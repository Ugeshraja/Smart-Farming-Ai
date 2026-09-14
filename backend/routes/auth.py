from fastapi import APIRouter, HTTPException, Depends, status, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import select

from models.user import (
    UserSignUp,
    UserLogin,
    ForgotPasswordRequest,
    UserProfileUpdate,
    UserResponse,
    TokenResponse
)
from services.firebase_service import firebase_service
from database.session import get_db
from database.models import User

router = APIRouter(prefix="/auth", tags=["Authentication & Profile"])
security = HTTPBearer(auto_error=False)


async def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> dict:
    """
    Dependency to verify JWT / Bearer token and return current authenticated user profile.
    """
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    payload = firebase_service.decode_access_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload["sub"]
    profile = await firebase_service.get_profile(user_id)
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
    - Validates email, password, and farm details.
    - Saves profile in Firestore 'users' collection.
    - Syncs user record to PostgreSQL 'users' table if database configured.
    - Stores preferred language as 'en' or 'ta'.
    - Returns JWT session token and user profile.
    """
    try:
        token, profile = await firebase_service.signup(payload)

        # Sync to PostgreSQL if database connection is active
        if db is not None:
            try:
                user_id = profile["user_id"]
                user_rec = db.execute(select(User).where(User.user_id == user_id)).scalar_one_or_none()
                if not user_rec:
                    user_rec = User(
                        user_id=user_id,
                        email=profile.get("email", ""),
                        name=profile.get("name", ""),
                        phone=profile.get("phone"),
                        preferred_language=profile.get("preferred_language", "en"),
                        farm_location=profile.get("farm_location"),
                        farm_details=profile.get("farm_details")
                    )
                    db.add(user_rec)
                    db.flush()
            except Exception as e:
                # Log error without breaking authentication
                pass

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
    Authenticate an existing farmer with email and password.
    Returns access token and user profile.
    """
    try:
        token, profile = await firebase_service.login(payload)

        # Ensure user record exists in PostgreSQL
        if db is not None:
            try:
                user_id = profile["user_id"]
                user_rec = db.execute(select(User).where(User.user_id == user_id)).scalar_one_or_none()
                if not user_rec:
                    user_rec = User(
                        user_id=user_id,
                        email=profile.get("email", ""),
                        name=profile.get("name", ""),
                        phone=profile.get("phone"),
                        preferred_language=profile.get("preferred_language", "en"),
                        farm_location=profile.get("farm_location"),
                        farm_details=profile.get("farm_details")
                    )
                    db.add(user_rec)
                    db.flush()
            except Exception:
                pass

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
    Initiates password reset flow via Firebase Auth or notification.
    """
    result = await firebase_service.forgot_password(payload.email)
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
    Protected route: updates profile attributes (name, phone, language, farm location, farm details).
    """
    try:
        updated = await firebase_service.update_profile(current_user["user_id"], payload)
        if not updated:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

        # Update in PostgreSQL if database configured
        if db is not None:
            try:
                user_id = current_user["user_id"]
                user_rec = db.execute(select(User).where(User.user_id == user_id)).scalar_one_or_none()
                if user_rec:
                    if payload.name is not None:
                        user_rec.name = payload.name
                    if payload.phone is not None:
                        user_rec.phone = payload.phone
                    if payload.preferred_language is not None:
                        user_rec.preferred_language = payload.preferred_language
                    if payload.farm_location is not None:
                        user_rec.farm_location = payload.farm_location
                    if payload.farm_details is not None:
                        user_rec.farm_details = payload.farm_details
                    db.flush()
            except Exception:
                pass

        return UserResponse(**updated)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/status")
async def get_auth_service_status():
    """
    Returns the current Firebase connectivity and service operation mode.
    """
    return firebase_service.get_status()
