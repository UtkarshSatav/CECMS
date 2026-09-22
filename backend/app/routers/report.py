from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.user import User, UserRole
from app.models.club import Club
from app.models.event import Event
from app.models.registration import Registration
from app.core.security import get_current_user, role_required

router = APIRouter(prefix="/report", tags=["report"])

@router.get("/dashboard")
def get_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required([UserRole.ADMINISTRATOR]))
):
    users_count = db.query(func.count(User.id)).scalar()
    clubs_count = db.query(func.count(Club.id)).scalar()
    events_count = db.query(func.count(Event.id)).scalar()
    registrations_count = db.query(func.count(Registration.id)).scalar()
    
    return {
        "users": users_count,
        "clubs": clubs_count,
        "events": events_count,
        "registrations": registrations_count
    }

@router.get("/clubs")
def get_club_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required([UserRole.ADMINISTRATOR]))
):
    clubs = db.query(Club).all()
    stats = []
    for club in clubs:
        events_count = db.query(func.count(Event.id)).filter(Event.club_id == club.id).scalar()
        stats.append({
            "club_id": club.id,
            "name": club.name,
            "status": club.status,
            "events_count": events_count
        })
    return stats

@router.get("/events")
def get_event_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required([UserRole.ADMINISTRATOR]))
):
    events = db.query(Event).all()
    stats = []
    for event in events:
        reg_count = db.query(func.count(Registration.id)).filter(Registration.event_id == event.id).scalar()
        stats.append({
            "event_id": event.id,
            "title": event.title,
            "status": event.status,
            "registrations_count": reg_count,
            "capacity": event.capacity
        })
    return stats

@router.get("/faculty/overview")
def get_faculty_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required([UserRole.FACULTY_COORDINATOR]))
):
    clubs = db.query(Club).filter(Club.faculty_coordinator_id == current_user.id).all()
    stats = []
    for club in clubs:
        events_count = db.query(func.count(Event.id)).filter(Event.club_id == club.id).scalar()
        stats.append({
            "club_id": club.id,
            "name": club.name,
            "events_count": events_count
        })
    return stats
