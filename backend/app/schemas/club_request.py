from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.club_request import RequestStatus
from app.schemas.user import UserResponse

class ClubRequestBase(BaseModel):
    name: str
    description: Optional[str] = None
    category: Optional[str] = None
    initial_leader_id: Optional[int] = None

class ClubRequestCreate(ClubRequestBase):
    pass

class ClubRequestDecision(BaseModel):
    status: RequestStatus
    rejection_reason: Optional[str] = None

class ClubRequestResponse(ClubRequestBase):
    id: int
    status: RequestStatus
    requested_by: int
    decided_by: Optional[int] = None
    rejection_reason: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    requester: Optional[UserResponse] = None
    initial_leader: Optional[UserResponse] = None

    class Config:
        from_attributes = True
