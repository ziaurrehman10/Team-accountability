from datetime import date, timedelta

from .database import SessionLocal, engine, Base
from . import models, auth


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.query(models.User).count() > 0:
            print("Demo data already exists — skipping seed.")
            return

        today = date.today()

        people = [
            {
                "username": "person1", "password": "person1pass", "display_name": "Person 1",
                "tasks": [
                    ("Learn Python OOP", "Classes, inheritance, polymorphism", 100, models.Priority.HIGH, today - timedelta(days=10)),
                    ("Exception Handling", "try/except, custom exceptions", 100, models.Priority.MEDIUM, today - timedelta(days=6)),
                    ("Git Basics", "Branching, merging, PRs", 100, models.Priority.MEDIUM, today - timedelta(days=4)),
                    ("Complete FastAPI Tutorial", "Official FastAPI docs tutorial", 100, models.Priority.HIGH, today - timedelta(days=1)),
                    ("SQL Fundamentals", "Joins, indexes, queries", 55, models.Priority.MEDIUM, today + timedelta(days=2)),
                    ("Authentication", "JWT-based auth for the API project", 20, models.Priority.HIGH, today + timedelta(days=5)),
                    ("PostgreSQL", "Set up and use Postgres locally", 0, models.Priority.MEDIUM, today + timedelta(days=9)),
                    ("Build API Project", "Full CRUD API with auth", 0, models.Priority.HIGH, today + timedelta(days=14)),
                    ("Deployment", "Deploy the API project", 0, models.Priority.LOW, today + timedelta(days=18)),
                    ("Testing Basics", "pytest fundamentals", 0, models.Priority.LOW, today + timedelta(days=20)),
                ],
            },
            {
                "username": "person2", "password": "person2pass", "display_name": "Person 2",
                "tasks": [
                    ("Learn Pandas", "DataFrame operations, indexing", 65, models.Priority.HIGH, today + timedelta(days=1)),
                    ("Practice Data Cleaning", "Handling nulls, duplicates, types", 40, models.Priority.MEDIUM, today + timedelta(days=4)),
                    ("NumPy Basics", "Arrays, broadcasting, vectorization", 100, models.Priority.MEDIUM, today - timedelta(days=8)),
                    ("Matplotlib Basics", "Plots, subplots, styling", 100, models.Priority.LOW, today - timedelta(days=5)),
                    ("Seaborn Basics", "Statistical visualizations", 100, models.Priority.LOW, today - timedelta(days=3)),
                    ("EDA on Sample Dataset", "Exploratory analysis walkthrough", 30, models.Priority.MEDIUM, today + timedelta(days=6)),
                    ("Build Visualization Project", "End-to-end viz project", 0, models.Priority.HIGH, today + timedelta(days=12)),
                    ("SQL for Analysts", "Aggregate queries, window functions", 0, models.Priority.MEDIUM, today + timedelta(days=15)),
                    ("Statistics Refresher", "Distributions, hypothesis testing", 0, models.Priority.LOW, today + timedelta(days=20)),
                    ("Portfolio Write-up", "Document the visualization project", 0, models.Priority.LOW, today + timedelta(days=22)),
                ],
            },
            {
                "username": "person3", "password": "person3pass", "display_name": "Person 3",
                "tasks": [
                    ("Linear Regression", "Theory + sklearn implementation", 35, models.Priority.HIGH, today + timedelta(days=1)),
                    ("Logistic Regression", "Classification fundamentals", 20, models.Priority.MEDIUM, today + timedelta(days=5)),
                    ("Train/Test Split & CV", "Cross-validation strategies", 100, models.Priority.MEDIUM, today - timedelta(days=7)),
                    ("Feature Scaling", "Normalization vs standardization", 100, models.Priority.LOW, today - timedelta(days=6)),
                    ("Decision Trees", "Trees and overfitting", 0, models.Priority.MEDIUM, today + timedelta(days=8)),
                    ("Random Forests", "Ensembles, feature importance", 0, models.Priority.MEDIUM, today + timedelta(days=11)),
                    ("Model Evaluation Metrics", "Precision, recall, F1, ROC", 0, models.Priority.MEDIUM, today - timedelta(days=1)),
                    ("Hyperparameter Tuning", "Grid search, random search", 0, models.Priority.LOW, today + timedelta(days=16)),
                    ("Kaggle Mini Project", "Apply models end to end", 0, models.Priority.HIGH, today + timedelta(days=20)),
                    ("Write Model Report", "Summarize findings", 0, models.Priority.LOW, today + timedelta(days=22)),
                ],
            },
            {
                "username": "person4", "password": "person4pass", "display_name": "Person 4",
                "tasks": [
                    ("Neural Network Basics", "Perceptrons, activation functions", 100, models.Priority.HIGH, today - timedelta(days=12)),
                    ("Backpropagation", "Gradient descent by hand", 100, models.Priority.HIGH, today - timedelta(days=10)),
                    ("CNN Basics", "Convolutions, pooling layers", 100, models.Priority.HIGH, today - timedelta(days=7)),
                    ("Image Classification Project", "CIFAR-10 classifier", 100, models.Priority.HIGH, today - timedelta(days=4)),
                    ("Data Augmentation", "Flips, crops, color jitter", 100, models.Priority.MEDIUM, today - timedelta(days=2)),
                    ("Transfer Learning", "Fine-tune a pretrained model", 100, models.Priority.MEDIUM, today - timedelta(days=1)),
                    ("Batch Normalization", "Theory and implementation", 100, models.Priority.LOW, today - timedelta(days=1)),
                    ("Regularization Techniques", "Dropout, weight decay", 80, models.Priority.MEDIUM, today + timedelta(days=2)),
                    ("Model Deployment", "Serve the CNN via an API", 10, models.Priority.HIGH, today + timedelta(days=6)),
                    ("Write-up & Demo", "Document and demo the project", 0, models.Priority.LOW, today + timedelta(days=9)),
                ],
            },
        ]

        for person in people:
            user = models.User(
                username=person["username"],
                display_name=person["display_name"],
                hashed_password=auth.hash_password(person["password"]),
            )
            db.add(user)
            db.commit()
            db.refresh(user)

            for idx, (name, desc, progress, priority, due) in enumerate(person["tasks"]):
                status = (
                    models.TaskStatus.COMPLETED if progress >= 100
                    else models.TaskStatus.IN_PROGRESS if progress > 0
                    else models.TaskStatus.NOT_STARTED
                )
                task = models.Task(
                    owner_id=user.id,
                    name=name,
                    description=desc,
                    status=status,
                    priority=priority,
                    progress=progress,
                    due_date=due,
                    order_index=idx,
                    notes="",
                )
                db.add(task)
            db.commit()

        db.add(models.Activity(owner_id=1, message="Person 1 completed \"Complete FastAPI Tutorial\""))
        db.add(models.Activity(owner_id=3, message="Person 3 started \"Linear Regression\""))
        db.add(models.Activity(owner_id=2, message="Person 2 updated \"Learn Pandas\" to 65%"))
        db.add(models.Activity(owner_id=4, message="Person 4 completed \"Transfer Learning\""))
        db.commit()

        print("Seeded 4 demo users: person1..person4 (passwords: person1pass..person4pass)")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
