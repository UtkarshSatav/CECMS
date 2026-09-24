from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from typing import List, Optional

from app.database import get_db
from app.models.user import User, UserRole
from app.models.club import Club, Membership, MembershipStatus
from app.schemas.user import UserCreate, AdminUserCreate, UserResponse, Token
from app.core.security import verify_password, get_password_hash, create_access_token, get_current_user, role_required
from app.core.config import settings

router = APIRouter(prefix="/auth", tags=["auth"])

def enrich_user_response(user: User, db: Session) -> UserResponse:
    # Check if student is a club leader
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

@router.post("/register", response_model=UserResponse)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_in.email).first()
    if user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user_in.password)
    new_user = User(
        email=user_in.email,
        hashed_password=hashed_password,
        full_name=user_in.full_name,
        role=UserRole.STUDENT
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return enrich_user_response(new_user, db)

@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        subject=user.id, expires_delta=access_token_expires
    )
    user_resp = enrich_user_response(user, db)
    return {"access_token": access_token, "token_type": "bearer", "user": user_resp}

@router.post("/admin/create-user", response_model=UserResponse)
def admin_create_user(
    user_in: AdminUserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Super Admin can create any user (Super Admin, Admin, Student)
    # Admin can only create Students
    is_super = current_user.role in [UserRole.SUPER_ADMIN, UserRole.ADMINISTRATOR]
    is_admin = current_user.role in [UserRole.ADMIN]

    if not is_super and not is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to create users")

    if user_in.role in [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.ADMINISTRATOR] and not is_super:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Super Admin can create Admin or Super Admin accounts"
        )
    
    user = db.query(User).filter(User.email == user_in.email).first()
    if user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user_in.password)
    new_user = User(
        email=user_in.email,
        hashed_password=hashed_password,
        full_name=user_in.full_name,
        role=user_in.role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return enrich_user_response(new_user, db)

@router.get("/users", response_model=List[UserResponse])
def get_users(
    role: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required([UserRole.ADMIN, UserRole.SUPER_ADMIN]))
):
    query = db.query(User)
    if role:
        query = query.filter(User.role == role)
    users = query.all()
    return [enrich_user_response(u, db) for u in users]
