from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy import func

from app.database import get_db
from app.models.user import User, UserRole
from app.models.club import Club, ClubStatus, Membership, MembershipStatus
from app.schemas.club import (
    ClubCreate, ClubUpdate, ClubResponse, MembershipResponse, 
    MembershipDecision, StudentAllotment, SetLeader
)
from app.schemas.user import UserResponse
from app.core.security import get_current_user, role_required

router = APIRouter(prefix="/clubs", tags=["clubs"])

def enrich_club(club: Club, db: Session) -> ClubResponse:
    count = db.query(func.count(Membership.id)).filter(
        Membership.club_id == club.id,
        Membership.status == MembershipStatus.APPROVED
    ).scalar() or 0
    
    leader_resp = None
    if club.leader:
        leader_resp = UserResponse(
            id=club.leader.id,
            email=club.leader.email,
            full_name=club.leader.full_name,
            role=club.leader.role,
            is_active=club.leader.is_active,
            created_at=club.leader.created_at,
            is_club_leader=True
        )
        
    return ClubResponse(
        id=club.id,
        name=club.name,
        description=club.description,
        status=club.status,
        leader_id=club.leader_id,
        leader=leader_resp,
        club_coordinator_id=club.club_coordinator_id,
        faculty_coordinator_id=club.faculty_coordinator_id,
        member_count=count,
        created_at=club.created_at,
        updated_at=club.updated_at
    )

@router.get("/", response_model=List[ClubResponse])
def get_clubs(db: Session = Depends(get_db)):
    clubs = db.query(Club).filter(Club.status == ClubStatus.ACTIVE).all()
    return [enrich_club(c, db) for c in clubs]

@router.get("/all", response_model=List[ClubResponse])
def get_all_clubs(
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required([UserRole.ADMIN, UserRole.SUPER_ADMIN]))
):
    clubs = db.query(Club).all()
    return [enrich_club(c, db) for c in clubs]

@router.get("/students/available", response_model=List[UserResponse])
def get_available_students(
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required([UserRole.ADMIN, UserRole.SUPER_ADMIN]))
):
    students = db.query(User).filter(User.role == UserRole.STUDENT, User.is_active == True).all()
    return [
        UserResponse(
            id=s.id,
            email=s.email,
            full_name=s.full_name,
            role=s.role,
            is_active=s.is_active,
            created_at=s.created_at
        ) for s in students
    ]

@router.get("/{id}", response_model=ClubResponse)
def get_club(id: int, db: Session = Depends(get_db)):
    club = db.query(Club).filter(Club.id == id).first()
    if not club:
        raise HTTPException(status_code=404, detail="Club not found")
    return enrich_club(club, db)

@router.post("/", response_model=ClubResponse)
def create_club(
    club_in: ClubCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required([UserRole.SUPER_ADMIN, UserRole.ADMIN]))
):
    existing = db.query(Club).filter(Club.name == club_in.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="A club with this name already exists")
        
    new_club = Club(
        name=club_in.name, 
        description=club_in.description,
        leader_id=club_in.leader_id
    )
    db.add(new_club)
    try:
        db.commit()
        db.refresh(new_club)
        
        # If leader was provided, ensure membership exists
        if club_in.leader_id:
            membership = db.query(Membership).filter(
                Membership.club_id == new_club.id,
                Membership.student_id == club_in.leader_id
            ).first()
            if not membership:
                membership = Membership(
                    student_id=club_in.leader_id,
                    club_id=new_club.id,
                    status=MembershipStatus.APPROVED,
                    is_leader=True,
                    decided_at=datetime.now(timezone.utc),
                    decided_by=current_user.id
                )
                db.add(membership)
            else:
                membership.status = MembershipStatus.APPROVED
                membership.is_leader = True
            db.commit()
            
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail="Could not create club: " + str(e))
        
    return enrich_club(new_club, db)

@router.put("/{id}", response_model=ClubResponse)
def update_club(
    id: int,
    club_in: ClubUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required([UserRole.ADMIN, UserRole.SUPER_ADMIN]))
):
    club = db.query(Club).filter(Club.id == id).first()
    if not club:
        raise HTTPException(status_code=404, detail="Club not found")
    
    update_data = club_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(club, key, value)
    
    db.commit()
    db.refresh(club)
    return enrich_club(club, db)

