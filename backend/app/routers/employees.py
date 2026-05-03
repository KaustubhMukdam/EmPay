"""Employees router — CRUD for employee records"""
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import SQLModel, Session, select
from sqlalchemy import or_

from app.database import get_session
from app.models.user import User, Role
from app.models.employee import Employee, EmployeeCreate, EmployeeUpdate, EmployeeRead, EmployeeWithUserRead
from app.dependencies.auth import get_current_user
from app.dependencies.roles import require_role

router = APIRouter()


def _generate_employee_code(user_id: uuid.UUID) -> str:
    return f"EMP-{str(user_id).replace('-', '')[:8].upper()}"


class AvailableUser(SQLModel):
    id: uuid.UUID
    name: str
    email: str
    role: Role


@router.get("", response_model=List[EmployeeWithUserRead])
def list_employees(
    q: Optional[str] = Query(None, min_length=1, max_length=100),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    stmt = (
        select(Employee, User)
        .where(Employee.user_id == User.id)
        .where(Employee.is_active == True)
        .order_by(Employee.created_at.desc())
    )
    if q:
        like_q = f"%{q.strip()}%"
        stmt = stmt.where(
            or_(
                Employee.employee_code.ilike(like_q),
                Employee.department.ilike(like_q),
                Employee.designation.ilike(like_q),
                User.name.ilike(like_q),
                User.email.ilike(like_q),
            )
        )
    
    stmt = stmt.offset(offset).limit(limit)
    rows = session.exec(stmt).all()
    return [
        EmployeeWithUserRead(
            **employee.dict(),
            name=user.name,
            email=user.email,
            role=user.role,
        )
        for employee, user in rows
    ]


@router.get("/{employee_id}", response_model=EmployeeWithUserRead)
def get_employee(
    employee_id: uuid.UUID,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    emp = session.get(Employee, employee_id)
    if not emp or not emp.is_active:
        raise HTTPException(status_code=404, detail="Employee not found")
    user = session.get(User, emp.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found for employee")
    return EmployeeWithUserRead(
        **emp.dict(),
        name=user.name,
        email=user.email,
        role=user.role,
    )


@router.post("", response_model=EmployeeRead, status_code=status.HTTP_201_CREATED)
def create_employee(
    payload: EmployeeCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_role([Role.ADMIN, Role.HR_OFFICER])),
):
    existing_user = session.get(User, payload.user_id)
    if not existing_user:
        raise HTTPException(status_code=404, detail="User not found")
    if not existing_user.is_active:
        raise HTTPException(status_code=400, detail="Cannot create employee for inactive user")

    existing_emp = session.exec(select(Employee).where(Employee.user_id == payload.user_id)).first()
    if existing_emp:
        raise HTTPException(status_code=409, detail="Employee already exists for this user")

    employee_code = payload.employee_code or _generate_employee_code(payload.user_id)
    emp = Employee(
        **payload.dict(exclude={'employee_code'}),
        employee_code=employee_code
    )
    session.add(emp)
    session.commit()
    session.refresh(emp)
    return emp


@router.get("/lookup/available-users", response_model=List[AvailableUser])
def list_available_users(
    q: Optional[str] = Query(None, min_length=1, max_length=100),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    session: Session = Depends(get_session),
    current_user: User = Depends(require_role([Role.ADMIN, Role.HR_OFFICER])),
):
    employee_user_ids = session.exec(select(Employee.user_id)).all()
    stmt = (
        select(User)
        .where(User.is_active == True)
        .where(User.id.notin_(employee_user_ids) if employee_user_ids else True)
        .order_by(User.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    if q:
        like_q = f"%{q.strip()}%"
        stmt = stmt.where(or_(User.name.ilike(like_q), User.email.ilike(like_q)))
    users = session.exec(stmt).all()
    return [
        AvailableUser(id=user.id, name=user.name, email=user.email, role=user.role)
        for user in users
    ]


@router.put("/{employee_id}", response_model=EmployeeRead)
def update_employee(
    employee_id: uuid.UUID,
    payload: EmployeeUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_role([Role.ADMIN, Role.HR_OFFICER])),
):
    emp = session.get(Employee, employee_id)
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    for key, val in payload.dict(exclude_unset=True).items():
        setattr(emp, key, val)
    session.add(emp)
    session.commit()
    session.refresh(emp)
    return emp


@router.delete("/{employee_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_employee(
    employee_id: uuid.UUID,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_role([Role.ADMIN])),
):
    emp = session.get(Employee, employee_id)
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    emp.is_active = False  # soft delete
    user = session.get(User, emp.user_id)
    if user:
        user.is_active = False
        session.add(user)
    session.add(emp)
    session.commit()
