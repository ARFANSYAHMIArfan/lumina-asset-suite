"""
Lumina Asset Suite - Auth routes
"""
from fastapi import APIRouter, HTTPException, Depends, status
from models import SignupRequest, LoginRequest, AuthResponse
from supabase_client import get_admin_client, get_anon_client
from auth import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup", response_model=AuthResponse)
async def signup(req: SignupRequest):
    """Create a new user account (auto-confirms email so user can log in immediately)."""
    admin = get_admin_client()
    anon = get_anon_client()
    try:
        # Use admin API to create user with email auto-confirmed
        create_resp = admin.auth.admin.create_user({
            "email": req.email,
            "password": req.password,
            "email_confirm": True,
        })
        if create_resp.user is None:
            raise HTTPException(status_code=400, detail="Failed to create user")

        # Login immediately to obtain session
        login_resp = anon.auth.sign_in_with_password({
            "email": req.email,
            "password": req.password,
        })
        if login_resp.session is None or login_resp.user is None:
            raise HTTPException(status_code=400, detail="Account created but login failed")

        return AuthResponse(
            user_id=login_resp.user.id,
            email=login_resp.user.email,
            access_token=login_resp.session.access_token,
            refresh_token=login_resp.session.refresh_token,
        )
    except HTTPException:
        raise
    except Exception as e:
        msg = str(e)
        if "already" in msg.lower() or "registered" in msg.lower() or "exists" in msg.lower():
            raise HTTPException(status_code=409, detail="Email already registered")
        raise HTTPException(status_code=400, detail=msg)


@router.post("/login", response_model=AuthResponse)
async def login(req: LoginRequest):
    """Login with email/password."""
    anon = get_anon_client()
    try:
        login_resp = anon.auth.sign_in_with_password({
            "email": req.email,
            "password": req.password,
        })
        if login_resp.session is None or login_resp.user is None:
            raise HTTPException(status_code=401, detail="Invalid email or password")
        return AuthResponse(
            user_id=login_resp.user.id,
            email=login_resp.user.email,
            access_token=login_resp.session.access_token,
            refresh_token=login_resp.session.refresh_token,
        )
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid email or password")


@router.get("/me")
async def me(current_user: dict = Depends(get_current_user)):
    return {
        "user_id": current_user["id"],
        "email": current_user["email"],
    }


@router.post("/logout")
async def logout(current_user: dict = Depends(get_current_user)):
    # Stateless JWT - logout is client-side. Just confirm token was valid.
    return {"message": "Logged out"}
