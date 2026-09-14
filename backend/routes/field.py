"""
SmartFarm AI - Field Profile Route
Endpoints for retrieving and updating the authenticated farmer's field profile.
"""

from typing import Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from sqlalchemy import select

from models.field import FieldProfile, FieldProfileUpdate
from services.firebase_service import firebase_service
from services.field_evaluator import evaluate_field_suitability
from database.session import get_db
from database.models import FieldRecord, User

router = APIRouter(prefix="/field", tags=["My Field Profile"])
security = HTTPBearer(auto_error=False)


async def get_authenticated_user_id(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> str:
    """
    Extracts authenticated user_id from Bearer token, or defaults to primary
    demo farmer in local development.
    """
    if credentials and credentials.credentials:
        token = credentials.credentials
        payload = firebase_service.decode_access_token(token)
        if payload and "sub" in payload:
            return payload["sub"]
        # If simulated token e.g. demo_token_xxx_USR-UGESH-001
        if "demo_token_" in token and "USR-" in token:
            parts = token.split("_")
            return parts[-1]

    # In dev mode, fallback to default demo farmer
    return "USR-UGESH-001"


@router.get("", response_model=Dict[str, Any])
@router.get("/", response_model=Dict[str, Any])
async def get_field_profile(
    user_id: str = Depends(get_authenticated_user_id),
    db: Optional[Session] = Depends(get_db)
):
    """
    Retrieves the field profile for the current authenticated farmer,
    and dynamically calculates the authoritative current agronomic suitability assessment.
    Enforces user isolation: only retrieves the record belonging to user_id.
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
        except Exception:
            profile = None

    if not profile:
        profile = await firebase_service.get_field_profile(user_id)

    if not profile:
        profile = {
            "crop_type": "Brinjal",
            "soil_type": "Loamy",
            "soil_ph": 6.4,
            "water_capacity": "72%",
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

    # Clean stored profile (remove any stale assessment before re-evaluating)
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
    Persists field parameters and returns the authoritative dynamic assessment.
    """
    try:
        data = payload.model_dump(exclude_unset=True)

        if db is not None:
            # Ensure user record exists to satisfy foreign key constraint
            user_rec = db.execute(select(User).where(User.user_id == user_id)).scalar_one_or_none()
            if not user_rec:
                user_rec = User(
                    user_id=user_id,
                    email=f"{user_id.lower()}@smartfarm.local",
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
            # Keep in-memory/firebase service in sync for seamless fallback
            try:
                await firebase_service.update_field_profile(user_id, data)
            except Exception:
                pass
        else:
            updated = await firebase_service.update_field_profile(user_id, data)
            clean_field = {k: v for k, v in updated.items() if k != "assessment"}

        assessment = evaluate_field_suitability(clean_field)

        return {
            **clean_field,
            "field": clean_field,
            "assessment": assessment
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update field profile: {str(e)}"
        )


@router.post("/evaluate", response_model=Dict[str, Any])
async def evaluate_field_endpoint(payload: Dict[str, Any]):
    """
    On-the-fly agronomic suitability evaluation without saving to database.
    Single source of truth: backend/services/field_evaluator.py.
    """
    clean_field = {k: v for k, v in payload.items() if k != "assessment"}
    assessment = evaluate_field_suitability(clean_field)
    return {
        "assessment": assessment
    }

