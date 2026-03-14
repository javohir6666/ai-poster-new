from __future__ import annotations

import hashlib

from django.core.files.storage import default_storage
from django.db import models


def _post_image_upload_to(instance: "PostImage", filename: str) -> str:
    # Keep it simple and predictable; filename is normalized at save time.
    return f"generated/posts/{instance.post_id}/{filename}"


class Post(models.Model):
    STATUS_CHOICES = [
        ("published", "Published"),
        ("draft", "Draft"),
        ("failed", "Failed"),
    ]

    channel = models.ForeignKey(
        "channels.Channel",
        on_delete=models.CASCADE,
        related_name="posts",
    )
    cron_job = models.ForeignKey(
        "channels.CronJob",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="posts",
    )

    title = models.CharField(max_length=255, blank=True, default="")
    category = models.CharField(max_length=120, blank=True, default="")

    text_plain = models.TextField(blank=True, default="")
    text_html = models.TextField(blank=True, default="")
    media = models.TextField(blank=True, default="")  # JSON string (list of media dicts)

    telegram_message_id = models.IntegerField(null=True, blank=True)
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default="draft")
    error = models.TextField(blank=True, default="")

    created_at = models.DateTimeField(auto_now_add=True)
    posted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["channel", "-id"]),
        ]

    def __str__(self) -> str:
        label = self.title or "(untitled)"
        return f"Post: {label} [{self.channel_id}]"


class PostImage(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="images")

    prompt = models.TextField(blank=True, default="")
    provider = models.CharField(max_length=20, blank=True, default="")

    image = models.FileField(upload_to=_post_image_upload_to)
    sha256 = models.CharField(max_length=64, blank=True, default="")

    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        # Compute sha256 after file is present.
        super().save(*args, **kwargs)
        if self.image and not self.sha256:
            try:
                with default_storage.open(self.image.name, "rb") as f:
                    digest = hashlib.sha256(f.read()).hexdigest()
                self.sha256 = digest
                super().save(update_fields=["sha256"])
            except Exception:
                # Best-effort; don't fail main flow.
                return

    def __str__(self) -> str:
        return f"PostImage: {self.post_id}"
