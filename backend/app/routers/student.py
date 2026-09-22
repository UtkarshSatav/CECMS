from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.club import Membership
from app.models.registration import Registration
from app.models.attendance import Attendance
from app.schemas.user import UserResponse, UserUpdate
from app.core.security import get_current_user, get_password_hash

router = APIRouter(prefix="/student", tags=["student"])

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.put("/me", response_model=UserResponse)
def update_me(user_in: UserUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if user_in.full_name is not None:
        current_user.full_name = user_in.full_name
    if user_in.password is not None:
        current_user.hashed_password = get_password_hash(user_in.password)
    
    db.commit()
    db.refresh(current_user)
    return current_user

@router.get("/me/participation")
def get_participation(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    memberships = db.query(Membership).filter(Membership.student_id == current_user.id).all()
    registrations = db.query(Registration).filter(Registration.student_id == current_user.id).all()
    
    # We can fetch attendance separately or map it
    attendance_records = db.query(Attendance).join(Registration).filter(Registration.student_id == current_user.id).all()

    return {
        "memberships": memberships,
        "registrations": registrations,
        "attendance": attendance_records
    }
