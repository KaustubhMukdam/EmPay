import uuid
from typing import Optional
from datetime import date, datetime
from sqlmodel import Field, SQLModel


class Employee(SQLModel, table=True):
    __tablename__ = "employees"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="users.id", unique=True, index=True)
    department: Optional[str] = Field(default=None, max_length=100)
    designation: Optional[str] = Field(default=None, max_length=100)
    date_of_joining: Optional[date] = Field(default=None)
    employee_code: Optional[str] = Field(default=None, max_length=20, unique=True)
    manager_id: Optional[uuid.UUID] = Field(default=None, foreign_key="employees.id")
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class EmployeeCreate(SQLModel):
    user_id: uuid.UUID
    department: Optional[str] = None
    designation: Optional[str] = None
    date_of_joining: Optional[date] = None
    employee_code: Optional[str] = None
    manager_id: Optional[uuid.UUID] = None


class EmployeeUpdate(SQLModel):
    department: Optional[str] = None
    designation: Optional[str] = None
    date_of_joining: Optional[date] = None
    employee_code: Optional[str] = None
    manager_id: Optional[uuid.UUID] = None
    is_active: Optional[bool] = None


class EmployeeRead(SQLModel):
    id: uuid.UUID
    user_id: uuid.UUID
    department: Optional[str]
    designation: Optional[str]
    date_of_joining: Optional[date]
    employee_code: Optional[str]
    manager_id: Optional[uuid.UUID]
    is_active: bool
    created_at: datetime
