from fastapi import APIRouter, Request
from model_service import AVAILABLE_LAYERS, MODEL_NAME

router = APIRouter()


@router.get("/status")
async def get_status(request: Request):
    svc = getattr(request.app.state, "model_service", None)
    loaded = svc is not None and svc.loaded
    return {
        "loaded": loaded,
        "model": MODEL_NAME,
        "available_layers": AVAILABLE_LAYERS,
    }
