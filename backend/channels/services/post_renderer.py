from __future__ import annotations

import html
import json
import re
from dataclasses import dataclass
from typing import Any

from ..models import AIModel
from .ai import AIUsage, generate_text_result


@dataclass(frozen=True)
class RenderedPost:
    title: str
    category: str
    text_plain: str
    text_html: str
    media: list[dict]  # normalized: [{"type":"photo","prompt":"..."}]
    usage: AIUsage


_RE_BOLD = re.compile(r"\*\*(.+?)\*\*")
_RE_ITALIC = re.compile(r"\*(.+?)\*")
_RE_CODE = re.compile(r"`([^`]+)`")


def format_telegram_html(text: str) -> str:
    """Minimal Telegram-HTML formatter: escapes + converts **bold**, *italic*, `code`."""

    safe = html.escape((text or "").strip())
    safe = _RE_CODE.sub(r"<code>\1</code>", safe)
    safe = _RE_BOLD.sub(r"<b>\1</b>", safe)
    safe = _RE_ITALIC.sub(r"<i>\1</i>", safe)
    return safe


def _coerce_media(images: Any) -> list[dict]:
    media: list[dict] = []
    if not images:
        return media
    if isinstance(images, list):
        for item in images:
            if isinstance(item, dict):
                prompt = item.get("prompt")
                if isinstance(prompt, str) and prompt.strip():
                    media.append({"type": "photo", "prompt": prompt.strip()})
    return media[:10]


def generate_structured_post(ai_model: AIModel, prompt: str, *, want_images: bool) -> RenderedPost:
    """Ask AI for structured JSON.

    Expected JSON:
      {"title": "...", "category": "...", "text": "...", "images": [{"prompt": "..."}, ...]}
    """

    schema = (
        '{"title": string, "category": string, "text": string, "images": [{"prompt": string}]}'
        if want_images
        else '{"title": string, "category": string, "text": string, "images": []}'
    )

    schema_prompt = (
        prompt
        + "\n\nReturn STRICT JSON only, no markdown, no prose.\n"
        + "Schema: "
        + schema
        + "\n"
    )

    res = generate_text_result(ai_model, schema_prompt)
    raw = res.text

    title = ""
    category = ""
    text_out = raw
    images: list[dict] = []

    candidate = raw.strip()
    # Common model behavior: wrap JSON in ```json ... ```
    if candidate.startswith("```"):
        candidate = re.sub(r"^```[a-zA-Z0-9_-]*\n?", "", candidate)
        candidate = re.sub(r"\n?```$", "", candidate).strip()

    def _try_parse(value: str):
        try:
            return json.loads(value)
        except Exception:
            return None

    data = _try_parse(candidate)
    if data is None:
        start = candidate.find("{")
        end = candidate.rfind("}")
        if start != -1 and end != -1 and end > start:
            data = _try_parse(candidate[start : end + 1])

    if isinstance(data, dict):
        if isinstance(data.get("title"), str):
            title = data["title"].strip()
        if isinstance(data.get("category"), str):
            category = data["category"].strip()
        if isinstance(data.get("text"), str):
            text_out = data["text"]
        images = _coerce_media(data.get("images")) if want_images else []

    text_plain_core = (text_out or "").strip()

    if not title and text_plain_core:
        first = text_plain_core.splitlines()[0].strip()
        title = first[:120]

    send_plain = (f"{title}\n\n{text_plain_core}" if title else text_plain_core).strip()
    return RenderedPost(
        title=title,
        category=category,
        text_plain=send_plain,
        text_html=format_telegram_html(send_plain),
        media=images,
        usage=res.usage,
    )
