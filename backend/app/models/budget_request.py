from __future__ import annotations
import enum
from sqlalchemy import Column, Integer, String, Float, DateTime, Enum as SAEnum, Text, ForeignKey
from sqlalchemy.sql import func
from app.database import Base
from sqlalchemy.orm import relationship

class BudgetRequestStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"

class BudgetRequest(Base):
    __tablename__ = "budget_requests"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    club_id = Column(Integer, ForeignKey("clubs.id"), nullable=False)
    event_request_id = Column(Integer, ForeignKey("event_requests.id"), nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    title = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    justification = Column(Text, nullable=True)
    
    status = Column(SAEnum(BudgetRequestStatus), nullable=False, default=BudgetRequestStatus.PENDING)
    decided_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    remarks = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    club = relationship("Club", back_populates="budget_requests")
    event_request = relationship("EventRequest", back_populates="budget_requests")
    creator = relationship("User", foreign_keys=[created_by], back_populates="budget_requests_created")
    decider = relationship("User", foreign_keys=[decided_by])
