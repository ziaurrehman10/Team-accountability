from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import models, schemas, auth, utils
from ..database import get_db

router = APIRouter(prefix="/api/tasks", tags=["tasks"])


@router.get("", response_model=List[schemas.TaskOut])
def list_tasks(
    owner_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    """Everyone can VIEW everyone's tasks (read-only for non-owners)."""
    query = db.query(models.Task)
    if owner_id is not None:
        query = query.filter(models.Task.owner_id == owner_id)
    return query.order_by(models.Task.owner_id, models.Task.order_index).all()


@router.get("/mine", response_model=List[schemas.TaskOut])
def my_tasks(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    return (
        db.query(models.Task)
        .filter(models.Task.owner_id == current_user.id)
        .order_by(models.Task.order_index)
        .all()
    )


@router.post("", response_model=schemas.TaskOut, status_code=status.HTTP_201_CREATED)
def create_task(
    payload: schemas.TaskCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    """A user may only create tasks for themselves."""
    task = models.Task(
        owner_id=current_user.id,
        name=payload.name,
        description=payload.description or "",
        priority=payload.priority,
        due_date=payload.due_date,
        notes=payload.notes or "",
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    utils.log_activity(db, current_user.id, f'{current_user.display_name} added a new task "{task.name}"')
    return task


@router.patch("/{task_id}", response_model=schemas.TaskOut)
def update_task(
    task_id: int,
    payload: schemas.TaskUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    if task.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only edit your own tasks")

    was_completed = task.status == models.TaskStatus.COMPLETED
    old_progress = task.progress

    data = payload.model_dump(exclude_unset=True)
    if "progress" in data and data["progress"] is not None:
        task.progress = data["progress"]
    if "notes" in data and data["notes"] is not None:
        task.notes = data["notes"]
    if "description" in data and data["description"] is not None:
        task.description = data["description"]
    if "priority" in data and data["priority"] is not None:
        task.priority = data["priority"]
    if "due_date" in data:
        task.due_date = data["due_date"]

    # Explicit status changes map to a progress value too, so progress stays
    # the single source of truth even when a user just flips the status.
    if "status" in data and data["status"] is not None:
        if data["status"] == models.TaskStatus.NOT_STARTED:
            task.progress = 0
        elif data["status"] == models.TaskStatus.IN_PROGRESS and task.progress in (0, 100):
            task.progress = 10
        elif data["status"] == models.TaskStatus.COMPLETED:
            task.progress = 100

    utils.recompute_task_status(task)
    db.commit()
    db.refresh(task)

    if task.status == models.TaskStatus.COMPLETED and not was_completed:
        utils.log_activity(db, current_user.id, f'{current_user.display_name} completed "{task.name}"')
        utils.notify_all(db, f'{current_user.display_name} completed "{task.name}"', kind="completion")
    elif task.status == models.TaskStatus.IN_PROGRESS and old_progress in (0, None) and task.progress > 0:
        utils.log_activity(db, current_user.id, f'{current_user.display_name} started "{task.name}"')
    elif task.progress != old_progress:
        utils.log_activity(db, current_user.id, f'{current_user.display_name} updated "{task.name}" to {task.progress}%')

    return task


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    if task.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only delete your own tasks")
    db.delete(task)
    db.commit()
    return None
