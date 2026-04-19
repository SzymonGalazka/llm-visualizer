from fastapi import APIRouter, HTTPException, Request
from neuronpedia import fetch_feature
from model_service import MODEL_NAME, LAYER_KEYS

router = APIRouter()


@router.get("/feature/{layer}/{index}")
async def get_feature(layer: int, index: int, request: Request):
    svc = getattr(request.app.state, "model_service", None)
    if svc is None or not svc.loaded:
        raise HTTPException(status_code=503, detail="Model not loaded yet")

    if layer not in LAYER_KEYS:
        raise HTTPException(status_code=400, detail=f"Layer {layer} not available")

    layer_key = LAYER_KEYS[layer]
    data = await fetch_feature(MODEL_NAME, layer_key, index)
    if not data:
        return {"feat_idx": index, "layer": layer, "layer_key": layer_key, "description": None, "activations": []}

    return {
        "feat_idx": index,
        "layer": layer,
        "layer_key": layer_key,
        "description": data.get("description"),
        "autoInterp_score": data.get("autoInterp_score"),
        "pos_str": data.get("pos_str", []),
        "neg_str": data.get("neg_str", []),
        "activations": data.get("activations", []),
        "neuronpedia_url": f"https://www.neuronpedia.org/{MODEL_NAME}/{layer_key}/{index}",
    }
