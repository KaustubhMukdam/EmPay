import uuid
from enum import Enum
from typing import Optional
from datetime import date as date_, datetime
from sqlmodel import Field, SQLModel


class AttendanceStatus(str, Enum):
    PRESENT = "present"
    ABSENT = "absent"
    HALF_DAY = "half_day"
    ON_LEAVE = "on_leave"


class Attendance(SQLModel, table=True):
    __tablename__ = "attendance"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    employee_id: uuid.UUID = Field(foreign_key="employees.id", index=True)
    date: date_ = Field(index=True)
    check_in: Optional[datetime] = Field(default=None)
    check_out: Optional[datetime] = Field(default=None)
    working_hours: Optional[float] = Field(default=None)
    status: AttendanceStatus = Field(default=AttendanceStatus.ABSENT)


class AttendanceRead(SQLModel):
    id: uuid.UUID
    employee_id: uuid.UUID
    date: date_
    check_in: Optional[datetime]
    check_out: Optional[datetime]
    working_hours: Optional[float]
    status: AttendanceStatus


class AttendanceSummary(SQLModel):
    employee_id: uuid.UUID
    month: int
    year: int
    total_working_days: int
    days_present: int
    days_absent: int
    days_on_leave: int
    days_half_day: int
    total_working_hours: float
