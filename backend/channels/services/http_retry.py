from __future__ import annotations

import json
import time
from dataclasses import dataclass

import requests


@dataclass(frozen=True)
class HttpResponse:
    status_code: int
    text: str
    json: dict | None


def request_json_with_retry(
    method: str,
    url: str,
    *,
    headers: dict | None = None,
    params: dict | None = None,
    json_body: dict | None = None,
    data: dict | None = None,
    files: dict | None = None,
    timeout: int = 30,
    retries: int = 3,
    backoff_base: float = 1.0,
    retry_statuses: tuple[int, ...] = (429, 500, 502, 503, 504),
) -> HttpResponse:
    """requests wrapper with exponential backoff.

    For Telegram-style 429 responses, respects `parameters.retry_after` when present.
    """

    last_text = ""
    for attempt in range(retries + 1):
        resp = requests.request(
            method,
            url,
            headers=headers,
            params=params,
            json=json_body,
            data=data,
            files=files,
            timeout=timeout,
        )
        raw = resp.text or ""
        last_text = raw

        parsed = None
        try:
            parsed = resp.json()
        except Exception:
            parsed = None

        if resp.status_code not in retry_statuses:
            return HttpResponse(status_code=resp.status_code, text=raw, json=parsed if isinstance(parsed, dict) else None)

        # retry
        if attempt >= retries:
            return HttpResponse(status_code=resp.status_code, text=raw, json=parsed if isinstance(parsed, dict) else None)

        sleep_s = backoff_base * (2 ** attempt)
        if isinstance(parsed, dict):
            params_obj = parsed.get("parameters")
            if isinstance(params_obj, dict) and isinstance(params_obj.get("retry_after"), (int, float)):
                sleep_s = max(float(params_obj["retry_after"]), sleep_s)
        time.sleep(min(30.0, sleep_s))

    return HttpResponse(status_code=599, text=last_text, json=None)
