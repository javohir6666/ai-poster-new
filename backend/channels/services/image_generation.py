from __future__ import annotations

from dataclasses import dataclass

from .gemini_images import GeneratedImage as GeminiGeneratedImage
from .gemini_images import generate_image as generate_gemini_image
from .openai_images import GeneratedImage as OpenAIGeneratedImage
from .openai_images import generate_image as generate_openai_image


@dataclass(frozen=True)
class GeneratedImage:
    filename: str
    content: bytes


def generate_image(provider: str, prompt: str) -> GeneratedImage:
    provider = (provider or "").lower()
    if provider == "gemini":
        img: GeminiGeneratedImage = generate_gemini_image(prompt)
        return GeneratedImage(filename=img.filename, content=img.content)
    if provider == "openai":
        img: OpenAIGeneratedImage = generate_openai_image(prompt)
        return GeneratedImage(filename=img.filename, content=img.content)

    # For custom/unknown providers, prefer Gemini if configured, else OpenAI.
    try:
        img = generate_gemini_image(prompt)
        return GeneratedImage(filename=img.filename, content=img.content)
    except Exception:
        img = generate_openai_image(prompt)
        return GeneratedImage(filename=img.filename, content=img.content)

