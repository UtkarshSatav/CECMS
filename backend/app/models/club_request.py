from __future__ import annotations
import enum
from sqlalchemy import Column, Integer, String, DateTime, Enum as SAEnum, Text, ForeignKey
from sqlalchemy.sql import func
from app.database import Base
from sqlalchemy.orm import relationship

class RequestStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"

class ClubRequest(Base):
    __tablename__ = "club_requests"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String, nullable=True)
    status = Column(SAEnum(RequestStatus), nullable=False, default=RequestStatus.PENDING)
    
    requested_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    initial_leader_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    decided_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    rejection_reason = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    requester = relationship("User", foreign_keys=[requested_by], back_populates="club_requests_created")
    initial_leader = relationship("User", foreign_keys=[initial_leader_id])
    decider = relationship("User", foreign_keys=[decided_by])
