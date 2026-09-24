from __future__ import annotations
import enum
from sqlalchemy import Column, Integer, String, Float, DateTime, Enum as SAEnum, Text, ForeignKey
from sqlalchemy.sql import func
from app.database import Base
from sqlalchemy.orm import relationship

class EventRequestStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"

class EventRequest(Base):
    __tablename__ = "event_requests"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    club_id = Column(Integer, ForeignKey("clubs.id"), nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    event_date = Column(DateTime(timezone=True), nullable=False)
    venue = Column(String, nullable=True)
    capacity = Column(Integer, nullable=False, default=50)
    registration_deadline = Column(DateTime(timezone=True), nullable=True)
    
    proposed_budget = Column(Float, nullable=False, default=0.0)
    budget_breakdown = Column(Text, nullable=True)
    
    status = Column(SAEnum(EventRequestStatus), nullable=False, default=EventRequestStatus.PENDING)
    decided_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    admin_notes = Column(Text, nullable=True)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    club = relationship("Club", back_populates="event_requests")
    creator = relationship("User", foreign_keys=[created_by], back_populates="event_requests_created")
    decider = relationship("User", foreign_keys=[decided_by])
    event = relationship("Event", foreign_keys=[event_id], post_update=True)
    budget_requests = relationship("BudgetRequest", back_populates="event_request")
