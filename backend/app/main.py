from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from sqlalchemy import text

from app.database import engine, Base, SessionLocal
from app.models.user import User, UserRole
from app.core.security import get_password_hash

# Import all models to ensure metadata is registered
from app.models import (
    User, Club, Membership, Event, Registration, Attendance,
    ClubRequest, EventRequest, BudgetRequest
)

from app.routers import (
    auth, student, club, event, registration, attendance, report,
    club_request, event_request, budget_request
)

def run_db_migrations():
    """Ensure newly added columns exist in sqlite tables without needing full alembic."""
    if not str(engine.url).startswith("sqlite"):
        return
    with engine.connect() as conn:
        # Check clubs.leader_id
        try:
            club_cols = [r[1] for r in conn.execute(text("PRAGMA table_info(clubs)")).fetchall()]
            if "leader_id" not in club_cols and len(club_cols) > 0:
                conn.execute(text("ALTER TABLE clubs ADD COLUMN leader_id INTEGER REFERENCES users(id)"))
                conn.commit()
        except Exception as e:
            print("Migration note (clubs):", e)

        # Check memberships.is_leader
        try:
            m_cols = [r[1] for r in conn.execute(text("PRAGMA table_info(memberships)")).fetchall()]
            if "is_leader" not in m_cols and len(m_cols) > 0:
                conn.execute(text("ALTER TABLE memberships ADD COLUMN is_leader BOOLEAN NOT NULL DEFAULT 0"))
                conn.commit()
        except Exception as e:
            print("Migration note (memberships):", e)

        # Check events.event_request_id
        try:
            e_cols = [r[1] for r in conn.execute(text("PRAGMA table_info(events)")).fetchall()]
            if "event_request_id" not in e_cols and len(e_cols) > 0:
                conn.execute(text("ALTER TABLE events ADD COLUMN event_request_id INTEGER REFERENCES event_requests(id)"))
                conn.commit()
        except Exception as e:
            print("Migration note (events):", e)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Run migrations for any altered columns
    run_db_migrations()
    
    # 2. Create tables for new models (club_requests, event_requests, budget_requests, etc.)
    Base.metadata.create_all(bind=engine)
    
    # 3. Seed starter accounts
    db = SessionLocal()
    try:
        # Super Admin
        super_admin = db.query(User).filter(User.email == "superadmin@cecms.com").first()
        if not super_admin:
            super_admin = User(
                email="superadmin@cecms.com",
                hashed_password=get_password_hash("admin123"),
                full_name="Super Administrator",
                role=UserRole.SUPER_ADMIN
            )
            db.add(super_admin)
            
        # Admin
        admin = db.query(User).filter(User.email == "admin@cecms.com").first()
        if not admin:
            admin = User(
                email="admin@cecms.com",
                hashed_password=get_password_hash("admin123"),
                full_name="Club Administrator",
                role=UserRole.ADMIN
            )
            db.add(admin)
        elif admin.role == UserRole.ADMINISTRATOR:
            # Upgrade legacy role to SUPER_ADMIN so user can test superadmin immediately if they want
            admin.role = UserRole.SUPER_ADMIN

        # Student
        student = db.query(User).filter(User.email == "student@cecms.com").first()
        if not student:
            student = User(
                email="student@cecms.com",
                hashed_password=get_password_hash("student123"),
                full_name="Alex Student",
                role=UserRole.STUDENT
            )
            db.add(student)

        db.commit()
    finally:
        db.close()
    yield

app = FastAPI(title="Campus Event & Club Management System API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(student.router)
app.include_router(club.router)
app.include_router(event.router)
app.include_router(registration.router)
app.include_router(attendance.router)
app.include_router(report.router)
app.include_router(club_request.router)
app.include_router(event_request.router)
app.include_router(budget_request.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to CECMS API", "status": "running", "rbac": "3-tier-active"}
