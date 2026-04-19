"""Neuronpedia API client with local disk cache."""
from __future__ import annotations

import json
import logging
import os
from pathlib import Path

import httpx

logger = logging.getLogger(__name__)

NEURONPEDIA_BASE = "https://www.neuronpedia.org/api"
CACHE_PATH = Path(__file__).parent / "cache" / "neuronpedia.json"

_cache: dict[str, dict] = {}


def _load_cache() -> None:
    global _cache
    if CACHE_PATH.exists():
        try:
            _cache = json.loads(CACHE_PATH.read_text())
        except Exception:
            _cache = {}


def _save_cache() -> None:
    CACHE_PATH.parent.mkdir(parents=True, exist_ok=True)
    CACHE_PATH.write_text(json.dumps(_cache, ensure_ascii=False, indent=2))


_load_cache()


async def fetch_feature(model_id: str, layer_key: str, feat_idx: int) -> dict:
    cache_key = f"{model_id}/{layer_key}/{feat_idx}"
    if cache_key in _cache:
        return _cache[cache_key]

    api_key = os.getenv("NEURONPEDIA_API_KEY", "")
    headers = {"x-api-key": api_key} if api_key else {}

    url = f"{NEURONPEDIA_BASE}/feature/{model_id}/{layer_key}/{feat_idx}"
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(url, headers=headers)
            resp.raise_for_status()
            data = resp.json()
    except Exception as exc:
        logger.warning(f"Neuronpedia fetch failed for {cache_key}: {exc}")
        return {}

    _cache[cache_key] = data
    _save_cache()
    return data
