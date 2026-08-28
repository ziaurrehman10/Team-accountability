# Team Accountability & Progress App

A simple, modern web app for exactly **4 people** to track their own task
progress and see whether their teammates are actually keeping up. Not a CRM,
not a project-management platform — just: 4 people → their tasks → their
progress → their activity → team accountability.

---

## Tech Stack

- **Frontend:** React 18 + Vite + Tailwind CSS + React Router
- **Backend:** Python + FastAPI
- **Database:** SQLite (file-based, zero setup). Structured via SQLAlchemy so
  swapping to PostgreSQL later is a one-line change (see below).
- **Auth:** bcrypt password hashing + JWT bearer tokens

---

## Project Structure

```
team-accountability/
├── backend/
│   ├── app/
│   │   ├── main.py            FastAPI app, CORS, router wiring
│   │   ├── database.py        SQLAlchemy engine/session
│   │   ├── models.py          User, Task, DailyUpdate, Activity, Notification
│   │   ├── schemas.py         Pydantic request/response models
│   │   ├── auth.py            Password hashing, JWT creation/validation
│   │   ├── config.py          Configurable accountability thresholds
│   │   ├── utils.py           Progress calculation, activity-status logic
│   │   ├── seed.py            Creates the 4 demo users + demo tasks
│   │   └── routers/           auth, users, tasks, daily_updates, activity, notifications
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── pages/              Login, Dashboard, MyTasks, Team, PersonDetail, Activity, MyProgress, Settings
    │   ├── components/         Layout, PersonCard, ProtectedRoute, shared UI pieces
    │   ├── context/            AuthContext (login/logout/session)
    │   └── api/client.js       Thin fetch wrapper for the backend API
    └── package.json
```

---

## Running It Locally

### 1. Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

On first startup the app automatically creates `team_accountability.db` and
seeds 4 demo users with 10 tasks each. You'll see this in the console:

```
Seeded 4 demo users: person1..person4 (passwords: person1pass..person4pass)
```

The API is now live at `http://127.0.0.1:8000` (interactive docs at
`http://127.0.0.1:8000/docs`).

### 2. Frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. The Vite dev server proxies `/api/*` requests
to `http://127.0.0.1:8000`, so both must be running.

### 3. Log in

| Username | Password    |
|----------|-------------|
| person1  | person1pass |
| person2  | person2pass |
| person3  | person3pass |
| person4  | person4pass |

Open the app in 4 browser tabs (or 4 browsers) logged in as each person to
see the accountability features in action — e.g. update a task's progress
as Person 1 and watch it change on Person 1's card when Person 2 refreshes
the dashboard.

---

## Core Concepts

### Progress is calculated, never typed

Each task has a `progress` field (0–100) that the task's owner adjusts with a
slider. Status (`NOT_STARTED` / `IN_PROGRESS` / `COMPLETED`) and the
completion date are **derived automatically** from that number — nobody can
type in an arbitrary overall percentage. A person's overall progress is the
average of their own tasks' progress; the team's overall progress is the
average across all tasks.

### Accountability status (🟢 🟡 🔴)

Whether someone shows as **Working**, **Behind**, or **No activity** is based
on how recently they touched a task (progress/status/notes change) or posted
a daily update. The thresholds are centralized and configurable in
`backend/app/config.py`:

```python
ACTIVE_WINDOW_HOURS = 24      # 🟢 active within the last 24h
ATTENTION_WINDOW_HOURS = 72   # 🟡 active within the last 72h, else 🔴
```

The app never accuses anyone of anything — it only shows objective signals
(last activity time, task status, due dates) and lets the team draw
conclusions.

### Permissions

- Everyone can **view** all 4 people's tasks, progress, and daily updates.
- A person can only **edit** their own tasks, their own daily updates, and
  their own profile. The backend enforces this on every write endpoint
  (`403 Forbidden` if you try to edit someone else's task) — it isn't just a
  frontend restriction.

---

## Switching to PostgreSQL Later

The database layer is a single environment variable:

```bash
export DATABASE_URL="postgresql://user:password@localhost:5432/team_accountability"
pip install psycopg2-binary
```

No other code changes are required — SQLAlchemy handles the rest.

---

## API Overview

All endpoints are under `/api` and (except `/api/auth/login` and
`/api/health`) require a `Authorization: Bearer <token>` header.

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/auth/login` | Log in, get a JWT |
| GET | `/api/auth/me` | Current user |
| GET | `/api/dashboard` | Team summary + all 4 people's progress |
| GET | `/api/users` | List the 4 users |
| GET | `/api/users/{id}/summary` | One person's progress summary |
| GET | `/api/tasks?owner_id=` | View tasks (anyone's) |
| GET | `/api/tasks/mine` | Your own tasks |
| POST | `/api/tasks` | Create a task (for yourself) |
| PATCH | `/api/tasks/{id}` | Update progress/status/notes (owner only) |
| DELETE | `/api/tasks/{id}` | Delete a task (owner only) |
| GET/POST | `/api/daily-updates` | View/log daily "what I worked on" entries |
| GET | `/api/activity` | Team-wide activity feed |
| GET | `/api/notifications` | Deadlines, overdue tasks, completions |

---

## Customizing the Demo Data

Edit `backend/app/seed.py` to change the 4 people's names, usernames,
passwords, and starting tasks. Delete `team_accountability.db` and restart
the backend to reseed from scratch (seeding only runs when the database is
empty).
