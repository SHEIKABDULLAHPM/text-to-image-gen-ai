from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os
import time
import requests
import re

# Load environment variables from .env
load_dotenv()

app = Flask(__name__)

cors_origins = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173,http://localhost,http://localhost:80"
).split(",")

CORS(
    app,
    resources={r"/*": {"origins": [origin.strip() for origin in cors_origins if origin.strip()]}},
    supports_credentials=True,
)

@app.before_request
def handle_options():
    if request.method == 'OPTIONS':
        return '', 204

# Internal model service configuration.
model_service_url = os.getenv("MODEL_SERVICE_URL", "http://model-service:8000")
model_service_token = os.getenv("MODEL_SERVICE_TOKEN", "")
model_request_timeout_sec = int(os.getenv("MODEL_REQUEST_TIMEOUT_SEC", "420"))
model_max_retries = int(os.getenv("MODEL_MAX_RETRIES", "3"))
model_retry_delay_sec = int(os.getenv("MODEL_RETRY_DELAY_SEC", "5"))
model_health_timeout_sec = int(os.getenv("MODEL_HEALTH_TIMEOUT_SEC", "5"))

# ✅ In-memory image history
image_history = []


def _model_headers() -> dict[str, str]:
    headers = {"Content-Type": "application/json"}
    if model_service_token:
        headers["Authorization"] = f"Bearer {model_service_token}"
    return headers


def _get_model_health() -> dict:
    try:
        response = requests.get(
            f"{model_service_url}/health",
            timeout=model_health_timeout_sec,
        )
        if response.headers.get("content-type", "").startswith("application/json"):
            return response.json()
        return {
            "status": "unknown",
            "ready": False,
            "error": "Non-JSON health response",
            "httpStatus": response.status_code,
            "raw": response.text[:300],
        }
    except Exception as exc:
        return {"status": "unknown", "ready": False, "error": str(exc)}


def _clamp_int(value, minimum: int, maximum: int, default: int) -> int:
    try:
        return max(minimum, min(maximum, int(value)))
    except (TypeError, ValueError):
        return default


def _clamp_float(value, minimum: float, maximum: float, default: float) -> float:
    try:
        return max(minimum, min(maximum, float(value)))
    except (TypeError, ValueError):
        return default


def _enhance_prompt(prompt: str) -> str:
    cleaned = re.sub(r"\s+", " ", prompt).strip()
    cleaned = re.sub(r"[^\w\s,.;:!?'-]", "", cleaned)

    artistic_suffix = "high quality, visually coherent composition, professionally lit"
    parts = [cleaned, artistic_suffix]

    return ", ".join(part for part in parts if part)

@app.route("/", methods=["GET"])
def index():
    return jsonify({"message": "AI Image Generator Backend is running!"})


@app.route("/generate", methods=["POST"])
def generate_image():
    data = request.get_json(silent=True) or {}
    print("✅ POST /generate called with:", data)

    prompt = data.get("prompt")
    size = data.get("size", "512x512")
    format_ = data.get("format", "png")
    steps = _clamp_int(data.get("steps"), 1, 60, 4)
    guidance_scale = _clamp_float(data.get("guidanceScale"), 0.0, 20.0, 0.0)
    seed = data.get("seed")
    model = (data.get("model") or os.getenv("MODEL_ID", "stabilityai/sd-turbo")).strip()

    if format_.lower() not in {"png", "jpeg", "webp"}:
        return jsonify({"error": "Unsupported format. Use png, jpeg, or webp."}), 400

    if not prompt:
        print("❌ Prompt missing in request")
        return jsonify({"error": "Prompt is required"}), 400

    try:
        width, height = map(int, size.lower().split("x"))
        enhanced_prompt = _enhance_prompt(prompt)

        response_body = None
        last_error = None
        health_snapshot = None

        for attempt in range(1, model_max_retries + 1):
            try:
                response = requests.post(
                    f"{model_service_url}/generate",
                    json={
                        "prompt": enhanced_prompt,
                        "width": width,
                        "height": height,
                        "format": format_,
                        "steps": steps,
                        "guidance_scale": guidance_scale,
                        "seed": seed,
                        "model": model,
                    },
                    headers=_model_headers(),
                    timeout=model_request_timeout_sec,
                )

                if response.status_code == 503:
                    health_snapshot = _get_model_health()
                    last_error = "Model service is not ready yet"
                    if attempt < model_max_retries:
                        time.sleep(model_retry_delay_sec)
                        continue

                response.raise_for_status()
                response_body = response.json()
                break
            except requests.Timeout:
                last_error = "Model inference timed out"
                if attempt < model_max_retries:
                    time.sleep(model_retry_delay_sec)
                    continue
                raise
            except requests.RequestException as exc:
                last_error = str(exc)
                if attempt < model_max_retries:
                    time.sleep(model_retry_delay_sec)
                    continue
                raise

        if response_body is None:
            return jsonify({
                "error": "Model service unavailable after retries",
                "details": last_error,
                "modelHealth": health_snapshot or _get_model_health(),
            }), 503

        base64_image = response_body.get("image")

        if not base64_image:
            return jsonify({"error": "Model service returned empty image"}), 502

        image_entry = {
            "prompt": prompt,
            "image": base64_image,
            "timestamp": int(time.time()),
            "size": size,
            "format": format_,
            "enhancedPrompt": enhanced_prompt,
            "seed": response_body.get("seed"),
            "model": response_body.get("model", model),
        }

        image_history.append(image_entry)

        print("🎉 Image generated successfully for:", prompt)
        return jsonify({
            "image": base64_image,
            "enhancedPrompt": enhanced_prompt,
            "seed": response_body.get("seed"),
            "model": response_body.get("model", model),
        })

    except requests.RequestException as e:
        print("❌ Model service request failed:", str(e))
        return jsonify({
            "error": "Model service unavailable or failed",
            "details": str(e),
            "modelHealth": _get_model_health(),
        }), 503
    except Exception as e:
        print("❌ Error during image generation:", str(e))
        return jsonify({"error": str(e)}), 500


@app.route("/history", methods=["GET"])
def get_history():
    return jsonify(image_history[::-1])  # Newest first


@app.route("/model-status", methods=["GET"])
def model_status():
    return jsonify(_get_model_health())


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
