# Text-to-Image Generator: Complete Project Documentation

## 1. Project Summary

This project is a fully containerized Text-to-Image Generator application.

It has three main services:
- Frontend service for user interaction
- Backend service for API orchestration
- Diffusion model service for image inference

The system is designed for:
- Clean dependency isolation with Docker
- Service separation for scalability
- Stable startup and health checks
- Better resilience during model warmup and network fluctuations

## 2. Technology Stack (What Is Used)

### Frontend
- React
- TypeScript
- Vite
- Tailwind CSS
- Axios
- Nginx (for production static hosting and API reverse proxy)

### Backend
- Python
- Flask
- Flask-CORS
- Gunicorn
- Requests

### Model Service
- Python
- FastAPI
- Diffusers
- Transformers
- PyTorch
- Pillow
- Uvicorn
- Hugging Face Hub

### DevOps and Runtime
- Docker
- Docker Compose
- Bridge network for service-to-service communication
- Volume caching for Hugging Face model files

## 3. Project Structure

- backend
  - app.py
  - requirements.txt
  - Dockerfile
- frontend
  - src
  - Dockerfile
  - nginx.conf
- model-service
  - app.py
  - requirements.txt
  - Dockerfile
- docker-compose.yml
- docker-compose.gpu.yml
- .env.example
- .dockerignore
- README.md

## 4. Container Architecture and Flow

Request flow:
1. User opens frontend in browser.
2. Frontend sends API request to /api/generate.
3. Nginx forwards /api traffic to backend.
4. Backend validates input and forwards inference call to model-service.
5. Model-service generates image using Stable Diffusion pipeline.
6. Backend returns base64 image to frontend.
7. Frontend renders generated image.

Network model:
- Services communicate internally through Docker Compose network using service names.
- Backend reaches model-service at http://model-service:8000.

## 5. Environment Variables

Main variables:
- MODEL_SERVICE_TOKEN: shared token between backend and model-service
- MODEL_ID: model identifier (default is stabilityai/sd-turbo)
- MODEL_DEVICE: cpu or cuda
- HUGGING_FACE_HUB_TOKEN: optional token for gated/private models
- CORS_ORIGINS: allowed frontend origins

Resilience and timeout variables:
- MODEL_REQUEST_TIMEOUT_SEC
- MODEL_MAX_RETRIES
- MODEL_RETRY_DELAY_SEC
- MODEL_HEALTH_TIMEOUT_SEC
- MODEL_LOAD_MAX_RETRIES
- MODEL_LOAD_RETRY_DELAY_SEC
- HF_HUB_DOWNLOAD_TIMEOUT
- HF_HUB_ETAG_TIMEOUT

Use .env.example as the template for local .env.

## 6. API Endpoints

### Backend
- GET /
  - Basic backend health message
- POST /generate
  - Input: prompt, size, format
  - Output: base64 image
- GET /history
  - Returns in-memory generation history
- GET /model-status
  - Returns model-service health data from backend perspective

### Model Service
- GET /health/live
  - Liveness check for container health
- GET /health/ready
  - Readiness check, returns unavailable until model is ready
- GET /health
  - Detailed model state: ready, error, load attempt
- POST /generate
  - Internal inference endpoint used by backend

## 7. Reliability Improvements Implemented

The following stability improvements are implemented:

1. Non-blocking model startup
- Model loads in background thread so service starts quickly.

2. Model load retries
- If Hugging Face download or initialization fails, model-service retries loading.

3. Backend request retries
- Backend retries model inference calls on transient unavailability and timeout scenarios.

4. Better 503 diagnostics
- Backend returns detailed model health snapshot for easier debugging.

5. Correct liveness/readiness separation
- Compose health check uses /health/live for startup stability.

6. Health endpoint correctness
- Model /health response now returns valid payload types.

## 8. Verified Working Status (What Works)

The following has been verified:

1. Docker Compose builds successfully for frontend, backend, and model-service.
2. Services start successfully and report healthy status.
3. Backend can reach model-service through internal network.
4. Model status is visible using backend endpoint /model-status.
5. End-to-end image generation path works and returns image payload.

## 9. Common Causes of 503 and How This Project Handles Them

### Cause A: Model still loading
- Symptom: /generate returns 503 initially.
- Handling: backend retries; model-service exposes readiness information.

### Cause B: Model download timeout from Hugging Face
- Symptom: transient startup failure.
- Handling: model load retry loop and configurable download timeouts.

### Cause C: Wrong token or auth mismatch
- Symptom: unauthorized or failed internal calls.
- Handling: shared MODEL_SERVICE_TOKEN across backend and model-service.

### Cause D: GPU runtime misconfiguration
- Symptom: model init failure when using cuda.
- Handling: switch MODEL_DEVICE to cpu or use GPU compose override with proper NVIDIA runtime.

## 10. Run Guide

### CPU mode
- docker compose up -d --build

### GPU mode
- docker compose -f docker-compose.yml -f docker-compose.gpu.yml up -d --build

### Access
- Frontend: http://localhost
- Backend: http://localhost:5000

## 11. Operations and Debug Checklist

If an issue appears:
1. Check container states: docker compose ps
2. Check backend logs: docker compose logs backend --tail 200
3. Check model logs: docker compose logs model-service --tail 200
4. Check model status via backend: GET http://localhost:5000/model-status
5. Check live endpoint directly: GET http://localhost:8000/health/live
6. Retry generation after readiness becomes true

## 12. Production Best Practices

1. Keep MODEL_SERVICE_TOKEN secret and rotate periodically.
2. Use external secret manager instead of plain env files in production.
3. Add persistent image storage (object storage) for generated assets.
4. Add persistent DB for history instead of in-memory list.
5. Add monitoring and alerting for model load/inference latency.
6. Use autoscaling strategy for backend and dedicated compute for model-service.
7. Use queue-based pattern for heavy workloads to avoid overload.

## 13. Known Limitations

1. History is in-memory and resets on container restart.
2. First model load can be slow due weight download.
3. CPU inference is slower than GPU mode.

## 14. Recommended Next Enhancements

1. Add Redis or database-backed job queue.
2. Add persistent artifact storage for generated images.
3. Add request rate limits and concurrency controls.
4. Add structured logging and tracing across services.
5. Add CI pipeline for build and deployment automation.
