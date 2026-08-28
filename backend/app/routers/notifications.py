from datetime import date, datetime, timedelta
from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import or_

from .. import models, schemas, auth, config
from ..database import get_db

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


@router.get("", response_model=List[schemas.NotificationOut])
def list_notifications(
    limit: int = 30,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    """Returns broadcast notifications (completions, progress updates) plus
    deadline/overdue notices computed live for the current user's own tasks."""
    stored = (
        db.query(models.Notification)
        .filter(or_(models.Notification.recipient_id.is_(None), models.Notification.recipient_id == current_user.id))
        .order_by(models.Notification.created_at.desc())
        .limit(limit)
        .all()
    )

    today = date.today()
    soon_cutoff = today + timedelta(days=config.DUE_SOON_DAYS)
    my_tasks = (
        db.query(models.Task)
        .filter(models.Task.owner_id == current_user.id, models.Task.status != models.TaskStatus.COMPLETED)
        .all()
    )

    computed = []
    for t in my_tasks:
        if not t.due_date:
            continue
        due_as_datetime = datetime.combine(t.due_date, datetime.min.time())
        if t.due_date < today:
            computed.append(models.Notification(
                id=-t.id * 2, recipient_id=current_user.id,
                message=f'"{t.name}" is overdue (was due {t.due_date.isoformat()})',
                kind="overdue", read=False, created_at=due_as_datetime,
            ))
        elif t.due_date <= soon_cutoff:
            computed.append(models.Notification(
                id=-t.id * 2 - 1, recipient_id=current_user.id,
                message=f'"{t.name}" is due soon ({t.due_date.isoformat()})',
                kind="deadline", read=False, created_at=due_as_datetime,
            ))

    combined = computed + stored
    combined.sort(key=lambda n: n.created_at, reverse=True)
    return combined[:limit]
