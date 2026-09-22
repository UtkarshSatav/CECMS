from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.registration import RegistrationStatus

class RegistrationCreate(BaseModel):
    pass

class RegistrationResponse(BaseModel):
    id: int
    student_id: int
    event_id: int
    status: RegistrationStatus
    registered_at: datetime
    cancelled_at: Optional[datetime]

    class Config:
        from_attributes = True
