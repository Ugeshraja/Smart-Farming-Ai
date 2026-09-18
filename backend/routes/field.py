"""
SmartFarm AI - Field Profile Route
Endpoints for retrieving and updating the authenticated farmer's field profile.
Guarantees multi-user data isolation: every operation requires authentication
and operates strictly on the authenticated user's field record.
"""

from typing import Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from sqlalchemy import select

from models.field import FieldProfile, FieldProfileUpdate
from services.supabase_auth_service import supabase_auth_service
from services.field_evaluator import evaluate_field_suitability
from database.session import get_db
from database.models import FieldRecord, User

router = APIRouter(prefix="/field", tags=["My Field Profile"])
security = HTTPBearer(auto_error=False)


async def get_authenticated_user_id(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> str:
    """
    Extracts canonical authenticated user_id (Supabase Auth UID) from verified Bearer token.
    Raises 401 Unauthorized if no credentials provided or token is invalid.
    """
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required to access field profile.",
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

    return str(payload["sub"])


@router.get("", response_model=Dict[str, Any])
@router.get("/", response_model=Dict[str, Any])
async def get_field_profile(
    user_id: str = Depends(get_authenticated_user_id),
    db: Optional[Session] = Depends(get_db)
):
    """
    Retrieves the field profile for the current authenticated farmer,
    and dynamically calculates the authoritative agronomic suitability assessment.
    Enforces user isolation: only retrieves the record belonging to authenticated user_id.
    """
    profile = None

    if db is not None:
        try:
            stmt = select(FieldRecord).where(FieldRecord.user_id == user_id)
            record = db.execute(stmt).scalar_one_or_none()
            if record:
                profile = {
                    "crop_type": record.crop_type,
                    "soil_type": record.soil_type,
                    "soil_ph": record.soil_ph,
                    "water_capacity": record.water_capacity,
                    "field_size": record.field_size,
                    "field_size_unit": record.field_size_unit,
                    "npk_nitrogen": record.npk_nitrogen,
                    "npk_phosphorus": record.npk_phosphorus,
                    "npk_potassium": record.npk_potassium,
                    "sowing_date": record.sowing_date,
                    "irrigation_method": record.irrigation_method,
                    "field_location": record.field_location,
                    "season": record.season
                }
        except Exception as e:
            profile = None

    # If the user has no saved field yet, return independent default initial profile
    if not profile:
        profile = {
            "crop_type": "Tomato",
            "soil_type": "Loamy",
            "soil_ph": 6.5,
            "water_capacity": "70%",
            "field_size": 2.0,
            "field_size_unit": "Acre",
            "npk_nitrogen": 80,
            "npk_phosphorus": 40,
            "npk_potassium": 40,
            "sowing_date": "2026-06-15",
            "irrigation_method": "Drip",
            "field_location": "Tamil Nadu",
            "season": "Kharif"
        }

    clean_field = {k: v for k, v in profile.items() if k != "assessment"}
    assessment = evaluate_field_suitability(clean_field)

    return {
        **clean_field,
        "field": clean_field,
        "assessment": assessment
    }


@router.put("", response_model=Dict[str, Any])
@router.put("/", response_model=Dict[str, Any])
async def update_field_profile(
    payload: FieldProfileUpdate,
    user_id: str = Depends(get_authenticated_user_id),
    db: Optional[Session] = Depends(get_db)
):
    """
    Updates or creates the field profile for the current authenticated farmer.
    Persists field parameters in PostgreSQL and returns the authoritative dynamic assessment.
    """
    try:
        data = payload.model_dump(exclude_unset=True)

        if db is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Database connection is unavailable."
            )

        # Ensure user record exists in public.users to satisfy foreign key constraint
        user_rec = db.execute(select(User).where(User.user_id == user_id)).scalar_one_or_none()
        if not user_rec:
            user_rec = User(
                id=user_id,
                user_id=user_id,
                email=f"user_{user_id[:8]}@smartfarm.local",
                name="Farmer",
                preferred_language="en"
            )
            db.add(user_rec)
            db.flush()

        stmt = select(FieldRecord).where(FieldRecord.user_id == user_id)
        record = db.execute(stmt).scalar_one_or_none()
        if not record:
            record = FieldRecord(user_id=user_id)
            db.add(record)

        for k, v in data.items():
            if hasattr(record, k):
                setattr(record, k, v)

        db.flush()
        clean_field = {
            "crop_type": record.crop_type,
            "soil_type": record.soil_type,
            "soil_ph": record.soil_ph,
            "water_capacity": record.water_capacity,
            "field_size": record.field_size,
            "field_size_unit": record.field_size_unit,
            "npk_nitrogen": record.npk_nitrogen,
            "npk_phosphorus": record.npk_phosphorus,
            "npk_potassium": record.npk_potassium,
            "sowing_date": record.sowing_date,
            "irrigation_method": record.irrigation_method,
            "field_location": record.field_location,
            "season": record.season
        }

        assessment = evaluate_field_suitability(clean_field)

        return {
            **clean_field,
            "field": clean_field,
            "assessment": assessment
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update field profile: {str(e)}"
        )


@router.post("/evaluate", response_model=Dict[str, Any])
async def evaluate_field_endpoint(payload: Dict[str, Any]):
    """
    On-the-fly agronomic suitability evaluation without saving to database.
    """
    clean_field = {k: v for k, v in payload.items() if k != "assessment"}
    assessment = evaluate_field_suitability(clean_field)
    return {
        "assessment": assessment
    }
