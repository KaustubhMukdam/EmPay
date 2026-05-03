"""Attendance router — check-in, check-out, logs"""
import uuid
import calendar
from typing import List, Optional
from datetime import date, datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select

from app.database import get_session
from app.models.user import User, Role
from app.models.employee import Employee
from app.models.attendance import Attendance, AttendanceStatus, AttendanceRead, AttendanceSummary
from app.dependencies.auth import get_current_user
from app.dependencies.roles import require_role

router = APIRouter()

ALL_ROLES = [Role.ADMIN, Role.HR_OFFICER, Role.PAYROLL_OFFICER, Role.EMPLOYEE]
MANAGER_ROLES = [Role.ADMIN, Role.HR_OFFICER, Role.PAYROLL_OFFICER]


def _as_utc(dt: datetime) -> datetime:
    # Backward compatibility: old rows may have naive timestamps.
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def _get_employee_for_user(user_id: uuid.UUID, session: Session) -> Employee:
    emp = session.exec(select(Employee).where(Employee.user_id == user_id)).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee record not found for this user")
    return emp


@router.post("/checkin", response_model=AttendanceRead)
def check_in(
    session: Session = Depends(get_session),
    current_user: User = Depends(require_role(ALL_ROLES)),
):
    emp = _get_employee_for_user(current_user.id, session)
    today = date.today()
    existing = session.exec(
        select(Attendance).where(
            Attendance.employee_id == emp.id,
            Attendance.date == today,
        )
    ).first()
    if existing and existing.check_in:
        raise HTTPException(status_code=409, detail="Already checked in today")

    if existing:
        record = existing
    else:
        record = Attendance(employee_id=emp.id, date=today)

    record.check_in = datetime.now(timezone.utc)
    record.status = AttendanceStatus.PRESENT
    session.add(record)
    session.commit()
    session.refresh(record)
    return record


@router.post("/checkout", response_model=AttendanceRead)
def check_out(
    session: Session = Depends(get_session),
    current_user: User = Depends(require_role(ALL_ROLES)),
):
    emp = _get_employee_for_user(current_user.id, session)
    today = date.today()
    record = session.exec(
        select(Attendance).where(
            Attendance.employee_id == emp.id,
            Attendance.date == today,
        )
    ).first()
    if not record or not record.check_in:
        raise HTTPException(status_code=400, detail="No check-in found for today")
    if record.check_out:
        raise HTTPException(status_code=409, detail="Already checked out today")

    record.check_out = datetime.now(timezone.utc)
    check_in_utc = _as_utc(record.check_in)
    check_out_utc = _as_utc(record.check_out)
    delta = (check_out_utc - check_in_utc).total_seconds() / 3600
    record.working_hours = round(delta, 2)
    if delta < 4:
        record.status = AttendanceStatus.HALF_DAY
    session.add(record)
    session.commit()
    session.refresh(record)
    return record


@router.get("/my", response_model=List[AttendanceRead])
def my_attendance(
    month: Optional[int] = Query(None, ge=1, le=12),
    year: Optional[int] = Query(None),
    session: Session = Depends(get_session),
    current_user: User = Depends(require_role(ALL_ROLES)),
):
    emp = _get_employee_for_user(current_user.id, session)
    query = select(Attendance).where(Attendance.employee_id == emp.id)
    records = session.exec(query).all()
    if month and year:
        records = [r for r in records if r.date.month == month and r.date.year == year]
    elif month:
        records = [r for r in records if r.date.month == month]
    return records


@router.get("/all", response_model=List[AttendanceRead])
def all_attendance(
    month: Optional[int] = Query(None, ge=1, le=12),
    year: Optional[int] = Query(None),
    session: Session = Depends(get_session),
    current_user: User = Depends(require_role(MANAGER_ROLES)),
):
    records = session.exec(select(Attendance)).all()
    if month and year:
        records = [r for r in records if r.date.month == month and r.date.year == year]
    elif month:
        records = [r for r in records if r.date.month == month]
    return records


@router.get("/summary/{employee_id}", response_model=AttendanceSummary)
def attendance_summary(
    employee_id: uuid.UUID,
    month: int = Query(..., ge=1, le=12),
    year: int = Query(...),
    session: Session = Depends(get_session),
    current_user: User = Depends(require_role(MANAGER_ROLES)),
):
    records = session.exec(
        select(Attendance).where(
            Attendance.employee_id == employee_id,
        )
    ).all()
    monthly = [r for r in records if r.date.month == month and r.date.year == year]
    
    working_days = sum(1 for day in range(1, calendar.monthrange(year, month)[1] + 1)
                       if date(year, month, day).weekday() < 5)

    return AttendanceSummary(
        employee_id=employee_id,
        month=month,
        year=year,
        total_working_days=working_days,
        days_present=sum(1 for r in monthly if r.status == AttendanceStatus.PRESENT),
        days_absent=sum(1 for r in monthly if r.status == AttendanceStatus.ABSENT),
        days_on_leave=sum(1 for r in monthly if r.status == AttendanceStatus.ON_LEAVE),
        days_half_day=sum(1 for r in monthly if r.status == AttendanceStatus.HALF_DAY),
        total_working_hours=sum(r.working_hours or 0 for r in monthly),
    )
