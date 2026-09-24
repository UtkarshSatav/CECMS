from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.club import Club, Membership, MembershipStatus
from app.models.registration import Registration
from app.models.attendance import Attendance
from app.schemas.user import UserResponse, UserUpdate
from app.core.security import get_current_user, get_password_hash

router = APIRouter(prefix="/students", tags=["students"])

def enrich_user_response(user: User, db: Session) -> UserResponse:
    led_clubs = db.query(Club.id).filter(Club.leader_id == user.id).all()
    led_membership_clubs = db.query(Membership.club_id).filter(
        Membership.student_id == user.id,
        Membership.status == MembershipStatus.APPROVED,
        Membership.is_leader == True
    ).all()
    
    led_ids = list(set([c[0] for c in led_clubs] + [m[0] for m in led_membership_clubs]))
    is_leader = len(led_ids) > 0
    
    return UserResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        is_active=user.is_active,
        created_at=user.created_at,
        is_club_leader=is_leader,
        led_club_ids=led_ids
    )

@router.get("/me", response_model=UserResponse)
def get_me(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return enrich_user_response(current_user, db)

@router.put("/me", response_model=UserResponse)
def update_me(user_in: UserUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if user_in.full_name is not None:
        current_user.full_name = user_in.full_name
    if user_in.password is not None:
        current_user.hashed_password = get_password_hash(user_in.password)
    
    db.commit()
    db.refresh(current_user)
    return enrich_user_response(current_user, db)

@router.get("/me/participation")
def get_participation(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    memberships = db.query(Membership).filter(Membership.student_id == current_user.id).all()
    registrations = db.query(Registration).filter(Registration.student_id == current_user.id).all()
    attendance_records = db.query(Attendance).join(Registration).filter(Registration.student_id == current_user.id).all()

    return {
        "memberships": memberships,
        "registrations": registrations,
        "attendance": attendance_records
    }
