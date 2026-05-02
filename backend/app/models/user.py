import uuid
from enum import Enum
from typing import Optional
from datetime import datetime
from sqlmodel import Field, SQLModel


class Role(str, Enum):
    ADMIN = "admin"
    EMPLOYEE = "employee"
    HR_OFFICER = "hr_officer"
    PAYROLL_OFFICER = "payroll_officer"


class User(SQLModel, table=True):
    __tablename__ = "users"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str = Field(max_length=255)
    email: str = Field(max_length=255, unique=True, index=True)
    hashed_password: str = Field(max_length=255)
    role: Role = Field(default=Role.EMPLOYEE)
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class UserCreate(SQLModel):
    name: str
    email: str
    password: str
    role: Role = Role.EMPLOYEE


class UserRead(SQLModel):
    id: uuid.UUID
    name: str
    email: str
    role: Role
    is_active: bool
    created_at: datetime


class UserRoleUpdate(SQLModel):
    role: Role
