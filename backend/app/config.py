"""
Configurable accountability rules.

These thresholds decide the "today's status" light shown for each person on
the dashboard. They are intentionally centralized here (not hardcoded
elsewhere) so they can be tuned without touching business logic.
"""

# A person is 🟢 ACTIVE if they touched a task (status/progress/notes change)
# or posted a daily update within this many hours.
ACTIVE_WINDOW_HOURS = 24

# A person is 🟡 NEEDS_ATTENTION if their last activity was within this many
# hours (and beyond the active window). Beyond this, they are 🔴 NO_ACTIVITY.
ATTENTION_WINDOW_HOURS = 72

# A task is considered "due soon" (used for notifications) if its due date is
# within this many days from now.
DUE_SOON_DAYS = 1

SECRET_KEY = "dev-secret-key-change-in-production-please"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days, simple for a 4-person tool
