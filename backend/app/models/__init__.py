# Initialize models
from app.models.user import User, UserRole
from app.models.club import Club, ClubStatus, Membership, MembershipStatus
from app.models.event import Event, EventStatus
from app.models.registration import Registration, RegistrationStatus
from app.models.attendance import Attendance, AttendanceStatus
from app.models.club_request import ClubRequest, RequestStatus
from app.models.event_request import EventRequest, EventRequestStatus
from app.models.budget_request import BudgetRequest, BudgetRequestStatus
