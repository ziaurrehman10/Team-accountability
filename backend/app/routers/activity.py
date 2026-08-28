from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import models, schemas, auth
from ..database import get_db

router = APIRouter(prefix="/api/activity", tags=["activity"])


@router.get("", response_model=List[schemas.ActivityOut])
def list_activity(
    limit: int = 30,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    return (
        db.query(models.Activity)
        .order_by(models.Activity.created_at.desc())
        .limit(limit)
        .all()
    )
