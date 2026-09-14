"""
Test Field Profile and Government Agriculture Schemes APIs
"""

import sys
import os

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_field_endpoints():
    print("\n--- 1. Testing GET /api/field ---")
    response = client.get("/api/field")
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    field = response.json()
    print("Initial Field Profile:", field)
    assert field["crop_type"] == "Brinjal"
    assert field["soil_type"] == "Loamy"
    assert field["soil_ph"] == 6.4
    assert field["water_capacity"] == "72%"
    assert field["field_size"] == 2.0
    assert field["npk_nitrogen"] == 80

    print("\n--- 2. Testing PUT /api/field ---")
    update_data = {
        "crop_type": "Tomato",
        "soil_ph": 6.6,
        "field_size": 3.5,
        "npk_nitrogen": 90
    }
    put_response = client.put("/api/field", json=update_data)
    assert put_response.status_code == 200, f"Expected 200, got {put_response.status_code}"
    updated = put_response.json()
    print("Updated Field Profile:", updated)
    assert updated["crop_type"] == "Tomato"
    assert updated["soil_ph"] == 6.6
    assert updated["field_size"] == 3.5
    assert updated["npk_nitrogen"] == 90
    assert updated["soil_type"] == "Loamy" # Preserved

    # Restore default demo field
    client.put("/api/field", json={
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
    })
    print("✓ Restored default demo profile.")

def test_schemes_endpoints():
    print("\n--- 3. Testing GET /api/schemes ---")
    response = client.get("/api/schemes")
    assert response.status_code == 200
    schemes = response.json()
    print(f"Total verified schemes returned: {len(schemes)}")
    assert len(schemes) >= 9

    print("\n--- 4. Testing Scheme Search & Filters ---")
    # Search "drip"
    res_search = client.get("/api/schemes?query=drip")
    assert res_search.status_code == 200
    drip_schemes = res_search.json()
    print(f"Schemes matching 'drip': {len(drip_schemes)}")
    assert any("pmksy" in s["name"].lower() for s in drip_schemes)

    # Filter State "Tamil Nadu"
    res_tn = client.get("/api/schemes?state=Tamil%20Nadu")
    assert res_tn.status_code == 200
    tn_schemes = res_tn.json()
    print(f"Schemes applicable to Tamil Nadu: {len(tn_schemes)}")
    assert len(tn_schemes) >= 7

    print("\n--- 5. Testing POST /api/schemes/evaluate ---")
    eval_payload = {
        "field_profile": {
            "crop_type": "Brinjal",
            "soil_type": "Loamy",
            "soil_ph": 6.4,
            "field_size": 2.0,
            "field_size_unit": "Acre",
            "field_location": "Tamil Nadu"
        }
    }
    res_eval = client.post("/api/schemes/evaluate", json=eval_payload)
    assert res_eval.status_code == 200
    eval_data = res_eval.json()
    print(f"Likely eligible count: {eval_data['likely_eligible_count']} / {eval_data['total_schemes_evaluated']}")
    assert eval_data["likely_eligible_count"] >= 3

    print("\n✓ ALL FIELD AND SCHEMES BACKEND TESTS PASSED!")

if __name__ == "__main__":
    test_field_endpoints()
    test_schemes_endpoints()
