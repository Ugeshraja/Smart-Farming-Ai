"""
SmartFarm AI - Prediction & AI Reports Route
Endpoints:
  POST   /api/predict          - Full AI inference pipeline with optional persistence
  POST   /api/predictions      - Persist user prediction & report
  GET    /api/predictions      - Retrieve prediction history for authenticated user only
  GET    /api/predictions/{id} - Retrieve single prediction with ownership verification
  DELETE /api/predictions/{id} - Delete prediction with ownership verification
  GET    /api/reports          - Retrieve AI reports for authenticated user only
  GET    /api/reports/{id}     - Retrieve AI report by prediction_id or report_id with ownership verification
"""

import logging
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status, Depends, Body
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from sqlalchemy import select, delete

from services.ai_pipeline_service import ai_pipeline_service
from services.supabase_auth_service import supabase_auth_service
from database.session import get_db
from database.models import DiseasePredictionRecord, AiReportRecord, User

logger = logging.getLogger("smartfarm.predict_route")
logger.setLevel(logging.INFO)

router = APIRouter(tags=["AI Model Inference & Crop Disease Detection"])
security = HTTPBearer(auto_error=False)

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
ALLOWED_CONTENT_TYPES = {
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "application/octet-stream"
}


def get_current_user_id(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> str:
    """
    Extracts canonical authenticated user_id (Supabase Auth UID) from Bearer token.
    Raises 401 if missing or invalid.
    """
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials required.",
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


def get_optional_user_id(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> Optional[str]:
    """Optional extraction of user_id for public endpoints that track history if logged in."""
    if not credentials or not credentials.credentials:
        return None
    payload = supabase_auth_service.decode_access_token(credentials.credentials)
    if payload and "sub" in payload:
        return str(payload["sub"])
    return None


@router.post("/predict")
async def predict_crop_disease(
    image: UploadFile = File(..., description="Uploaded crop leaf image (JPG, PNG, WEBP)"),
    crop: Optional[str] = Form(None, description="Optional crop hint (e.g. Tomato, Potato, Brinjal)"),
    explain: bool = Form(True, description="Generate LIME textual explanation"),
    advisory: bool = Form(True, description="Generate LLM farmer advisory"),
    user_id: Optional[str] = Depends(get_optional_user_id),
    db: Optional[Session] = Depends(get_db)
):
    """
    Unified multi-stage AI disease detection pipeline:
    1. YOLO11: Leaf localization
    2. SAM ViT-B: Segmentation
    3. ResNet-50: Disease diagnosis
    4. LIME: Feature explanation
    5. RAG: Agricultural knowledge retrieval
    6. Gemini: Actionable advisory
    Persists diagnosis under authenticated user_id when available.
    """
    filename = (image.filename or "").lower()
    ext = "." + filename.split(".")[-1] if "." in filename else ""
    if ext not in ALLOWED_EXTENSIONS and image.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported image format '{ext}'. Please upload a JPG, JPEG, PNG, or WEBP image."
        )

    try:
        image_bytes = await image.read()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to read uploaded image bytes."
        )

    if not image_bytes or len(image_bytes) < 100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded image file is empty or corrupted."
        )

    try:
        result = ai_pipeline_service.predict(image_bytes, crop_hint=crop, explain=explain, advisory=advisory)
    except Exception as e:
        logger.error(f"Inference pipeline error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Disease prediction failed: {str(e)}"
        )

    # If user is authenticated, persist prediction and report associated with this user
    if result.get("success") and user_id and db is not None:
        try:
            # Ensure user exists in public.users to satisfy foreign key
            user_rec = db.execute(select(User).where(User.user_id == user_id)).scalar_one_or_none()
            if not user_rec:
                user_rec = User(id=user_id, user_id=user_id, email=f"user_{user_id[:8]}@smartfarm.local", name="Farmer")
                db.add(user_rec)
                db.flush()

            leaf_url = result.get("leaf_crop_url") or result.get("image_url")
            if not leaf_url and isinstance(result.get("leaf_crop"), dict):
                leaf_url = result.get("leaf_crop", {}).get("image_url")

            lime_exp = result.get("lime_summary")
            if not lime_exp and isinstance(result.get("lime"), dict):
                lime_exp = result.get("lime", {}).get("explanation")

            pred_record = DiseasePredictionRecord(
                user_id=user_id,
                crop=result.get("crop") or crop or "Unknown",
                predicted_disease=result.get("disease"),
                disease_clean=result.get("disease_clean"),
                confidence=float(result.get("confidence", 0.0)) if result.get("confidence") is not None else None,
                confidence_percent=float(result.get("confidence_percent", 0.0)) if result.get("confidence_percent") is not None else None,
                status=result.get("status", "success"),
                model_used=result.get("model_used") or "ResNet-50",
                image_url=leaf_url or (result.get("original_image", {}).get("image_url") if isinstance(result.get("original_image"), dict) else None),
                leaf_crop_url=leaf_url,
                top3_predictions=result.get("top3_predictions"),
                lime_summary=lime_exp
            )
            db.add(pred_record)
            db.flush()

            advisory_content = result.get("advisory")
            if advisory_content:
                adv_text = (advisory_content.get("text") or advisory_content.get("advisory_text")) if isinstance(advisory_content, dict) else str(advisory_content)
                rag_content = result.get("rag", {})
                rag_sources_list = rag_content.get("sources") if isinstance(rag_content, dict) else (result.get("rag_sources") or [result.get("rag_context")])
                report_record = AiReportRecord(
                    user_id=user_id,
                    prediction_id=pred_record.id,
                    language="en",
                    report_title=f"AI Advisory: {result.get('disease')}",
                    advisory_text=adv_text,
                    rag_sources=rag_sources_list
                )
                db.add(report_record)
                db.flush()

            result["id"] = pred_record.id
            result["user_id"] = user_id
        except Exception as e:
            logger.warning(f"Failed to persist prediction history in database: {e}")

    return result


