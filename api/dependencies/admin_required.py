from fastapi import Depends, HTTPException, status
from .auth import get_current_user
from models import User

def admin_required(current_user: User = Depends(get_current_user)):
    """
    Dependency to ensure the user has admin privileges.
    Raises 403 Forbidden if not an admin.
    """
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user
