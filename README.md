# LLM Visualizer

An interactive interpretability tool for **Gemma 2** models. It runs a forward pass, encodes residual-stream activations through **GemmaScope Sparse Autoencoders (SAEs)**, and renders the result as an interactive graph — showing which SAE features activate per token, their top vocabulary projections, and next-token predictions. Feature descriptions are fetched on demand from [Neuronpedia](https://www.neuronpedia.org).

## Prerequisites

| Requirement         | Version |
| ------------------- | ------- |
| Python              | 3.10+   |
| Node.js             | 18+     |
| HuggingFace account | —       |

**Gemma 2 is a gated model.** Before running, visit [google/gemma-2-2b](https://huggingface.co/google/gemma-2-2b) (or the 9B variant) on HuggingFace and accept the license agreement.

## Setup

```bash
git clone https://github.com/your-org/llm-visualizer.git
cd llm-visualizer

# Copy and fill in your API keys
cp backend/.env.example backend/.env
# Edit backend/.env — see comments inside for where to get each key
```

## Running

Open two terminals:

```bash
# Terminal 1 — backend (FastAPI on port 8000)
./start_backend.sh

# Terminal 2 — frontend (Vite dev server on port 5173)
./start_frontend.sh
```

Then open [http://localhost:5173](http://localhost:5173) in your browser.

The first run will download model weights (~5–18 GB depending on the model size) and install Python dependencies automatically.

## Environment Variables

See [`backend/.env.example`](backend/.env.example) for the full list with descriptions.

| Variable              | Required    | Description                                               |
| --------------------- | ----------- | --------------------------------------------------------- |
| `HF_TOKEN`            | Yes         | HuggingFace token for downloading Gemma 2 weights         |
| `NEURONPEDIA_API_KEY` | Recommended | Enables feature description lookups without rate-limiting |

## Architecture

```
frontend/   React + TypeScript (Vite, React Flow, TailwindCSS)
backend/    FastAPI
  model_service.py   — loads Gemma 2 via TransformerLens
  graph_builder.py   — runs SAE (sae-lens) and builds graph data
  neuronpedia.py     — fetches feature descriptions from Neuronpedia API
  routers/           — REST endpoints: /analyze, /models, /features, /status
```

## License

[MIT](LICENSE)
