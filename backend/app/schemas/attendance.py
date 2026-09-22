from pydantic import BaseModel
from typing import List
from datetime import datetime
from app.models.attendance import AttendanceStatus

class AttendanceItem(BaseModel):
    registration_id: int
    status: AttendanceStatus

class AttendanceCreate(BaseModel):
    records: List[AttendanceItem]

class AttendanceResponse(BaseModel):
    id: int
    registration_id: int
    status: AttendanceStatus
    marked_at: datetime
    marked_by: int

    class Config:
        from_attributes = True
