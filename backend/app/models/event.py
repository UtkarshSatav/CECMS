from __future__ import annotations
import enum
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum as SAEnum, Text, ForeignKey, CheckConstraint
from sqlalchemy.sql import func
from app.database import Base
from sqlalchemy.orm import relationship

class EventStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    PUBLISHED = "PUBLISHED"
    CANCELLED = "CANCELLED"
    COMPLETED = "COMPLETED"

class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    event_date = Column(DateTime(timezone=True), nullable=False)
    venue = Column(String, nullable=True)
    capacity = Column(Integer, CheckConstraint('capacity > 0'), nullable=False)
    registration_deadline = Column(DateTime(timezone=True), nullable=True)
    status = Column(SAEnum(EventStatus), nullable=False, default=EventStatus.DRAFT)
    image_url = Column(String, nullable=True)
    
    club_id = Column(Integer, ForeignKey("clubs.id"), nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    club = relationship("Club", back_populates="events")
    creator = relationship("User", foreign_keys=[created_by], back_populates="events_created")
    registrations = relationship("Registration", back_populates="event", cascade="all, delete-orphan")
