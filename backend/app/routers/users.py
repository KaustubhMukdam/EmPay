"""Users router — /users (admin role management)"""
import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from app.database import get_session
from app.models.user import User, UserRead, UserRoleUpdate, Role
from app.dependencies.roles import require_role

router = APIRouter()


def _apply_user_role_update(
    user_id: uuid.UUID,
    payload: UserRoleUpdate,
    session: Session,
) -> User:
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.role = payload.role
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


@router.put("/{user_id}/role", response_model=UserRead)
def update_user_role(
    user_id: uuid.UUID,
    payload: UserRoleUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_role([Role.ADMIN])),
):
    return _apply_user_role_update(user_id, payload, session)


@router.post("/{user_id}/role", response_model=UserRead)
def update_user_role_post(
    user_id: uuid.UUID,
    payload: UserRoleUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_role([Role.ADMIN])),
):
    return _apply_user_role_update(user_id, payload, session)
