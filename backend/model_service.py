import asyncio
import logging
import os
from typing import Any

# Opt in to MPS before TransformerLens reads this env var at import time.
# See: https://github.com/TransformerLensOrg/TransformerLens/issues/1178
os.environ.setdefault("TRANSFORMERLENS_ALLOW_MPS", "1")

import torch
from transformer_lens import HookedTransformer
from sae_lens import SAE

logger = logging.getLogger(__name__)

# Per-model configuration — add new entries here to expose more choices.
# Note: Gemma Scope only covers gemma-2-2b (PT), not the IT variant.
MODEL_CONFIGS: dict[str, dict] = {
    "gemma-2-9b-it": {
        "sae_release": "gemma-scope-9b-it-res-canonical",
        "available_layers": [9, 20, 31],
        "sae_width": "16k",
    },
    "gemma-2-2b": {
        "sae_release": "gemma-scope-2b-pt-res-canonical",
        "available_layers": [5, 12, 20],
        "sae_width": "16k",
    },
}

AVAILABLE_MODELS: list[str] = list(MODEL_CONFIGS.keys())
DEFAULT_MODEL = "gemma-2-2b"


class ModelService:
    def __init__(self, model_name: str = DEFAULT_MODEL) -> None:
        self.model: HookedTransformer | None = None
        self.saes: dict[int, SAE] = {}
        self._loaded = False

        self._apply_config(model_name)

        # Detect best available device
        if torch.backends.mps.is_available():
            self.device = "mps"
        elif torch.cuda.is_available():
            self.device = "cuda"
        else:
            self.device = "cpu"
        logger.info(f"Using device: {self.device}")

    def _apply_config(self, model_name: str) -> None:
        if model_name not in MODEL_CONFIGS:
            raise ValueError(f"Unknown model '{model_name}'. Available: {AVAILABLE_MODELS}")
        cfg = MODEL_CONFIGS[model_name]
        self.model_name = model_name
        self.sae_release = cfg["sae_release"]
        self.sae_width = cfg["sae_width"]
        self.available_layers: list[int] = cfg["available_layers"]
        self.layer_keys: dict[int, str] = {
            layer: f"{layer}-gemmascope-res-{self.sae_width}"
            for layer in self.available_layers
        }

    @property
    def loaded(self) -> bool:
        return self._loaded

    async def load(self) -> None:
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, self._load_sync)

    async def switch_to(self, model_name: str) -> None:
        """Unload the current model and load a different one."""
        if model_name not in MODEL_CONFIGS:
            raise ValueError(f"Unknown model '{model_name}'. Available: {AVAILABLE_MODELS}")
        if model_name == self.model_name and self._loaded:
            return  # already loaded, nothing to do

        logger.info(f"Switching model: {self.model_name} → {model_name}")
        self._loaded = False
        self.model = None
        self.saes = {}

        # Release device memory where possible
        if torch.backends.mps.is_available():
            torch.mps.empty_cache()
        elif torch.cuda.is_available():
            torch.cuda.empty_cache()

        self._apply_config(model_name)
        await self.load()

    def _load_sync(self) -> None:
        hf_token = os.getenv("HF_TOKEN") or None
        if hf_token:
            import huggingface_hub
            huggingface_hub.login(token=hf_token, add_to_git_credential=False)

        logger.info(f"Loading {self.model_name} in bfloat16 on {self.device}...")
        self.model = HookedTransformer.from_pretrained_no_processing(
            self.model_name,
            device=self.device,
            dtype=torch.bfloat16,
        )
        self.model.eval()

        for layer in self.available_layers:
            sae_id = f"layer_{layer}/width_{self.sae_width}/canonical"
            logger.info(f"Loading SAE for layer {layer} ({sae_id})...")
            sae, _cfg, _log_sparsities = SAE.from_pretrained(
                release=self.sae_release,
                sae_id=sae_id,
                device=self.device,
            )
            self.saes[layer] = sae

        self._loaded = True
        logger.info("All models and SAEs loaded.")

    def analyze(
        self,
        text: str,
        layer: int,
        top_k_features: int = 5,
        top_k_concepts: int = 3,
        threshold: float = 0.0,
    ) -> dict[str, Any]:
        """Run a forward pass and extract SAE feature activations."""
        assert self._loaded, "Model not loaded yet"
        assert layer in self.saes, f"No SAE for layer {layer}"
        assert self.model is not None

        tokens = self.model.to_tokens(text, prepend_bos=True)  # (1, seq_len)
        str_tokens: list[str] = self.model.to_str_tokens(tokens[0])  # pass 1D tensor to avoid batch dim bug

        with torch.no_grad():
            logits, cache = self.model.run_with_cache(
                tokens,
                names_filter=lambda name: name == f"blocks.{layer}.hook_resid_post",
            )

        resid: torch.Tensor = cache[f"blocks.{layer}.hook_resid_post"]  # (1, seq_len, d_model)
        sae = self.saes[layer]

        # Encode through SAE → dense activations (1, seq_len, d_sae)
        with torch.no_grad():
            feature_acts: torch.Tensor = sae.encode(resid)  # type: ignore[arg-type]

        feature_acts_np = feature_acts[0].float().cpu()  # (seq_len, d_sae)

        # Top-k vocab concepts per feature via W_U @ W_dec
        W_U: torch.Tensor = self.model.W_U  # (d_model, vocab_size)
        W_dec: torch.Tensor = sae.W_dec     # (d_sae, d_model)
        # Pre-move to CPU float32 once — avoids repeated transfers in the inner loop
        W_U_cpu = W_U.float().cpu()
        W_dec_cpu = W_dec.float().cpu()

        token_data = []
        for pos_idx, token_str in enumerate(str_tokens):
            if token_str in ("<bos>", "<s>"):
                continue

            acts_at_pos = feature_acts_np[pos_idx]  # (d_sae,)

            # Top-k active features above threshold
            active_mask = acts_at_pos > threshold
            active_indices = active_mask.nonzero(as_tuple=False).squeeze(1)
            if active_indices.numel() == 0:
                token_data.append({"token": token_str, "pos": pos_idx, "features": []})
                continue

            active_values = acts_at_pos[active_indices]
            if active_indices.numel() > top_k_features:
                topk = torch.topk(active_values, k=top_k_features)
                feat_indices = active_indices[topk.indices].tolist()
                feat_values = topk.values.tolist()
            else:
                sorted_idx = torch.argsort(active_values, descending=True)
                feat_indices = active_indices[sorted_idx].tolist()
                feat_values = active_values[sorted_idx].tolist()

            features = []
            for feat_idx, feat_val in zip(feat_indices, feat_values):
                # Compute concept directions: W_U @ W_dec[feat_idx]
                # Do matmul on CPU to avoid MPS dtype/op limitations
                with torch.no_grad():
                    feat_dec = W_dec[feat_idx].float().cpu()  # (d_model,)
                    feat_logits = W_U_cpu.T @ feat_dec        # (vocab_size,)
                topk_concepts = torch.topk(feat_logits, k=top_k_concepts)
                concepts = []
                for vocab_idx, concept_score in zip(
                    topk_concepts.indices.tolist(), topk_concepts.values.tolist()
                ):
                    concept_token = self.model.tokenizer.decode([vocab_idx]).strip()
                    if not concept_token:
                        continue
                    concepts.append({"token": concept_token, "vocab_idx": vocab_idx, "score": float(concept_score)})

                features.append(
                    {
                        "feat_idx": int(feat_idx),
                        "activation": float(feat_val),
                        "layer": layer,
                        "layer_key": self.layer_keys[layer],
                        "concepts": concepts,
                    }
                )

            token_data.append({"token": token_str, "pos": pos_idx, "features": features})

        # Top-k next token predictions — free since logits already computed above
        next_token_preds: list[dict[str, Any]] = []
        with torch.no_grad():
            last_logits = logits[0, -1, :].float().cpu()  # (vocab_size,)
            probs = torch.softmax(last_logits, dim=-1)
            topk_next = torch.topk(probs, k=10)
            for vid, prob in zip(topk_next.indices.tolist(), topk_next.values.tolist()):
                pred_token = self.model.tokenizer.decode([vid]).strip()
                next_token_preds.append({"token": pred_token, "prob": float(prob), "vocab_idx": vid})

        return {
            "text": text,
            "layer": layer,
            "token_data": token_data,
            "next_token_predictions": next_token_preds,
        }
