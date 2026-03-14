from __future__ import annotations

from dataclasses import dataclass
from datetime import timedelta

from django.core.files.base import ContentFile
from django.db import transaction
from django.db.models import F
from django.utils import timezone

from ..cron import compute_next_run
from ..models import AIModel, ChannelAnalytics, ChannelDailyMetric, CronJob, CronJobRun, PostLog
from posts.models import Post, PostImage

import json

from .ai import generate_text_result
from .image_generation import generate_image
from .post_renderer import generate_structured_post
from .telegram import (
    build_inline_keyboard,
    edit_message_reply_markup,
    send_message,
    send_photo_bytes,
)


TELEGRAM_TEXT_LIMIT = 4096
TELEGRAM_CAPTION_LIMIT = 1024


def _generate_topic(ai_model: AIModel, channel):
    parts: list[str] = []
    if channel.customPrompt:
        parts.append(channel.customPrompt.strip())
    parts.append(
        "Generate exactly ONE short topic idea for the next Telegram post. "
        "Return only the topic text (no quotes, no bullets)."
    )
    prompt = "\n\n".join(parts)
    res = generate_text_result(ai_model, prompt)
    return res.text, res.usage


def _build_prompt(job: CronJob, *, topic: str, want_images: bool, recent_titles: list[str]) -> str:
    channel = job.channel
    parts: list[str] = []
    if channel.customPrompt:
        parts.append(channel.customPrompt.strip())

    if recent_titles:
        joined = "\n".join([f"- {t}" for t in recent_titles if t.strip()])
        parts.append("Previous post titles (do NOT repeat or rephrase these):\n" + joined)

    parts.append(f"Topic: {topic.strip()}")

    # We want structured output: title + category + text.
    # Keep it concise, especially when captions are used.
    if want_images:
        parts.append(
            "Return a short title (<= 80 chars), a category name (1-3 words), and post text (<= 800 chars). "
            "Also return EXACTLY 1 image prompt suitable for safe image generation."
        )
    else:
        parts.append(
            "Return a short title (<= 80 chars), a category name (1-3 words), and post text (<= 2500 chars)."
        )

    return "\n\n".join([p for p in parts if p])


def _get_recent_titles(channel, *, limit: int = 12) -> list[str]:
    titles = (
        Post.objects.filter(channel=channel, status="published")
        .exclude(title="")
        .order_by("-id")
        .values_list("title", flat=True)[:limit]
    )
    return [t for t in titles if isinstance(t, str) and t.strip()]


def _pick_ai_model(job: CronJob) -> AIModel:
    channel = job.channel
    if channel.ai_model_id:
        return channel.ai_model
    if channel.aiModel:
        return AIModel.objects.get(name=channel.aiModel)
    raise AIModel.DoesNotExist("No AI model configured")


def _truncate_for_telegram(text: str) -> str:
    text = (text or "").strip()
    if len(text) <= TELEGRAM_TEXT_LIMIT:
        return text
    return text[: TELEGRAM_TEXT_LIMIT - 20].rstrip() + "\n\n[truncated]"


def _caption_html(text_plain: str) -> str:
    cap = (text_plain or "").strip()
    if len(cap) > TELEGRAM_CAPTION_LIMIT:
        cap = cap[: TELEGRAM_CAPTION_LIMIT - 20].rstrip() + "..."

    # No extra formatting in captions to avoid cutting HTML tags mid-way.
    import html

    return html.escape(cap)


def _touch_analytics(channel, now, *, tokens_used: int = 0):
    analytics, _ = ChannelAnalytics.objects.get_or_create(channel=channel)
    if analytics.lastPostAt is None or analytics.lastPostAt.date() != now.date():
        analytics.postsToday = 0
    analytics.postsToday += 1
    analytics.totalPosts += 1
    if tokens_used:
        analytics.aiTokensUsed += int(tokens_used)
    analytics.lastPostAt = now
    analytics.save(update_fields=["postsToday", "totalPosts", "aiTokensUsed", "lastPostAt", "updated_at"])


@dataclass(frozen=True)
class RunResult:
    ok: bool
    detail: str


