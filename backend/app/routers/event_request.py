from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timezone

from app.database import get_db
from app.models.user import User, UserRole
from app.models.club import Club, Membership, MembershipStatus
from app.models.event import Event, EventStatus
from app.models.event_request import EventRequest, EventRequestStatus
from app.schemas.event_request import EventRequestCreate, EventRequestDecision, EventRequestResponse
from app.schemas.user import UserResponse
from app.core.security import get_current_user, role_required

router = APIRouter(prefix="/event-requests", tags=["event-requests"])

def enrich_event_request(req: EventRequest) -> EventRequestResponse:
    creator_resp = None
    if req.creator:
        creator_resp = UserResponse(
            id=req.creator.id,
            email=req.creator.email,
            full_name=req.creator.full_name,
            role=req.creator.role,
            is_active=req.creator.is_active,
            created_at=req.creator.created_at,
            is_club_leader=True
        )
    return EventRequestResponse(
        id=req.id,
        club_id=req.club_id,
        created_by=req.created_by,
        title=req.title,
        description=req.description,
        event_date=req.event_date,
        venue=req.venue,
        capacity=req.capacity,
        registration_deadline=req.registration_deadline,
        proposed_budget=req.proposed_budget,
        budget_breakdown=req.budget_breakdown,
        status=req.status,
        decided_by=req.decided_by,
        admin_notes=req.admin_notes,
        event_id=req.event_id,
        created_at=req.created_at,
        updated_at=req.updated_at,
        creator=creator_resp,
        club_name=req.club.name if req.club else None
    )

@router.get("/", response_model=List[EventRequestResponse])
def get_event_requests(
    club_id: Optional[int] = None,
    status_filter: Optional[EventRequestStatus] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    is_admin = current_user.role in [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.ADMINISTRATOR]
    
    query = db.query(EventRequest)
    if club_id:
        query = query.filter(EventRequest.club_id == club_id)
    if status_filter:
        query = query.filter(EventRequest.status == status_filter)
        
    if not is_admin:
        # Student: only view requests for clubs they lead or that they created
        user_led_clubs = db.query(Club.id).filter(Club.leader_id == current_user.id).all()
        led_ids = [c[0] for c in user_led_clubs]
        query = query.filter(
            (EventRequest.created_by == current_user.id) | (EventRequest.club_id.in_(led_ids))
        )
        
    requests = query.order_by(EventRequest.created_at.desc()).all()
    return [enrich_event_request(r) for r in requests]

@router.get("/{id}", response_model=EventRequestResponse)
def get_event_request(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    req = db.query(EventRequest).filter(EventRequest.id == id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Event request not found")
        
    is_admin = current_user.role in [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.ADMINISTRATOR]
    is_creator = req.created_by == current_user.id
    is_leader = req.club and req.club.leader_id == current_user.id
    if not is_admin and not is_creator and not is_leader:
        raise HTTPException(status_code=403, detail="Not authorized to view this request")
        
    return enrich_event_request(req)

@router.post("/", response_model=EventRequestResponse)
def create_event_request(
    request_in: EventRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    club = db.query(Club).filter(Club.id == request_in.club_id).first()
    if not club:
        raise HTTPException(status_code=404, detail="Club not found")
        
    is_admin = current_user.role in [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.ADMINISTRATOR]
    is_club_leader = club.leader_id == current_user.id
    
    # Also check if user has approved membership with is_leader=True
    if not is_club_leader and not is_admin:
        membership_leader = db.query(Membership).filter(
            Membership.club_id == request_in.club_id,
            Membership.student_id == current_user.id,
            Membership.status == MembershipStatus.APPROVED,
            Membership.is_leader == True
        ).first()
        if membership_leader:
            is_club_leader = True
            
    if not is_club_leader and not is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the designated Club Leader can submit event requests for this club"
        )
        
    new_req = EventRequest(
        club_id=request_in.club_id,
        created_by=current_user.id,
        title=request_in.title,
        description=request_in.description,
        event_date=request_in.event_date,
        venue=request_in.venue,
        capacity=request_in.capacity,
        registration_deadline=request_in.registration_deadline,
        proposed_budget=request_in.proposed_budget,
        budget_breakdown=request_in.budget_breakdown,
        status=EventRequestStatus.PENDING
    )
    db.add(new_req)
    db.commit()
    db.refresh(new_req)
    return enrich_event_request(new_req)

@router.put("/{id}/decision", response_model=EventRequestResponse)
def decide_event_request(
    id: int,
    decision: EventRequestDecision,
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required([UserRole.ADMIN, UserRole.SUPER_ADMIN]))
):
    req = db.query(EventRequest).filter(EventRequest.id == id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Event request not found")
        
    if req.status != EventRequestStatus.PENDING:
        raise HTTPException(status_code=400, detail="Event request has already been decided")
        
    req.status = decision.status
    req.decided_by = current_user.id
    req.admin_notes = decision.admin_notes
    req.updated_at = datetime.now(timezone.utc)
    
    if decision.status == EventRequestStatus.APPROVED:
        # Create published event!
        new_event = Event(
            title=req.title,
            description=req.description,
            event_date=req.event_date,
            venue=req.venue,
            capacity=req.capacity,
            registration_deadline=req.registration_deadline,
            status=EventStatus.PUBLISHED,
            club_id=req.club_id,
            created_by=req.created_by,
            event_request_id=req.id
        )
        db.add(new_event)
        db.commit()
        db.refresh(new_event)
        req.event_id = new_event.id
        
    db.commit()
    db.refresh(req)
    return enrich_event_request(req)
