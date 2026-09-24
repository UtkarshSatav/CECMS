from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timezone

from app.database import get_db
from app.models.user import User, UserRole
from app.models.club import Club
from app.models.event_request import EventRequest
from app.models.budget_request import BudgetRequest, BudgetRequestStatus
from app.schemas.budget_request import BudgetRequestCreate, BudgetRequestDecision, BudgetRequestResponse
from app.schemas.user import UserResponse
from app.core.security import get_current_user, role_required

router = APIRouter(prefix="/budget-requests", tags=["budget-requests"])

def enrich_budget_request(req: BudgetRequest) -> BudgetRequestResponse:
    creator_resp = None
    if req.creator:
        creator_resp = UserResponse(
            id=req.creator.id,
            email=req.creator.email,
            full_name=req.creator.full_name,
            role=req.creator.role,
            is_active=req.creator.is_active,
            created_at=req.creator.created_at
        )
    return BudgetRequestResponse(
        id=req.id,
        club_id=req.club_id,
        event_request_id=req.event_request_id,
        created_by=req.created_by,
        title=req.title,
        amount=req.amount,
        justification=req.justification,
        status=req.status,
        decided_by=req.decided_by,
        remarks=req.remarks,
        created_at=req.created_at,
        updated_at=req.updated_at,
        creator=creator_resp,
        club_name=req.club.name if req.club else None,
        event_title=req.event_request.title if req.event_request else None
    )

@router.get("/", response_model=List[BudgetRequestResponse])
def get_budget_requests(
    club_id: Optional[int] = None,
    status_filter: Optional[BudgetRequestStatus] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required([UserRole.ADMIN, UserRole.SUPER_ADMIN]))
):
    query = db.query(BudgetRequest)
    if club_id:
        query = query.filter(BudgetRequest.club_id == club_id)
    if status_filter:
        query = query.filter(BudgetRequest.status == status_filter)
        
    requests = query.order_by(BudgetRequest.created_at.desc()).all()
    return [enrich_budget_request(r) for r in requests]

@router.get("/{id}", response_model=BudgetRequestResponse)
def get_budget_request(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required([UserRole.ADMIN, UserRole.SUPER_ADMIN]))
):
    req = db.query(BudgetRequest).filter(BudgetRequest.id == id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Budget request not found")
    return enrich_budget_request(req)

@router.post("/", response_model=BudgetRequestResponse)
def create_budget_request(
    request_in: BudgetRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required([UserRole.ADMIN, UserRole.SUPER_ADMIN]))
):
    club = db.query(Club).filter(Club.id == request_in.club_id).first()
    if not club:
        raise HTTPException(status_code=404, detail="Club not found")
        
    if request_in.event_request_id:
        ev_req = db.query(EventRequest).filter(EventRequest.id == request_in.event_request_id).first()
        if not ev_req:
            raise HTTPException(status_code=404, detail="Linked event request not found")

    new_req = BudgetRequest(
        club_id=request_in.club_id,
        event_request_id=request_in.event_request_id,
        created_by=current_user.id,
        title=request_in.title,
        amount=request_in.amount,
        justification=request_in.justification,
        status=BudgetRequestStatus.PENDING
    )
    db.add(new_req)
    db.commit()
    db.refresh(new_req)
    return enrich_budget_request(new_req)

@router.put("/{id}/decision", response_model=BudgetRequestResponse)
def decide_budget_request(
    id: int,
    decision: BudgetRequestDecision,
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required([UserRole.SUPER_ADMIN]))
):
    req = db.query(BudgetRequest).filter(BudgetRequest.id == id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Budget request not found")
        
    if req.status != BudgetRequestStatus.PENDING:
        raise HTTPException(status_code=400, detail="Budget request has already been decided")
        
    req.status = decision.status
    req.decided_by = current_user.id
    req.remarks = decision.remarks
    req.updated_at = datetime.now(timezone.utc)
    
    db.commit()
    db.refresh(req)
    return enrich_budget_request(req)
