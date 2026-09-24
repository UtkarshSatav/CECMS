from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.user import User, UserRole
from app.models.club import Club, Membership, MembershipStatus
from app.models.event import Event
from app.models.registration import Registration, RegistrationStatus
from app.models.attendance import Attendance, AttendanceStatus
from app.models.club_request import ClubRequest, RequestStatus
from app.models.event_request import EventRequest, EventRequestStatus
from app.models.budget_request import BudgetRequest, BudgetRequestStatus
from app.core.security import get_current_user, role_required

router = APIRouter(prefix="/reports", tags=["reports"])

@router.get("/dashboard")
def get_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required([UserRole.ADMIN, UserRole.SUPER_ADMIN]))
):
    users_count = db.query(func.count(User.id)).scalar() or 0
    admins_count = db.query(func.count(User.id)).filter(User.role.in_([UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.ADMINISTRATOR])).scalar() or 0
    students_count = db.query(func.count(User.id)).filter(User.role == UserRole.STUDENT).scalar() or 0
    clubs_count = db.query(func.count(Club.id)).scalar() or 0
    events_count = db.query(func.count(Event.id)).scalar() or 0
    registrations_count = db.query(func.count(Registration.id)).filter(Registration.status == RegistrationStatus.REGISTERED).scalar() or 0
    
    pending_club_reqs = db.query(func.count(ClubRequest.id)).filter(ClubRequest.status == RequestStatus.PENDING).scalar() or 0
    pending_event_reqs = db.query(func.count(EventRequest.id)).filter(EventRequest.status == EventRequestStatus.PENDING).scalar() or 0
    pending_budget_reqs = db.query(func.count(BudgetRequest.id)).filter(BudgetRequest.status == BudgetRequestStatus.PENDING).scalar() or 0
    
    approved_budget_sum = db.query(func.sum(BudgetRequest.amount)).filter(BudgetRequest.status == BudgetRequestStatus.APPROVED).scalar() or 0.0
    
    return {
        "users": users_count,
        "admins": admins_count,
        "students": students_count,
        "total_clubs": clubs_count,
        "total_events": events_count,
        "total_registrations": registrations_count,
        "pending_club_requests": pending_club_reqs,
        "pending_event_requests": pending_event_reqs,
        "pending_budget_requests": pending_budget_reqs,
        "approved_budget_total": approved_budget_sum
    }

@router.get("/clubs")
def get_club_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required([UserRole.ADMIN, UserRole.SUPER_ADMIN]))
):
    clubs = db.query(Club).all()
    stats = []
    for club in clubs:
        events_count = db.query(func.count(Event.id)).filter(Event.club_id == club.id).scalar() or 0
        members_count = db.query(func.count(Membership.id)).filter(
            Membership.club_id == club.id, 
            Membership.status == MembershipStatus.APPROVED
        ).scalar() or 0
        stats.append({
            "club_id": club.id,
            "name": club.name,
            "status": club.status,
            "leader_name": club.leader.full_name if club.leader else "None",
            "member_count": members_count,
            "events_count": events_count
        })
    return stats

@router.get("/events")
def get_event_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required([UserRole.ADMIN, UserRole.SUPER_ADMIN]))
):
    events = db.query(Event).all()
    stats = []
    for event in events:
        reg_count = db.query(func.count(Registration.id)).filter(
            Registration.event_id == event.id,
            Registration.status == RegistrationStatus.REGISTERED
        ).scalar() or 0
        
        att_count = db.query(func.count(Attendance.id)).join(Registration).filter(
            Registration.event_id == event.id,
            Attendance.status == AttendanceStatus.PRESENT
        ).scalar() or 0
        
        rate = round((att_count / reg_count * 100), 1) if reg_count > 0 else 0
        
        stats.append({
            "event_id": event.id,
            "title": event.title,
            "club_name": event.club.name if event.club else "",
            "status": event.status,
            "registrations_count": reg_count,
            "attendance_rate": rate,
            "capacity": event.capacity
        })
    return stats
