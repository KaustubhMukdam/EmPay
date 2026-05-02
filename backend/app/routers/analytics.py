"""Analytics router — role-aware dashboard data"""
from datetime import date
from fastapi import APIRouter, Depends, Query
from sqlmodel import Session, select, func

from app.database import get_session
from app.models.user import User, Role
from app.models.employee import Employee
from app.models.attendance import Attendance, AttendanceStatus
from app.models.leave import LeaveRequest, LeaveStatus, LeaveType
from app.models.payroll import Payrun, Payslip, PayrunStatus
from app.dependencies.auth import get_current_user
from app.dependencies.roles import require_role

router = APIRouter()

ALL_ROLES = [Role.ADMIN, Role.HR_OFFICER, Role.PAYROLL_OFFICER, Role.EMPLOYEE]


@router.get("/dashboard")
def dashboard(
    session: Session = Depends(get_session),
    current_user: User = Depends(require_role(ALL_ROLES)),
):
    today = date.today()
    role = current_user.role

    if role == Role.ADMIN or role == Role.HR_OFFICER:
        total_employees = len(session.exec(select(Employee).where(Employee.is_active == True)).all())
        today_present = len(session.exec(
            select(Attendance).where(
                Attendance.date == today,
                Attendance.status == AttendanceStatus.PRESENT,
            )
        ).all())
        pending_leaves = len(session.exec(
            select(LeaveRequest).where(LeaveRequest.status == LeaveStatus.PENDING)
        ).all())
        last_payrun = session.exec(
            select(Payrun).where(Payrun.status == PayrunStatus.PROCESSED)
        ).first()
        return {
            "role": role.value,
            "total_employees": total_employees,
            "today_present": today_present,
            "pending_leaves": pending_leaves,
            "last_payrun": last_payrun.month if last_payrun else None,
        }

    elif role == Role.PAYROLL_OFFICER:
        pending_leaves = len(session.exec(
            select(LeaveRequest).where(LeaveRequest.status == LeaveStatus.PENDING)
        ).all())
        payruns = session.exec(select(Payrun)).all()
        payslip_count = len(session.exec(select(Payslip)).all())
        return {
            "role": role.value,
            "pending_leaves": pending_leaves,
            "total_payruns": len(payruns),
            "payslip_count": payslip_count,
        }

    else:  # Employee
        emp = session.exec(
            select(Employee).where(Employee.user_id == current_user.id)
        ).first()
        if not emp:
            return {"role": role.value, "error": "Employee record not found"}

        month = today.month
        year = today.year
        monthly_att = session.exec(
            select(Attendance).where(
                Attendance.employee_id == emp.id,
            )
        ).all()
        monthly_att = [r for r in monthly_att if r.date.month == month and r.date.year == year]

        return {
            "role": role.value,
            "days_present": sum(1 for r in monthly_att if r.status == AttendanceStatus.PRESENT),
            "days_on_leave": sum(1 for r in monthly_att if r.status == AttendanceStatus.ON_LEAVE),
            "days_absent": sum(1 for r in monthly_att if r.status == AttendanceStatus.ABSENT),
            "today_checked_in": any(r.date == today and r.check_in for r in monthly_att),
        }


@router.get("/attendance-monthly")
def attendance_monthly(
    month: int = Query(..., ge=1, le=12),
    year: int = Query(...),
    session: Session = Depends(get_session),
    current_user: User = Depends(require_role([Role.ADMIN, Role.HR_OFFICER, Role.PAYROLL_OFFICER])),
):
    records = session.exec(select(Attendance)).all()
    monthly = [r for r in records if r.date.month == month and r.date.year == year]
    
    # Group by week
    from datetime import timedelta
    import calendar
    start = date(year, month, 1)
    end = date(year, month, calendar.monthrange(year, month)[1])
    
    weeks = []
    week_start = start
    while week_start <= end:
        week_end = min(week_start + timedelta(days=6), end)
        week_records = [r for r in monthly if week_start <= r.date <= week_end]
        weeks.append({
            "week": f"{week_start.strftime('%b %d')}–{week_end.strftime('%d')}",
            "present": sum(1 for r in week_records if r.status == AttendanceStatus.PRESENT),
            "absent": sum(1 for r in week_records if r.status == AttendanceStatus.ABSENT),
            "on_leave": sum(1 for r in week_records if r.status == AttendanceStatus.ON_LEAVE),
        })
        week_start += timedelta(days=7)
    return {"weeks": weeks}


@router.get("/leave-distribution")
def leave_distribution(
    session: Session = Depends(get_session),
    current_user: User = Depends(require_role([Role.ADMIN, Role.HR_OFFICER])),
):
    leave_types = session.exec(select(LeaveType)).all()
    requests = session.exec(
        select(LeaveRequest).where(LeaveRequest.status == LeaveStatus.APPROVED)
    ).all()
    
    distribution = []
    for lt in leave_types:
        count = sum(1 for r in requests if r.leave_type_id == lt.id)
        distribution.append({"leave_type": lt.name, "count": count})
    return {"distribution": distribution}
