import uuid
from enum import Enum
from typing import Optional
from datetime import date, datetime
from sqlmodel import Field, SQLModel


class LeaveStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class LeaveType(SQLModel, table=True):
    __tablename__ = "leave_types"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str = Field(max_length=100)
    is_paid: bool = Field(default=True)
    max_days: int = Field(default=12)
    created_by: Optional[uuid.UUID] = Field(default=None, foreign_key="users.id")


class LeaveTypeCreate(SQLModel):
    name: str
    is_paid: bool = True
    max_days: int = 12


class LeaveTypeRead(SQLModel):
    id: uuid.UUID
    name: str
    is_paid: bool
    max_days: int


class LeaveAllocation(SQLModel, table=True):
    __tablename__ = "leave_allocations"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    employee_id: uuid.UUID = Field(foreign_key="employees.id", index=True)
    leave_type_id: uuid.UUID = Field(foreign_key="leave_types.id")
    year: int
    total_days: int
    used_days: int = Field(default=0)


class LeaveAllocationCreate(SQLModel):
    employee_id: uuid.UUID
    leave_type_id: uuid.UUID
    year: int
    total_days: int


class LeaveAllocationRead(SQLModel):
    id: uuid.UUID
    employee_id: uuid.UUID
    leave_type_id: uuid.UUID
    year: int
    total_days: int
    used_days: int


class LeaveRequest(SQLModel, table=True):
    __tablename__ = "leave_requests"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    employee_id: uuid.UUID = Field(foreign_key="employees.id", index=True)
    leave_type_id: uuid.UUID = Field(foreign_key="leave_types.id")
    from_date: date
    to_date: date
    total_days: int
    reason: Optional[str] = Field(default=None)
    status: LeaveStatus = Field(default=LeaveStatus.PENDING)
    reviewed_by: Optional[uuid.UUID] = Field(default=None, foreign_key="users.id")
    reviewed_at: Optional[datetime] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class LeaveRequestCreate(SQLModel):
    leave_type_id: uuid.UUID
    from_date: date
    to_date: date
    reason: Optional[str] = None


class LeaveRequestRead(SQLModel):
    id: uuid.UUID
    employee_id: uuid.UUID
    leave_type_id: uuid.UUID
    from_date: date
    to_date: date
    total_days: int
    reason: Optional[str]
    status: LeaveStatus
    reviewed_by: Optional[uuid.UUID]
    reviewed_at: Optional[datetime]
    created_at: datetime
