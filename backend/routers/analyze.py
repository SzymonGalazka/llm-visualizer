import asyncio
import logging
from typing import Annotated

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field

from graph_builder import build_graph

logger = logging.getLogger(__name__)
router = APIRouter()


class AnalyzeRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=512)
    layer: int = Field(9)
    top_k_features: int = Field(5, ge=1, le=20)
    top_k_concepts: int = Field(3, ge=1, le=10)
    threshold: float = Field(0.0, ge=0.0)


@router.post("/analyze")
async def analyze(req: AnalyzeRequest, request: Request):
    svc = getattr(request.app.state, "model_service", None)
    if svc is None or not svc.loaded:
        raise HTTPException(status_code=503, detail="Model not loaded yet")

    if req.layer not in svc.saes:
        raise HTTPException(status_code=400, detail=f"Layer {req.layer} not available")

    loop = asyncio.get_event_loop()
    try:
        analysis = await loop.run_in_executor(
            None,
            lambda: svc.analyze(
                req.text,
                req.layer,
                req.top_k_features,
                req.top_k_concepts,
                req.threshold,
            ),
        )
    except Exception as exc:
        logger.exception("Analysis failed")
        raise HTTPException(status_code=500, detail=str(exc))

    graph = build_graph(analysis)
    return {
        **graph,
        "text": req.text,
        "layer": req.layer,
        "next_token_predictions": analysis.get("next_token_predictions", []),
    }
