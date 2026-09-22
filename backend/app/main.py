from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.database import engine, Base, SessionLocal
from app.models.user import User, UserRole
from app.core.security import get_password_hash

from app.routers import auth, student, club, event, registration, attendance, report

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create tables and seed admin
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        admin = db.query(User).filter(User.email == "admin@cecms.com").first()
        if not admin:
            new_admin = User(
                email="admin@cecms.com",
                hashed_password=get_password_hash("admin123"),
                full_name="System Administrator",
                role=UserRole.ADMINISTRATOR
            )
            db.add(new_admin)
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

@app.get("/")
def read_root():
    return {"message": "Welcome to CECMS API"}
