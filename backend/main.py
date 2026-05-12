import os
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from routers import analyze, features, status, models
from model_service import ModelService

load_dotenv()
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
logger = logging.getLogger(__name__)

model_service: ModelService | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global model_service
    logger.info("Loading model and SAEs — this may take several minutes on first run...")
    model_service = ModelService()
    await model_service.load()
    app.state.model_service = model_service
    logger.info("Model and SAEs ready.")
    yield
    logger.info("Shutting down.")


app = FastAPI(title="LLM Visualizer API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(status.router, prefix="/api")
app.include_router(analyze.router, prefix="/api")
app.include_router(features.router, prefix="/api")
app.include_router(models.router, prefix="/api")
