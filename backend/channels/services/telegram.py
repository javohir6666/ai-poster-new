from __future__ import annotations

import json
from urllib.parse import quote, urlparse

import requests
from django.conf import settings

from .http_retry import request_json_with_retry


def _require_token() -> str:
    token = getattr(settings, "TELEGRAM_BOT_TOKEN", "") or ""
    if not token:
        raise ValueError("TELEGRAM_BOT_TOKEN is not configured")
    return token


def build_inline_keyboard(channel_username: str, *, message_id: int | None = None) -> dict:
    """Inline keyboard:
    1) Subscribe link -> t.me/<username>
    2) Share link -> t.me/share/url?url=https://t.me/<username>/<message_id>

    Note: Telegram doesn't support "forward this message" from bots. The share URL is the closest UX.
    """

    ch = (channel_username or "").strip()
    username = ch[1:] if ch.startswith("@") else ch

    subscribe_url = f"https://t.me/{username}" if username else "https://t.me/"

    buttons = [{"text": "Kanalga obuna bo'ling", "url": subscribe_url}]

    if username and message_id:
        msg_url = f"https://t.me/{username}/{int(message_id)}"
        share_url = f"https://t.me/share/url?url={quote(msg_url, safe='')}"
        buttons.append({"text": "Ulashish", "url": share_url})

    return {"inline_keyboard": [buttons]}


def edit_message_reply_markup(chat_id: str, message_id: int, reply_markup: dict, *, timeout: int = 20) -> None:
    token = _require_token()
    url = f"https://api.telegram.org/bot{token}/editMessageReplyMarkup"
    payload = {
        "chat_id": chat_id,
        "message_id": int(message_id),
        "reply_markup": reply_markup,
    }

    res = request_json_with_retry("POST", url, json_body=payload, timeout=timeout, retries=3)
    raw = res.text
    if res.status_code >= 400:
        raise RuntimeError(f"Telegram editMessageReplyMarkup failed: {res.status_code} {raw[:400]}")

    data = res.json or {}
    if isinstance(data, dict) and data.get("ok") is False:
        raise RuntimeError(f"Telegram editMessageReplyMarkup failed: {raw[:400]}")


def send_message(
    chat_id: str,
    text: str,
    *,
    parse_mode: str = "HTML",
    reply_markup: dict | None = None,
    timeout: int = 20,
) -> int | None:
    token = _require_token()
    url = f"https://api.telegram.org/bot{token}/sendMessage"
    payload: dict = {
        "chat_id": chat_id,
        "text": text,
        "parse_mode": parse_mode,
        "disable_web_page_preview": True,
    }
    if reply_markup:
        payload["reply_markup"] = reply_markup

    res = request_json_with_retry("POST", url, json_body=payload, timeout=timeout, retries=3)
    raw = res.text
    if res.status_code >= 400:
        raise RuntimeError(f"Telegram sendMessage failed: {res.status_code} {raw[:400]}")

    data = res.json or {}
    if isinstance(data, dict) and data.get("ok") is False:
        raise RuntimeError(f"Telegram sendMessage failed: {raw[:400]}")

    if isinstance(data, dict) and data.get("ok") and isinstance(data.get("result"), dict):
        return data["result"].get("message_id")

    return None


def fetch_image_bytes(photo_url: str, *, timeout: int, max_bytes: int = 10 * 1024 * 1024) -> tuple[str, bytes]:
    parsed = urlparse(photo_url)
    if parsed.scheme not in ("http", "https"):
        raise RuntimeError("Photo URL must be http(s)")

    resp = requests.get(
        photo_url,
        timeout=timeout,
        stream=True,
        allow_redirects=True,
        headers={"User-Agent": "ai-poster-bot/1.0"},
    )
    if resp.status_code >= 400:
        raise RuntimeError(f"Failed to fetch image: {resp.status_code} {photo_url}")

    content_type = (resp.headers.get("Content-Type") or "").split(";")[0].strip().lower()
    if content_type and not content_type.startswith("image/"):
        raise RuntimeError(f"Fetched URL is not an image (Content-Type={content_type})")

    content = resp.content
    if not content:
        raise RuntimeError("Fetched image is empty")
    if len(content) > max_bytes:
        raise RuntimeError("Image too large (>10MB)")

    filename = "image.jpg"
    if content_type.startswith("image/"):
        ext = content_type.split("/", 1)[1].strip() or "jpg"
        if ext == "jpeg":
            ext = "jpg"
        filename = f"image.{ext}"

    return filename, content


def send_photo_bytes(
    chat_id: str,
    image_bytes: bytes,
    *,
    filename: str = "image.jpg",
    caption: str = "",
    parse_mode: str = "HTML",
    reply_markup: dict | None = None,
    timeout: int = 30,
) -> int | None:
    token = _require_token()
    url = f"https://api.telegram.org/bot{token}/sendPhoto"

    files = {"photo": (filename, image_bytes)}
    data: dict = {"chat_id": chat_id, "caption": caption, "parse_mode": parse_mode}
    if reply_markup:
        # multipart: reply_markup must be JSON string
        data["reply_markup"] = json.dumps(reply_markup, ensure_ascii=True)

    res = request_json_with_retry("POST", url, data=data, files=files, timeout=timeout, retries=3)
    raw = res.text
    if res.status_code >= 400:
        raise RuntimeError(f"Telegram sendPhoto(upload) failed: {res.status_code} {raw[:400]}")

    data = res.json or {}
    if isinstance(data, dict) and data.get("ok") is False:
        raise RuntimeError(f"Telegram sendPhoto(upload) failed: {raw[:400]}")

    if isinstance(data, dict) and data.get("ok") and isinstance(data.get("result"), dict):
        return data["result"].get("message_id")

    return None


def send_media_group_bytes(
    chat_id: str,
    images: list[tuple[str, bytes]],
    *,
    caption: str = "",
    parse_mode: str = "HTML",
    timeout: int = 40,
) -> list[int]:
    """Sends an album from already-downloaded image bytes.

    Telegram does not accept reply_markup in sendMediaGroup.
    """

    token = _require_token()
    url = f"https://api.telegram.org/bot{token}/sendMediaGroup"

    files: dict[str, tuple[str, bytes]] = {}
    media: list[dict] = []

    for idx, (fname, content) in enumerate(images[:10]):
        attach_name = f"file{idx}"
        files[attach_name] = (fname, content)
        item = {"type": "photo", "media": f"attach://{attach_name}"}
        if idx == 0 and caption:
            item["caption"] = caption[:1024]
            item["parse_mode"] = parse_mode
        media.append(item)

    data = {"chat_id": chat_id, "media": json.dumps(media, ensure_ascii=True)}
    res = request_json_with_retry("POST", url, data=data, files=files, timeout=timeout, retries=3)
    raw = res.text
    if res.status_code >= 400:
        raise RuntimeError(f"Telegram sendMediaGroup(upload) failed: {res.status_code} {raw[:400]}")

    up_data = res.json or {}
    if isinstance(up_data, dict) and up_data.get("ok") is False:
        raise RuntimeError(f"Telegram sendMediaGroup(upload) failed: {raw[:400]}")

    message_ids: list[int] = []
    if isinstance(up_data, dict) and up_data.get("ok") and isinstance(up_data.get("result"), list):
        for msg in up_data["result"]:
            if isinstance(msg, dict) and isinstance(msg.get("message_id"), int):
                message_ids.append(msg["message_id"])

    return message_ids
