from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from sqlalchemy import func

from app.database import get_db
from app.models.user import User, UserRole
from app.models.event import Event, EventStatus
from app.models.club import Club
from app.models.registration import Registration, RegistrationStatus
from app.schemas.event import EventCreate, EventUpdate, EventResponse
from app.core.security import get_current_user, role_required

router = APIRouter(prefix="/events", tags=["events"])

@router.get("/", response_model=List[EventResponse])
def get_events(db: Session = Depends(get_db)):
    events = db.query(Event).filter(Event.status == EventStatus.PUBLISHED).all()
    result = []
    for event in events:
        count = db.query(func.count(Registration.id)).filter(
            Registration.event_id == event.id,
            Registration.status == RegistrationStatus.REGISTERED
        ).scalar()
        ev_data = event.__dict__.copy()
        ev_data["registration_count"] = count or 0
        result.append(EventResponse(**ev_data))
    return result

@router.get("/all", response_model=List[EventResponse])
def get_all_events(
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required([UserRole.ADMIN, UserRole.SUPER_ADMIN]))
):
    events = db.query(Event).all()
    result = []
    for event in events:
        count = db.query(func.count(Registration.id)).filter(
            Registration.event_id == event.id,
            Registration.status == RegistrationStatus.REGISTERED
        ).scalar()
        ev_data = event.__dict__.copy()
        ev_data["registration_count"] = count or 0
        result.append(EventResponse(**ev_data))
    return result

@router.get("/{id}", response_model=EventResponse)
def get_event(id: int, db: Session = Depends(get_db)):
    event = db.query(Event).filter(Event.id == id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    count = db.query(func.count(Registration.id)).filter(
        Registration.event_id == event.id,
        Registration.status == RegistrationStatus.REGISTERED
    ).scalar()
    
    ev_data = event.__dict__.copy()
    ev_data["registration_count"] = count or 0
    return EventResponse(**ev_data)

@router.post("/", response_model=EventResponse)
def create_event(
    event_in: EventCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required([UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.CLUB_COORDINATOR]))
):
    club = db.query(Club).filter(Club.id == event_in.club_id).first()
    if not club:
        raise HTTPException(status_code=404, detail="Club not found")

    new_event = Event(
        **event_in.model_dump(),
        status=EventStatus.PUBLISHED,
        created_by=current_user.id
    )
    db.add(new_event)
    db.commit()
    db.refresh(new_event)
    
    ev_data = new_event.__dict__.copy()
    ev_data["registration_count"] = 0
    return EventResponse(**ev_data)

@router.put("/{id}", response_model=EventResponse)
def update_event(
    id: int,
    event_in: EventUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    event = db.query(Event).filter(Event.id == id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
        
    is_admin = current_user.role in [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.ADMINISTRATOR]
    if event.created_by != current_user.id and not is_admin:
        raise HTTPException(status_code=403, detail="Not authorized to update this event")
    
    update_data = event_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(event, key, value)
    
    db.commit()
    db.refresh(event)

    count = db.query(func.count(Registration.id)).filter(
        Registration.event_id == event.id,
        Registration.status == RegistrationStatus.REGISTERED
    ).scalar()
    
    ev_data = event.__dict__.copy()
    ev_data["registration_count"] = count or 0
    return EventResponse(**ev_data)

@router.delete("/{id}")
def cancel_event(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    event = db.query(Event).filter(Event.id == id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
        
    is_admin = current_user.role in [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.ADMINISTRATOR]
    if event.created_by != current_user.id and not is_admin:
        raise HTTPException(status_code=403, detail="Not authorized to cancel this event")
    
    event.status = EventStatus.CANCELLED
    db.commit()
    return {"detail": "Event cancelled successfully"}