def run_cron_job(job: CronJob, *, now=None) -> RunResult:
    """Run one CronJob.

    Records:
    - PostLog (success/failed)
    - Post + PostImage (published/failed)
    - CronJobRun + ChannelDailyMetric (analytics)
    """

    now = now or timezone.now()

    # Prevent duplicate runs from scheduler + run_now racing.
    with transaction.atomic():
        job = (
            CronJob.objects.select_for_update()
            .select_related("channel", "channel__ai_model")
            .get(id=job.id)
        )
        if job.lastRunAt and (now - job.lastRunAt).total_seconds() < 30:
            return RunResult(ok=False, detail="duplicate_run_suppressed")
        job.lastRunAt = now
        job.save(update_fields=["lastRunAt"])

    if job.status != "active":
        return RunResult(ok=False, detail="inactive")
    if job.channel.status != "active":
        return RunResult(ok=False, detail="channel_inactive")
    if not job.channel.isAdminVerified:
        return RunResult(ok=False, detail="admin_not_verified")

    run_started = timezone.now()
    ai_model = _pick_ai_model(job)

    run_row = CronJobRun.objects.create(
        channel=job.channel,
        cron_job=job,
        ai_provider=(ai_model.provider or ""),
        ai_model=(ai_model.model or ai_model.name or ""),
        status="failed",  # overwritten on success
        error="",
        started_at=run_started,
    )

    post_obj: Post | None = None
    topic_usage = None
    prompt_tokens = 0
    output_tokens = 0
    total_tokens = 0

    try:
        topic = (job.topic or "").strip()
        if not topic:
            topic_text, topic_usage = _generate_topic(ai_model, job.channel)
            topic = (topic_text or "").strip()
        if not topic:
            raise RuntimeError("AI returned empty topic")

        want_images = bool(job.with_images)
        recent_titles = _get_recent_titles(job.channel)
        prompt = _build_prompt(job, topic=topic, want_images=want_images, recent_titles=recent_titles)

        rendered = generate_structured_post(ai_model, prompt, want_images=want_images)
        text_html = _truncate_for_telegram(rendered.text_html)
        if not text_html:
            raise RuntimeError("AI returned empty text")

        # Token usage accounting (best-effort)
        prompt_tokens = int(getattr(rendered.usage, "prompt_tokens", 0) or 0)
        output_tokens = int(getattr(rendered.usage, "output_tokens", 0) or 0)
        total_tokens = int(getattr(rendered.usage, "total_tokens", 0) or 0)
        if topic_usage is not None:
            prompt_tokens += int(getattr(topic_usage, "prompt_tokens", 0) or 0)
            output_tokens += int(getattr(topic_usage, "output_tokens", 0) or 0)
            total_tokens += int(getattr(topic_usage, "total_tokens", 0) or 0)

        message_id = None
        media_json = ""
        media_error = ""

        post_obj = Post.objects.create(
            channel=job.channel,
            cron_job=job,
            title=(rendered.title or "").strip(),
            category=(rendered.category or "").strip(),
            text_plain=(rendered.text_plain or "").strip(),
            text_html=text_html,
            media="",
            status="draft",
        )

        if want_images and rendered.media:
            media_items = rendered.media[:1]
            prepared: list[tuple[str, bytes]] = []
            for item in media_items:
                img_prompt = item.get("prompt")
                if not isinstance(img_prompt, str) or not img_prompt.strip():
                    raise RuntimeError("Invalid image prompt in AI response")
                generated = generate_image(ai_model.provider, img_prompt.strip())
                prepared.append((generated.filename, generated.content))

            image_rows: list[PostImage] = []
            for idx, item in enumerate(media_items):
                img_prompt = (item.get("prompt") or "").strip()
                filename, content = prepared[idx]
                row = PostImage.objects.create(
                    post=post_obj,
                    prompt=img_prompt,
                    provider=(ai_model.provider or ""),
                    image=ContentFile(content, name=filename or f"image_{idx}.png"),
                )
                image_rows.append(row)

            media_payload: list[dict] = []
            for row in image_rows:
                media_payload.append(
                    {
                        "type": "photo",
                        "prompt": row.prompt,
                        "post_image_id": row.id,
                        "url": getattr(row.image, "url", ""),
                    }
                )
            media_json = json.dumps(media_payload, ensure_ascii=True)

            message_id = send_photo_bytes(
                job.channel.channelUsername,
                prepared[0][1],
                filename=prepared[0][0],
                caption=_caption_html(rendered.text_plain),
                reply_markup=build_inline_keyboard(job.channel.channelUsername),
            )
            try:
                if message_id:
                    edit_message_reply_markup(
                        job.channel.channelUsername,
                        message_id,
                        build_inline_keyboard(job.channel.channelUsername, message_id=message_id),
                    )
            except Exception as e:
                media_error = (media_error + "\n" if media_error else "") + f"keyboard: {e}"
        else:
            message_id = send_message(
                job.channel.channelUsername,
                text_html,
                reply_markup=build_inline_keyboard(job.channel.channelUsername),
            )
            try:
                if message_id:
                    edit_message_reply_markup(
                        job.channel.channelUsername,
                        message_id,
                        build_inline_keyboard(job.channel.channelUsername, message_id=message_id),
                    )
            except Exception as e:
                media_error = (media_error + "\n" if media_error else "") + f"keyboard: {e}"

        _touch_analytics(job.channel, now, tokens_used=total_tokens)

        PostLog.objects.create(
            channel=job.channel,
            cron_job=job,
            topic=topic,
            content=text_html,
            media=media_json,
            status="success",
            error=media_error,
            telegram_message_id=message_id,
            posted_at=now,
        )

        post_obj.telegram_message_id = message_id
        post_obj.media = media_json
        post_obj.status = "published"
        post_obj.posted_at = now
        post_obj.error = media_error
        post_obj.save(update_fields=["telegram_message_id", "media", "status", "posted_at", "error"])

        finished = timezone.now()
        dur_ms = int((finished - run_started).total_seconds() * 1000)
        run_row.post = post_obj
        run_row.telegram_message_id = message_id
        run_row.prompt_tokens = prompt_tokens
        run_row.output_tokens = output_tokens
        run_row.total_tokens = total_tokens
        run_row.status = "success"
        run_row.finished_at = finished
        run_row.duration_ms = dur_ms
        run_row.error = media_error
        run_row.save(
            update_fields=[
                "post",
                "telegram_message_id",
                "prompt_tokens",
                "output_tokens",
                "total_tokens",
                "status",
                "finished_at",
                "duration_ms",
                "error",
            ]
        )

        metric, _ = ChannelDailyMetric.objects.get_or_create(channel=job.channel, date=now.date())
        ChannelDailyMetric.objects.filter(id=metric.id).update(
            runs_total=F("runs_total") + 1,
            runs_success=F("runs_success") + 1,
            posts_published=F("posts_published") + 1,
            tokens_total=F("tokens_total") + int(total_tokens),
            duration_total_ms=F("duration_total_ms") + int(dur_ms),
        )

        job.nextRun = compute_next_run(job.schedule, now)
        job.save(update_fields=["nextRun"])

        if media_error:
            return RunResult(ok=True, detail=("posted_with_warnings: " + media_error)[:240])
        return RunResult(ok=True, detail="posted")

    except Exception as e:
        job.nextRun = (now + timedelta(minutes=5)).replace(second=0, microsecond=0)
        job.save(update_fields=["nextRun"])

        try:
            if post_obj is not None:
                post_obj.status = "failed"
                post_obj.error = str(e)
                post_obj.save(update_fields=["status", "error"])
        except Exception:
            pass

        try:
            finished = timezone.now()
            dur_ms = int((finished - run_started).total_seconds() * 1000)

            run_row.status = "failed"
            run_row.finished_at = finished
            run_row.duration_ms = dur_ms
            run_row.prompt_tokens = int(prompt_tokens)
            run_row.output_tokens = int(output_tokens)
            run_row.total_tokens = int(total_tokens)
            run_row.error = str(e)
            run_row.save(
                update_fields=[
                    "status",
                    "finished_at",
                    "duration_ms",
                    "prompt_tokens",
                    "output_tokens",
                    "total_tokens",
                    "error",
                ]
            )

            metric, _ = ChannelDailyMetric.objects.get_or_create(channel=job.channel, date=now.date())
            ChannelDailyMetric.objects.filter(id=metric.id).update(
                runs_total=F("runs_total") + 1,
                runs_failed=F("runs_failed") + 1,
                tokens_total=F("tokens_total") + int(total_tokens),
                duration_total_ms=F("duration_total_ms") + int(dur_ms),
            )
        except Exception:
            pass

        PostLog.objects.create(
            channel=job.channel,
            cron_job=job,
            topic=(job.topic or "").strip(),
            status="failed",
            error=str(e),
        )

        return RunResult(ok=False, detail=str(e))
