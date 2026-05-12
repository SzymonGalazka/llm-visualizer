from fastapi import APIRouter, Request
from model_service import AVAILABLE_MODELS

router = APIRouter()


@router.get("/status")
async def get_status(request: Request):
    svc = getattr(request.app.state, "model_service", None)
    loaded = svc is not None and svc.loaded
    model_name = svc.model_name if svc is not None else None
    available_layers = svc.available_layers if svc is not None else []
    return {
        "loaded": loaded,
        "model": model_name,
        "available_layers": available_layers,
        "available_models": AVAILABLE_MODELS,
    }
