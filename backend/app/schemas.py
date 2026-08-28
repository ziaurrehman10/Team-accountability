from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel, ConfigDict

from .models import TaskStatus, Priority


# ---------- Auth ----------

class LoginRequest(BaseModel):
    username: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    username: str
    display_name: str


class UserWithToken(BaseModel):
    user: UserPublic
    token: Token


# ---------- Tasks ----------

class TaskBase(BaseModel):
    name: str
    description: Optional[str] = ""
    priority: Priority = Priority.MEDIUM
    due_date: Optional[date] = None
    notes: Optional[str] = ""


class TaskCreate(TaskBase):
    owner_id: Optional[int] = None  # admin/demo seeding convenience


class TaskUpdate(BaseModel):
    """Fields an owner may edit on their own task. Progress drives status/
    completion automatically — users cannot free-type overall percentages."""
    status: Optional[TaskStatus] = None
    progress: Optional[int] = None
    notes: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[Priority] = None
    due_date: Optional[date] = None


class TaskOut(TaskBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    owner_id: int
    status: TaskStatus
    progress: int
    date_created: datetime
    date_completed: Optional[datetime] = None


# ---------- Daily updates ----------

class DailyUpdateCreate(BaseModel):
    task_id: Optional[int] = None
    task_name_snapshot: Optional[str] = ""
    what_completed: str
    work_note: Optional[str] = ""
    tomorrow_plan: Optional[str] = ""


class DailyUpdateOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    owner_id: int
    task_id: Optional[int]
    task_name_snapshot: str
    what_completed: str
    work_note: str
    tomorrow_plan: str
    created_at: datetime


# ---------- Activity ----------

class ActivityOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    owner_id: int
    message: str
    created_at: datetime


# ---------- Notifications ----------

class NotificationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    recipient_id: Optional[int]
    message: str
    kind: str
    read: bool
    created_at: datetime


# ---------- Dashboard / aggregate views ----------

class PersonSummary(BaseModel):
    id: int
    username: str
    display_name: str
    overall_progress: float
    completed: int
    in_progress: int
    not_started: int
    total: int
    current_task: Optional[str] = None
    next_task: Optional[str] = None
    activity_status: str  # ACTIVE | NEEDS_ATTENTION | NO_ACTIVITY
    last_activity_at: Optional[datetime] = None


class TeamSummary(BaseModel):
    total_tasks: int
    completed: int
    in_progress: int
    not_started: int
    overall_progress: float
    active_members: int
    total_members: int


class DashboardOut(BaseModel):
    team_summary: TeamSummary
    people: List[PersonSummary]
