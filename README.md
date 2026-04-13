# Text-to-Image Generator (Dockerized)

This project is now structured as a fully containerized, production-oriented, multi-service application:

- `frontend`: React + Vite app served by Nginx
- `backend`: Flask API for request orchestration and history
- `model-service`: FastAPI inference service running Stable Diffusion via Hugging Face Diffusers

All services are orchestrated with Docker Compose.

## Complete Documentation

For a detailed project document covering architecture, stack, reliability fixes, verified working status, and operations guidance, see:

- docs/PROJECT_DOCUMENTATION.md

## Architecture

```text
Browser -> Frontend (Nginx + React) -> Backend (Flask API) -> Model Service (FastAPI + Stable Diffusion)
```

The frontend proxies `/api/*` requests to the backend.
The backend securely calls the model-service using an internal bearer token (`MODEL_SERVICE_TOKEN`).

## Folder Structure

```text
text-to-image-gen-ai/
    backend/
        app.py
        requirements.txt
        Dockerfile
    frontend/
        src/
        nginx.conf
        Dockerfile
    model-service/
        app.py
        requirements.txt
        Dockerfile
    docker-compose.yml
    docker-compose.gpu.yml
    .env.example
    .dockerignore
```

## Prerequisites

- Docker Desktop with Compose v2
- Optional: NVIDIA Container Toolkit for GPU inference

## Secure Configuration

1. Create runtime env file:

```bash
cp .env.example .env
```

2. Update `.env`:

- `MODEL_SERVICE_TOKEN`: set a strong random secret
- `HUGGING_FACE_HUB_TOKEN`: optional for private/gated models
- `MODEL_ID`: defaults to `stabilityai/sd-turbo`
- `MODEL_DEVICE`: `cpu` or `cuda`

Do not commit `.env`.

## Run (CPU)

```bash
docker compose up --build
```

Access:

- Frontend: `http://localhost`
- Backend health: `http://localhost:5000/`

## Run (GPU)

```bash
docker compose -f docker-compose.yml -f docker-compose.gpu.yml up --build
```

Notes:

- Requires compatible NVIDIA drivers and runtime.
- Ensure Docker has GPU support enabled.

## Production Readiness Notes

- Backend runs with `gunicorn`.
- Frontend runs behind Nginx.
- Model weights are cached in Docker volume `model-cache` for faster restarts.
- Services include health checks and restart policies.
- Service-to-service auth token is required between backend and model-service.

## API Endpoints

Backend:

- `GET /` - service health message
- `POST /generate` - generate an image from prompt + size + format
- `GET /history` - returns in-memory generation history

Model service (internal):

- `GET /health`
- `POST /generate`

## Scale and Deploy

- Scale frontend/backend replicas with Compose or migrate manifests to Kubernetes.
- Keep model-service on dedicated GPU nodes in production for throughput.
- Add external persistence (Redis/Postgres/S3) if you need durable history and generated asset storage.
