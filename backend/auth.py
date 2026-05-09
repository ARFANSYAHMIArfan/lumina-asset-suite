"""
Lumina Asset Suite - Auth dependency for FastAPI
Verifies Supabase JWT and extracts user info.
"""
from fastapi import Header, HTTPException, status
from typing import Optional
from supabase_client import get_admin_client


async def get_current_user(authorization: Optional[str] = Header(None)) -> dict:
    """
    FastAPI dependency that validates Supabase JWT and returns the user.
    Expects: Authorization: Bearer <access_token>
    """
    if not authorization or not authorization.startswith('Bearer '):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid Authorization header",
        )

    token = authorization.split(' ', 1)[1].strip()
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Empty access token",
        )

    try:
        admin = get_admin_client()
        # Use the admin client to validate the user token
        user_response = admin.auth.get_user(token)
        if user_response is None or user_response.user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token",
            )
        user = user_response.user
        return {
            "id": user.id,
            "email": user.email,
            "access_token": token,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token validation failed: {str(e)}",
        )
