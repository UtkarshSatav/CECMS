from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.models.club import ClubStatus, MembershipStatus
from app.schemas.user import UserResponse

class ClubBase(BaseModel):
    name: str
    description: Optional[str] = None

class ClubCreate(ClubBase):
    leader_id: Optional[int] = None

class ClubUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[ClubStatus] = None
    leader_id: Optional[int] = None
    club_coordinator_id: Optional[int] = None
    faculty_coordinator_id: Optional[int] = None

class ClubResponse(ClubBase):
    id: int
    status: ClubStatus
    leader_id: Optional[int] = None
    leader: Optional[UserResponse] = None
    club_coordinator_id: Optional[int] = None
    faculty_coordinator_id: Optional[int] = None
    member_count: Optional[int] = 0
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class StudentAllotment(BaseModel):
    student_id: int
    is_leader: Optional[bool] = False

class SetLeader(BaseModel):
    student_id: int

class MembershipRequest(BaseModel):
    pass

class MembershipDecision(BaseModel):
    status: MembershipStatus # APPROVED or REJECTED

class MembershipResponse(BaseModel):
    id: int
    student_id: int
    club_id: int
    status: MembershipStatus
    is_leader: bool = False
    requested_at: datetime
    decided_at: Optional[datetime] = None
    decided_by: Optional[int] = None
    student: Optional[UserResponse] = None

    class Config:
        from_attributes = True
