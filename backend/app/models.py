import enum
from datetime import datetime

from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, Date,
    ForeignKey, Enum, Text
)
from sqlalchemy.orm import relationship

from .database import Base


class TaskStatus(str, enum.Enum):
    NOT_STARTED = "NOT_STARTED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"


class Priority(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    display_name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    tasks = relationship("Task", back_populates="owner", cascade="all, delete-orphan")
    daily_updates = relationship("DailyUpdate", back_populates="owner", cascade="all, delete-orphan")


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    name = Column(String, nullable=False)
    description = Column(Text, default="")
    status = Column(Enum(TaskStatus), default=TaskStatus.NOT_STARTED, nullable=False)
    priority = Column(Enum(Priority), default=Priority.MEDIUM, nullable=False)
    progress = Column(Integer, default=0)  # 0-100, only meaningful editable field per-task
    notes = Column(Text, default="")

    due_date = Column(Date, nullable=True)
    date_created = Column(DateTime, default=datetime.utcnow)
    date_completed = Column(DateTime, nullable=True)
    order_index = Column(Integer, default=0)

    owner = relationship("User", back_populates="tasks")


class DailyUpdate(Base):
    __tablename__ = "daily_updates"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=True)

    task_name_snapshot = Column(String, default="")
    what_completed = Column(Text, default="")
    work_note = Column(Text, default="")
    tomorrow_plan = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="daily_updates")


class Activity(Base):
    __tablename__ = "activity"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    message = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    # recipient_id NULL means broadcast to everyone (e.g. "someone completed a task")
    recipient_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    message = Column(String, nullable=False)
    kind = Column(String, default="info")  # info | deadline | overdue | completion | progress
    read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
