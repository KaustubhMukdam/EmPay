"""Employees router — CRUD for employee records"""
import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.database import get_session
from app.models.user import User, Role
from app.models.employee import Employee, EmployeeCreate, EmployeeUpdate, EmployeeRead
from app.dependencies.auth import get_current_user
from app.dependencies.roles import require_role

router = APIRouter()


@router.get("", response_model=List[EmployeeRead])
def list_employees(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    return session.exec(select(Employee)).all()


@router.get("/{employee_id}", response_model=EmployeeRead)
def get_employee(
    employee_id: uuid.UUID,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    emp = session.get(Employee, employee_id)
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    return emp


@router.post("", response_model=EmployeeRead, status_code=status.HTTP_201_CREATED)
def create_employee(
    payload: EmployeeCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_role([Role.ADMIN, Role.HR_OFFICER])),
):
    emp = Employee(**payload.dict())
    session.add(emp)
    session.commit()
    session.refresh(emp)
    return emp


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
    session.add(emp)
    session.commit()
