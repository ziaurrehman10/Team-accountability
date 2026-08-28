from typing import List, Optional

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import models, schemas, auth, utils
from ..database import get_db

router = APIRouter(prefix="/api/daily-updates", tags=["daily-updates"])


@router.get("", response_model=List[schemas.DailyUpdateOut])
def list_daily_updates(
    owner_id: Optional[int] = None,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    query = db.query(models.DailyUpdate)
    if owner_id is not None:
        query = query.filter(models.DailyUpdate.owner_id == owner_id)
    return query.order_by(models.DailyUpdate.created_at.desc()).limit(limit).all()


@router.post("", response_model=schemas.DailyUpdateOut, status_code=201)
def create_daily_update(
    payload: schemas.DailyUpdateCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    task_name = payload.task_name_snapshot
    if payload.task_id and not task_name:
        task = db.query(models.Task).filter(models.Task.id == payload.task_id).first()
        task_name = task.name if task else ""

    update = models.DailyUpdate(
        owner_id=current_user.id,
        task_id=payload.task_id,
        task_name_snapshot=task_name or "",
        what_completed=payload.what_completed,
        work_note=payload.work_note or "",
        tomorrow_plan=payload.tomorrow_plan or "",
    )
    db.add(update)
    db.commit()
    db.refresh(update)

    utils.log_activity(db, current_user.id, f'{current_user.display_name} logged a daily update on "{task_name}"' if task_name else f'{current_user.display_name} logged a daily update')
    return update
