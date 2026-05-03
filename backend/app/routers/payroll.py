"""Payroll router — salary config, payruns, payslips"""
import uuid
import calendar
from typing import List, Optional
from datetime import date, datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.database import get_session
from app.models.user import User, Role
from app.models.employee import Employee
from app.models.attendance import Attendance, AttendanceStatus
from app.models.leave import LeaveRequest, LeaveStatus, LeaveType
from app.models.payroll import (
    SalaryConfig, SalaryConfigCreate, SalaryConfigRead,
    Payrun, PayrunCreate, PayrunRead, PayrunStatus,
    Payslip, PayslipRead,
)
from app.dependencies.auth import get_current_user
from app.dependencies.roles import require_role
from app.utils.payroll_calc import calculate_payslip

router = APIRouter()

PAYROLL_ROLES = [Role.ADMIN, Role.PAYROLL_OFFICER]
ALL_ROLES = [Role.ADMIN, Role.HR_OFFICER, Role.PAYROLL_OFFICER, Role.EMPLOYEE]


# ─── Salary Config ─────────────────────────────────────────────────────────────

@router.get("/salary-config/{employee_id}", response_model=SalaryConfigRead)
def get_salary_config(
    employee_id: uuid.UUID,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_role(PAYROLL_ROLES)),
):
    config = session.exec(
        select(SalaryConfig).where(SalaryConfig.employee_id == employee_id)
    ).first()
    if not config:
        raise HTTPException(status_code=404, detail="Salary config not found")
    return config


@router.post("/salary-config", response_model=SalaryConfigRead, status_code=status.HTTP_201_CREATED)
def upsert_salary_config(
    payload: SalaryConfigCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_role(PAYROLL_ROLES)),
):
    existing = session.exec(
        select(SalaryConfig).where(SalaryConfig.employee_id == payload.employee_id)
    ).first()
    if existing:
        for k, v in payload.dict(exclude_unset=True).items():
            setattr(existing, k, v)
        config = existing
    else:
        config = SalaryConfig(**payload.dict())
    session.add(config)
    session.commit()
    session.refresh(config)
    return config


# ─── Payruns ───────────────────────────────────────────────────────────────────

@router.get("/payruns", response_model=List[PayrunRead])
def list_payruns(
    session: Session = Depends(get_session),
    current_user: User = Depends(require_role(PAYROLL_ROLES)),
):
    return session.exec(select(Payrun)).all()


@router.post("/payruns", response_model=PayrunRead, status_code=status.HTTP_201_CREATED)
def create_payrun(
    payload: PayrunCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_role(PAYROLL_ROLES)),
):
    # Check uniqueness
    existing = session.exec(
        select(Payrun).where(
            Payrun.month == payload.month,
            Payrun.year == payload.year,
        )
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="Payrun already exists for this month/year")

    # Get all active employees
    employees = session.exec(select(Employee).where(Employee.is_active == True)).all()
    if not employees:
        raise HTTPException(status_code=400, detail="No active employees found")

    # Working days in the month (Mon–Fri)
    working_days = sum(
        1 for day in range(1, calendar.monthrange(payload.year, payload.month)[1] + 1)
        if date(payload.year, payload.month, day).weekday() < 5
    )

    # Create payrun record
    payrun = Payrun(
        month=payload.month,
        year=payload.year,
        status=PayrunStatus.PROCESSING,
        created_by=current_user.id,
    )
    session.add(payrun)
    session.flush()  # get payrun.id before creating payslips

    # Calculate payslip for each employee
    for emp in employees:
        config = session.exec(
            select(SalaryConfig).where(SalaryConfig.employee_id == emp.id)
        ).first()
        if not config:
            print(f"Skipping employee {emp.employee_code}: No salary config found")
            continue

        # Count attendance for this month - OPTIMIZED: Filter by date in SQL
        month_start = date(payload.year, payload.month, 1)
        _, last_day = calendar.monthrange(payload.year, payload.month)
        month_end = date(payload.year, payload.month, last_day)

        monthly_att = session.exec(
            select(Attendance).where(
                Attendance.employee_id == emp.id,
                Attendance.date >= month_start,
                Attendance.date <= month_end,
            )
        ).all()
        
        # Handling Half-Days (0.5 present)
        days_present = sum(1 for r in monthly_att if r.status == AttendanceStatus.PRESENT)
        days_half_day = sum(1 for r in monthly_att if r.status == AttendanceStatus.HALF_DAY)
        days_on_leave = sum(1 for r in monthly_att if r.status == AttendanceStatus.ON_LEAVE)
        
        # Effective present days
        effective_present = days_present + (days_half_day * 0.5)

        # Determine paid vs unpaid leave days
        approved_requests = session.exec(
            select(LeaveRequest).where(
                LeaveRequest.employee_id == emp.id,
                LeaveRequest.status == LeaveStatus.APPROVED,
                LeaveRequest.to_date >= month_start,
                LeaveRequest.from_date <= month_end,
            )
        ).all()
        
        unpaid_leave_days = 0.0
        for req in approved_requests:
            lt = session.get(LeaveType, req.leave_type_id)
            if lt and not lt.is_paid:
                from_d = max(req.from_date, month_start)
                to_d = min(req.to_date, month_end)
                if from_d <= to_d:
                    unpaid_leave_days += (to_d - from_d).days + 1
        
        # Add half-day unpaid portion if no corresponding leave request
        # (Simplified: if you are half-day and didn't apply for half-day paid leave, it's 0.5 unpaid)
        unpaid_leave_days += (days_half_day * 0.5)

        result = calculate_payslip(
            basic=config.basic,
            hra=config.hra,
            other_allowances=config.other_allowances,
            pf_rate=config.pf_rate,
            prof_tax=config.professional_tax,
            total_working_days=working_days,
            unpaid_leave_days=unpaid_leave_days,
        )

        payslip = Payslip(
            payrun_id=payrun.id,
            employee_id=emp.id,
            basic=result.basic,
            hra=result.hra,
            other_allowances=result.other_allowances,
            gross=result.gross,
            pf_deduction=result.pf_deduction,
            prof_tax=result.prof_tax,
            leave_deduction=result.leave_deduction,
            net_pay=result.net_pay,
            working_days=working_days,
            days_present=effective_present,
            days_on_leave=days_on_leave,
            unpaid_days=unpaid_leave_days,
        )
        session.add(payslip)

    payrun.status = PayrunStatus.PROCESSED
    payrun.processed_at = datetime.utcnow()
    session.add(payrun)
    session.commit()
    session.refresh(payrun)
    return payrun


