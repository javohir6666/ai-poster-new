from __future__ import annotations

import os

from celery import Celery


os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

app = Celery("config")

# Read settings from Django settings, using CELERY_ prefix.
app.config_from_object("django.conf:settings", namespace="CELERY")

# Autodiscover tasks.py in installed apps.
app.autodiscover_tasks()

# Run the scheduler frequently to reduce drift.
app.conf.beat_schedule = {
    "process-due-cron-jobs": {
        "task": "channels.tasks.process_due_cron_jobs",
        "schedule": 30.0,
        "kwargs": {"max_jobs": 50},
    }
}
