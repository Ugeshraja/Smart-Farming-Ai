"""
SmartFarm AI - Field Agronomic Suitability Evaluator
Authoritative single source of truth for deterministic crop suitability assessment.
Grounded in TNAU (Tamil Nadu Agricultural University) & ICAR agronomic standards.
"""

import re
from typing import Dict, Any, List, Optional, Tuple

# Crop requirements registry grounded in verified TNAU/ICAR agronomic data
VERIFIED_CROP_REQUIREMENTS: Dict[str, Dict[str, Any]] = {
    "Brinjal": {
        "crop_name_en": "Brinjal",
        "crop_name_ta": "கத்தரிக்காய்",
        "npk_unit": "kg/ha",
        "ph": {
            "optimal_min": 6.0,
            "optimal_max": 7.0,
            "tolerable_min": 5.5,
            "tolerable_max": 7.5,
            "desc": "6.0 – 7.0 (slightly acidic to neutral)"
        },
        "water_capacity": {
            "optimal_min": 60.0,
            "optimal_max": 80.0,
            "tolerable_min": 50.0,
            "tolerable_max": 85.0,
            "desc": "60% – 80% available root-zone moisture"
        },
        "nitrogen": {
            "optimal_min": 70,
            "optimal_max": 130,
            "tolerable_min": 55,
            "tolerable_max": 160,
            "recommended": 100,
            "desc": "70 – 130 kg/ha (TNAU recommended basal + split: 100 kg/ha)"
        },
        "phosphorus": {
            "optimal_min": 30,
            "optimal_max": 70,
            "tolerable_min": 20,
            "tolerable_max": 90,
            "recommended": 50,
            "desc": "30 – 70 kg/ha (TNAU recommended: 50 kg/ha)"
        },
        "potassium": {
            "optimal_min": 30,
            "optimal_max": 70,
            "tolerable_min": 20,
            "tolerable_max": 90,
            "recommended": 50,
            "desc": "30 – 70 kg/ha (TNAU recommended: 50 kg/ha)"
        },
        "soil_types": {
            "good": ["Loamy", "Red Loamy", "Sandy Loam", "Alluvial", "Clay Loam"],
            "borderline": ["Black Cotton", "Black Soil"],
            "poor": ["Clay", "Heavy Clay", "Sandy", "Gravelly"]
        },
        "irrigation_methods": {
            "good": ["Drip", "Sprinkler"],
            "borderline": ["Flood", "Furrow"],
            "poor": ["Rain-fed"]
        },
        "seasons": {
            "good": ["Kharif", "Rabi", "Zaid / Summer", "Zaid", "Summer"],
            "borderline": [],
            "poor": []
        }
    },
    "Tomato": {
        "crop_name_en": "Tomato",
        "crop_name_ta": "தக்காளி",
        "npk_unit": "kg/ha",
        "ph": {
            "optimal_min": 6.0,
            "optimal_max": 6.8,
            "tolerable_min": 5.5,
            "tolerable_max": 7.2,
            "desc": "6.0 – 6.8 (TNAU standard; pH > 7.2 induces iron chlorosis and blossom end rot)"
        },
        "water_capacity": {
            "optimal_min": 60.0,
            "optimal_max": 75.0,
            "tolerable_min": 50.0,
            "tolerable_max": 80.0,
            "desc": "60% – 75% root-zone moisture"
        },
        "nitrogen": {
            "optimal_min": 70,
            "optimal_max": 130,
            "tolerable_min": 55,
            "tolerable_max": 160,
            "recommended": 100,
            "desc": "70 – 130 kg/ha (TNAU recommended: 100 kg/ha)"
        },
        "phosphorus": {
            "optimal_min": 30,
            "optimal_max": 70,
            "tolerable_min": 20,
            "tolerable_max": 90,
            "recommended": 50,
            "desc": "30 – 70 kg/ha (TNAU recommended: 50 kg/ha)"
        },
        "potassium": {
            "optimal_min": 35,
            "optimal_max": 80,
            "tolerable_min": 25,
            "tolerable_max": 100,
            "recommended": 50,
            "desc": "35 – 80 kg/ha (Tomatoes require adequate potassium for firm fruit walls)"
        },
        "soil_types": {
            "good": ["Red Loamy", "Loamy", "Sandy Loam", "Alluvial"],
            "borderline": ["Clay Loam", "Black Soil", "Black Cotton"],
            "poor": ["Clay", "Heavy Clay", "Sandy", "Gravelly"]
        },
        "irrigation_methods": {
            "good": ["Drip"],
            "borderline": ["Flood", "Furrow"],
            "poor": ["Sprinkler", "Rain-fed"]
        },
        "seasons": {
            "good": ["Rabi", "Kharif"],
            "borderline": ["Zaid / Summer", "Zaid", "Summer"],
            "poor": []
        }
    },
    "Potato": {
        "crop_name_en": "Potato",
        "crop_name_ta": "உருளைக்கிழங்கு",
        "npk_unit": "kg/ha",
        "ph": {
            "optimal_min": 5.0,
            "optimal_max": 6.5,
            "tolerable_min": 4.8,
            "tolerable_max": 6.8,
            "desc": "5.0 – 6.5 (CPRI/TNAU standard; pH > 6.8 induces Common Scab Streptomyces)"
        },
        "water_capacity": {
            "optimal_min": 65.0,
            "optimal_max": 80.0,
            "tolerable_min": 55.0,
            "tolerable_max": 85.0,
            "desc": "65% – 80% consistent moisture without saturation"
        },
        "nitrogen": {
            "optimal_min": 90,
            "optimal_max": 150,
            "tolerable_min": 70,
            "tolerable_max": 180,
            "recommended": 120,
            "desc": "90 – 150 kg/ha (CPRI recommended: 120 kg/ha; excess N delays tuber bulking)"
        },
        "phosphorus": {
            "optimal_min": 80,
            "optimal_max": 150,
            "tolerable_min": 55,
            "tolerable_max": 180,
            "recommended": 120,
            "desc": "80 – 150 kg/ha (Potato has high phosphorus demand for stolon and tuber initiation)"
        },
        "potassium": {
            "optimal_min": 80,
            "optimal_max": 150,
            "tolerable_min": 60,
            "tolerable_max": 180,
            "recommended": 120,
            "desc": "80 – 150 kg/ha (Critical for tuber starch synthesis and disease resistance)"
        },
        "soil_types": {
            "good": ["Sandy Loam", "Loamy", "Alluvial"],
            "borderline": ["Red Loamy"],
            "poor": ["Clay", "Heavy Clay", "Black Cotton", "Black Soil", "Sandy", "Gravelly"]
        },
        "irrigation_methods": {
            "good": ["Furrow", "Drip"],
            "borderline": ["Flood"],
            "poor": ["Sprinkler", "Rain-fed"]
        },
        "seasons": {
            "good": ["Rabi"],
            "borderline": ["Kharif"],
            "poor": ["Zaid / Summer", "Zaid", "Summer"]
        }
    }
}