@router.post("/{id}/allot-student", response_model=MembershipResponse)
def allot_student_to_club(
    id: int,
    allotment: StudentAllotment,
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required([UserRole.ADMIN, UserRole.SUPER_ADMIN]))
):
    club = db.query(Club).filter(Club.id == id).first()
    if not club:
        raise HTTPException(status_code=404, detail="Club not found")
        
    student = db.query(User).filter(User.id == allotment.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
        
    membership = db.query(Membership).filter(
        Membership.club_id == id,
        Membership.student_id == allotment.student_id
    ).first()
    
    if membership:
        membership.status = MembershipStatus.APPROVED
        membership.is_leader = allotment.is_leader or False
        membership.decided_at = datetime.now(timezone.utc)
        membership.decided_by = current_user.id
    else:
        membership = Membership(
            student_id=allotment.student_id,
            club_id=id,
            status=MembershipStatus.APPROVED,
            is_leader=allotment.is_leader or False,
            decided_at=datetime.now(timezone.utc),
            decided_by=current_user.id
        )
        db.add(membership)
        
    if allotment.is_leader:
        # Also set this student as the club's leader
        club.leader_id = student.id
        
    db.commit()
    db.refresh(membership)
    return membership

@router.put("/{id}/leader", response_model=ClubResponse)
def set_club_leader(
    id: int,
    data: SetLeader,
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required([UserRole.ADMIN, UserRole.SUPER_ADMIN]))
):
    club = db.query(Club).filter(Club.id == id).first()
    if not club:
        raise HTTPException(status_code=404, detail="Club not found")
        
    student = db.query(User).filter(User.id == data.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
        
    # Reset any existing leader flag for this club
    prev_memberships = db.query(Membership).filter(Membership.club_id == id).all()
    for m in prev_memberships:
        if m.student_id == data.student_id:
            m.status = MembershipStatus.APPROVED
            m.is_leader = True
        else:
            m.is_leader = False
            
    # If the student isn't already a member, create membership
    target_membership = db.query(Membership).filter(
        Membership.club_id == id,
        Membership.student_id == data.student_id
    ).first()
    if not target_membership:
        target_membership = Membership(
            student_id=data.student_id,
            club_id=id,
            status=MembershipStatus.APPROVED,
            is_leader=True,
            decided_at=datetime.now(timezone.utc),
            decided_by=current_user.id
        )
        db.add(target_membership)
        
    club.leader_id = data.student_id
    db.commit()
    db.refresh(club)
    return enrich_club(club, db)

@router.delete("/{id}/members/{student_id}")
def remove_member_from_club(
    id: int,
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required([UserRole.ADMIN, UserRole.SUPER_ADMIN]))
):
    membership = db.query(Membership).filter(
        Membership.club_id == id,
        Membership.student_id == student_id
    ).first()
    if not membership:
        raise HTTPException(status_code=404, detail="Membership not found")
        
    club = db.query(Club).filter(Club.id == id).first()
    if club and club.leader_id == student_id:
        club.leader_id = None
        
    db.delete(membership)
    db.commit()
    return {"detail": "Member removed successfully"}

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
        if existing.status == MembershipStatus.REJECTED:
            existing.status = MembershipStatus.PENDING
            existing.requested_at = datetime.now(timezone.utc)
            db.commit()
            db.refresh(existing)
            return existing
        raise HTTPException(status_code=400, detail="Membership already requested or approved")
    
    membership = Membership(student_id=current_user.id, club_id=id)
    db.add(membership)
    db.commit()
    db.refresh(membership)
    return membership

@router.get("/{id}/members", response_model=List[MembershipResponse])
def get_club_members(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Any authenticated user can view the members of an active club
    return db.query(Membership).filter(
        Membership.club_id == id,
        Membership.status == MembershipStatus.APPROVED
    ).all()

@router.get("/{id}/requests", response_model=List[MembershipResponse])
def get_club_requests(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    club = db.query(Club).filter(Club.id == id).first()
    if not club:
        raise HTTPException(status_code=404, detail="Club not found")
        
    # Allowed: Admin, Super Admin, or the Club's Leader
    is_admin = current_user.role in [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.ADMINISTRATOR]
    is_leader = club.leader_id == current_user.id
    if not is_admin and not is_leader:
        raise HTTPException(status_code=403, detail="Not authorized to view requests for this club")
    
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
    current_user: User = Depends(get_current_user)
):
    club = db.query(Club).filter(Club.id == id).first()
    if not club:
        raise HTTPException(status_code=404, detail="Club not found")
        
    is_admin = current_user.role in [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.ADMINISTRATOR]
    is_leader = club.leader_id == current_user.id
    if not is_admin and not is_leader:
        raise HTTPException(status_code=403, detail="Not authorized to decide requests for this club")
    
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
