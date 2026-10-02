"""
SmartFarm AI - Multi-User Community Integration Test
Validates:
  1. Community members directory returns real registered user names (e.g. UGESHRAJA S, Kavitha R.)
  2. Account A logs in and creates a post
  3. Account B logs in and sees Account A's post with real author name and actual UTC timestamp
  4. Account B likes Account A's post and submits a comment
  5. Account A sees Account B's comment and updated likes
  6. Global feed includes posts from both Account A and Account B
  7. Cross-user deletion authorization: Account A cannot delete Account B's post (403 Forbidden)
  8. Account B can delete own post (200 OK)
"""

import sys
import os
from pathlib import Path

# Add backend directory to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_multi_user_community_lifecycle():
    print("\n--- 1. Testing GET /api/community/members ---")
    resp_members = client.get("/api/community/members")
    assert resp_members.status_code == 200, f"Expected 200, got {resp_members.status_code}"
    members = resp_members.json()
    assert len(members) >= 2, f"Expected at least 2 registered members, got {len(members)}"
    
    names = [m["name"] for m in members]
    print(f"Registered community members found ({len(members)}):", names)
    assert "UGESHRAJA S" in names, "Expected UGESHRAJA S in members list"
    assert "Kavitha R." in names, "Expected Kavitha R. in members list"
    assert all(name != "Farmer" for name in names), "Found generic 'Farmer' name in members list"

    print("\n--- 2. Authenticating Account A (UGESHRAJA S) ---")
    login_a = client.post("/api/auth/login", json={
        "email": "ugeshraja@example.com",
        "password": "password123"
    })
    assert login_a.status_code == 200, f"Account A login failed: {login_a.text}"
    token_a = login_a.json()["access_token"]
    headers_a = {"Authorization": f"Bearer {token_a}"}

    print("\n--- 3. Authenticating Account B (Kavitha Raman / Kavitha R.) ---")
    # Login or create account B
    login_b = client.post("/api/auth/login", json={
        "email": "farmer_c9883896@smartfarm.org",
        "password": "SecurePassword123"
    })
    if login_b.status_code != 200:
        # Create fresh Account B if needed
        signup_b = client.post("/api/auth/signup", json={
            "name": "Kavitha R.",
            "email": "kavitha_community_test@smartfarm.org",
            "password": "SecurePassword123",
            "phone": "+91 94444 11223",
            "preferred_language": "ta",
            "farm_location": "Salem, Tamil Nadu"
        })
        assert signup_b.status_code == 201, f"Account B signup failed: {signup_b.text}"
        token_b = signup_b.json()["access_token"]
    else:
        token_b = login_b.json()["access_token"]
    headers_b = {"Authorization": f"Bearer {token_b}"}

    print("\n--- 4. Account A publishes a Community Post ---")
    post_payload_a = {
        "crop": "Tomato",
        "topic": "Early Blight Observations",
        "language": "en",
        "content": "Noticed brown concentric rings on lower leaves of Tomato. Started copper fungicide application."
    }
    create_resp_a = client.post("/api/community/posts", json=post_payload_a, headers=headers_a)
    assert create_resp_a.status_code == 201, f"Post creation failed: {create_resp_a.text}"
    post_a = create_resp_a.json()
    post_a_id = post_a["id"]
    print("Created Post A ID:", post_a_id)
    assert post_a["farmerName"] == "UGESHRAJA S", f"Expected author 'UGESHRAJA S', got '{post_a['farmerName']}'"
    assert post_a["crop"] == "Tomato"
    assert post_a["created_at"] is not None
    assert "T" in post_a["created_at"], f"Invalid ISO timestamp: {post_a['created_at']}"

    print("\n--- 5. Account B views Global Feed and inspects Post A ---")
    feed_resp_b = client.get("/api/community/posts", headers=headers_b)
    assert feed_resp_b.status_code == 200
    feed = feed_resp_b.json()
    found_post_a = next((p for p in feed if p["id"] == post_a_id), None)
    assert found_post_a is not None, "Account B could not find Account A's post in global feed"
    assert found_post_a["farmerName"] == "UGESHRAJA S"
    assert found_post_a["created_at"] is not None
    print("Account B verified Post A by:", found_post_a["farmerName"], "at timestamp:", found_post_a["created_at"])

    print("\n--- 6. Account B likes Post A ---")
    like_resp = client.post(f"/api/community/posts/{post_a_id}/like", headers=headers_b)
    assert like_resp.status_code == 200
    like_data = like_resp.json()
    assert like_data["has_liked"] is True
    assert like_data["likes"] >= 1
    print("Post A like count after Account B like:", like_data["likes"])

    print("\n--- 7. Account B replies to Post A ---")
    comment_payload = {
        "content": "Also ensure good drainage and avoid overhead watering to prevent spore spread."
    }
    comment_resp = client.post(f"/api/community/posts/{post_a_id}/comments", json=comment_payload, headers=headers_b)
    assert comment_resp.status_code == 201
    comment_data = comment_resp.json()
    print("Account B comment author:", comment_data["author"], "at:", comment_data["created_at"])
    assert comment_data["author"] in ("Kavitha R.", "Kavitha Raman", "Kavitha_community_test")

    print("\n--- 8. Account B publishes own post ---")
    post_payload_b = {
        "crop": "Potato",
        "topic": "Tuber Bulking Nutrition",
        "language": "ta",
        "content": "உருளைக்கிழங்கு பயிருக்கு பொட்டாஷ் உரம் இடும் முறை குறித்து உங்கள் அனுபவங்களைப் பகிருங்கள்."
    }
    create_resp_b = client.post("/api/community/posts", json=post_payload_b, headers=headers_b)
    assert create_resp_b.status_code == 201
    post_b = create_resp_b.json()
    post_b_id = post_b["id"]
    print("Created Post B ID:", post_b_id, "by:", post_b["farmerName"])

    print("\n--- 9. Account A views Global Feed with both posts ---")
    feed_resp_a = client.get("/api/community/posts", headers=headers_a)
    assert feed_resp_a.status_code == 200
    feed_a = feed_resp_a.json()
    post_ids = [p["id"] for p in feed_a]
    assert post_a_id in post_ids, "Post A missing from feed"
    assert post_b_id in post_ids, "Post B missing from feed"
    
    reloaded_post_a = next(p for p in feed_a if p["id"] == post_a_id)
    assert len(reloaded_post_a["comments"]) >= 1, "Comments not populated on Post A"
    assert reloaded_post_a["likes"] >= 1, "Likes not populated on Post A"
    print("Post A verified with comments:", len(reloaded_post_a["comments"]), "and likes:", reloaded_post_a["likes"])

    print("\n--- 10. Authorization Test: Account A attempts to delete Account B's post ---")
    unauth_delete = client.delete(f"/api/community/posts/{post_b_id}", headers=headers_a)
    assert unauth_delete.status_code == 403, f"Expected 403 Forbidden, got {unauth_delete.status_code}"
    print("Cross-user deletion rejected correctly with 403 Forbidden.")

    print("\n--- 11. Account B deletes own post ---")
    auth_delete = client.delete(f"/api/community/posts/{post_b_id}", headers=headers_b)
    assert auth_delete.status_code == 200
    print("Account B post deleted successfully.")

    print("\n--- 12. Cleanup Account A test post ---")
    client.delete(f"/api/community/posts/{post_a_id}", headers=headers_a)
    print("Cleanup complete.")

    print("\nALL MULTI-USER COMMUNITY TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_multi_user_community_lifecycle()
