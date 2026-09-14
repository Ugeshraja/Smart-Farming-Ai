"""
SmartFarm AI - Comprehensive Field Agronomic Suitability Tests
Covers all 11 test cases required for the My Field suitability evaluation.
"""

import sys
import os
import pytest

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient
from main import app
from services.field_evaluator import evaluate_field_suitability

client = TestClient(app)

BASE_BRINJAL_FIELD = {
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


def test_1_valid_brinjal_field():
    """TEST 1: Normal valid Brinjal field -> Suitable for Planting (🟢)"""
    res = evaluate_field_suitability(BASE_BRINJAL_FIELD)
    assert res["valid"] is True
    assert res["suitable"] is True
    assert res["overall_status"] == "Suitable for Planting"
    assert res["status_level"] == "good"
    assert res["crop_type"] == "Brinjal"
    assert res["npk_unit"] == "kg/ha"
    assert all(c["status"] == "good" for c in res["checks"])


def test_2_brinjal_high_ph():
    """TEST 2: Brinjal pH = 8.2 -> pH marked as poor, Overall = Not Suitable for Planting (🔴)"""
    field = {**BASE_BRINJAL_FIELD, "soil_ph": 8.2}
    res = evaluate_field_suitability(field)
    assert res["valid"] is True
    assert res["suitable"] is False
    assert res["overall_status"] == "Not Suitable for Planting"
    assert res["status_level"] == "poor"
    ph_check = next(c for c in res["checks"] if c["parameter"] == "Soil pH")
    assert ph_check["status"] == "poor"
    assert "too high" in ph_check["message"].lower() or "alkaline" in ph_check["message"].lower()


def test_3_brinjal_low_ph():
    """TEST 3: Brinjal pH = 4.5 -> pH marked as poor, Overall = Not Suitable for Planting (🔴)"""
    field = {**BASE_BRINJAL_FIELD, "soil_ph": 4.5}
    res = evaluate_field_suitability(field)
    assert res["valid"] is True
    assert res["suitable"] is False
    assert res["overall_status"] == "Not Suitable for Planting"
    assert res["status_level"] == "poor"
    ph_check = next(c for c in res["checks"] if c["parameter"] == "Soil pH")
    assert ph_check["status"] == "poor"
    assert "severely acidic" in ph_check["message"].lower() or "below" in ph_check["message"].lower()


def test_4_low_water_capacity():
    """TEST 4: Water capacity = 35% -> marked as poor/insufficient, Overall reflects failure"""
    field = {**BASE_BRINJAL_FIELD, "water_capacity": "35%"}
    res = evaluate_field_suitability(field)
    assert res["valid"] is True
    assert res["suitable"] is False
    assert res["overall_status"] == "Not Suitable for Planting"
    water_check = next(c for c in res["checks"] if c["parameter"] == "Water Capacity")
    assert water_check["status"] == "poor"
    assert "insufficient" in water_check["message"].lower() or "drought" in water_check["message"].lower()


def test_5_low_npk():
    """TEST 5: N = 30, P = 10, K = 10 -> N/P/K individually show problems, Overall reflects failure"""
    field = {
        **BASE_BRINJAL_FIELD,
        "npk_nitrogen": 30,
        "npk_phosphorus": 10,
        "npk_potassium": 10
    }
    res = evaluate_field_suitability(field)
    assert res["valid"] is True
    assert res["suitable"] is False
    assert res["overall_status"] == "Not Suitable for Planting"
    n_check = next(c for c in res["checks"] if c["parameter"] == "Nitrogen (N)")
    p_check = next(c for c in res["checks"] if c["parameter"] == "Phosphorus (P)")
    k_check = next(c for c in res["checks"] if c["parameter"] == "Potassium (K)")
    assert n_check["status"] == "poor"
    assert p_check["status"] == "poor"
    assert k_check["status"] == "poor"


def test_6_tomato_rules():
    """TEST 6: Tomato: pH = 6.4, N = 90, P = 45, K = 55, Irrigation = Drip -> Evaluated with Tomato rules"""
    field = {
        "crop_type": "Tomato",
        "soil_type": "Red Loamy",
        "soil_ph": 6.4,
        "water_capacity": "68%",
        "field_size": 1.5,
        "field_size_unit": "Acre",
        "npk_nitrogen": 90,
        "npk_phosphorus": 45,
        "npk_potassium": 55,
        "sowing_date": "2026-07-01",
        "irrigation_method": "Drip",
        "field_location": "Tamil Nadu",
        "season": "Kharif"
    }
    res = evaluate_field_suitability(field)
    assert res["valid"] is True
    assert res["crop_type"] == "Tomato"
    assert res["suitable"] is True
    assert res["overall_status"] == "Suitable for Planting"
    ph_check = next(c for c in res["checks"] if c["parameter"] == "Soil pH")
    assert "Tomato" in ph_check["message"]
    assert "6.0–6.8" in ph_check["message"] or "6.0 – 6.8" in ph_check["message"] or "6.0" in ph_check["message"]


def test_7_potato_rules():
    """TEST 7: Potato: pH = 5.8, N = 120, P = 100, K = 110, Season = Rabi, Irrigation = Furrow/Drip"""
    field = {
        "crop_type": "Potato",
        "soil_type": "Sandy Loam",
        "soil_ph": 5.8,
        "water_capacity": "70%",
        "field_size": 2.5,
        "field_size_unit": "Acre",
        "npk_nitrogen": 120,
        "npk_phosphorus": 100,
        "npk_potassium": 110,
        "sowing_date": "2026-10-15",
        "irrigation_method": "Drip",
        "field_location": "Tamil Nadu",
        "season": "Rabi"
    }
    res = evaluate_field_suitability(field)
    assert res["valid"] is True
    assert res["crop_type"] == "Potato"
    assert res["suitable"] is True
    assert res["overall_status"] == "Suitable for Planting"
    ph_check = next(c for c in res["checks"] if c["parameter"] == "Soil pH")
    assert "Potato" in ph_check["message"]
    assert "5.0" in ph_check["message"]


def test_8_potato_high_ph_common_scab():
    """TEST 8: Potato pH = 7.5 -> Potato-specific Common Scab risk triggered and marked as poor"""
    field = {
        "crop_type": "Potato",
        "soil_type": "Sandy Loam",
        "soil_ph": 7.5,
        "water_capacity": "70%",
        "field_size": 2.5,
        "field_size_unit": "Acre",
        "npk_nitrogen": 120,
        "npk_phosphorus": 100,
        "npk_potassium": 110,
        "sowing_date": "2026-10-15",
        "irrigation_method": "Drip",
        "field_location": "Tamil Nadu",
        "season": "Rabi"
    }
    res = evaluate_field_suitability(field)
    assert res["valid"] is True
    assert res["suitable"] is False
    assert res["overall_status"] == "Not Suitable for Planting"
    ph_check = next(c for c in res["checks"] if c["parameter"] == "Soil pH")
    assert ph_check["status"] == "poor"
    assert "common scab" in ph_check["message"].lower() or "scabies" in ph_check["message"].lower()


def test_9_missing_invalid_values():
    """TEST 9: Missing values / non-numeric pH -> Validation error; no false 'Suitable' result"""
    # Missing pH
    invalid_field_1 = {**BASE_BRINJAL_FIELD, "soil_ph": ""}
    res_1 = evaluate_field_suitability(invalid_field_1)
    assert res_1["valid"] is False
    assert res_1["suitable"] is False
    assert res_1["overall_status"] == "Validation Error"

    # Impossible pH
    invalid_field_2 = {**BASE_BRINJAL_FIELD, "soil_ph": 14.5}
    res_2 = evaluate_field_suitability(invalid_field_2)
    assert res_2["valid"] is False
    assert res_2["suitable"] is False

    # Negative nitrogen
    invalid_field_3 = {**BASE_BRINJAL_FIELD, "npk_nitrogen": -20}
    res_3 = evaluate_field_suitability(invalid_field_3)
    assert res_3["valid"] is False
    assert res_3["suitable"] is False


def test_10_dynamic_update_no_stale_assessment():
    """TEST 10: Change field after previous successful assessment -> dynamic recalculation, no stale result"""
    # 1. First save valid Brinjal field
    put_1 = client.put("/api/field", json={
        "crop_type": "Brinjal",
        "soil_ph": 6.4,
        "water_capacity": "72%",
        "npk_nitrogen": 80,
        "npk_phosphorus": 40,
        "npk_potassium": 40
    })
    assert put_1.status_code == 200
    data_1 = put_1.json()
    assert data_1["assessment"]["suitable"] is True
    assert data_1["assessment"]["overall_status"] == "Suitable for Planting"

    # 2. Change soil_ph to 8.5
    put_2 = client.put("/api/field", json={
        "soil_ph": 8.5
    })
    assert put_2.status_code == 200
    data_2 = put_2.json()
    assert data_2["assessment"]["suitable"] is False
    assert data_2["assessment"]["overall_status"] == "Not Suitable for Planting"

    # 3. GET /api/field confirms the updated assessment is dynamic and NOT stale
    get_res = client.get("/api/field")
    assert get_res.status_code == 200
    get_data = get_res.json()
    assert get_data["soil_ph"] == 8.5
    assert get_data["assessment"]["suitable"] is False
    assert get_data["assessment"]["overall_status"] == "Not Suitable for Planting"

    # Reset back to 6.4 for clean state
    client.put("/api/field", json={"soil_ph": 6.4})


def test_11_unsupported_crop():
    """TEST 11: Unsupported crop -> 'Assessment unavailable for this crop', NOT 'Suitable for Planting'"""
    field = {**BASE_BRINJAL_FIELD, "crop_type": "Cotton"}
    res = evaluate_field_suitability(field)
    assert res["valid"] is True
    assert res["suitable"] is False
    assert res["status_level"] == "unavailable"
    assert res["overall_status"] == "Assessment unavailable for this crop"
    assert "Verified suitability rules are not currently available" in res["message"]


def test_api_endpoints():
    """Verify GET, PUT, and POST /evaluate endpoints"""
    # POST /api/field/evaluate
    res_eval = client.post("/api/field/evaluate", json=BASE_BRINJAL_FIELD)
    assert res_eval.status_code == 200
    body = res_eval.json()
    assert "assessment" in body
    assert body["assessment"]["overall_status"] == "Suitable for Planting"


if __name__ == "__main__":
    print("\n--- RUNNING ALL 11 FIELD AGRONOMIC SUITABILITY TESTS ---")
    test_1_valid_brinjal_field()
    print("✓ TEST 1 PASSED: Valid Brinjal field evaluated as Suitable for Planting")

    test_2_brinjal_high_ph()
    print("✓ TEST 2 PASSED: Brinjal high pH (8.2) evaluated as Not Suitable for Planting")

    test_3_brinjal_low_ph()
    print("✓ TEST 3 PASSED: Brinjal low pH (4.5) evaluated as Not Suitable for Planting")

    test_4_low_water_capacity()
    print("✓ TEST 4 PASSED: Low water capacity (35%) evaluated as Not Suitable for Planting")

    test_5_low_npk()
    print("✓ TEST 5 PASSED: Low NPK (30-10-10) evaluated with individual nutrient deficiencies")

    test_6_tomato_rules()
    print("✓ TEST 6 PASSED: Tomato evaluated against Tomato-specific rules (6.0-6.8 pH)")

    test_7_potato_rules()
    print("✓ TEST 7 PASSED: Potato evaluated against Potato-specific rules (5.0-6.5 pH, Rabi season)")

    test_8_potato_high_ph_common_scab()
    print("✓ TEST 8 PASSED: Potato pH 7.5 triggers Common Scab risk and Not Suitable status")

    test_9_missing_invalid_values()
    print("✓ TEST 9 PASSED: Missing/invalid/impossible values rejected without false suitability")

    test_10_dynamic_update_no_stale_assessment()
    print("✓ TEST 10 PASSED: Field modification dynamically updates assessment (no stale cache)")

    test_11_unsupported_crop()
    print("✓ TEST 11 PASSED: Unsupported crop returns 'Assessment unavailable for this crop'")

    test_api_endpoints()
    print("✓ API ENDPOINTS TEST PASSED: GET, PUT, and POST /api/field/evaluate functional")

    print("\n=======================================================")
    print("🎉 ALL 11 FIELD SUITABILITY TESTS COMPLETED SUCCESSFULLY!")
    print("=======================================================\n")