@router.post("/predictions", response_model=Dict[str, Any])
async def save_prediction(
    payload: Dict[str, Any] = Body(...),
    user_id: str = Depends(get_current_user_id),
    db: Optional[Session] = Depends(get_db)
):
    """
    Saves or updates a prediction record owned by the authenticated user.
    Enforces user isolation: always sets user_id to the verified token's user_id.
    """
    if db is None:
        raise HTTPException(status_code=500, detail="Database unavailable.")

    # Ensure user exists in public.users
    user_rec = db.execute(select(User).where(User.user_id == user_id)).scalar_one_or_none()
    if not user_rec:
        user_rec = User(id=user_id, user_id=user_id, email=f"user_{user_id[:8]}@smartfarm.local", name="Farmer")
        db.add(user_rec)
        db.flush()

    import uuid
    pred_id = payload.get("id") or f"PRED-{uuid.uuid4().hex[:8].upper()}"
    
    # Check if record already exists for this user
    existing = db.execute(
        select(DiseasePredictionRecord).where(
            DiseasePredictionRecord.id == pred_id,
            DiseasePredictionRecord.user_id == user_id
        )
    ).scalar_one_or_none()

    crop = payload.get("crop") or "Crop"
    disease = payload.get("disease") or payload.get("predicted_disease") or "Healthy"
    disease_clean = payload.get("disease_clean") or disease
    confidence = payload.get("confidence")
    if confidence is not None:
        try:
            confidence = float(confidence)
        except (ValueError, TypeError):
            confidence = None

    image_url = payload.get("imageUrl") or payload.get("image_url")
    leaf_crop_url = payload.get("leaf_crop_url") or payload.get("leaf_crop", {}).get("image_url")

    lime_summary = None
    lime_exp = payload.get("limeExplanation")
    if isinstance(lime_exp, dict):
        lime_summary = lime_exp.get("summary") or lime_exp.get("explanation")
    elif isinstance(lime_exp, str):
        lime_summary = lime_exp

    if existing:
        existing.crop = crop
        existing.predicted_disease = disease
        existing.disease_clean = disease_clean
        existing.confidence = confidence
        existing.image_url = image_url
        existing.leaf_crop_url = leaf_crop_url
        existing.top3_predictions = payload.get("top3Predictions") or payload.get("top3_predictions")
        existing.lime_summary = lime_summary
        record = existing
    else:
        record = DiseasePredictionRecord(
            id=pred_id,
            user_id=user_id,
            crop=crop,
            predicted_disease=disease,
            disease_clean=disease_clean,
            confidence=confidence,
            confidence_percent=confidence if (confidence and confidence > 1.0) else (confidence * 100 if confidence else None),
            status=payload.get("status", "success"),
            model_used=payload.get("model_used", "ResNet-50"),
            image_url=image_url,
            leaf_crop_url=leaf_crop_url,
            top3_predictions=payload.get("top3Predictions") or payload.get("top3_predictions"),
            lime_summary=lime_summary
        )
        db.add(record)

    db.flush()

    # Save associated AI report if advisory exists
    adv = payload.get("advisory")
    adv_text = ""
    if isinstance(adv, dict):
        adv_text = adv.get("text") or adv.get("en") or adv.get("advisory_text") or ""
    elif isinstance(adv, str):
        adv_text = adv

    if adv_text:
        existing_report = db.execute(
            select(AiReportRecord).where(
                AiReportRecord.prediction_id == record.id,
                AiReportRecord.user_id == user_id
            )
        ).scalar_one_or_none()

        if existing_report:
            existing_report.advisory_text = adv_text
        else:
            new_report = AiReportRecord(
                user_id=user_id,
                prediction_id=record.id,
                language="en",
                report_title=f"AI Diagnostic Report: {record.predicted_disease}",
                advisory_text=adv_text,
                rag_sources=payload.get("rag")
            )
            db.add(new_report)

    db.flush()
    return {"success": True, "id": record.id, "prediction": format_prediction_dict(record)}


