from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.user import User, UserRole
from app.models.event import Event
from app.models.registration import Registration, RegistrationStatus
from app.models.attendance import Attendance
from app.schemas.attendance import AttendanceCreate, AttendanceResponse
from app.core.security import get_current_user, role_required

router = APIRouter(prefix="/attendance", tags=["attendance"])

@router.get("/event/{event_id}")
def get_event_attendance(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required([UserRole.CLUB_COORDINATOR, UserRole.FACULTY_COORDINATOR]))
):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    registrations = db.query(Registration).filter(
        Registration.event_id == event_id,
        Registration.status == RegistrationStatus.REGISTERED
    ).all()
    
    reg_ids = [r.id for r in registrations]
    attendance_records = db.query(Attendance).filter(Attendance.registration_id.in_(reg_ids)).all()
    
    return {
        "registrations": registrations,
        "attendance": attendance_records
    }

@router.post("/event/{event_id}")
def mark_attendance(
    event_id: int,
    attendance_in: AttendanceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required([UserRole.CLUB_COORDINATOR]))
):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event or event.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to mark attendance for this event")
    
    responses = []
    for record in attendance_in.records:
        reg = db.query(Registration).filter(
            Registration.id == record.registration_id,
            Registration.event_id == event_id,
            Registration.status == RegistrationStatus.REGISTERED
        ).first()
        
        if not reg:
            continue
        
        existing = db.query(Attendance).filter(Attendance.registration_id == reg.id).first()
        if existing:
            existing.status = record.status
            existing.marked_by = current_user.id
            responses.append(existing)
        else:
            new_att = Attendance(
                registration_id=reg.id,
                status=record.status,
                marked_by=current_user.id
            )
            db.add(new_att)
            responses.append(new_att)
            
    db.commit()
    return {"detail": "Attendance marked successfully", "count": len(responses)}
