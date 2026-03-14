from __future__ import annotations

import time

from django.core.management.base import BaseCommand
from django.db.models import Q
from django.utils import timezone

from ...cron import compute_next_run
from ...models import CronJob
from ...services.runner import run_cron_job


class Command(BaseCommand):
    help = "Runs a simple in-process scheduler to execute due CronJobs."

    def add_arguments(self, parser):
        parser.add_argument("--once", action="store_true", help="Run one iteration and exit")
        parser.add_argument("--sleep", type=int, default=15, help="Sleep seconds between iterations (default: 15)")

    def handle(self, *args, **options):
        run_once = bool(options["once"])
        sleep_s = int(options["sleep"])

        self.stdout.write(self.style.SUCCESS("Scheduler started"))

        while True:
            now = timezone.now()

            due = (
                CronJob.objects.select_related("channel", "channel__ai_model")
                .filter(status="active", channel__status="active")
                .filter(Q(nextRun__lte=now) | Q(nextRun__isnull=True))
                .order_by("nextRun", "id")
            )

            for job in due:
                # If nextRun is null, initialize it (don't post immediately unless it's actually due).
                if job.nextRun is None:
                    try:
                        job.nextRun = compute_next_run(job.schedule, now)
                        job.save(update_fields=["nextRun"])
                    except Exception as e:
                        job.status = "inactive"
                        job.save(update_fields=["status"])
                        self.stdout.write(f"[{job.id}] INVALID CRON: {e}")
                        continue

                if job.nextRun is None or job.nextRun > now:
                    # Either not initialized or not due yet.
                    continue

                result = run_cron_job(job, now=now)
                if result.ok:
                    self.stdout.write(f"[{job.id}] OK: {result.detail}")
                else:
                    self.stdout.write(f"[{job.id}] FAIL: {result.detail}")

            if run_once:
                break

            time.sleep(max(1, sleep_s))
