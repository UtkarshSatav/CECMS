from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.club import ClubStatus, MembershipStatus
from app.schemas.user import UserResponse

class ClubBase(BaseModel):
    name: str
    description: Optional[str] = None

class ClubCreate(ClubBase):
    pass

class ClubUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[ClubStatus] = None
    club_coordinator_id: Optional[int] = None
    faculty_coordinator_id: Optional[int] = None

class ClubResponse(ClubBase):
    id: int
    status: ClubStatus
    club_coordinator_id: Optional[int]
    faculty_coordinator_id: Optional[int]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True

class MembershipRequest(BaseModel):
    pass # Empty since we just POST /id/join

class MembershipDecision(BaseModel):
    status: MembershipStatus # APPROVED or REJECTED

class MembershipResponse(BaseModel):
    id: int
    student_id: int
    club_id: int
    status: MembershipStatus
    requested_at: datetime
    decided_at: Optional[datetime]
    decided_by: Optional[int]

    class Config:
        from_attributes = True
