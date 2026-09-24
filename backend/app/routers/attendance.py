from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.user import User, UserRole
from app.models.event import Event
from app.models.club import Club
from app.models.registration import Registration, RegistrationStatus
from app.models.attendance import Attendance
from app.schemas.attendance import AttendanceCreate, AttendanceResponse
from app.core.security import get_current_user

router = APIRouter(prefix="/attendance", tags=["attendance"])

def can_manage_attendance(event: Event, user: User, db: Session) -> bool:
    if user.role in [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.ADMINISTRATOR]:
        return True
    if event.created_by == user.id:
        return True
    club = db.query(Club).filter(Club.id == event.club_id).first()
    if club and club.leader_id == user.id:
        return True
    return False

@router.get("/event/{event_id}")
def get_event_attendance(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    if not can_manage_attendance(event, current_user, db):
        raise HTTPException(status_code=403, detail="Not authorized to view attendance for this event")

    registrations = db.query(Registration).filter(
        Registration.event_id == event_id,
        Registration.status == RegistrationStatus.REGISTERED
    ).all()
    
    reg_ids = [r.id for r in registrations]
    attendance_records = db.query(Attendance).filter(Attendance.registration_id.in_(reg_ids)).all()
    
    # Enrich with student info
    enriched_regs = []
    att_map = {a.registration_id: a.status for a in attendance_records}
    for r in registrations:
        enriched_regs.append({
            "registration_id": r.id,
            "student_name": r.student.full_name if r.student else "Student",
            "student_email": r.student.email if r.student else "",
            "status": att_map.get(r.id, "ABSENT")
        })
        
    return enriched_regs

@router.post("/event/{event_id}")
def mark_attendance(
    event_id: int,
    attendance_in: AttendanceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
        
    if not can_manage_attendance(event, current_user, db):
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
