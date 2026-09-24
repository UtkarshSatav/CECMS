from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timezone

from app.database import get_db
from app.models.user import User, UserRole
from app.models.club import Club, ClubStatus, Membership, MembershipStatus
from app.models.club_request import ClubRequest, RequestStatus
from app.schemas.club_request import ClubRequestCreate, ClubRequestDecision, ClubRequestResponse
from app.schemas.user import UserResponse
from app.core.security import get_current_user, role_required

router = APIRouter(prefix="/club-requests", tags=["club-requests"])

def enrich_club_request(req: ClubRequest) -> ClubRequestResponse:
    requester_resp = None
    if req.requester:
        requester_resp = UserResponse(
            id=req.requester.id,
            email=req.requester.email,
            full_name=req.requester.full_name,
            role=req.requester.role,
            is_active=req.requester.is_active,
            created_at=req.requester.created_at
        )
    initial_leader_resp = None
    if req.initial_leader:
        initial_leader_resp = UserResponse(
            id=req.initial_leader.id,
            email=req.initial_leader.email,
            full_name=req.initial_leader.full_name,
            role=req.initial_leader.role,
            is_active=req.initial_leader.is_active,
            created_at=req.initial_leader.created_at
        )
    return ClubRequestResponse(
        id=req.id,
        name=req.name,
        description=req.description,
        category=req.category,
        initial_leader_id=req.initial_leader_id,
        status=req.status,
        requested_by=req.requested_by,
        decided_by=req.decided_by,
        rejection_reason=req.rejection_reason,
        created_at=req.created_at,
        updated_at=req.updated_at,
        requester=requester_resp,
        initial_leader=initial_leader_resp
    )

@router.get("/", response_model=List[ClubRequestResponse])
def get_club_requests(
    status_filter: Optional[RequestStatus] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required([UserRole.ADMIN, UserRole.SUPER_ADMIN]))
):
    query = db.query(ClubRequest)
    # If standard Admin, they can see all requests or their own requests
    if status_filter:
        query = query.filter(ClubRequest.status == status_filter)
    requests = query.order_by(ClubRequest.created_at.desc()).all()
    return [enrich_club_request(r) for r in requests]

@router.post("/", response_model=ClubRequestResponse)
def create_club_request(
    request_in: ClubRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required([UserRole.ADMIN, UserRole.SUPER_ADMIN]))
):
    # Check if a club or pending request with this name already exists
    existing_club = db.query(Club).filter(Club.name == request_in.name).first()
    if existing_club:
        raise HTTPException(status_code=400, detail="A club with this name already exists")
        
    existing_req = db.query(ClubRequest).filter(
        ClubRequest.name == request_in.name,
        ClubRequest.status == RequestStatus.PENDING
    ).first()
    if existing_req:
        raise HTTPException(status_code=400, detail="A pending request for this club name already exists")
        
    if request_in.initial_leader_id:
        leader_user = db.query(User).filter(User.id == request_in.initial_leader_id).first()
        if not leader_user:
            raise HTTPException(status_code=404, detail="Initial leader student not found")

    new_req = ClubRequest(
        name=request_in.name,
        description=request_in.description,
        category=request_in.category,
        initial_leader_id=request_in.initial_leader_id,
        requested_by=current_user.id,
        status=RequestStatus.PENDING
    )
    db.add(new_req)
    db.commit()
    db.refresh(new_req)
    return enrich_club_request(new_req)

@router.put("/{id}/decision", response_model=ClubRequestResponse)
def decide_club_request(
    id: int,
    decision: ClubRequestDecision,
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required([UserRole.SUPER_ADMIN]))
):
    req = db.query(ClubRequest).filter(ClubRequest.id == id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Club request not found")
        
    if req.status != RequestStatus.PENDING:
        raise HTTPException(status_code=400, detail="Request has already been decided")
        
    req.status = decision.status
    req.decided_by = current_user.id
    req.rejection_reason = decision.rejection_reason
    req.updated_at = datetime.now(timezone.utc)
    
    if decision.status == RequestStatus.APPROVED:
        # Create active club
        new_club = Club(
            name=req.name,
            description=req.description,
            status=ClubStatus.ACTIVE,
            leader_id=req.initial_leader_id
        )
        db.add(new_club)
        db.commit()
        db.refresh(new_club)
        
        # If an initial leader was chosen, allot membership
        if req.initial_leader_id:
            membership = Membership(
                student_id=req.initial_leader_id,
                club_id=new_club.id,
                status=MembershipStatus.APPROVED,
                is_leader=True,
                decided_at=datetime.now(timezone.utc),
                decided_by=current_user.id
            )
            db.add(membership)
            db.commit()
            
    db.commit()
    db.refresh(req)
    return enrich_club_request(req)
