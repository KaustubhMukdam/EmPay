"""Analytics router — role-aware dashboard data"""
from datetime import date, timedelta
import calendar
from fastapi import APIRouter, Depends, Query, HTTPException
from pydantic import BaseModel
from sqlmodel import Session, select, func

from app.database import get_session
from app.models.user import User, Role
from app.models.employee import Employee
from app.models.attendance import Attendance, AttendanceStatus
from app.models.leave import LeaveRequest, LeaveStatus, LeaveType, LeaveAllocation
from app.models.payroll import Payrun, PayrunStatus
from app.dependencies.auth import get_current_user
from app.dependencies.roles import require_role

router = APIRouter()

ALL_ROLES = [Role.ADMIN, Role.HR_OFFICER, Role.PAYROLL_OFFICER, Role.EMPLOYEE]


# Pydantic models for responses
class AdminAnalytics(BaseModel):
    total_employees: int
    present_today: int
    half_day_today: int
    pending_leaves: int
    payroll_due_month: int | None
    payroll_due_year: int | None
    processed_payruns: int
    total_payslips: int


class WeeklyAttendance(BaseModel):
    week_label: str
    present: int
    absent: int
    half_day: int
    on_leave: int


class AttendanceMonthlyResponse(BaseModel):
    weeks: list[WeeklyAttendance]


class LeaveDistributionItem(BaseModel):
    leave_type: str
    count: int


class LeaveDistributionResponse(BaseModel):
    distribution: list[LeaveDistributionItem]


class EmployeeSummary(BaseModel):
    total_working_days: int
    present: int
    absent: int
    half_day: int
    on_leave: int
    check_in_today: bool
    leave_balance: dict


# Endpoints
@router.get("/admin", response_model=AdminAnalytics)
def get_admin_analytics(
    session: Session = Depends(get_session),
    current_user: User = Depends(require_role([Role.ADMIN, Role.HR_OFFICER, Role.PAYROLL_OFFICER])),
):
    """Get admin dashboard analytics"""
    today = date.today()
    
    total_employees = session.exec(
        select(func.count(Employee.id)).where(Employee.is_active == True)
    ).one() or 0
    
    present_today = session.exec(
        select(func.count(Attendance.id)).where(
            Attendance.date == today,
            Attendance.status == AttendanceStatus.PRESENT,
        )
    ).one() or 0

    half_day_today = session.exec(
        select(func.count(Attendance.id)).where(
            Attendance.date == today,
            Attendance.status == AttendanceStatus.HALF_DAY,
        )
    ).one() or 0
    
    pending_leaves = session.exec(
        select(func.count(LeaveRequest.id)).where(LeaveRequest.status == LeaveStatus.PENDING)
    ).one() or 0

    processed_payruns = session.exec(
        select(func.count(Payrun.id)).where(Payrun.status == PayrunStatus.PROCESSED)
    ).one() or 0

    from app.models.payroll import Payslip
    total_payslips = session.exec(select(func.count(Payslip.id))).one() or 0
    
    due_payrun = session.exec(
        select(Payrun)
        .where(Payrun.status != PayrunStatus.PROCESSED)
        .order_by(Payrun.year.desc(), Payrun.month.desc())
    ).first()
    
    return AdminAnalytics(
        total_employees=total_employees,
        present_today=present_today,
        half_day_today=half_day_today,
        pending_leaves=pending_leaves,
        payroll_due_month=due_payrun.month if due_payrun else None,
        payroll_due_year=due_payrun.year if due_payrun else None,
        processed_payruns=processed_payruns,
        total_payslips=total_payslips,
    )