# ─── Payslips ──────────────────────────────────────────────────────────────────

@router.get("/payslips", response_model=List[PayslipRead])
def list_payslips(
    employee_id: Optional[uuid.UUID] = None,
    month: Optional[int] = None,
    year: Optional[int] = None,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    # Role-based access control
    if current_user.role == Role.EMPLOYEE:
        emp = session.exec(
            select(Employee).where(Employee.user_id == current_user.id)
        ).first()
        if not emp:
            raise HTTPException(status_code=403, detail="Employee record not found")
        
        # Employees can only see their own payslips
        if employee_id and employee_id != emp.id:
            raise HTTPException(status_code=403, detail="Access denied")
        employee_id = emp.id

    # Build query
    statement = select(Payslip)
    if employee_id:
        statement = statement.where(Payslip.employee_id == employee_id)
    
    if month or year:
        payrun_stmt = select(Payrun.id)
        if month:
            payrun_stmt = payrun_stmt.where(Payrun.month == month)
        if year:
            payrun_stmt = payrun_stmt.where(Payrun.year == year)
        
        payrun_ids = session.exec(payrun_stmt).all()
        statement = statement.where(Payslip.payrun_id.in_(payrun_ids))

    payslips_raw = session.exec(statement).all()

    # Enrich payslips with payrun month/year
    result = []
    for ps in payslips_raw:
        payrun = session.get(Payrun, ps.payrun_id)
        ps_dict = ps.dict()
        ps_dict["payrun_month"] = payrun.month if payrun else 0
        ps_dict["payrun_year"] = payrun.year if payrun else 0
        result.append(PayslipRead(**ps_dict))
    
    return result


@router.get("/payslips/{employee_id}", response_model=List[PayslipRead])
def get_payslips_for_employee(
    employee_id: uuid.UUID,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    return list_payslips(employee_id=employee_id, session=session, current_user=current_user)


@router.get("/payslips/detail/{payslip_id}", response_model=PayslipRead)
def get_payslip_detail(
    payslip_id: uuid.UUID,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    payslip = session.get(Payslip, payslip_id)
    if not payslip:
        raise HTTPException(status_code=404, detail="Payslip not found")
    
    # RBAC check
    if current_user.role not in PAYROLL_ROLES:
        # If not Admin/Payroll, must be the owner
        emp = session.exec(select(Employee).where(Employee.user_id == current_user.id)).first()
        if not emp or payslip.employee_id != emp.id:
            raise HTTPException(status_code=403, detail="Access denied")
            
    return payslip
