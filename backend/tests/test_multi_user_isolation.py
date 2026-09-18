"""
SmartFarm AI - Multi-User Isolation Automated Test Suite
Verifies:
  1. Supabase Auth registration & login (auth.users and public.users)
  2. My Field isolation between User A and User B
  3. Prediction History isolation
  4. AI Reports isolation and URL ownership protection (preventing User B from accessing User A's report)
  5. Delete isolation
"""

import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from fastapi.testclient import TestClient
from main import app
from database.connection import get_engine
from sqlalchemy import text

client = TestClient(app)

def cleanup_test_accounts():
    eng = get_engine()
    if eng:
        with eng.begin() as conn:
            for em in ['usera@test.com', 'userb@test.com']:
                # Find user_id
                u = conn.execute(text("SELECT id FROM auth.users WHERE lower(email) = :em;"), {"em": em}).fetchone()
                if u:
                    uid = str(u[0])
                    conn.execute(text("DELETE FROM public.ai_reports WHERE user_id = :uid;"), {"uid": uid})
                    conn.execute(text("DELETE FROM public.disease_predictions WHERE user_id = :uid;"), {"uid": uid})
                    conn.execute(text("DELETE FROM public.fields WHERE user_id = :uid;"), {"uid": uid})
                    conn.execute(text("DELETE FROM public.users WHERE email = :em;"), {"em": em})
                    conn.execute(text("DELETE FROM auth.users WHERE email = :em;"), {"em": em})

