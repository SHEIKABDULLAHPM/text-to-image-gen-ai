import base64
import io
import os
import time
from contextlib import nullcontext
from threading import Lock, Thread
from typing import Any

from diffusers import (
    StableDiffusionPipeline,
    StableDiffusionXLPipeline,
)
from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel, Field
from PIL import Image
import torch


app = FastAPI(title="Model Service", version="1.0.0")

MODEL_ID = os.getenv("MODEL_ID", "stabilityai/sd-turbo")
MODEL_SERVICE_TOKEN = os.getenv("MODEL_SERVICE_TOKEN", "")
HF_TOKEN = os.getenv("HUGGING_FACE_HUB_TOKEN")
DEVICE = os.getenv("DEVICE", "cuda" if torch.cuda.is_available() else "cpu")
DEFAULT_WIDTH = int(os.getenv("DEFAULT_WIDTH", "512"))
DEFAULT_HEIGHT = int(os.getenv("DEFAULT_HEIGHT", "512"))
DEFAULT_STEPS = int(os.getenv("DEFAULT_STEPS", "4"))
DEFAULT_GUIDANCE_SCALE = float(os.getenv("DEFAULT_GUIDANCE_SCALE", "0.0"))
MODEL_LOAD_MAX_RETRIES = int(os.getenv("MODEL_LOAD_MAX_RETRIES", "5"))
MODEL_LOAD_RETRY_DELAY_SEC = int(os.getenv("MODEL_LOAD_RETRY_DELAY_SEC", "20"))
DEFAULT_MODEL_ALIAS = os.getenv("DEFAULT_MODEL_ALIAS", "turbo")

MODEL_ALIASES = {
    "turbo": "stabilityai/sd-turbo",
    "sd15": "runwayml/stable-diffusion-v1-5",
    "sdxl": "stabilityai/stable-diffusion-xl-base-1.0",
}

pipeline: StableDiffusionPipeline | StableDiffusionXLPipeline | None = None
pipelines: dict[str, StableDiffusionPipeline | StableDiffusionXLPipeline] = {}
pipeline_lock = Lock()
model_ready = False
model_error: str | None = None
model_load_attempt = 0


class GenerationRequest(BaseModel):
    prompt: str = Field(min_length=1, max_length=500)
    width: int = Field(default=DEFAULT_WIDTH, ge=256, le=1024)
    height: int = Field(default=DEFAULT_HEIGHT, ge=256, le=1024)
    format: str = Field(default="png")
    steps: int = Field(default=DEFAULT_STEPS, ge=1, le=60)
    guidance_scale: float = Field(default=DEFAULT_GUIDANCE_SCALE, ge=0, le=20)
    seed: int | None = Field(default=None)
    model: str | None = Field(default=None)


def _resolve_model_id(model: str | None) -> str:
    if model and model.strip():
        key = model.strip().lower()
    else:
        key = DEFAULT_MODEL_ALIAS.lower()
    return MODEL_ALIASES.get(key, model or MODEL_ID)


def _serialize_image(image: Image.Image, fmt: str) -> str:
    image_bytes = io.BytesIO()
    image.save(image_bytes, format=fmt.upper())
    image_bytes.seek(0)
    return base64.b64encode(image_bytes.read()).decode("utf-8")


def _load_pipeline_for_model(model_id: str) -> StableDiffusionPipeline | StableDiffusionXLPipeline:
    dtype = torch.float16 if DEVICE == "cuda" else torch.float32

    if "xl" in model_id.lower():
        loaded_pipeline = StableDiffusionXLPipeline.from_pretrained(
            model_id,
            torch_dtype=dtype,
            use_safetensors=True,
            token=HF_TOKEN,
        )
    else:
        loaded_pipeline = StableDiffusionPipeline.from_pretrained(
            model_id,
            torch_dtype=dtype,
            use_safetensors=True,
            token=HF_TOKEN,
        )

    return loaded_pipeline.to(DEVICE)


def _load_model_sync() -> None:
    global pipeline, model_ready, model_error, model_load_attempt

    retries = max(1, MODEL_LOAD_MAX_RETRIES)
    initial_model = _resolve_model_id(MODEL_ID if MODEL_ID else DEFAULT_MODEL_ALIAS)
    for attempt in range(1, retries + 1):
        model_load_attempt = attempt
        try:
            loaded_pipeline = _load_pipeline_for_model(initial_model)
            pipelines[initial_model] = loaded_pipeline
            pipeline = loaded_pipeline
            model_ready = True
            model_error = None
            return
        except Exception as exc:
            model_ready = False
            model_error = str(exc)
            if attempt < retries:
                time.sleep(MODEL_LOAD_RETRY_DELAY_SEC)


@app.on_event("startup")
def startup() -> None:
    # Load model in the background so liveness checks pass while weights download.
    Thread(target=_load_model_sync, daemon=True).start()


@app.get("/health")
def health() -> dict[str, Any]:
    return {
        "status": "ok" if model_ready else "loading",
        "ready": model_ready,
        "model": _resolve_model_id(MODEL_ID),
        "device": DEVICE,
        "error": model_error,
        "load_attempt": model_load_attempt,
        "max_retries": MODEL_LOAD_MAX_RETRIES,
        "loaded_models": list(pipelines.keys()),
    }


@app.get("/health/live")
def health_live() -> dict[str, str]:
    return {"status": "alive"}


@app.get("/health/ready")
def health_ready() -> dict[str, str]:
    if not model_ready:
        raise HTTPException(status_code=503, detail="Model is still loading")
    return {"status": "ready"}


@app.post("/generate")
def generate(
    payload: GenerationRequest,
    authorization: str | None = Header(default=None),
) -> dict[str, Any]:
    if MODEL_SERVICE_TOKEN:
        if not authorization or authorization != f"Bearer {MODEL_SERVICE_TOKEN}":
            raise HTTPException(status_code=401, detail="Unauthorized")

    if model_error:
        raise HTTPException(status_code=503, detail=f"Model failed to load: {model_error}")

    if pipeline is None or not model_ready:
        raise HTTPException(status_code=503, detail="Model is not ready")

    output_format = payload.format.lower()
    if output_format not in {"png", "jpeg", "webp"}:
        raise HTTPException(status_code=400, detail="Unsupported format")

    autocast_ctx = torch.autocast("cuda") if DEVICE == "cuda" else nullcontext()
    requested_model = _resolve_model_id(payload.model)

    with pipeline_lock:
        selected_pipeline = pipelines.get(requested_model)
        if selected_pipeline is None:
            selected_pipeline = _load_pipeline_for_model(requested_model)
            pipelines[requested_model] = selected_pipeline
        generator = None
        if payload.seed is not None:
            generator = torch.Generator(device=DEVICE).manual_seed(payload.seed)

        with torch.inference_mode():
            with autocast_ctx:
                result = selected_pipeline(
                    prompt=payload.prompt,
                    width=payload.width,
                    height=payload.height,
                    num_inference_steps=payload.steps,
                    guidance_scale=payload.guidance_scale,
                    generator=generator,
                )

    encoded_images = [_serialize_image(image, output_format) for image in result.images]
    return {
        "image": encoded_images[0],
        "seed": payload.seed,
        "model": requested_model,
    }
