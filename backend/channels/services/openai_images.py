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


def generate_image(prompt: str, *, size: str = "1024x1024", timeout: int = 60) -> GeneratedImage:
    """
    Uses OpenAI Images API to generate an image and returns bytes.
    Requires `OPENAI_API_KEY`.
    """
    api_key = getattr(settings, "OPENAI_API_KEY", "") or ""
    if not api_key:
        raise ValueError("OPENAI_API_KEY is not configured (required for image generation)")

    model = getattr(settings, "OPENAI_IMAGE_MODEL", "") or "gpt-image-1"
    endpoint = getattr(settings, "OPENAI_IMAGE_BASE_URL", "") or "https://api.openai.com/v1/images/generations"

    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
    payload = {
        "model": model,
        "prompt": prompt,
        "size": size,
        "response_format": "b64_json",
    }

    resp = requests.post(endpoint, json=payload, headers=headers, timeout=timeout)
    raw = resp.text or ""
    if resp.status_code >= 400:
        raise RuntimeError(f"OpenAI image request failed: {resp.status_code} {raw[:400]}")

    data = resp.json()
    b64 = None
    if isinstance(data, dict) and isinstance(data.get("data"), list) and data["data"]:
        item = data["data"][0]
        if isinstance(item, dict):
            b64 = item.get("b64_json")
    if not isinstance(b64, str) or not b64.strip():
        raise RuntimeError("OpenAI image response missing b64_json")

    content = base64.b64decode(b64)
    return GeneratedImage(filename="image.png", content=content)

