"""Leave router — types, allocations, requests, approve/reject"""
import uuid
from typing import List
from datetime import date, datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.database import get_session
from app.models.user import User, Role
from app.models.employee import Employee
from app.models.attendance import Attendance, AttendanceStatus
from app.models.leave import (
    LeaveType, LeaveTypeCreate, LeaveTypeRead,
    LeaveAllocation, LeaveAllocationCreate, LeaveAllocationRead,
    LeaveRequest, LeaveRequestCreate, LeaveRequestRead, LeaveStatus,
)
from app.dependencies.auth import get_current_user
from app.dependencies.roles import require_role

router = APIRouter()

ALL_ROLES = [Role.ADMIN, Role.HR_OFFICER, Role.PAYROLL_OFFICER, Role.EMPLOYEE]
APPROVER_ROLES = [Role.ADMIN, Role.PAYROLL_OFFICER]
HR_ROLES = [Role.ADMIN, Role.HR_OFFICER]


def _get_employee_for_user(user_id: uuid.UUID, session: Session) -> Employee:
    emp = session.exec(select(Employee).where(Employee.user_id == user_id)).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee record not found for this user")
    return emp


# ─── Leave Types ──────────────────────────────────────────────────────────────

@router.get("/types", response_model=List[LeaveTypeRead])
def list_leave_types(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    return session.exec(select(LeaveType)).all()


@router.post("/types", response_model=LeaveTypeRead, status_code=status.HTTP_201_CREATED)
def create_leave_type(
    payload: LeaveTypeCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_role(HR_ROLES)),
):
    lt = LeaveType(**payload.dict(), created_by=current_user.id)
    session.add(lt)
    session.commit()
    session.refresh(lt)
    return lt


# ─── Leave Allocations ────────────────────────────────────────────────────────

@router.get("/allocations/my", response_model=List[LeaveAllocationRead])
def my_allocations(
    session: Session = Depends(get_session),
    current_user: User = Depends(require_role(ALL_ROLES)),
):
    emp = _get_employee_for_user(current_user.id, session)
    return session.exec(
        select(LeaveAllocation).where(LeaveAllocation.employee_id == emp.id)
    ).all()


@router.post("/allocations", response_model=LeaveAllocationRead, status_code=status.HTTP_201_CREATED)
def create_allocation(
    payload: LeaveAllocationCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_role(HR_ROLES)),
):
    alloc = LeaveAllocation(**payload.dict())
    session.add(alloc)
    session.commit()
    session.refresh(alloc)
    return alloc


# ─── Leave Requests ───────────────────────────────────────────────────────────

@router.get("/requests/my", response_model=List[LeaveRequestRead])
def my_requests(
    session: Session = Depends(get_session),
    current_user: User = Depends(require_role(ALL_ROLES)),
):
    emp = _get_employee_for_user(current_user.id, session)
    return session.exec(
        select(LeaveRequest).where(LeaveRequest.employee_id == emp.id)
    ).all()


@router.post("/requests", response_model=LeaveRequestRead, status_code=status.HTTP_201_CREATED)
def apply_for_leave(
    payload: LeaveRequestCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_role(ALL_ROLES)),
):
    emp = _get_employee_for_user(current_user.id, session)
    
    # Calculate total days
    delta = (payload.to_date - payload.from_date).days + 1
    if delta <= 0:
        raise HTTPException(status_code=400, detail="Invalid date range")

    # Check leave balance
    current_year = payload.from_date.year
    alloc = session.exec(
        select(LeaveAllocation).where(
            LeaveAllocation.employee_id == emp.id,
            LeaveAllocation.leave_type_id == payload.leave_type_id,
            LeaveAllocation.year == current_year,
        )
    ).first()
    if alloc:
        remaining = alloc.total_days - alloc.used_days
        leave_type = session.get(LeaveType, payload.leave_type_id)
        if leave_type and leave_type.is_paid and remaining < delta:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient leave balance. Remaining: {remaining} days",
            )

    request = LeaveRequest(
        employee_id=emp.id,
        leave_type_id=payload.leave_type_id,
        from_date=payload.from_date,
        to_date=payload.to_date,
        total_days=delta,
        reason=payload.reason,
    )
    session.add(request)
    session.commit()
    session.refresh(request)
    return request


@router.get("/requests/all", response_model=List[LeaveRequestRead])
def all_requests(
    session: Session = Depends(get_session),
    current_user: User = Depends(require_role(APPROVER_ROLES)),
):
    return session.exec(select(LeaveRequest)).all()


@router.patch("/requests/{request_id}/approve", response_model=LeaveRequestRead)
def approve_leave(
    request_id: uuid.UUID,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_role(APPROVER_ROLES)),
):
    req = session.get(LeaveRequest, request_id)
    if not req:
        raise HTTPException(status_code=404, detail="Leave request not found")
    if req.status != LeaveStatus.PENDING:
        raise HTTPException(status_code=400, detail="Request is not pending")

    req.status = LeaveStatus.APPROVED
    req.reviewed_by = current_user.id
    req.reviewed_at = datetime.utcnow()
    session.add(req)

    # Side effect: mark attendance as On Leave for approved dates
    current_date = req.from_date
    while current_date <= req.to_date:
        att = session.exec(
            select(Attendance).where(
                Attendance.employee_id == req.employee_id,
                Attendance.date == current_date,
            )
        ).first()
        if att:
            att.status = AttendanceStatus.ON_LEAVE
        else:
            att = Attendance(
                employee_id=req.employee_id,
                date=current_date,
                status=AttendanceStatus.ON_LEAVE,
            )
        session.add(att)
        from datetime import timedelta
        current_date += timedelta(days=1)

    # Decrement leave balance
    year = req.from_date.year
    alloc = session.exec(
        select(LeaveAllocation).where(
            LeaveAllocation.employee_id == req.employee_id,
            LeaveAllocation.leave_type_id == req.leave_type_id,
            LeaveAllocation.year == year,
        )
    ).first()
    if alloc:
        alloc.used_days += req.total_days
        session.add(alloc)

    session.commit()
    session.refresh(req)
    return req


@router.patch("/requests/{request_id}/reject", response_model=LeaveRequestRead)
def reject_leave(
    request_id: uuid.UUID,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_role(APPROVER_ROLES)),
):
    req = session.get(LeaveRequest, request_id)
    if not req:
        raise HTTPException(status_code=404, detail="Leave request not found")
    if req.status != LeaveStatus.PENDING:
        raise HTTPException(status_code=400, detail="Request is not pending")

    req.status = LeaveStatus.REJECTED
    req.reviewed_by = current_user.id
    req.reviewed_at = datetime.utcnow()
    session.add(req)
    session.commit()
    session.refresh(req)
    return req
