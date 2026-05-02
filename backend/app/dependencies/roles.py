from typing import List
from fastapi import Depends, HTTPException, status

from app.models.user import User, Role
from app.dependencies.auth import get_current_user


def require_role(allowed_roles: List[Role]):
    """
    FastAPI dependency factory.
    Usage:
        @router.post("/endpoint")
        def handler(current_user = Depends(require_role([Role.ADMIN, Role.HR_OFFICER]))):
            ...
    """
    def checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {[r.value for r in allowed_roles]}",
            )
        return current_user

    return checker
