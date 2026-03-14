from __future__ import annotations

from celery import shared_task
from django.db import transaction
from django.db.models import Q
from django.utils import timezone

from .cron import compute_next_run
from .models import CronJob
from .services.runner import run_cron_job


@shared_task
def process_due_cron_jobs(*, max_jobs: int = 50) -> dict:
    """Periodic task. Picks due jobs and runs them.

    Designed to be safe with multiple workers:
    - Uses row-level locking when supported.
    - `run_cron_job` has duplicate suppression via lastRunAt.
    """

    now = timezone.now()

    # Quick preselect to keep lock scopes small.
    ids = list(
        CronJob.objects.filter(status="active", channel__status="active")
        .filter(Q(nextRun__lte=now) | Q(nextRun__isnull=True))
        .values_list("id", flat=True)
        .order_by("nextRun", "id")[: max(1, int(max_jobs))]
    )

    processed = 0
    ok = 0
    failed = 0

    for job_id in ids:
        job = None
        try:
            # Lock a single job row to avoid double-processing.
            with transaction.atomic():
                qs = CronJob.objects.select_related("channel", "channel__ai_model").filter(id=job_id)
                try:
                    job = qs.select_for_update(skip_locked=True).first()
                except TypeError:
                    job = qs.select_for_update().first()

                if not job:
                    continue

                if job.nextRun is None:
                    job.nextRun = compute_next_run(job.schedule, now)
                    job.save(update_fields=["nextRun"])

                # Not due after initialization.
                if job.nextRun and job.nextRun > now:
                    continue

            # Run outside the lock to keep DB contention low.
            res = run_cron_job(job, now=now)
            processed += 1
            if res.ok:
                ok += 1
            else:
                failed += 1
        except Exception:
            processed += 1
            failed += 1

    return {"processed": processed, "ok": ok, "failed": failed, "checked": len(ids)}