def parse_water_percentage(value: Any) -> Optional[float]:
    """Extracts numeric float percentage from strings like '72%', '72', or numeric 72."""
    if value is None:
        return None
    if isinstance(value, (int, float)):
        return float(value)
    s = str(value).strip()
    match = re.search(r"[-+]?\d*\.?\d+", s)
    if match:
        try:
            return float(match.group(0))
        except ValueError:
            return None
    return None


def validate_field_inputs(field_data: Dict[str, Any]) -> Tuple[bool, Optional[str], Optional[str]]:
    """
    Validates field data before evaluation.
    Returns (is_valid, error_en, error_ta).
    """
    if not isinstance(field_data, dict):
        return False, "Invalid field profile format.", "தவறான நில விவர வடிவம்."

    crop = field_data.get("crop_type")
    if not crop or not str(crop).strip():
        return False, "Please select a crop type before evaluating field suitability.", "மதிப்பீடு செய்ய பயிர் வகையைத் தேர்ந்தெடுக்கவும்."

    # Soil pH validation
    raw_ph = field_data.get("soil_ph")
    if raw_ph is None or str(raw_ph).strip() == "":
        return False, "Please enter soil pH before evaluating field suitability.", "மதிப்பீடு செய்ய மண்ணின் pH அளவை உள்ளிடவும்."
    try:
        ph = float(raw_ph)
        if ph < 3.0 or ph > 11.0:
            return False, f"Soil pH ({ph}) is outside the feasible agronomic range (3.0 to 11.0).", f"மண் pH ({ph}) சாத்தியமான 3.0 முதல் 11.0 வரம்பிற்கு வெளியே உள்ளது."
    except (ValueError, TypeError):
        return False, "Soil pH must be a valid numeric value.", "மண் pH சரியான எண்ணாக இருக்க வேண்டும்."

    # Water capacity validation
    raw_water = field_data.get("water_capacity")
    water_val = parse_water_percentage(raw_water)
    if water_val is None:
        return False, "Please enter a valid soil water capacity percentage (0% to 100%).", "சரியான மண் நீர் கொள்ளளவு சதவீதத்தை (0% - 100%) உள்ளிடவும்."
    if water_val < 0 or water_val > 100:
        return False, f"Water capacity ({water_val}%) must be between 0% and 100%.", f"நீர் கொள்ளளவு ({water_val}%) 0% முதல் 100%க்குள் இருக்க வேண்டும்."

    # NPK validation
    for nutrient, key, name_en, name_ta in [
        ("N", "npk_nitrogen", "Nitrogen (N)", "நைட்ரஜன் (N)"),
        ("P", "npk_phosphorus", "Phosphorus (P)", "பாஸ்பரஸ் (P)"),
        ("K", "npk_potassium", "Potassium (K)", "பொட்டாசியம் (K)")
    ]:
        raw_val = field_data.get(key)
        if raw_val is None or str(raw_val).strip() == "":
            return False, f"Please enter a value for {name_en}.", f"{name_ta} மதிப்பினை உள்ளிடவும்."
        try:
            val = float(raw_val)
            if val < 0:
                return False, f"{name_en} cannot be negative.", f"{name_ta} மதிப்பு எதிர்மறையாக இருக்க முடியாது."
        except (ValueError, TypeError):
            return False, f"{name_en} must be a valid non-negative number.", f"{name_ta} சரியான எண்ணாக இருக்க வேண்டும்."

    # Field size validation
    raw_size = field_data.get("field_size")
    if raw_size is not None:
        try:
            size_val = float(raw_size)
            if size_val <= 0:
                return False, "Field size must be greater than zero.", "நில அளவு பூஜ்ஜியத்தை விட அதிகமாக இருக்க வேண்டும்."
        except (ValueError, TypeError):
            return False, "Field size must be a valid number.", "நில அளவு சரியான எண்ணாக இருக்க வேண்டும்."

    return True, None, None


