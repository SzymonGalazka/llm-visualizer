import asyncio
import logging

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

from model_service import AVAILABLE_MODELS

logger = logging.getLogger(__name__)
router = APIRouter()


class SwitchModelRequest(BaseModel):
    model: str


@router.post("/switch-model")
async def switch_model(req: SwitchModelRequest, request: Request):
    svc = getattr(request.app.state, "model_service", None)
    if svc is None:
        raise HTTPException(status_code=503, detail="Model service not initialised")

    if req.model not in AVAILABLE_MODELS:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown model '{req.model}'. Available: {AVAILABLE_MODELS}",
        )

    if req.model == svc.model_name and svc.loaded:
        return {"status": "already_loaded", "model": svc.model_name}

    # Run the switch in the background so the response returns immediately.
    # The frontend polls /status to know when the new model is ready.
    asyncio.create_task(svc.switch_to(req.model))
    return {"status": "switching", "model": req.model}
