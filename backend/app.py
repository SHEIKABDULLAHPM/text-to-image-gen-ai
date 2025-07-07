from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import json
import base64
import boto3
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()

app = Flask(__name__)
CORS(app, origins=["http://localhost:5173"], supports_credentials=True)

# AWS credentials
aws_access_key = os.getenv("AWS_ACCESS_KEY_ID")
aws_secret_key = os.getenv("AWS_SECRET_ACCESS_KEY")
aws_region = os.getenv("AWS_REGION", "us-east-1")

# Initialize Bedrock client
bedrock_client = boto3.client(
    service_name="bedrock-runtime",
    region_name=aws_region,
    aws_access_key_id=aws_access_key,
    aws_secret_access_key=aws_secret_key
)

# In-memory history (you can persist this to file or DB if needed)
image_history = []

@app.route("/", methods=["GET"])
def index():
    return jsonify({"message": "AI Image Generator Backend is running!"})

@app.route("/generate", methods=["POST"])
def generate_image():
    data = request.get_json()
    prompt = data.get("prompt")
    size = data.get("size", "512x512")
    format_ = data.get("format", "png")

    if not prompt:
        return jsonify({"error": "Prompt is required"}), 400

    try:
        width, height = map(int, size.lower().split("x"))

        body = json.dumps({
            "taskType": "TEXT_IMAGE",
            "textToImageParams": {
                "text": prompt
            },
            "imageGenerationConfig": {
                "numberOfImages": 1,
                "height": height,
                "width": width,
                "seed": 0,
                "cfgScale": 10
            }
        })

        response = bedrock_client.invoke_model(
            modelId="amazon.titan-image-generator-v1",
            body=body,
            accept="application/json",
            contentType="application/json"
        )

        response_body = json.loads(response['body'].read())
        base64_image = response_body['images'][0]

        image_entry = {
            "prompt": prompt,
            "image": base64_image,
            "timestamp": int(os.times().elapsed),
            "size": size,
            "format": format_
        }
        image_history.append(image_entry)

        return jsonify({"image": base64_image})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/history", methods=["GET"])
def get_history():
    return jsonify(image_history[::-1])  # Newest first

# ✅ Only run if this is the main file
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
