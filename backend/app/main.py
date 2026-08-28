from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import Base, engine
from .routers import auth as auth_router
from .routers import users, tasks, daily_updates, activity, notifications
from .seed import seed

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Team Accountability & Progress API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router)
app.include_router(users.router)
app.include_router(tasks.router)
app.include_router(daily_updates.router)
app.include_router(activity.router)
app.include_router(notifications.router)


@app.on_event("startup")
def on_startup():
    seed()


@app.get("/api/health")
def health():
    return {"status": "ok"}