def evaluate_field_suitability(field_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Authoritative deterministic evaluation of field suitability for the selected crop.
    Returns structured assessment matching the required contract.
    """
    # 1. Input Validation
    is_valid, err_en, err_ta = validate_field_inputs(field_data)
    if not is_valid:
        return {
            "valid": False,
            "overall_status": "Validation Error",
            "overall_status_ta": "உள்ளீட்டு பிழை",
            "suitable": False,
            "status_level": "invalid",
            "npk_unit": "kg/ha",
            "water_capacity_definition": "Available Soil Moisture / Water Holding Capacity (%)",
            "message": err_en,
            "message_ta": err_ta,
            "checks": [],
            "improvements": [
                {
                    "parameter": "Input Validation",
                    "status": "poor",
                    "issue": err_en,
                    "issue_ta": err_ta,
                    "action": "Correct the input values before evaluating.",
                    "action_ta": "மதிப்பீடு செய்வதற்கு முன் சரியான மதிப்புகளை உள்ளிடவும்."
                }
            ],
            "recommendations": [
                "Please enter valid field measurements to obtain an accurate agronomic suitability assessment."
            ],
            "recommendations_ta": [
                "சரியான விவசாய பொருத்த மதிப்பீட்டைப் பெற சரியான நில அளவீடுகளை உள்ளிடவும்."
            ]
        }

    crop_input = str(field_data.get("crop_type", "")).strip()

    # Find matching crop case-insensitively
    matched_crop_key = None
    for k in VERIFIED_CROP_REQUIREMENTS:
        if k.lower() == crop_input.lower():
            matched_crop_key = k
            break

    # 2. Check for Unsupported Crop
    if not matched_crop_key:
        return {
            "valid": True,
            "overall_status": "Assessment unavailable for this crop",
            "overall_status_ta": "இந்த பயிருக்கான மதிப்பீடு கிடைக்கவில்லை",
            "suitable": False,
            "status_level": "unavailable",
            "crop_type": crop_input,
            "npk_unit": "kg/ha",
            "water_capacity_definition": "Available Soil Moisture / Water Holding Capacity (%)",
            "message": f"Verified suitability rules are not currently available for {crop_input or 'this crop'}.",
            "message_ta": f"{crop_input or 'இந்த பயிருக்கான'} சரிபார்க்கப்பட்ட பொருத்த விதிகள் தற்போது கிடைக்கவில்லை.",
            "checks": [],
            "improvements": [
                {
                    "parameter": "Crop Verification",
                    "status": "borderline",
                    "issue": f"No verified TNAU/ICAR agronomic rule profile is loaded for '{crop_input}'. Supported verified crops: Brinjal, Tomato, Potato.",
                    "issue_ta": f"'{crop_input}' பயிருக்கான சரிபார்க்கப்பட்ட TNAU/ICAR விதிகள் ஏற்றப்படவில்லை. ஆதரிக்கப்படும் பயிர்கள்: கத்தரிக்காய், தக்காளி, உருளைக்கிழங்கு.",
                    "action": "Select a supported crop (Brinjal, Tomato, or Potato) for a verified scientific assessment.",
                    "action_ta": "சரிபார்க்கப்பட்ட அறிவியல் மதிப்பீட்டிற்கு ஆதரிக்கப்படும் பயிரைத் தேர்ந்தெடுக்கவும்."
                }
            ],
            "recommendations": [
                f"Verified suitability rules are not currently available for {crop_input}. Please select Brinjal, Tomato, or Potato for scientific suitability checks."
            ],
            "recommendations_ta": [
                f"{crop_input} பயிருக்கான சரிபார்க்கப்பட்ட விதிகள் தற்போது இல்லை. கத்தரிக்காய், தக்காளி அல்லது உருளைக்கிழங்கைத் தேர்ந்தெடுக்கவும்."
            ]
        }

    rules = VERIFIED_CROP_REQUIREMENTS[matched_crop_key]
    crop_name_en = rules["crop_name_en"]
    crop_name_ta = rules["crop_name_ta"]

    checks: List[Dict[str, Any]] = []
    improvements: List[Dict[str, Any]] = []

    # Helper to register check and optional improvement
    def add_check(
        parameter: str,
        value: Any,
        status: str,
        rec_range: str,
        msg_en: str,
        msg_ta: str,
        action_en: Optional[str] = None,
        action_ta: Optional[str] = None,
        is_critical: bool = False
    ):
        checks.append({
            "parameter": parameter,
            "value": value,
            "status": status,
            "is_critical": is_critical,
            "recommended_range": rec_range,
            "message": msg_en,
            "message_ta": msg_ta
        })
        if status in ("poor", "borderline"):
            improvements.append({
                "parameter": parameter,
                "status": status,
                "is_critical": is_critical,
                "issue": msg_en,
                "issue_ta": msg_ta,
                "action": action_en or msg_en,
                "action_ta": action_ta or msg_ta
            })

    # --- 1. Soil pH Evaluation (Critical) ---
    ph_val = float(field_data.get("soil_ph", 6.4))
    ph_rules = rules["ph"]
    opt_min, opt_max = ph_rules["optimal_min"], ph_rules["optimal_max"]
    tol_min, tol_max = ph_rules["tolerable_min"], ph_rules["tolerable_max"]

    if opt_min <= ph_val <= opt_max:
        ph_status = "good"
        ph_msg_en = f"Soil pH ({ph_val:.1f}) is optimal for {crop_name_en} ({opt_min}–{opt_max})."
        ph_msg_ta = f"மண்ணின் pH ({ph_val:.1f}) {crop_name_ta} பயிருக்கு மிகவும் உகந்த நிலையில் உள்ளது ({opt_min}–{opt_max})."
        ph_act_en = None
        ph_act_ta = None
    elif tol_min <= ph_val < opt_min:
        ph_status = "borderline"
        ph_msg_en = f"Soil pH ({ph_val:.1f}) is slightly acidic for {crop_name_en}. Recommended range: {opt_min}–{opt_max}."
        ph_msg_ta = f"மண்ணின் pH ({ph_val:.1f}) சற்றே அமிலத்தன்மையில் உள்ளது. பரிந்துரைக்கப்படும் அளவு: {opt_min}–{opt_max}."
        ph_act_en = "Apply agricultural lime (calcium carbonate) or dolomite to gently raise soil pH."
        ph_act_ta = "மண்ணின் அமிலத்தன்மையைக் குறைக்க விவசாய சுண்ணாம்பு (Lime) இடவும்."
    elif opt_max < ph_val <= tol_max:
        ph_status = "borderline"
        ph_msg_en = f"Soil pH ({ph_val:.1f}) is slightly alkaline for {crop_name_en}. Recommended range: {opt_min}–{opt_max}."
        ph_msg_ta = f"மண்ணின் pH ({ph_val:.1f}) சற்றே காரத்தன்மையில் உள்ளது. பரிந்துரைக்கப்படும் அளவு: {opt_min}–{opt_max}."
        ph_act_en = "Incorporate organic farmyard manure (FYM) or green manure to moderate alkaline pH."
        ph_act_ta = "மண்ணின் காரத்தன்மையைக் குறைக்க மட்கிய தொழு உரம் அல்லது தழை உரம் இடவும்."
    elif ph_val < tol_min:
        ph_status = "poor"
        ph_msg_en = f"Soil pH ({ph_val:.1f}) is severely acidic for {crop_name_en} (below {tol_min}). Stunts root development and locks phosphorus."
        ph_msg_ta = f"மண்ணின் pH ({ph_val:.1f}) மிக அதிக அமிலத்தன்மை கொண்டது ({tol_min}க்கு கீழ்). வேர் வளர்ச்சியை பாதிக்கும்."
        ph_act_en = "Apply agricultural lime @ 1–2 tonnes/ha and well-rotted compost before transplanting to bring pH above 6.0."
        ph_act_ta = "மண்ணின் pH அளவை 6.0க்கு மேல் உயர்த்த ஹெக்டேருக்கு 1-2 டன் சுண்ணாம்பு மற்றும் தொழு உரம் இடவும்."
    else:  # ph_val > tol_max
        ph_status = "poor"
        if matched_crop_key == "Potato":
            ph_msg_en = f"Soil pH ({ph_val:.1f}) is too high for Potato (> {tol_max}). Alkaline soil strongly triggers devastating Common Scab (Streptomyces scabies) disease."
            ph_msg_ta = f"மண்ணின் pH ({ph_val:.1f}) உருளைக்கிழங்குக்கு மிக அதிகம். கார மண் கொடிய சொறி நோயை (Common Scab) உண்டாக்கும்."
            ph_act_en = "Apply elemental agricultural sulfur (200-300 kg/ha) or gypsum to acidify soil to pH 5.2–6.2 before tuber planting."
            ph_act_ta = "கிழங்கு நடுவதற்கு முன் கந்தகம் (Sulfur) அல்லது ஜிப்சம் இட்டு pH அளவை 5.2–6.2 வரை குறைக்கவும்."
        else:
            ph_msg_en = f"Soil pH ({ph_val:.1f}) is too high for {crop_name_en} (> {tol_max}). Induces severe micronutrient (Iron/Zinc) chlorosis."
            ph_msg_ta = f"மண்ணின் pH ({ph_val:.1f}) {crop_name_ta} பயிருக்கு மிக அதிகம். இது இரும்பு மற்றும் துத்தநாக பற்றாக்குறையை ஏற்படுத்தும்."
            ph_act_en = "Apply agricultural gypsum or elemental sulfur along with heavy organic compost to reduce pH toward optimal range."
            ph_act_ta = "மண்ணின் pH அளவைக் குறைக்க ஜிப்சம் அல்லது கந்தகத்துடன் அதிக கரிம உரங்களை இடவும்."

    add_check(
        parameter="Soil pH",
        value=ph_val,
        status=ph_status,
        rec_range=ph_rules["desc"],
        msg_en=ph_msg_en,
        msg_ta=ph_msg_ta,
        action_en=ph_act_en,
        action_ta=ph_act_ta,
        is_critical=True
    )

    # --- 2. Water Capacity / Availability Evaluation (Critical) ---
    water_val = parse_water_percentage(field_data.get("water_capacity", 72)) or 72.0
    w_rules = rules["water_capacity"]
    w_opt_min, w_opt_max = w_rules["optimal_min"], w_rules["optimal_max"]
    w_tol_min, w_tol_max = w_rules["tolerable_min"], w_rules["tolerable_max"]

    if w_opt_min <= water_val <= w_opt_max:
        w_status = "good"
        w_msg_en = f"Water capacity ({water_val:.0f}%) is in the optimal range ({w_opt_min:.0f}%–{w_opt_max:.0f}%)."
        w_msg_ta = f"மண் நீர் கொள்ளளவு ({water_val:.0f}%) உகந்த வரம்பில் உள்ளது ({w_opt_min:.0f}%–{w_opt_max:.0f}%)."
        w_act_en = None
        w_act_ta = None
    elif w_tol_min <= water_val < w_opt_min:
        w_status = "borderline"
        w_msg_en = f"Water capacity ({water_val:.0f}%) is slightly low. Recommended: {w_opt_min:.0f}%–{w_opt_max:.0f}%."
        w_msg_ta = f"நீர் கொள்ளளவு ({water_val:.0f}%) சற்றே குறைவாக உள்ளது. பரிந்துரை: {w_opt_min:.0f}%–{w_opt_max:.0f}%."
        w_act_en = "Increase irrigation frequency and incorporate organic matter/mulch to enhance moisture retention."
        w_act_ta = "நீர் பாசன இடைவெளியைக் குறைத்து மூடாக்கு அல்லது மட்கிய உரம் இட்டு ஈரப்பதத்தை அதிகரிக்கவும்."
    elif w_opt_max < water_val <= w_tol_max:
        w_status = "borderline"
        w_msg_en = f"Water capacity ({water_val:.0f}%) is on the higher side. Ensure soil does not remain saturated."
        w_msg_ta = f"நீர் கொள்ளளவு ({water_val:.0f}%) அதிகமாக உள்ளது. நிலத்தில் நீர் தேங்காமல் பார்த்துக் கொள்ளவும்."
        w_act_en = "Improve furrow drainage to avoid standing water around root zones."
        w_act_ta = "வேர்ப்பகுதியில் நீர் தேங்குவதைத் தவிர்க்க வடிகால் வசதியை மேம்படுத்தவும்."
    elif water_val < w_tol_min:
        w_status = "poor"
        w_msg_en = f"Water capacity ({water_val:.0f}%) is insufficient for {crop_name_en} (below {w_tol_min:.0f}%). Risk of severe drought stress and crop failure."
        w_msg_ta = f"நீர் கொள்ளளவு ({water_val:.0f}%) {crop_name_ta} பயிருக்கு போதுமானதாக இல்லை ({w_tol_min:.0f}%க்கு கீழ்). வறட்சி ஏற்படும் அபாயம்."
        w_act_en = "Ensure dependable irrigation source (drip system) and pre-soak planting ridges before sowing."
        w_act_ta = "விதைப்பதற்கு முன் சொட்டுநீர்ப் பாசனம் அல்லது தேவையான நீர் ஆதாரம் அமைத்து நிலத்தை ஈரப்பதமாக்கவும்."
    else:  # water_val > w_tol_max
        w_status = "poor"
        w_msg_en = f"Water capacity ({water_val:.0f}%) is excessive (> {w_tol_max:.0f}%). Severe waterlogging induces root rot and bacterial wilt."
        w_msg_ta = f"நீர் கொள்ளளவு ({water_val:.0f}%) மிக அதிகம் ({w_tol_max:.0f}%க்கு மேல்). அதிக நீர் தேங்குவது வேரழுகல் மற்றும் வாடல் நோயை உண்டாக்கும்."
        w_act_en = "Construct deep drainage channels and raised beds to evacuate surplus water."
        w_act_ta = "அதிகப்படியான நீரை வெளியேற்ற ஆழமான வடிகால் வாய்க்கால்களை அமைக்கவும்."

    add_check(
        parameter="Water Capacity",
        value=f"{water_val:.0f}%",
        status=w_status,
        rec_range=w_rules["desc"],
        msg_en=w_msg_en,
        msg_ta=w_msg_ta,
        action_en=w_act_en,
        action_ta=w_act_ta,
        is_critical=True
    )

    # --- 3. Nitrogen (N) Evaluation (Critical) ---
    n_val = float(field_data.get("npk_nitrogen", 80))
    n_rules = rules["nitrogen"]
    if n_rules["optimal_min"] <= n_val <= n_rules["optimal_max"]:
        n_status = "good"
        n_msg_en = f"Nitrogen level ({n_val:.0f} kg/ha) is suitable for {crop_name_en}."
        n_msg_ta = f"நைட்ரஜன் அளவு ({n_val:.0f} kg/ha) {crop_name_ta} பயிருக்கு போதுமானதாக உள்ளது."
        n_act_en = None
        n_act_ta = None
    elif n_rules["tolerable_min"] <= n_val < n_rules["optimal_min"]:
        n_status = "borderline"
        n_msg_en = f"Nitrogen level ({n_val:.0f} kg/ha) is slightly low for {crop_name_en}. Recommended: {n_rules['optimal_min']}–{n_rules['optimal_max']} kg/ha."
        n_msg_ta = f"நைட்ரஜன் அளவு ({n_val:.0f} kg/ha) சற்றே குறைவாக உள்ளது. பரிந்துரை: {n_rules['optimal_min']}–{n_rules['optimal_max']} kg/ha."
        n_act_en = f"Supplement with basal Neem-coated Urea or well-decomposed manure to reach {n_rules['recommended']} kg/ha."
        n_act_ta = f"வேப்பம்பூசிய யூரியா அல்லது தொழு உரமிட்டு {n_rules['recommended']} kg/ha அளவை அடையவும்."
    elif n_rules["optimal_max"] < n_val <= n_rules["tolerable_max"]:
        n_status = "borderline"
        n_msg_en = f"Nitrogen level ({n_val:.0f} kg/ha) is on the higher side. Avoid excess vegetative growth."
        n_msg_ta = f"நைட்ரஜன் அளவு ({n_val:.0f} kg/ha) அதிகமாக உள்ளது. அதிக தழை வளர்ச்சி பூப்பிடிப்பை தாமதப்படுத்தலாம்."
        n_act_en = "Reduce topdress urea applications and balance with potash."
        n_act_ta = "யூரியா இடுவதைக் குறைத்து பொட்டாஷ் உரத்தை சமநிலையில் இடவும்."
    elif n_val < n_rules["tolerable_min"]:
        n_status = "poor"
        n_msg_en = f"Nitrogen availability ({n_val:.0f} kg/ha) is critically low for {crop_name_en} (below {n_rules['tolerable_min']} kg/ha). Causes severe stunting and chlorosis."
        n_msg_ta = f"நைட்ரஜன் சத்து ({n_val:.0f} kg/ha) மிகவும் குறைவாக உள்ளது ({n_rules['tolerable_min']} kg/haக்கு கீழ்). பயிர் வளர்ச்சி குன்றி இலைகள் மஞ்சளாகும்."
        n_act_en = f"Increase nitrogen availability before planting. Apply basal dose of Nitrogen (Urea/Compost) to achieve at least {n_rules['optimal_min']} kg/ha."
        n_act_ta = f"நடவுக்கு முன் தழைச்சத்து அளவை அதிகரிக்கவும். குறைந்தபட்சம் {n_rules['optimal_min']} kg/ha கிடைக்கும்படி யூரியா இடவும்."
    else:  # n_val > n_rules["tolerable_max"]
        n_status = "poor"
        n_msg_en = f"Nitrogen level ({n_val:.0f} kg/ha) is dangerously excessive. Increases pest/disease susceptibility and delays flowering."
        n_msg_ta = f"நைட்ரஜன் அளவு ({n_val:.0f} kg/ha) மிக அதிகமாக உள்ளது. பூச்சி தாக்குதல் மற்றும் நோய் அபாயத்தை அதிகரிக்கும்."
        n_act_en = "Do not apply any additional nitrogen fertilizers; flush soil if necessary."
        n_act_ta = "கூடுதல் நைட்ரஜன் உரங்கள் எதையும் இடவேண்டாம்."

    add_check(
        parameter="Nitrogen (N)",
        value=f"{n_val:.0f} kg/ha",
        status=n_status,
        rec_range=n_rules["desc"],
        msg_en=n_msg_en,
        msg_ta=n_msg_ta,
        action_en=n_act_en,
        action_ta=n_act_ta,
        is_critical=True
    )

    # --- 4. Phosphorus (P) Evaluation ---
    p_val = float(field_data.get("npk_phosphorus", 40))
    p_rules = rules["phosphorus"]
    if p_rules["optimal_min"] <= p_val <= p_rules["optimal_max"]:
        p_status = "good"
        p_msg_en = f"Phosphorus level ({p_val:.0f} kg/ha) is optimal for {crop_name_en}."
        p_msg_ta = f"பாஸ்பரஸ் அளவு ({p_val:.0f} kg/ha) {crop_name_ta} பயிருக்கு உகந்ததாக உள்ளது."
        p_act_en = None
        p_act_ta = None
    elif p_rules["tolerable_min"] <= p_val < p_rules["optimal_min"]:
        p_status = "borderline"
        p_msg_en = f"Phosphorus ({p_val:.0f} kg/ha) is slightly below optimal ({p_rules['optimal_min']}–{p_rules['optimal_max']} kg/ha)."
        p_msg_ta = f"பாஸ்பரஸ் ({p_val:.0f} kg/ha) சற்றே குறைவாக உள்ளது ({p_rules['optimal_min']}–{p_rules['optimal_max']} kg/ha)."
        p_act_en = f"Apply Single Super Phosphate (SSP) or DAP to reach recommended {p_rules['recommended']} kg/ha."
        p_act_ta = f"சூப்பர் பாஸ்பேட் (SSP) அல்லது DAP இட்டு {p_rules['recommended']} kg/ha அளவை அடையவும்."
    elif p_rules["optimal_max"] < p_val <= p_rules["tolerable_max"]:
        p_status = "borderline"
        p_msg_en = f"Phosphorus ({p_val:.0f} kg/ha) is high but acceptable."
        p_msg_ta = f"பாஸ்பரஸ் ({p_val:.0f} kg/ha) அதிகமாக இருந்தாலும் ஏற்கக்கூடியது."
        p_act_en = "Avoid additional phosphate applications."
        p_act_ta = "கூடுதல் பாஸ்பேட் உரங்களை இட வேண்டாம்."
    elif p_val < p_rules["tolerable_min"]:
        p_status = "poor"
        p_msg_en = f"Phosphorus ({p_val:.0f} kg/ha) is severely deficient (below {p_rules['tolerable_min']} kg/ha). Prevents healthy root establishment."
        p_msg_ta = f"பாஸ்பரஸ் ({p_val:.0f} kg/ha) மிகக் குறைவாக உள்ளது ({p_rules['tolerable_min']} kg/haக்கு கீழ்). வேர் வளர்ச்சியை முடக்கும்."
        p_act_en = f"Incorporate basal Single Super Phosphate (SSP @ 250 kg/ha) into soil before planting."
        p_act_ta = "நடவுக்கு முன் நிலத்தில் சிங்கிள் சூப்பர் பாஸ்பேட் (SSP) அடியுரமாக இடவும்."
    else:
        p_status = "poor"
        p_msg_en = f"Phosphorus level ({p_val:.0f} kg/ha) is excessively high; interferes with micronutrient uptake."
        p_msg_ta = f"பாஸ்பரஸ் ({p_val:.0f} kg/ha) அளவுக்கு அதிகமாக உள்ளது."
        p_act_en = "Do not apply phosphatic fertilizer."
        p_act_ta = "பாஸ்பேட் உரங்களை இட வேண்டாம்."

    add_check(
        parameter="Phosphorus (P)",
        value=f"{p_val:.0f} kg/ha",
        status=p_status,
        rec_range=p_rules["desc"],
        msg_en=p_msg_en,
        msg_ta=p_msg_ta,
        action_en=p_act_en,
        action_ta=p_act_ta,
        is_critical=False
    )

    # --- 5. Potassium (K) Evaluation ---
    k_val = float(field_data.get("npk_potassium", 40))
    k_rules = rules["potassium"]
    if k_rules["optimal_min"] <= k_val <= k_rules["optimal_max"]:
        k_status = "good"
        k_msg_en = f"Potassium level ({k_val:.0f} kg/ha) is optimal for {crop_name_en}."
        k_msg_ta = f"பொட்டாசியம் அளவு ({k_val:.0f} kg/ha) {crop_name_ta} பயிருக்கு உகந்ததாக உள்ளது."
        k_act_en = None
        k_act_ta = None
    elif k_rules["tolerable_min"] <= k_val < k_rules["optimal_min"]:
        k_status = "borderline"
        k_msg_en = f"Potassium ({k_val:.0f} kg/ha) is slightly low. Recommended: {k_rules['optimal_min']}–{k_rules['optimal_max']} kg/ha."
        k_msg_ta = f"பொட்டாசியம் ({k_val:.0f} kg/ha) சற்றே குறைவாக உள்ளது. பரிந்துரை: {k_rules['optimal_min']}–{k_rules['optimal_max']} kg/ha."
        k_act_en = f"Apply Muriate of Potash (MOP) to reach recommended {k_rules['recommended']} kg/ha."
        k_act_ta = f"பொட்டாஷ் (MOP) உரமிட்டு {k_rules['recommended']} kg/ha அளவை அடையவும்."
    elif k_rules["optimal_max"] < k_val <= k_rules["tolerable_max"]:
        k_status = "borderline"
        k_msg_en = f"Potassium ({k_val:.0f} kg/ha) is high but tolerable."
        k_msg_ta = f"பொட்டாசியம் ({k_val:.0f} kg/ha) சற்று அதிகமாக இருந்தாலும் ஏற்கக்கூடியது."
        k_act_en = "Withhold additional potash."
        k_act_ta = "கூடுதல் பொட்டாஷ் உரத்தை தவிர்க்கவும்."
    elif k_val < k_rules["tolerable_min"]:
        k_status = "poor"
        k_msg_en = f"Potassium ({k_val:.0f} kg/ha) is severely deficient (below {k_rules['tolerable_min']} kg/ha). Results in poor fruit firmness and disease vulnerability."
        k_msg_ta = f"பொட்டாசியம் ({k_val:.0f} kg/ha) மிகக் குறைவாக உள்ளது ({k_rules['tolerable_min']} kg/haக்கு கீழ்). காய் தரத்தைக் குறைக்கும்."
        k_act_en = f"Apply basal Muriate of Potash (MOP @ 60–80 kg/ha) to support sturdy stems and disease resistance."
        k_act_ta = "காய் தரம் மற்றும் நோய் எதிர்ப்பிற்கு பொட்டாஷ் (MOP) அடியுரமாக இடவும்."
    else:
        k_status = "poor"
        k_msg_en = f"Potassium ({k_val:.0f} kg/ha) is excessively high; blocks magnesium absorption."
        k_msg_ta = f"பொட்டாசியம் ({k_val:.0f} kg/ha) அளவுக்கு அதிகமாக உள்ளது."
        k_act_en = "Skip potash fertilization."
        k_act_ta = "பொட்டாஷ் உரமிடுவதைத் தவிர்க்கவும்."

    add_check(
        parameter="Potassium (K)",
        value=f"{k_val:.0f} kg/ha",
        status=k_status,
        rec_range=k_rules["desc"],
        msg_en=k_msg_en,
        msg_ta=k_msg_ta,
        action_en=k_act_en,
        action_ta=k_act_ta,
        is_critical=False
    )

    # --- 6. Soil Type Evaluation (Critical) ---
    soil_input = str(field_data.get("soil_type", "Loamy")).strip()
    s_rules = rules["soil_types"]
    soil_status = "borderline"
    soil_msg_en = f"Soil type '{soil_input}' is acceptable for {crop_name_en}."
    soil_msg_ta = f"'{soil_input}' மண் வகை {crop_name_ta} பயிருக்கு ஏற்கத்தக்கது."
    soil_act_en = None
    soil_act_ta = None

    if any(st.lower() in soil_input.lower() or soil_input.lower() in st.lower() for st in s_rules["good"]):
        soil_status = "good"
        soil_msg_en = f"Soil type '{soil_input}' provides optimal aeration and drainage for {crop_name_en}."
        soil_msg_ta = f"'{soil_input}' மண் வகை {crop_name_ta} பயிரின் வேர் வளர்ச்சிக்கு உகந்த வடிகால் கொண்டது."
    elif any(st.lower() in soil_input.lower() or soil_input.lower() in st.lower() for st in s_rules["poor"]):
        soil_status = "poor"
        if matched_crop_key == "Potato":
            soil_msg_en = f"Heavy clay/compact soil '{soil_input}' is unsuitable for Potato. Compacted soil deforms tubers and leads to rotting."
            soil_msg_ta = f"களிமண் நிலம் உருளைக்கிழங்கு கிழங்கு பெருக்கத்திற்கு ஏற்றதல்ல; கிழங்கு அழுகலை உண்டாக்கும்."
            soil_act_en = "Plant in loose, well-drained sandy loam or incorporate significant sand and compost to lighten soil texture."
            soil_act_ta = "மணல் கலந்த வண்டல் மண்ணில் நடவு செய்யவும் அல்லது மண்ணை இலகுவாக்க மணல் மற்றும் மட்கிய உரம் சேர்க்கவும்."
        else:
            soil_msg_en = f"Soil type '{soil_input}' has poor drainage or texture unsuitable for {crop_name_en}."
            soil_msg_ta = f"'{soil_input}' மண் வகை வடிகால் வசதி குறைவால் {crop_name_ta} பயிருக்கு ஏற்றதல்ல."
            soil_act_en = "Improve soil structure with liberal application of organic farmyard manure (25 tonnes/ha)."
            soil_act_ta = "மண்ணின் அமைப்பை மேம்படுத்த ஏக்கருக்கு அதிக தொழு உரம் இடவும்."
    else:
        soil_status = "borderline"
        soil_msg_en = f"Soil type '{soil_input}' is borderline for {crop_name_en}. Ensure ridge drainage."
        soil_msg_ta = f"'{soil_input}' மண் வகை மிதமானது. வடிகால் இருப்பதை உறுதி செய்யவும்."
        soil_act_en = "Form raised broad beds to safeguard roots from excess compaction."
        soil_act_ta = "பாத்திகளை உயர்த்தி அமைத்து வேர் அழுகலைத் தவிர்க்கவும்."

    add_check(
        parameter="Soil Type",
        value=soil_input,
        status=soil_status,
        rec_range=", ".join(s_rules["good"]),
        msg_en=soil_msg_en,
        msg_ta=soil_msg_ta,
        action_en=soil_act_en,
        action_ta=soil_act_ta,
        is_critical=True
    )

    # --- 7. Irrigation Method Compatibility ---
    irrig_input = str(field_data.get("irrigation_method", "Drip")).strip()
    i_rules = rules["irrigation_methods"]
    irrig_status = "borderline"
    irrig_msg_en = f"Irrigation method '{irrig_input}' is acceptable."
    irrig_msg_ta = f"'{irrig_input}' பாசன முறை ஏற்கத்தக்கது."
    irrig_act_en = None
    irrig_act_ta = None

    if any(m.lower() in irrig_input.lower() for m in i_rules["good"]):
        irrig_status = "good"
        irrig_msg_en = f"'{irrig_input}' irrigation is highly compatible with {crop_name_en}."
        irrig_msg_ta = f"'{irrig_input}' பாசன முறை {crop_name_ta} பயிருக்கு மிகவும் சிறந்தது."
    elif any(m.lower() in irrig_input.lower() for m in i_rules["poor"]):
        irrig_status = "poor"
        if "sprinkler" in irrig_input.lower():
            irrig_msg_en = f"Overhead sprinkler irrigation is contraindicated for {crop_name_en}. Wetting foliage triggers rapid Early/Late Blight fungal outbreaks."
            irrig_msg_ta = f"தெளிப்பு நீர் பாசனம் {crop_name_ta} இலைகளை நனைத்து இலைக்கருகல் பூஞ்சை நோய்களை வேகமாக பரப்பும்."
            irrig_act_en = "Switch to drip irrigation or ground furrow irrigation to keep the foliage canopy completely dry."
            irrig_act_ta = "இலைகள் நனையாமல் இருக்க சொட்டுநீர் அல்லது வாய்க்கால் பாசனத்திற்கு மாறவும்."
        elif "rain-fed" in irrig_input.lower():
            irrig_msg_en = f"Rain-fed cultivation is unviable for commercial {crop_name_en}; drought during flowering causes severe blossom and fruit drop."
            irrig_msg_ta = f"மானாவாரி முறை {crop_name_ta} பயிருக்கு போதுமானதாக இல்லை; பூக்கள் உதிரும்."
            irrig_act_en = "Arrange supplemental micro-irrigation before establishing commercial crop."
            irrig_act_ta = "பயிர் வைப்பதற்கு முன் துணை பாசன வசதி ஏற்படுத்தவும்."
        else:
            irrig_msg_en = f"Irrigation method '{irrig_input}' is unsuitable for {crop_name_en}."
            irrig_msg_ta = f"'{irrig_input}' பாசன முறை {crop_name_ta} பயிருக்கு உகந்ததல்ல."
            irrig_act_en = "Adopt drip or furrow irrigation."
            irrig_act_ta = "சொட்டுநீர் அல்லது வாய்க்கால் பாசனத்தை தேர்வு செய்யவும்."
    else:
        irrig_status = "borderline"
        irrig_msg_en = f"'{irrig_input}' is acceptable but monitor for standing water."
        irrig_msg_ta = f"'{irrig_input}' பாசனம் ஏற்கக்கூடியது, ஆனால் நீர் தேங்காமல் கவனிக்கவும்."
        irrig_act_en = "Regulate water flow to prevent stagnation around stem collars."
        irrig_act_ta = "தண்டுப் பகுதியில் நீர் தேங்குவதைத் தடுக்க சீராக பாசனம் செய்யவும்."

    add_check(
        parameter="Irrigation Method",
        value=irrig_input,
        status=irrig_status,
        rec_range=", ".join(i_rules["good"]),
        msg_en=irrig_msg_en,
        msg_ta=irrig_msg_ta,
        action_en=irrig_act_en,
        action_ta=irrig_act_ta,
        is_critical=False
    )

    # --- 8. Season Compatibility (Critical) ---
    season_input = str(field_data.get("season", "Kharif")).strip()
    season_rules = rules["seasons"]
    season_status = "borderline"
    season_msg_en = f"Season '{season_input}' is acceptable for {crop_name_en}."
    season_msg_ta = f"'{season_input}' பருவம் {crop_name_ta} பயிருக்கு ஏற்கத்தக்கது."
    season_act_en = None
    season_act_ta = None

    if any(s.lower() in season_input.lower() for s in season_rules["good"]):
        season_status = "good"
        season_msg_en = f"'{season_input}' is the ideal growing season for {crop_name_en}."
        season_msg_ta = f"'{season_input}' பருவம் {crop_name_ta} சாகுபடிக்கு மிகவும் உகந்த காலம்."
    elif any(s.lower() in season_input.lower() for s in season_rules["poor"]):
        season_status = "poor"
        if matched_crop_key == "Potato":
            season_msg_en = f"Summer / Zaid ({season_input}) is unsuitable for Potato in plains. Night temperatures > 22°C completely suppress tuberization."
            season_msg_ta = f"கோடை காலம் உருளைக்கிழங்கு கிழங்கு உற்பத்திக்கு உகந்ததல்ல. அதிக வெப்பம் கிழங்கு உருவாவதைத் தடுக்கும்."
            season_act_en = "Schedule potato planting during cool winter (Rabi) season, or in high-altitude cool climates only."
            season_act_ta = "குளிர்கால கார்த்திகைப் பட்டத்தில் (Rabi) அல்லது குளிர்ந்த மலைப்பிரதேசங்களில் மட்டும் நடவு செய்யவும்."
        else:
            season_msg_en = f"Season '{season_input}' is unfavorable for {crop_name_en}."
            season_msg_ta = f"'{season_input}' பருவம் {crop_name_ta} பயிருக்கு உகந்ததல்ல."
            season_act_en = f"Plan cultivation during {', '.join(season_rules['good'])}."
            season_act_ta = f"{', '.join(season_rules['good'])} பருவத்தில் பயிரிட திட்டமிடவும்."
    else:
        season_status = "borderline"
        if matched_crop_key == "Tomato" and any(w in season_input.lower() for w in ["zaid", "summer"]):
            season_msg_en = "Summer season requires temperature management (shade netting or mulching) to prevent tomato blossom drop."
            season_msg_ta = "கோடைக்காலத்தில் தக்காளி பூக்கள் உதிர்வதைத் தடுக்க நிழல்வலை அல்லது மூடாக்கு அவசியம்."
            season_act_en = "Use shade net or heat-tolerant hybrid varieties."
            season_act_ta = "நிழல்வலை அல்லது வெப்பத்தைத் தாங்கும் கலப்பின விதைகளைப் பயன்படுத்தவும்."
        elif matched_crop_key == "Potato" and "kharif" in season_input.lower():
            season_msg_en = "Kharif potato is only feasible in high altitude hills (e.g. Nilgiris/Ooty); plains require Rabi winter."
            season_msg_ta = "ஆடிப்பட்ட உருளைக்கிழங்கு மலைப்பிரதேசங்களில் (ஊட்டி) மட்டுமே சாத்தியம்; சமவெளியில் குளிர்காலம் தேவை."
            season_act_en = "Ensure local temperatures stay below 25°C during day and 18°C at night."
            season_act_ta = "பகல் வெப்பநிலை 25°C மற்றும் இரவு 18°Cக்கு குறைவாக இருப்பதை உறுதி செய்யவும்."
        else:
            season_msg_en = f"Season '{season_input}' is borderline for {crop_name_en}."
            season_msg_ta = f"'{season_input}' பருவம் {crop_name_ta} பயிருக்கு மிதமானது."

    add_check(
        parameter="Season",
        value=season_input,
        status=season_status,
        rec_range=", ".join(season_rules["good"]),
        msg_en=season_msg_en,
        msg_ta=season_msg_ta,
        action_en=season_act_en,
        action_ta=season_act_ta,
        is_critical=True
    )

    # --- 9. Field Size & Location (Informational) ---
    f_size = field_data.get("field_size", 2.0)
    f_unit = field_data.get("field_size_unit", "Acre")
    f_loc = field_data.get("field_location", "Tamil Nadu")

    checks.append({
        "parameter": "Field Size & Location",
        "value": f"{f_size} {f_unit} ({f_loc})",
        "status": "good",
        "is_critical": False,
        "recommended_range": "Feasible for standard production",
        "message": f"Land parcel size of {f_size} {f_unit} in {f_loc} is adequate for commercial {crop_name_en}.",
        "message_ta": f"{f_loc} பகுதியில் உள்ள {f_size} {f_unit} நில அளவு {crop_name_ta} சாகுபடிக்கு போதுமானது."
    })

    # --- Overall Decision Calculation ---
    poor_checks = [c for c in checks if c["status"] == "poor"]
    borderline_checks = [c for c in checks if c["status"] == "borderline"]

    if poor_checks:
        overall_status = "Not Suitable for Planting"
        overall_status_ta = "நடவு செய்ய ஏற்றதல்ல"
        suitable = False
        status_level = "poor"
        primary_issues = [c["parameter"] for c in poor_checks]
        message = f"Field is not suitable for planting {crop_name_en} due to critical deficiencies in: {', '.join(primary_issues)}."
        message_ta = f"முக்கிய காரணிகளில் ({', '.join(primary_issues)}) குறைபாடுகள் உள்ளதால் {crop_name_ta} பயிரிட இந்த நிலம் தற்போது ஏற்றதல்ல."
    elif borderline_checks:
        overall_status = "Suitable with Improvements"
        overall_status_ta = "மேம்பாடுகளுடன் பயிரிடலாம்"
        suitable = True
        status_level = "borderline"
        borderline_params = [c["parameter"] for c in borderline_checks]
        message = f"Field is suitable for {crop_name_en} with minor improvements recommended for: {', '.join(borderline_params)}."
        message_ta = f"சில முன்னேற்றங்களுடன் ({', '.join(borderline_params)}) {crop_name_ta} பயிரிட இந்த நிலம் உகந்தது."
    else:
        overall_status = "Suitable for Planting"
        overall_status_ta = "நடவு செய்ய உகந்தது"
        suitable = True
        status_level = "good"
        message = f"All field parameters are within the recommended agronomic range for planting {crop_name_en}."
        message_ta = f"அனைத்து நில அளவீடுகளும் {crop_name_ta} சாகுபடிக்கு மிகவும் உகந்த நிலையில் உள்ளன."

    # Recommendations
    recommendations: List[str] = []
    recommendations_ta: List[str] = []

    if not suitable:
        recommendations.append(f"Improve the identified soil and field conditions before planting {crop_name_en}.")
        recommendations_ta.append(f"{crop_name_ta} பயிரிடுவதற்கு முன் மேற்கண்ட குறைபாடுகளை சரிசெய்து நிலத்தை தயார் செய்யவும்.")
        for imp in improvements[:3]:
            recommendations.append(f"{imp['parameter']}: {imp['action']}")
            recommendations_ta.append(f"{imp['parameter']}: {imp['action_ta']}")
    elif borderline_checks:
        recommendations.append(f"Your field can support {crop_name_en}, but addressing borderline parameters will maximize harvest yield.")
        recommendations_ta.append(f"{crop_name_ta} பயிரிடலாம், ஆனால் சுட்டிக்காட்டப்பட்ட அளவீடுகளை மேம்படுத்துவது அதிக மகசூலைத் தரும்.")
        for imp in improvements[:2]:
            recommendations.append(f"{imp['parameter']}: {imp['action']}")
            recommendations_ta.append(f"{imp['parameter']}: {imp['action_ta']}")
    else:
        recommendations.append(f"Your current field conditions are suitable for planting {crop_name_en}.")
        recommendations_ta.append(f"தங்களின் தர்தோதைய நில சூழல் {crop_name_ta} பயிரிட மிகவும் உகந்ததாக உள்ளது.")
        recommendations.append(f"Maintain routine irrigation and follow TNAU recommended basal fertilization schedule during sowing.")
        recommendations_ta.append(f"வழக்கமான பாசனத்தை பராமரித்து, விதைப்பின் போது பரிந்துரைக்கப்பட்ட அடியுரங்களை இடவும்.")

    return {
        "valid": True,
        "crop_type": crop_name_en,
        "overall_status": overall_status,
        "overall_status_ta": overall_status_ta,
        "suitable": suitable,
        "status_level": status_level,
        "npk_unit": "kg/ha",
        "water_capacity_definition": "Available Soil Moisture / Water Holding Capacity (%)",
        "message": message,
        "message_ta": message_ta,
        "checks": checks,
        "improvements": improvements,
        "recommendations": recommendations,
        "recommendations_ta": recommendations_ta
    }
