from __future__ import annotations
import enum
from sqlalchemy import Column, Integer, String, DateTime, Enum as SAEnum, ForeignKey, UniqueConstraint
from sqlalchemy.sql import func
from app.database import Base
from sqlalchemy.orm import relationship

class RegistrationStatus(str, enum.Enum):
    REGISTERED = "REGISTERED"
    CANCELLED = "CANCELLED"

class Registration(Base):
    __tablename__ = "registrations"
    __table_args__ = (UniqueConstraint("student_id", "event_id", name="_student_event_uc"),)

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False)
    registered_at = Column(DateTime(timezone=True), server_default=func.now())
    cancelled_at = Column(DateTime(timezone=True), nullable=True)
    status = Column(SAEnum(RegistrationStatus), nullable=False, default=RegistrationStatus.REGISTERED)

    # Relationships
    student = relationship("User", back_populates="registrations")
    event = relationship("Event", back_populates="registrations")
    attendance = relationship("Attendance", uselist=False, back_populates="registration", cascade="all, delete-orphan")
