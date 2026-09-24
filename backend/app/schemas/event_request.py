from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from app.models.event_request import EventRequestStatus
from app.schemas.user import UserResponse

class EventRequestBase(BaseModel):
    title: str
    description: Optional[str] = None
    event_date: datetime
    venue: Optional[str] = None
    capacity: int = Field(gt=0, default=50)
    registration_deadline: Optional[datetime] = None
    proposed_budget: float = Field(ge=0.0, default=0.0)
    budget_breakdown: Optional[str] = None

class EventRequestCreate(EventRequestBase):
    club_id: int

class EventRequestDecision(BaseModel):
    status: EventRequestStatus
    admin_notes: Optional[str] = None

class EventRequestResponse(EventRequestBase):
    id: int
    club_id: int
    created_by: int
    status: EventRequestStatus
    decided_by: Optional[int] = None
    admin_notes: Optional[str] = None
    event_id: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    creator: Optional[UserResponse] = None
    club_name: Optional[str] = None

    class Config:
        from_attributes = True
