from datetime import datetime, timedelta
from typing import Optional

from sqlalchemy.orm import Session

from . import models, config


def recompute_task_status(task: models.Task) -> None:
    """Progress is the single source of truth. Status and completion date are
    derived from it — users never type an overall percentage directly."""
    progress = max(0, min(100, task.progress or 0))
    task.progress = progress

    if progress >= 100:
        if task.status != models.TaskStatus.COMPLETED:
            task.date_completed = datetime.utcnow()
        task.status = models.TaskStatus.COMPLETED
        task.progress = 100
    elif progress > 0:
        task.status = models.TaskStatus.IN_PROGRESS
        task.date_completed = None
    else:
        task.status = models.TaskStatus.NOT_STARTED
        task.date_completed = None


def last_activity_time(db: Session, user_id: int) -> Optional[datetime]:
    """Most recent of: a task update (we approximate with date_completed /
    date_created for now) or a daily update. Task edits don't currently store
    an updated_at column, so daily updates + task completions are the signal."""
    times = []

    latest_update = (
        db.query(models.DailyUpdate)
        .filter(models.DailyUpdate.owner_id == user_id)
        .order_by(models.DailyUpdate.created_at.desc())
        .first()
    )
    if latest_update:
        times.append(latest_update.created_at)

    latest_completed_task = (
        db.query(models.Task)
        .filter(models.Task.owner_id == user_id, models.Task.date_completed.isnot(None))
        .order_by(models.Task.date_completed.desc())
        .first()
    )
    if latest_completed_task:
        times.append(latest_completed_task.date_completed)

    latest_activity_row = (
        db.query(models.Activity)
        .filter(models.Activity.owner_id == user_id)
        .order_by(models.Activity.created_at.desc())
        .first()
    )
    if latest_activity_row:
        times.append(latest_activity_row.created_at)

    return max(times) if times else None


def activity_status_for(last_active: Optional[datetime]) -> str:
    if last_active is None:
        return "NO_ACTIVITY"
    hours_since = (datetime.utcnow() - last_active).total_seconds() / 3600
    if hours_since <= config.ACTIVE_WINDOW_HOURS:
        return "ACTIVE"
    if hours_since <= config.ATTENTION_WINDOW_HOURS:
        return "NEEDS_ATTENTION"
    return "NO_ACTIVITY"


def log_activity(db: Session, owner_id: int, message: str) -> models.Activity:
    entry = models.Activity(owner_id=owner_id, message=message)
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


def notify_all(db: Session, message: str, kind: str = "info") -> None:
    db.add(models.Notification(recipient_id=None, message=message, kind=kind))
    db.commit()
