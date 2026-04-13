# GitHub Setup and Deployment Guide

## 1. Repository Status

Remote repository:
- https://github.com/SHEIKABDULLAHPM/text-to-image-gen-ai

Branch:
- main

This project is set up for:
- Dockerized microservices
- GitHub Actions CI build verification
- Optional GHCR image publishing

## 2. What Was Added

1. GitHub Actions CI workflow
- File: .github/workflows/ci.yml
- Purpose: Build-check backend, model-service, and frontend Docker images on push/PR

2. GitHub Actions GHCR publish workflow
- File: .github/workflows/publish-ghcr.yml
- Purpose: Build and publish Docker images to GitHub Container Registry on version tags and manual trigger

3. Improved .gitignore
- Added common Python/Node/build artifacts to keep repository clean

## 3. How to Push the Project to GitHub

Run from project root:

```powershell
git add .
git commit -m "feat: containerized ai image platform with model service and github workflows"
git push origin main
```

If push is rejected because remote has new commits:

```powershell
git pull --rebase origin main
git push origin main
```

## 4. GitHub Actions Workflows

### CI Workflow
- Trigger: push to main, pull_request to main
- Validates Docker builds for all services

### Publish Workflow
- Trigger:
  - manual via workflow_dispatch
  - push tags like v1.0.0
- Publishes images to:
  - ghcr.io/<owner>/text-to-image-gen-ai-backend
  - ghcr.io/<owner>/text-to-image-gen-ai-model-service
  - ghcr.io/<owner>/text-to-image-gen-ai-frontend

## 5. Create a Release Tag (for GHCR publish)

```powershell
git tag v1.0.0
git push origin v1.0.0
```

## 6. Required GitHub Permissions

For package publishing workflow:
- Repository Actions enabled
- Workflow permissions should allow read/write for GITHUB_TOKEN packages

In repository settings:
- Actions > General > Workflow permissions = Read and write permissions

## 7. Environment and Secrets

This repo uses runtime .env values locally and in Compose. Do not commit real secrets.

Use .env.example as template and keep .env local.

If deploying via your own infrastructure, provide at runtime:
- MODEL_SERVICE_TOKEN
- HUGGING_FACE_HUB_TOKEN (optional for gated models)
- MODEL_ID / DEFAULT_MODEL_ALIAS / MODEL_DEVICE
- CORS_ORIGINS and timeout settings

## 8. Post-Push Verification

1. Open GitHub Actions tab and verify CI passes.
2. Confirm workflow badges and logs.
3. For tag pushes, confirm images appear in GHCR Packages.

## 9. Local Deploy Command

```powershell
docker compose up -d --build
```

Check health:

```powershell
docker compose ps
```

## 10. Troubleshooting Push Issues

1. Authentication failed
- Re-authenticate with Git credential manager or GitHub CLI.

2. Remote rejected (non-fast-forward)
- Pull with rebase then push.

3. Large files detected
- Ensure node_modules, .venv, dist are ignored.
