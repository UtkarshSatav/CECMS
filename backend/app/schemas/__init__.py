# Initialize schemas
from app.schemas.user import UserCreate, AdminUserCreate, UserResponse, UserLogin, UserUpdate, Token
from app.schemas.club import ClubCreate, ClubUpdate, ClubResponse, MembershipResponse, MembershipDecision, StudentAllotment, SetLeader
from app.schemas.event import EventCreate, EventUpdate, EventResponse
from app.schemas.registration import RegistrationResponse
from app.schemas.attendance import AttendanceCreate, AttendanceResponse, AttendanceItem
from app.schemas.club_request import ClubRequestCreate, ClubRequestDecision, ClubRequestResponse
from app.schemas.event_request import EventRequestCreate, EventRequestDecision, EventRequestResponse
from app.schemas.budget_request import BudgetRequestCreate, BudgetRequestDecision, BudgetRequestResponse
