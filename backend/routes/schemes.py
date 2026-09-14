"""
SmartFarm AI - Government Agriculture Schemes Route
Endpoints for discovering verified agricultural schemes and evaluating
deterministic, rule-based farmer eligibility.
"""

from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Query, HTTPException, status
from pydantic import BaseModel

from services.schemes_data import VERIFIED_GOVERNMENT_SCHEMES, evaluate_eligibility

router = APIRouter(prefix="/schemes", tags=["Government Agriculture Schemes"])


class EvaluationRequest(BaseModel):
    field_profile: Optional[Dict[str, Any]] = None
    scheme_id: Optional[str] = None


@router.get("", response_model=List[Dict[str, Any]])
@router.get("/", response_model=List[Dict[str, Any]])
async def list_schemes(
    query: Optional[str] = Query("", description="Search term across name, agency, benefits, or description"),
    state: Optional[str] = Query("all", description="State filter ('all', 'Tamil Nadu', etc.)"),
    crop: Optional[str] = Query("all", description="Crop filter ('all', 'Brinjal', 'Tomato', etc.)"),
    category: Optional[str] = Query("all", description="Scheme category filter")
):
    """
    Search and filter verified government agriculture schemes.
    """
    q = (query or "").strip().lower()
    state_filter = (state or "all").strip().lower()
    crop_filter = (crop or "all").strip().lower()
    cat_filter = (category or "all").strip().lower()

    results = []
    for s in VERIFIED_GOVERNMENT_SCHEMES:
        rules = s.get("rules", {})
        s_state = s.get("state", "").lower()
        s_cat = s.get("category", "").lower()
        supported_states = [st.lower() for st in rules.get("supportedStates", ["all india"])]
        supported_crops = [c.lower() for c in rules.get("supportedCrops", ["all"])]

        # 1. State Filter
        if state_filter != "all":
            if not ("all india" in supported_states or any(state_filter in st for st in supported_states)):
                continue

        # 2. Crop Filter
        if crop_filter != "all":
            if not ("all" in supported_crops or any(crop_filter in c for c in supported_crops)):
                continue

        # 3. Category Filter
        if cat_filter != "all":
            if not (cat_filter in s_cat or s_cat in cat_filter):
                continue

        # 4. Search Query Filter
        if q:
            searchable = (
                f"{s.get('name', '')} {s.get('nameTa', '')} "
                f"{s.get('agency', '')} {s.get('category', '')} "
                f"{s.get('description', '')} {s.get('descriptionTa', '')} "
                f"{s.get('benefits', '')} {s.get('benefitsTa', '')} "
                f"{' '.join(s.get('requiredDocuments', []))}"
            ).lower()
            if q not in searchable:
                continue

        results.append(s)

    return results


@router.get("/{scheme_id}", response_model=Dict[str, Any])
async def get_scheme_by_id(scheme_id: str):
    """
    Retrieves complete details for a single verified government scheme.
    """
    for s in VERIFIED_GOVERNMENT_SCHEMES:
        if s["id"].lower() == scheme_id.lower():
            return s
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"Scheme '{scheme_id}' was not found in verified registry."
    )


@router.post("/evaluate", response_model=Dict[str, Any])
async def evaluate_schemes_eligibility(payload: EvaluationRequest):
    """
    Evaluates rule-based eligibility for all or a specific scheme against a field profile.
    Deterministic evaluation: does NOT use AI models or make legal guarantees.
    """
    field_profile = payload.field_profile

    # If evaluating single scheme
    if payload.scheme_id:
        target_scheme = None
        for s in VERIFIED_GOVERNMENT_SCHEMES:
            if s["id"].lower() == payload.scheme_id.lower():
                target_scheme = s
                break
        if not target_scheme:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Scheme '{payload.scheme_id}' not found."
            )
        eval_result = evaluate_eligibility(target_scheme, field_profile)
        return {
            "scheme_id": target_scheme["id"],
            "scheme_name": target_scheme["name"],
            "evaluation": eval_result
        }

    # Evaluate all schemes
    evaluations = {}
    likely_eligible_count = 0

    for s in VERIFIED_GOVERNMENT_SCHEMES:
        res = evaluate_eligibility(s, field_profile)
        evaluations[s["id"]] = res
        if res["status"] == "likely_eligible":
            likely_eligible_count += 1

    return {
        "field_profile_summary": {
            "crop": field_profile.get("crop_type") if field_profile else None,
            "field_size": field_profile.get("field_size") if field_profile else None,
            "location": field_profile.get("field_location") if field_profile else None
        },
        "total_schemes_evaluated": len(VERIFIED_GOVERNMENT_SCHEMES),
        "likely_eligible_count": likely_eligible_count,
        "evaluations": evaluations
    }
