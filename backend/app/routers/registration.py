from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timezone
from sqlalchemy import func

from app.database import get_db
from app.models.user import User
from app.models.event import Event, EventStatus
from app.models.registration import Registration, RegistrationStatus
from app.schemas.registration import RegistrationResponse
from app.core.security import get_current_user

router = APIRouter(prefix="/registrations", tags=["registrations"])

@router.post("/{event_id}", response_model=RegistrationResponse)
def register_for_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event or event.status != EventStatus.PUBLISHED:
        raise HTTPException(status_code=404, detail="Published event not found")
    
    if event.registration_deadline and datetime.now(timezone.utc) > event.registration_deadline:
        raise HTTPException(status_code=400, detail="Registration deadline has passed")
    
    count = db.query(func.count(Registration.id)).filter(
        Registration.event_id == event_id,
        Registration.status == RegistrationStatus.REGISTERED
    ).scalar()
    
    if count >= event.capacity:
        raise HTTPException(status_code=400, detail="Event is at full capacity")
    
    existing = db.query(Registration).filter(
        Registration.student_id == current_user.id,
        Registration.event_id == event_id
    ).first()
    if existing:
        if existing.status == RegistrationStatus.REGISTERED:
            raise HTTPException(status_code=400, detail="Already registered")
        else:
            # Re-register
            existing.status = RegistrationStatus.REGISTERED
            existing.registered_at = datetime.now(timezone.utc)
            existing.cancelled_at = None
            db.commit()
            db.refresh(existing)
            return existing

    new_reg = Registration(student_id=current_user.id, event_id=event_id)
    db.add(new_reg)
    db.commit()
    db.refresh(new_reg)
    return new_reg

@router.delete("/{event_id}")
def cancel_registration(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    reg = db.query(Registration).filter(
        Registration.student_id == current_user.id,
        Registration.event_id == event_id,
        Registration.status == RegistrationStatus.REGISTERED
    ).first()
    if not reg:
        raise HTTPException(status_code=404, detail="Active registration not found")
    
    reg.status = RegistrationStatus.CANCELLED
    reg.cancelled_at = datetime.now(timezone.utc)
    db.commit()
    return {"detail": "Registration cancelled successfully"}

@router.get("/my", response_model=List[RegistrationResponse])
def get_my_registrations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(Registration).filter(
        Registration.student_id == current_user.id
    ).all()
