from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from app.models.budget_request import BudgetRequestStatus
from app.schemas.user import UserResponse

class BudgetRequestBase(BaseModel):
    club_id: int
    event_request_id: Optional[int] = None
    title: str
    amount: float = Field(gt=0.0)
    justification: Optional[str] = None

class BudgetRequestCreate(BudgetRequestBase):
    pass

class BudgetRequestDecision(BaseModel):
    status: BudgetRequestStatus
    remarks: Optional[str] = None

class BudgetRequestResponse(BudgetRequestBase):
    id: int
    created_by: int
    status: BudgetRequestStatus
    decided_by: Optional[int] = None
    remarks: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    creator: Optional[UserResponse] = None
    club_name: Optional[str] = None
    event_title: Optional[str] = None

    class Config:
        from_attributes = True
