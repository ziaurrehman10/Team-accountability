from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import models, schemas, auth, utils
from ..database import get_db

router = APIRouter(prefix="/api", tags=["users"])


def _person_summary(db: Session, user: models.User) -> schemas.PersonSummary:
    tasks = db.query(models.Task).filter(models.Task.owner_id == user.id).order_by(models.Task.order_index).all()
    total = len(tasks)
    completed = sum(1 for t in tasks if t.status == models.TaskStatus.COMPLETED)
    in_progress = sum(1 for t in tasks if t.status == models.TaskStatus.IN_PROGRESS)
    not_started = sum(1 for t in tasks if t.status == models.TaskStatus.NOT_STARTED)

    overall_progress = round(sum(t.progress for t in tasks) / total, 1) if total else 0.0

    current_task = next((t.name for t in tasks if t.status == models.TaskStatus.IN_PROGRESS), None)
    next_task = next((t.name for t in tasks if t.status == models.TaskStatus.NOT_STARTED), None)

    last_active = utils.last_activity_time(db, user.id)
    status_label = utils.activity_status_for(last_active)

    return schemas.PersonSummary(
        id=user.id,
        username=user.username,
        display_name=user.display_name,
        overall_progress=overall_progress,
        completed=completed,
        in_progress=in_progress,
        not_started=not_started,
        total=total,
        current_task=current_task,
        next_task=next_task,
        activity_status=status_label,
        last_activity_at=last_active,
    )


@router.get("/users", response_model=List[schemas.UserPublic])
def list_users(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    return db.query(models.User).order_by(models.User.id).all()


@router.get("/dashboard", response_model=schemas.DashboardOut)
def dashboard(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    users = db.query(models.User).order_by(models.User.id).all()
    people = [_person_summary(db, u) for u in users]

    all_tasks = db.query(models.Task).all()
    total_tasks = len(all_tasks)
    completed = sum(1 for t in all_tasks if t.status == models.TaskStatus.COMPLETED)
    in_progress = sum(1 for t in all_tasks if t.status == models.TaskStatus.IN_PROGRESS)
    not_started = sum(1 for t in all_tasks if t.status == models.TaskStatus.NOT_STARTED)
    # Weighted by each task's own progress percentage, same method used per-person,
    # so team and per-person figures are always consistent with each other.
    overall_progress = round(sum(t.progress for t in all_tasks) / total_tasks, 1) if total_tasks else 0.0
    active_members = sum(1 for p in people if p.activity_status == "ACTIVE")

    team_summary = schemas.TeamSummary(
        total_tasks=total_tasks,
        completed=completed,
        in_progress=in_progress,
        not_started=not_started,
        overall_progress=overall_progress,
        active_members=active_members,
        total_members=len(people),
    )

    return schemas.DashboardOut(team_summary=team_summary, people=people)


@router.get("/users/{user_id}/summary", response_model=schemas.PersonSummary)
def person_summary(user_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="User not found")
    return _person_summary(db, user)
