from __future__ import annotations
import enum
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum as SAEnum, Text, ForeignKey, UniqueConstraint
from sqlalchemy.sql import func
from app.database import Base
from sqlalchemy.orm import relationship

class ClubStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"

class MembershipStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"

class Club(Base):
    __tablename__ = "clubs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String, unique=True, index=True, nullable=False)
    description = Column(Text, nullable=True)
    status = Column(SAEnum(ClubStatus), nullable=False, default=ClubStatus.ACTIVE)
    club_coordinator_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    faculty_coordinator_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    club_coordinator = relationship("User", foreign_keys=[club_coordinator_id], back_populates="clubs_coordinated")
    faculty_coordinator = relationship("User", foreign_keys=[faculty_coordinator_id], back_populates="faculty_clubs")
    memberships = relationship("Membership", back_populates="club", cascade="all, delete-orphan")
    events = relationship("Event", back_populates="club")


class Membership(Base):
    __tablename__ = "memberships"
    __table_args__ = (UniqueConstraint("student_id", "club_id", name="_student_club_uc"),)

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    club_id = Column(Integer, ForeignKey("clubs.id"), nullable=False)
    status = Column(SAEnum(MembershipStatus), nullable=False, default=MembershipStatus.PENDING)
    requested_at = Column(DateTime(timezone=True), server_default=func.now())
    decided_at = Column(DateTime(timezone=True), nullable=True)
    decided_by = Column(Integer, ForeignKey("users.id"), nullable=True)

    # Relationships
    student = relationship("User", foreign_keys=[student_id], back_populates="memberships")
    club = relationship("Club", back_populates="memberships")
    decider = relationship("User", foreign_keys=[decided_by])