def test_full_user_isolation():
    cleanup_test_accounts()

    print("\n--- STEP 1: REGISTER USER A AND USER B ---")
    # Register User A
    res_a = client.post("/api/auth/signup", json={
        "name": "User Alpha",
        "email": "usera@test.com",
        "password": "PasswordA123!",
        "phone": "+91 90000 00001",
        "farm_location": "Coimbatore, Tamil Nadu",
        "preferred_language": "en"
    })
    assert res_a.status_code == 201, f"User A signup failed: {res_a.text}"
    token_a = res_a.json()["access_token"]
    user_a = res_a.json()["user"]
    uid_a = user_a["user_id"]
    print(f"User A registered successfully with UID: {uid_a}")

    # Register User B
    res_b = client.post("/api/auth/signup", json={
        "name": "User Beta",
        "email": "userb@test.com",
        "password": "PasswordB123!",
        "phone": "+91 90000 00002",
        "farm_location": "Madurai, Tamil Nadu",
        "preferred_language": "ta"
    })
    assert res_b.status_code == 201, f"User B signup failed: {res_b.text}"
    token_b = res_b.json()["access_token"]
    user_b = res_b.json()["user"]
    uid_b = user_b["user_id"]
    print(f"User B registered successfully with UID: {uid_b}")

    assert uid_a != uid_b, "User A and User B must have distinct UIDs"

    headers_a = {"Authorization": f"Bearer {token_a}"}
    headers_b = {"Authorization": f"Bearer {token_b}"}

    print("\n--- STEP 2: TEST MY FIELD ISOLATION ---")
    # User A sets: Crop = Tomato, Soil pH = 6.5, Water Capacity = 70%
    put_a = client.put("/api/field", headers=headers_a, json={
        "crop_type": "Tomato",
        "soil_ph": 6.5,
        "water_capacity": "70%",
        "field_size": 3.0,
        "irrigation_method": "Drip"
    })
    assert put_a.status_code == 200, f"User A field update failed: {put_a.text}"
    field_a = put_a.json()["field"]
    assert field_a["crop_type"] == "Tomato"
    assert field_a["soil_ph"] == 6.5
    assert "70%" in str(field_a["water_capacity"])
    print("User A saved My Field: Tomato, 6.5, 70%")

    # User B reads their field: MUST NOT see User A's custom field
    get_b = client.get("/api/field", headers=headers_b)
    assert get_b.status_code == 200
    field_b_initial = get_b.json()["field"]
    print("User B initial field crop:", field_b_initial.get("crop_type"))

    # User B sets: Crop = Potato, Soil pH = 5.8, Water Capacity = 50%
    put_b = client.put("/api/field", headers=headers_b, json={
        "crop_type": "Potato",
        "soil_ph": 5.8,
        "water_capacity": "50%",
        "field_size": 1.5,
        "irrigation_method": "Sprinkler"
    })
    assert put_b.status_code == 200, f"User B field update failed: {put_b.text}"
    field_b = put_b.json()["field"]
    assert field_b["crop_type"] == "Potato"
    assert field_b["soil_ph"] == 5.8
    assert "50%" in str(field_b["water_capacity"])
    print("User B saved My Field: Potato, 5.8, 50%")

    # User A re-fetches field: MUST STILL be Tomato, 6.5, 70%
    get_a_again = client.get("/api/field", headers=headers_a)
    assert get_a_again.status_code == 200
    field_a_again = get_a_again.json()["field"]
    assert field_a_again["crop_type"] == "Tomato"
    assert field_a_again["soil_ph"] == 6.5
    assert "70%" in str(field_a_again["water_capacity"])
    print("User A re-verified field: retains Tomato, 6.5, 70% and did NOT receive User B's Potato!")

    print("\n--- STEP 3: PREDICTION HISTORY ISOLATION ---")
    # User A creates a prediction
    pred_a_res = client.post("/api/predictions", headers=headers_a, json={
        "id": "PRED-ALPHA-001",
        "crop": "Tomato",
        "disease": "Tomato Early Blight",
        "confidence": 96.5,
        "imageUrl": "https://example.com/leaf_a.jpg",
        "advisory": {
            "text": "Apply copper fungicide and isolate infected leaves."
        }
    })
    assert pred_a_res.status_code == 200, f"Save prediction A failed: {pred_a_res.text}"
    print("User A created prediction PRED-ALPHA-001")

    # User B fetches predictions: User B must have 0 predictions!
    list_b = client.get("/api/predictions", headers=headers_b)
    assert list_b.status_code == 200
    preds_b = list_b.json()
    assert len(preds_b) == 0, f"User B should have 0 predictions, but found: {preds_b}"
    print(f"User B prediction count verified: 0 (User A's prediction is NOT visible)")

    # User B creates their own prediction
    pred_b_res = client.post("/api/predictions", headers=headers_b, json={
        "id": "PRED-BETA-001",
        "crop": "Potato",
        "disease": "Potato Late Blight",
        "confidence": 98.2,
        "imageUrl": "https://example.com/leaf_b.jpg",
        "advisory": {
            "text": "Improve soil drainage and use mancozeb treatment."
        }
    })
    assert pred_b_res.status_code == 200
    print("User B created prediction PRED-BETA-001")

    # User B re-fetches: sees only PRED-BETA-001
    list_b_again = client.get("/api/predictions", headers=headers_b).json()
    assert len(list_b_again) == 1
    assert list_b_again[0]["id"] == "PRED-BETA-001"
    assert list_b_again[0]["crop"] == "Potato"
    print("User B sees only User B's prediction (PRED-BETA-001)")

    # User A re-fetches: sees only PRED-ALPHA-001
    list_a_again = client.get("/api/predictions", headers=headers_a).json()
    assert len(list_a_again) == 1
    assert list_a_again[0]["id"] == "PRED-ALPHA-001"
    assert list_a_again[0]["crop"] == "Tomato"
    print("User A sees only User A's prediction (PRED-ALPHA-001)")

    print("\n--- STEP 4: AI REPORTS & URL OWNERSHIP SECURITY ---")
    # User A can access report PRED-ALPHA-001
    rep_a = client.get("/api/reports/PRED-ALPHA-001", headers=headers_a)
    assert rep_a.status_code == 200
    assert "copper fungicide" in rep_a.json()["advisory_text"]
    print("User A successfully opened User A report PRED-ALPHA-001")

    # User B attempts to access User A's report directly: MUST BE 404 ACCESS DENIED!
    rep_b_hacking_a = client.get("/api/reports/PRED-ALPHA-001", headers=headers_b)
    assert rep_b_hacking_a.status_code == 404, f"Expected 404, got: {rep_b_hacking_a.status_code}"
    print("SECURITY PASSED: User B access to User A report was rejected with HTTP 404 (Access Denied)!")

    # User A attempts to access User B's report directly: MUST BE 404 ACCESS DENIED!
    rep_a_hacking_b = client.get("/api/reports/PRED-BETA-001", headers=headers_a)
    assert rep_a_hacking_b.status_code == 404
    print("SECURITY PASSED: User A access to User B report was rejected with HTTP 404 (Access Denied)!")

    print("\n--- STEP 5: DELETE ISOLATION ---")
    # User A deletes their prediction
    del_a = client.delete("/api/predictions/PRED-ALPHA-001", headers=headers_a)
    assert del_a.status_code == 200
    print("User A deleted prediction PRED-ALPHA-001")

    # Verify User A now has 0 predictions
    assert len(client.get("/api/predictions", headers=headers_a).json()) == 0

    # Verify User B's prediction is STILL INTACT!
    list_b_final = client.get("/api/predictions", headers=headers_b).json()
    assert len(list_b_final) == 1
    assert list_b_final[0]["id"] == "PRED-BETA-001"
    print("DELETE ISOLATION PASSED: User B's prediction remains completely untouched!")

    # Verify directly in database that users exist in auth.users and public.users
    eng = get_engine()
    with eng.connect() as conn:
        auth_users = conn.execute(text("SELECT email FROM auth.users WHERE lower(email) IN ('usera@test.com', 'userb@test.com');")).fetchall()
        assert len(auth_users) == 2, f"Expected 2 auth.users, found: {auth_users}"
        pub_users = conn.execute(text("SELECT email FROM public.users WHERE lower(email) IN ('usera@test.com', 'userb@test.com');")).fetchall()
        assert len(pub_users) == 2, f"Expected 2 public.users, found: {pub_users}"
    print("DATABASE VERIFICATION PASSED: Both test accounts exist in Supabase auth.users and public.users!")

    cleanup_test_accounts()
    print("\n>>> ALL MULTI-USER ISOLATION TESTS PASSED WITH 100% SUCCESS! <<<\n")

if __name__ == "__main__":
    test_full_user_isolation()
