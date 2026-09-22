from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from app.models.event import EventStatus

class EventBase(BaseModel):
    title: str
    description: Optional[str] = None
    event_date: datetime
    venue: Optional[str] = None
    capacity: int = Field(gt=0)
    registration_deadline: Optional[datetime] = None
    image_url: Optional[str] = None

class EventCreate(EventBase):
    club_id: int

class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    event_date: Optional[datetime] = None
    venue: Optional[str] = None
    capacity: Optional[int] = Field(None, gt=0)
    registration_deadline: Optional[datetime] = None
    status: Optional[EventStatus] = None
    image_url: Optional[str] = None

class EventResponse(EventBase):
    id: int
    status: EventStatus
    club_id: int
    created_by: int
    created_at: datetime
    updated_at: Optional[datetime]
    registration_count: Optional[int] = 0

    class Config:
        from_attributes = True
