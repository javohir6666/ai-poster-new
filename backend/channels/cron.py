from __future__ import annotations

from dataclasses import dataclass
from datetime import timedelta
from typing import Iterable, Set


def _expand_cron_field(field: str, min_value: int, max_value: int, *, allow_7_as_0: bool = False) -> Set[int]:
    field = (field or "").strip()
    if not field:
        raise ValueError("Empty cron field")

    if field == "*":
        return set(range(min_value, max_value + 1))

    values: Set[int] = set()
    for part in field.split(","):
        part = part.strip()
        if not part:
            raise ValueError("Empty cron part")

        if part.startswith("*/"):
            step = int(part[2:])
            if step <= 0:
                raise ValueError(f"Invalid step: {part}")
            values.update(range(min_value, max_value + 1, step))
            continue

        step = 1
        if "/" in part:
            base, step_str = part.split("/", 1)
            step = int(step_str)
            if step <= 0:
                raise ValueError(f"Invalid step: {part}")
            part = base

        if part == "*":
            values.update(range(min_value, max_value + 1, step))
            continue

        if "-" in part:
            start_str, end_str = part.split("-", 1)
            start = int(start_str)
            end = int(end_str)
            if allow_7_as_0 and start == 7:
                start = 0
            if allow_7_as_0 and end == 7:
                end = 0
            if start < min_value or end > max_value:
                raise ValueError(f"Out of bounds range: {part}")
            if start <= end:
                values.update(range(start, end + 1, step))
            else:
                # Wrap-around range (e.g. 23-2 for hours)
                values.update(range(start, max_value + 1, step))
                values.update(range(min_value, end + 1, step))
            continue

        value = int(part)
        if allow_7_as_0 and value == 7:
            value = 0
        if value < min_value or value > max_value:
            raise ValueError(f"Out of bounds value: {part}")
        values.add(value)

    return values


@dataclass(frozen=True)
class CronSchedule:
    minutes: Set[int]
    hours: Set[int]
    months: Set[int]
    dom: Set[int] | None  # None means '*'
    dow: Set[int] | None  # None means '*'

    @classmethod
    def parse(cls, expr: str) -> "CronSchedule":
        parts = (expr or "").split()
        if len(parts) != 5:
            raise ValueError("Cron must have 5 fields: minute hour dom month dow")

        minute_s, hour_s, dom_s, month_s, dow_s = parts
        minutes = _expand_cron_field(minute_s, 0, 59)
        hours = _expand_cron_field(hour_s, 0, 23)
        months = _expand_cron_field(month_s, 1, 12)

        dom = None if dom_s == "*" else _expand_cron_field(dom_s, 1, 31)
        # In cron, day-of-week is typically 0-6 (Sun=0) and sometimes 7=Sun.
        dow = None if dow_s == "*" else _expand_cron_field(dow_s, 0, 6, allow_7_as_0=True)

        return cls(minutes=minutes, hours=hours, months=months, dom=dom, dow=dow)

    def matches(self, dt) -> bool:
        if dt.minute not in self.minutes:
            return False
        if dt.hour not in self.hours:
            return False
        if dt.month not in self.months:
            return False

        dom_any = self.dom is None
        dow_any = self.dow is None

        dom_ok = dom_any or dt.day in self.dom

        # Python weekday: Mon=0..Sun=6, cron: Sun=0..Sat=6
        cron_dow = (dt.weekday() + 1) % 7
        dow_ok = dow_any or cron_dow in self.dow

        if dom_any and dow_any:
            return True
        if dom_any:
            return dow_ok
        if dow_any:
            return dom_ok

        # Common cron semantics: if both dom and dow are restricted, match if either matches.
        return dom_ok or dow_ok


def compute_next_run(expr: str, base_dt, *, max_minutes: int = 525600):
    """
    Compute next run timestamp (timezone-aware) after `base_dt`.
    Dependency-free cron evaluator; iterates minute-by-minute for simplicity.
    """
    schedule = CronSchedule.parse(expr)
    candidate = (base_dt + timedelta(minutes=1)).replace(second=0, microsecond=0)
    for _ in range(max_minutes):
        if schedule.matches(candidate):
            return candidate
        candidate = candidate + timedelta(minutes=1)
    raise ValueError("Unable to find next run time within max_minutes")

