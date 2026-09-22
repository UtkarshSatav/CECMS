from __future__ import annotations
import enum
from sqlalchemy import Column, Integer, String, DateTime, Enum as SAEnum, ForeignKey
from sqlalchemy.sql import func
from app.database import Base
from sqlalchemy.orm import relationship

class AttendanceStatus(str, enum.Enum):
    PRESENT = "PRESENT"
    ABSENT = "ABSENT"

class Attendance(Base):
    __tablename__ = "attendance"

    id = Column(Integer, primary_key=True, index=True)
    registration_id = Column(Integer, ForeignKey("registrations.id"), nullable=False, unique=True)
    status = Column(SAEnum(AttendanceStatus), nullable=False, default=AttendanceStatus.ABSENT)
    marked_at = Column(DateTime(timezone=True), server_default=func.now())
    marked_by = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Relationships
    registration = relationship("Registration", back_populates="attendance")
    marker = relationship("User")