@router.get("/predictions", response_model=List[Dict[str, Any]])
async def get_prediction_history(
    user_id: str = Depends(get_current_user_id),
    db: Optional[Session] = Depends(get_db)
):
    """
    Retrieves the prediction history belonging strictly to the authenticated user.
    """
    if db is None:
        return []

    stmt = (
        select(DiseasePredictionRecord)
        .where(DiseasePredictionRecord.user_id == user_id)
        .order_by(DiseasePredictionRecord.created_at.desc())
    )
    records = db.execute(stmt).scalars().all()
    return [format_prediction_dict(rec) for rec in records]


@router.get("/predictions/{prediction_id}", response_model=Dict[str, Any])
async def get_prediction_by_id(
    prediction_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Optional[Session] = Depends(get_db)
):
    """
    Retrieves a single prediction by ID.
    Enforces ownership: returns 404 if prediction doesn't exist or belongs to another user.
    """
    if db is None:
        raise HTTPException(status_code=500, detail="Database unavailable.")

    stmt = select(DiseasePredictionRecord).where(
        DiseasePredictionRecord.id == prediction_id,
        DiseasePredictionRecord.user_id == user_id
    )
    record = db.execute(stmt).scalar_one_or_none()
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prediction record not found or access denied."
        )

    return format_prediction_dict(record)


@router.delete("/predictions/{prediction_id}", response_model=Dict[str, Any])
async def delete_prediction(
    prediction_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Optional[Session] = Depends(get_db)
):
    """
    Deletes a single prediction by ID.
    Enforces ownership: only deletes if the record belongs to the authenticated user.
    Returns 404 if the record belongs to someone else or does not exist.
    """
    if db is None:
        raise HTTPException(status_code=500, detail="Database unavailable.")

    stmt = select(DiseasePredictionRecord).where(
        DiseasePredictionRecord.id == prediction_id,
        DiseasePredictionRecord.user_id == user_id
    )
    record = db.execute(stmt).scalar_one_or_none()
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prediction record not found or access denied."
        )

    # Delete associated reports first (or cascade)
    db.execute(delete(AiReportRecord).where(
        AiReportRecord.prediction_id == prediction_id,
        AiReportRecord.user_id == user_id
    ))
    db.delete(record)
    db.flush()

    return {"success": True, "deleted_id": prediction_id}


@router.get("/reports", response_model=List[Dict[str, Any]])
async def get_ai_reports(
    user_id: str = Depends(get_current_user_id),
    db: Optional[Session] = Depends(get_db)
):
    """
    Retrieves all AI diagnostic reports belonging to the authenticated user.
    """
    if db is None:
        return []

    stmt = (
        select(AiReportRecord)
        .where(AiReportRecord.user_id == user_id)
        .order_by(AiReportRecord.created_at.desc())
    )
    records = db.execute(stmt).scalars().all()
    return [rec.to_dict() for rec in records]


