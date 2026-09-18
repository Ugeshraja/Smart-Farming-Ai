from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
from sqlalchemy.orm import Session

from models.user import (
    UserSignUp,
    UserLogin,
    ForgotPasswordRequest,
    UserProfileUpdate,
    UserResponse,
    TokenResponse
)
from services.supabase_auth_service import supabase_auth_service
from database.session import get_db

router = APIRouter(prefix="/auth", tags=["Authentication & Profile"])
security = HTTPBearer(auto_error=False)


async def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> dict:
    """
    Dependency to verify JWT / Bearer token and return current authenticated user profile.
    Derives canonical user identity strictly from verified token (sub = Supabase Auth UID).
    """
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    payload = supabase_auth_service.decode_access_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = str(payload["sub"])
    profile = await supabase_auth_service.get_profile(user_id)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User profile could not be found.",
        )

    return profile


@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def signup(payload: UserSignUp, db: Optional[Session] = Depends(get_db)):
    """
    Register a new farmer:
    - Creates authenticated user in Supabase auth.users with standard bcrypt encrypted_password.
    - Saves profile in public.users referenced by the Supabase Auth UID.
    - Returns JWT session token and user profile.
    """
    try:
        token, profile = await supabase_auth_service.signup(payload)
        return TokenResponse(
            access_token=token,
            token_type="bearer",
            user=UserResponse(**profile)
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Registration error: {str(e)}")


@router.post("/login", response_model=TokenResponse)
async def login(payload: UserLogin, db: Optional[Session] = Depends(get_db)):
    """
    Authenticate an existing farmer against Supabase auth.users.
    Returns access token and user profile.
    """
    try:
        token, profile = await supabase_auth_service.login(payload)
        return TokenResponse(
            access_token=token,
            token_type="bearer",
            user=UserResponse(**profile)
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Login error: {str(e)}")


@router.post("/logout")
async def logout():
    """
    Terminates session on backend.
    """
    return {"message": "Logged out successfully."}


@router.post("/forgot-password")
async def forgot_password(payload: ForgotPasswordRequest):
    """
    Initiates password reset flow.
    """
    result = await supabase_auth_service.forgot_password(payload.email)
    return result


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    """
    Protected route: returns profile for currently authenticated farmer.
    """
    return UserResponse(**current_user)


@router.put("/profile", response_model=UserResponse)
async def update_profile(
    payload: UserProfileUpdate,
    current_user: dict = Depends(get_current_user),
    db: Optional[Session] = Depends(get_db)
):
    """
    Protected route: updates profile attributes for authenticated user.
    """
    try:
        updated = await supabase_auth_service.update_profile(current_user["user_id"], payload)
        if not updated:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
        return UserResponse(**updated)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/status")
async def get_auth_service_status():
    """
    Returns current Supabase Auth connectivity status.
    """
    return supabase_auth_service.get_status()
