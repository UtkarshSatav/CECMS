from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from typing import List

from app.database import get_db
from app.models.user import User, UserRole
from app.models.club import Club, ClubStatus, Membership, MembershipStatus
from app.schemas.club import ClubCreate, ClubUpdate, ClubResponse, MembershipResponse, MembershipDecision
from app.core.security import get_current_user, role_required

router = APIRouter(prefix="/clubs", tags=["clubs"])

@router.get("/", response_model=List[ClubResponse])
def get_clubs(db: Session = Depends(get_db)):
    return db.query(Club).filter(Club.status == ClubStatus.ACTIVE).all()

@router.get("/{id}", response_model=ClubResponse)
def get_club(id: int, db: Session = Depends(get_db)):
    club = db.query(Club).filter(Club.id == id).first()
    if not club:
        raise HTTPException(status_code=404, detail="Club not found")
    return club

@router.post("/", response_model=ClubResponse)
def create_club(
    club_in: ClubCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required([UserRole.ADMINISTRATOR]))
):
    new_club = Club(name=club_in.name, description=club_in.description)
    db.add(new_club)
    try:
        db.commit()
        db.refresh(new_club)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail="Could not create club (name might not be unique)")
    return new_club

@router.put("/{id}", response_model=ClubResponse)
def update_club(
    id: int,
    club_in: ClubUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required([UserRole.ADMINISTRATOR]))
):
    club = db.query(Club).filter(Club.id == id).first()
    if not club:
        raise HTTPException(status_code=404, detail="Club not found")
    
    update_data = club_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(club, key, value)
    
    db.commit()
    db.refresh(club)
    return club

@router.post("/{id}/join", response_model=MembershipResponse)
def join_club(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    club = db.query(Club).filter(Club.id == id, Club.status == ClubStatus.ACTIVE).first()
    if not club:
        raise HTTPException(status_code=404, detail="Active club not found")
    
    existing = db.query(Membership).filter(
        Membership.student_id == current_user.id,
        Membership.club_id == id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Membership already requested/exists")
    
    membership = Membership(student_id=current_user.id, club_id=id)
    db.add(membership)
    db.commit()
    db.refresh(membership)
    return membership

@router.get("/{id}/members", response_model=List[MembershipResponse])
def get_club_members(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required([UserRole.ADMINISTRATOR, UserRole.CLUB_COORDINATOR, UserRole.FACULTY_COORDINATOR]))
):
    return db.query(Membership).filter(
        Membership.club_id == id,
        Membership.status == MembershipStatus.APPROVED
    ).all()

@router.get("/{id}/requests", response_model=List[MembershipResponse])
def get_club_requests(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required([UserRole.CLUB_COORDINATOR]))
):
    # Additional check: Is this coordinator actually managing this club?
    club = db.query(Club).filter(Club.id == id).first()
    if club and club.club_coordinator_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not the coordinator of this club")
    
    return db.query(Membership).filter(
        Membership.club_id == id,
        Membership.status == MembershipStatus.PENDING
    ).all()

@router.put("/{id}/requests/{membership_id}", response_model=MembershipResponse)
def decide_membership(
    id: int,
    membership_id: int,
    decision: MembershipDecision,
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required([UserRole.CLUB_COORDINATOR]))
):
    club = db.query(Club).filter(Club.id == id).first()
    if club and club.club_coordinator_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not the coordinator of this club")
    
    membership = db.query(Membership).filter(Membership.id == membership_id, Membership.club_id == id).first()
    if not membership:
        raise HTTPException(status_code=404, detail="Membership request not found")
    if membership.status != MembershipStatus.PENDING:
        raise HTTPException(status_code=400, detail="Membership is not pending")

    membership.status = decision.status
    membership.decided_at = datetime.now(timezone.utc)
    membership.decided_by = current_user.id
    db.commit()
    db.refresh(membership)
    return membership
