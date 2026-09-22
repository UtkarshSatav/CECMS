from __future__ import annotations
import enum
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum as SAEnum
from sqlalchemy.sql import func
from app.database import Base
from sqlalchemy.orm import relationship

class UserRole(str, enum.Enum):
    STUDENT = "STUDENT"
    CLUB_COORDINATOR = "CLUB_COORDINATOR"
    FACULTY_COORDINATOR = "FACULTY_COORDINATOR"
    ADMINISTRATOR = "ADMINISTRATOR"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(SAEnum(UserRole), nullable=False, default=UserRole.STUDENT)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    clubs_coordinated = relationship("Club", foreign_keys="Club.club_coordinator_id", back_populates="club_coordinator")
    faculty_clubs = relationship("Club", foreign_keys="Club.faculty_coordinator_id", back_populates="faculty_coordinator")
    memberships = relationship("Membership", foreign_keys="Membership.student_id", back_populates="student")
    events_created = relationship("Event", foreign_keys="Event.created_by", back_populates="creator")
    registrations = relationship("Registration", foreign_keys="Registration.student_id", back_populates="student")
