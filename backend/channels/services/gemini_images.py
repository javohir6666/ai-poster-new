from __future__ import annotations

import base64
from dataclasses import dataclass

import requests
from django.conf import settings

from .http_retry import request_json_with_retry


@dataclass(frozen=True)
class GeneratedImage:
    filename: str
    content: bytes


def generate_image(prompt: str, *, timeout: int = 60) -> GeneratedImage:
    """
    Generates an image via Gemini Imagen REST `:predict`.
    Docs example uses:
      POST https://generativelanguage.googleapis.com/v1beta/models/<MODEL>:predict
      header: x-goog-api-key: $GEMINI_API_KEY
      body: {"instances":[{"prompt": "..."}], "parameters":{"sampleCount": 1}}
    """
    api_key = getattr(settings, "GEMINI_API_KEY", "") or ""
    if not api_key:
        raise ValueError("GEMINI_API_KEY is not configured (required for image generation)")

    model = getattr(settings, "GEMINI_IMAGE_MODEL", "") or "imagen-4.0-generate-001"
    base_url = getattr(settings, "GEMINI_IMAGE_BASE_URL", "") or "https://generativelanguage.googleapis.com/v1beta"

    url = f"{base_url}/models/{model}:predict"
    headers = {"x-goog-api-key": api_key, "Content-Type": "application/json"}
    payload = {"instances": [{"prompt": prompt}], "parameters": {"sampleCount": 1}}

    res = request_json_with_retry("POST", url, headers=headers, json_body=payload, timeout=timeout, retries=2)
    raw = res.text
    if res.status_code >= 400:
        raise RuntimeError(f"Gemini Imagen request failed: {res.status_code} {raw[:400]}")

    data = res.json or {}

    def _decode(b64: str) -> bytes:
        return base64.b64decode(b64)

    # Try common REST response shapes.
    if isinstance(data, dict):
        preds = data.get("predictions")
        if isinstance(preds, list) and preds:
            first = preds[0]
            if isinstance(first, dict):
                for key in ("bytesBase64Encoded", "imageBytes", "b64"):
                    v = first.get(key)
                    if isinstance(v, str) and v.strip():
                        return GeneratedImage(filename="image.png", content=_decode(v))
                img = first.get("image")
                if isinstance(img, dict):
                    v = img.get("bytesBase64Encoded") or img.get("imageBytes")
                    if isinstance(v, str) and v.strip():
                        return GeneratedImage(filename="image.png", content=_decode(v))

        # Some clients use generatedImages structure.
        gen = data.get("generatedImages") or data.get("generated_images")
        if isinstance(gen, list) and gen:
            first = gen[0]
            if isinstance(first, dict):
                img = first.get("image")
                if isinstance(img, dict):
                    v = img.get("imageBytes") or img.get("image_bytes") or img.get("bytesBase64Encoded")
                    if isinstance(v, str) and v.strip():
                        return GeneratedImage(filename="image.png", content=_decode(v))

    raise RuntimeError("Gemini Imagen response missing image bytes")