@router.get("/monthly-attendance", response_model=AttendanceMonthlyResponse)
def get_monthly_attendance(
    month: int = Query(..., ge=1, le=12),
    year: int = Query(...),
    session: Session = Depends(get_session),
    current_user: User = Depends(require_role([Role.ADMIN, Role.HR_OFFICER, Role.PAYROLL_OFFICER])),
):
    """Get weekly attendance breakdown for a month"""
    month_start = date(year, month, 1)
    month_end = date(year, month, calendar.monthrange(year, month)[1])
    
    records = session.exec(
        select(Attendance).where(
            Attendance.date >= month_start,
            Attendance.date <= month_end,
        )
    ).all()
    
    # Group by week
    weekly_data = []
    week_start = month_start
    while week_start <= month_end:
        week_end = min(week_start + timedelta(days=6), month_end)
        week_records = [r for r in records if week_start <= r.date <= week_end]
        
        weekly_data.append(WeeklyAttendance(
            week_label=f"{week_start.strftime('%b %d')}–{week_end.strftime('%d')}",
            present=sum(1 for r in week_records if r.status == AttendanceStatus.PRESENT),
            absent=sum(1 for r in week_records if r.status == AttendanceStatus.ABSENT),
            half_day=sum(1 for r in week_records if r.status == AttendanceStatus.HALF_DAY),
            on_leave=sum(1 for r in week_records if r.status == AttendanceStatus.ON_LEAVE),
        ))
        week_start += timedelta(days=7)
    
    return AttendanceMonthlyResponse(weeks=weekly_data)


@router.get("/leave-distribution", response_model=LeaveDistributionResponse)
def get_leave_distribution(
    session: Session = Depends(get_session),
    current_user: User = Depends(require_role([Role.ADMIN, Role.HR_OFFICER])),
):
    """Get distribution of approved leaves by type (top 12 most used)"""
    leave_types = session.exec(select(LeaveType)).all()
    requests = session.exec(
        select(LeaveRequest).where(LeaveRequest.status == LeaveStatus.APPROVED)
    ).all()
    
    # Build distribution only for leave types with approved requests
    distribution = []
    for lt in leave_types:
        count = sum(1 for r in requests if r.leave_type_id == lt.id)
        if count > 0:  # Only include types with actual approvals
            distribution.append(LeaveDistributionItem(leave_type=lt.name, count=count))
    
    # Sort by count descending and limit to top 12 for readability
    distribution.sort(key=lambda x: x.count, reverse=True)
    distribution = distribution[:12]
    
    return LeaveDistributionResponse(distribution=distribution)


@router.get("/employee-summary", response_model=EmployeeSummary)
def get_employee_summary(
    session: Session = Depends(get_session),
    current_user: User = Depends(require_role([Role.EMPLOYEE])),
):
    """Get employee's own dashboard summary"""
    today = date.today()
    
    emp = session.exec(
        select(Employee).where(Employee.user_id == current_user.id)
    ).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee record not found")
    
    # Current month attendance
    month_start = date(today.year, today.month, 1)
    month_end = date(today.year, today.month, calendar.monthrange(today.year, today.month)[1])
    
    monthly_records = session.exec(
        select(Attendance).where(
            Attendance.employee_id == emp.id,
            Attendance.date >= month_start,
            Attendance.date <= month_end,
        )
    ).all()
    
    # Working days in month (exclude weekends)
    working_days = sum(1 for day in range(1, calendar.monthrange(today.year, today.month)[1] + 1)
                       if date(today.year, today.month, day).weekday() < 5)
    
    # Leave balance
    balances = session.exec(
        select(LeaveAllocation).where(
            LeaveAllocation.employee_id == emp.id,
            LeaveAllocation.year == today.year,
        )
    ).all()

    leave_type_names = {
        leave_type.id: leave_type.name
        for leave_type in session.exec(select(LeaveType)).all()
    }
    leave_balance_dict = {
        leave_type_names.get(balance.leave_type_id, str(balance.leave_type_id)): balance.total_days - balance.used_days
        for balance in balances
    }
    
    return EmployeeSummary(
        total_working_days=working_days,
        present=sum(1 for r in monthly_records if r.status == AttendanceStatus.PRESENT),
        absent=sum(1 for r in monthly_records if r.status == AttendanceStatus.ABSENT),
        half_day=sum(1 for r in monthly_records if r.status == AttendanceStatus.HALF_DAY),
        on_leave=sum(1 for r in monthly_records if r.status == AttendanceStatus.ON_LEAVE),
        check_in_today=any(r.date == today and r.check_in for r in monthly_records),
        leave_balance=leave_balance_dict,
    )