@router.get("/reports/{report_id}", response_model=Dict[str, Any])
async def get_ai_report_by_id(
    report_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Optional[Session] = Depends(get_db)
):
    """
    Retrieves an AI report by report ID or prediction ID.
    Enforces ownership: returns 404 if not found or owned by another user.
    """
    if db is None:
        raise HTTPException(status_code=500, detail="Database unavailable.")

    # Check AiReportRecord
    stmt = select(AiReportRecord).where(
        (AiReportRecord.id == report_id) | (AiReportRecord.prediction_id == report_id),
        AiReportRecord.user_id == user_id
    )
    report = db.execute(stmt).scalar_one_or_none()

    # Also fetch the associated prediction to provide complete diagnostic data
    pred = None
    if report and report.prediction_id:
        pred_stmt = select(DiseasePredictionRecord).where(
            DiseasePredictionRecord.id == report.prediction_id,
            DiseasePredictionRecord.user_id == user_id
        )
        pred = db.execute(pred_stmt).scalar_one_or_none()
    elif not report:
        # Check if the requested id is a prediction ID owned by this user
        pred_stmt = select(DiseasePredictionRecord).where(
            DiseasePredictionRecord.id == report_id,
            DiseasePredictionRecord.user_id == user_id
        )
        pred = db.execute(pred_stmt).scalar_one_or_none()

    if not report and not pred:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found or access denied."
        )

    # Format composite report structure expected by frontend AiReports page
    pred_data = format_prediction_dict(pred) if pred else {}
    adv_text = report.advisory_text if report else (pred_data.get("advisory", {}).get("text") or "")

    return {
        **pred_data,
        "id": pred.id if pred else report_id,
        "prediction_id": pred.id if pred else report_id,
        "user_id": user_id,
        "report_id": report.id if report else None,
        "report_title": report.report_title if report else f"AI Diagnostic Report: {pred_data.get('disease', 'Diagnosis')}",
        "advisory": {
            "text": adv_text,
            "en": adv_text,
            "ta": adv_text
        },
        "advisory_text": adv_text,
        "rag": report.rag_sources if report else pred_data.get("rag")
    }


def format_prediction_dict(rec: Optional[DiseasePredictionRecord]) -> Dict[str, Any]:
    """Helper to convert DiseasePredictionRecord to frontend expected schema."""
    if not rec:
        return {}

    conf_pct = rec.confidence_percent
    if conf_pct is None and rec.confidence is not None:
        conf_pct = rec.confidence * 100 if rec.confidence <= 1.0 else rec.confidence

    disease_name = rec.disease_clean or rec.predicted_disease or "Unknown"

    lime_dict = None
    if rec.lime_summary:
        lime_dict = {
            "summary": rec.lime_summary,
            "explanation": rec.lime_summary,
            "why_predicted": [rec.lime_summary]
        }

    # Fetch advisory if reports relation loaded
    adv_text = ""
    rag_data = None
    if hasattr(rec, "reports") and rec.reports:
        adv_text = rec.reports[0].advisory_text or ""
        rag_data = rec.reports[0].rag_sources

    return {
        "id": rec.id,
        "user_id": rec.user_id,
        "crop": rec.crop,
        "disease": disease_name,
        "disease_clean": disease_name,
        "confidence": round(conf_pct, 1) if conf_pct is not None else 95.0,
        "status": rec.status or "Disease Detected",
        "imageUrl": rec.image_url or rec.leaf_crop_url or "",
        "original_image": {"image_url": rec.image_url} if rec.image_url else None,
        "leaf_crop": {"image_url": rec.leaf_crop_url} if rec.leaf_crop_url else None,
        "top3Predictions": rec.top3_predictions or [],
        "limeExplanation": lime_dict,
        "limeText": rec.lime_summary or "",
        "createdAt": rec.created_at.strftime("%d/%m/%Y, %I:%M:%S %p") if rec.created_at else "Just now",
        "advisory": {
            "text": adv_text,
            "en": adv_text,
            "ta": adv_text
        },
        "rag": rag_data
    }
