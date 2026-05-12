#!/usr/bin/env bash
# Run the FastAPI backend
set -e
cd "$(dirname "$0")/backend"

if [ ! -f .env ]; then
  echo "No .env found — copying .env.example"
  cp .env.example .env
  echo "Edit backend/.env and add your HF_TOKEN and NEURONPEDIA_API_KEY"
fi

# Create virtual environment if it doesn't exist
if [ ! -d .venv ]; then
  echo "Creating virtual environment..."
  python3 -m venv .venv
fi

# Activate virtual environment
source .venv/bin/activate

if ! python -c "import transformer_lens" 2>/dev/null; then
  echo "Installing Python dependencies..."
  pip install -r requirements.txt
fi

uvicorn main:app --host 0.0.0.0 --port 8000 --reload
