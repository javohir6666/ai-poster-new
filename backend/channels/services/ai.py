from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Any

import requests
from django.conf import settings

from .http_retry import request_json_with_retry

from ..models import AIModel


@dataclass(frozen=True)
class AIUsage:
    prompt_tokens: int = 0
    output_tokens: int = 0
    total_tokens: int = 0


@dataclass(frozen=True)
class AITextResult:
    text: str
    usage: AIUsage


def _extract_text(data: Any, fallback: str) -> str:
    if isinstance(data, str):
        return data
    if isinstance(data, dict):
        for key in ("text", "content", "message", "result", "output"):
            value = data.get(key)
            if isinstance(value, str) and value.strip():
                return value
        for key in ("data", "choices"):
            value = data.get(key)
            if isinstance(value, str) and value.strip():
                return value
            if isinstance(value, list) and value:
                first = value[0]
                if isinstance(first, dict):
                    for k in ("text", "content", "message"):
                        v = first.get(k)
                        if isinstance(v, str) and v.strip():
                            return v
        return fallback
    if isinstance(data, list) and data:
        first = data[0]
        if isinstance(first, str):
            return first
        if isinstance(first, dict):
            for k in ("text", "content", "message"):
                v = first.get(k)
                if isinstance(v, str) and v.strip():
                    return v
    return fallback


def generate_text_result(ai_model: AIModel, prompt: str, *, timeout: int = 25) -> AITextResult:
    provider = (ai_model.provider or "custom").lower()

    if provider == "gemini":
        api_key = getattr(settings, "GEMINI_API_KEY", "") or ""
        if not api_key:
            raise ValueError("GEMINI_API_KEY is not configured")

        model_name = ai_model.model or "gemini-2.5-flash"
        base_url = ai_model.base_url or (
            f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent"
        )

        payload = {
            "contents": [
                {
                    "role": "user",
                    "parts": [{"text": prompt}],
                }
            ]
        }

        res = request_json_with_retry("POST", f"{base_url}?key={api_key}", json_body=payload, timeout=timeout, retries=3)
        raw = res.text
        if res.status_code >= 400:
            raise RuntimeError(f"AI request failed: {res.status_code} {raw[:400]}")
        data = res.json if isinstance(res.json, dict) else raw

        # Gemini: candidates[0].content.parts[0].text
        text_out = ""
        try:
            candidates = data.get("candidates") if isinstance(data, dict) else None
            if isinstance(candidates, list) and candidates:
                content = candidates[0].get("content", {})
                parts = content.get("parts", [])
                if isinstance(parts, list) and parts and isinstance(parts[0], dict):
                    text_out = (parts[0].get("text") or "").strip()
        except Exception:
            text_out = ""

        if not text_out:
            text_out = _extract_text(data, raw).strip()

        # Usage: usageMetadata
        usage = AIUsage()
        if isinstance(data, dict):
            meta = data.get("usageMetadata")
            if isinstance(meta, dict):
                pt = int(meta.get("promptTokenCount") or 0)
                ct = int(meta.get("candidatesTokenCount") or 0)
                tt = int(meta.get("totalTokenCount") or (pt + ct))
                usage = AIUsage(prompt_tokens=pt, output_tokens=ct, total_tokens=tt)

        return AITextResult(text=text_out, usage=usage)

    if provider == "openai":
        api_key = getattr(settings, "OPENAI_API_KEY", "") or ""
        if not api_key:
            raise ValueError("OPENAI_API_KEY is not configured")

        model_name = ai_model.model or "gpt-4o-mini"
        base_url = ai_model.base_url or "https://api.openai.com/v1/responses"

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }
        payload = {"model": model_name, "input": prompt}

        res = request_json_with_retry("POST", base_url, headers=headers, json_body=payload, timeout=timeout, retries=3)
        raw = res.text
        if res.status_code >= 400:
            raise RuntimeError(f"AI request failed: {res.status_code} {raw[:400]}")
        data = res.json if isinstance(res.json, dict) else raw

        text_out = ""
        if isinstance(data, dict) and isinstance(data.get("output_text"), str) and data["output_text"].strip():
            text_out = data["output_text"].strip()
        else:
            try:
                out = data.get("output") if isinstance(data, dict) else None
                if isinstance(out, list):
                    parts: list[str] = []
                    for item in out:
                        if not isinstance(item, dict) or item.get("type") != "message":
                            continue
                        content = item.get("content")
                        if not isinstance(content, list):
                            continue
                        for part in content:
                            if not isinstance(part, dict):
                                continue
                            if part.get("type") in ("output_text", "text"):
                                txt = part.get("text")
                                if isinstance(txt, str) and txt.strip():
                                    parts.append(txt.strip())
                    if parts:
                        text_out = "\n".join(parts).strip()
            except Exception:
                text_out = ""

        if not text_out:
            text_out = _extract_text(data, raw).strip()

        usage = AIUsage()
        if isinstance(data, dict):
            u = data.get("usage")
            if isinstance(u, dict):
                pt = int(u.get("input_tokens") or 0)
                ot = int(u.get("output_tokens") or 0)
                tt = int(u.get("total_tokens") or (pt + ot))
                usage = AIUsage(prompt_tokens=pt, output_tokens=ot, total_tokens=tt)

        return AITextResult(text=text_out, usage=usage)

    # custom provider
    if not ai_model.base_url:
        raise ValueError("AI model base_url not configured")
    if not ai_model.api_key:
        raise ValueError("AI model api_key not configured")

    headers = {"Authorization": f"Bearer {ai_model.api_key}", "Content-Type": "application/json"}
    payload = {"prompt": prompt}

    res = request_json_with_retry("POST", ai_model.base_url, headers=headers, json_body=payload, timeout=timeout, retries=3)
    raw = res.text
    if res.status_code >= 400:
        raise RuntimeError(f"AI request failed: {res.status_code} {raw[:400]}")

    data = res.json if isinstance(res.json, dict) else raw

    return AITextResult(text=(_extract_text(data, raw) or "").strip(), usage=AIUsage())


def generate_text(ai_model: AIModel, prompt: str, *, timeout: int = 25) -> str:
    return generate_text_result(ai_model, prompt, timeout=timeout).text
