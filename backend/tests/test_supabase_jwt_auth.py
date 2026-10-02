import os
import sys
from pathlib import Path
import jwt
from datetime import datetime, timedelta, timezone

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from services.supabase_auth_service import supabase_auth_service
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_supabase_auth_jwt_flow():
    print("\n--- Testing Supabase Auth GoTrue JWT Token Flow for Ugesh ---")
    
    # Simulate a token issued by Supabase GoTrue to Ugesh (signed by Supabase's project key, not FastAPI's SECRET_KEY)
    ugesh_uid = "59b18c99-d1e0-4443-b5ab-8b08d4517b80"
    supabase_dummy_secret = "external-supabase-gotrue-project-jwt-secret-xyz"
    
    exp_time = datetime.now(timezone.utc) + timedelta(hours=2)
    supabase_token = jwt.encode({
        "aud": "authenticated",
        "exp": exp_time,
        "sub": ugesh_uid,
        "email": "ugeshraja007@gmail.com",
        "role": "authenticated",
        "app_metadata": {"provider": "email"},
        "user_metadata": {"name": "Ugesh"}
    }, supabase_dummy_secret, algorithm="HS256")
    
    # 1. Test decode_access_token
    payload = supabase_auth_service.decode_access_token(supabase_token)
    assert payload is not None, "decode_access_token failed on valid Supabase GoTrue token"
    assert payload["sub"] == ugesh_uid, f"Expected {ugesh_uid}, got {payload.get('sub')}"
    assert payload["email"] == "ugeshraja007@gmail.com"
    print("✓ decode_access_token successfully decoded and DB-verified Ugesh's Supabase token:", payload["sub"])
    
    # 2. Test publishing post via FastAPI with this Supabase JWT
    headers = {"Authorization": f"Bearer {supabase_token}"}
    post_payload = {
        "crop": "Tomato",
        "topic": "Crop Health",
        "language": "en",
        "content": "hi everyone - testing tomato crop health from verified Supabase session"
    }
    
    resp = client.post("/api/community/posts", json=post_payload, headers=headers)
    assert resp.status_code == 201, f"Expected 201 Created, got {resp.status_code}: {resp.text}"
    created_post = resp.json()
    print("✓ Successfully published post with Supabase JWT. Post ID:", created_post["id"])
    assert created_post["farmerName"] == "Ugesh", f"Expected farmerName 'Ugesh', got {created_post.get('farmerName')}"
    assert created_post["crop"] == "Tomato"
    assert created_post["created_at"] is not None
    print("✓ Post author correctly resolved to:", created_post["farmerName"])
    print("✓ Real UTC timestamp:", created_post["created_at"])
    
    # 3. Clean up the test post
    del_resp = client.delete(f"/api/community/posts/{created_post['id']}", headers=headers)
    assert del_resp.status_code == 200
    print("✓ Test post cleaned up successfully.")
    
    print("\nALL SUPABASE AUTH JWT TESTS PASSED!")

if __name__ == "__main__":
    test_supabase_auth_jwt_flow()
