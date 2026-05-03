import uuid
from enum import Enum
from typing import Optional
from datetime import date, datetime
from sqlmodel import Field, SQLModel


class PayrunStatus(str, Enum):
    DRAFT = "draft"
    PROCESSING = "processing"
    PROCESSED = "processed"


class SalaryConfig(SQLModel, table=True):
    __tablename__ = "salary_config"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    employee_id: uuid.UUID = Field(foreign_key="employees.id", unique=True, index=True)
    basic: float
    hra: float = Field(default=0.0)
    other_allowances: float = Field(default=0.0)
    pf_rate: float = Field(default=0.12)          # 12%
    professional_tax: float = Field(default=200.0)  # ₹200 flat monthly
    effective_from: Optional[date] = Field(default=None)


class SalaryConfigCreate(SQLModel):
    employee_id: uuid.UUID
    basic: float
    hra: float = 0.0
    other_allowances: float = 0.0
    pf_rate: float = 0.12
    professional_tax: float = 200.0
    effective_from: Optional[date] = None


class SalaryConfigRead(SQLModel):
    id: uuid.UUID
    employee_id: uuid.UUID
    basic: float
    hra: float
    other_allowances: float
    pf_rate: float
    professional_tax: float
    effective_from: Optional[date]


class Payrun(SQLModel, table=True):
    __tablename__ = "payruns"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    month: int  # 1–12
    year: int
    status: PayrunStatus = Field(default=PayrunStatus.DRAFT)
    created_by: uuid.UUID = Field(foreign_key="users.id")
    processed_at: Optional[datetime] = Field(default=None)


class PayrunCreate(SQLModel):
    month: int
    year: int


class PayrunRead(SQLModel):
    id: uuid.UUID
    month: int
    year: int
    status: PayrunStatus
    created_by: uuid.UUID
    processed_at: Optional[datetime]


class Payslip(SQLModel, table=True):
    __tablename__ = "payslips"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    payrun_id: uuid.UUID = Field(foreign_key="payruns.id", index=True)
    employee_id: uuid.UUID = Field(foreign_key="employees.id", index=True)
    basic: float
    hra: float
    other_allowances: float
    gross: float
    pf_deduction: float
    prof_tax: float
    leave_deduction: float
    net_pay: float
    working_days: int
    days_present: int
    days_on_leave: int
    unpaid_days: int
    created_at: datetime = Field(default_factory=datetime.utcnow)


class PayslipRead(SQLModel):
    id: uuid.UUID
    payrun_id: uuid.UUID
    employee_id: uuid.UUID
    basic: float
    hra: float
    other_allowances: float
    gross: float
    pf_deduction: float
    prof_tax: float
    leave_deduction: float
    net_pay: float
    working_days: int
    days_present: int
    days_on_leave: int
    unpaid_days: int
    created_at: datetime
    payrun_month: int = 0
    payrun_year: int = 0
