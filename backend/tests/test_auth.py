import sys
import os
import unittest
from fastapi.testclient import TestClient

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app

client = TestClient(app)


class TestAuthAndHealth(unittest.TestCase):
    def test_health_endpoints(self):
        """Verify root and health check endpoints."""
        res_root = client.get("/")
        self.assertEqual(res_root.status_code, 200)
        self.assertEqual(res_root.json()["status"], "online")

        res_health = client.get("/api/health")
        self.assertEqual(res_health.status_code, 200)
        self.assertEqual(res_health.json()["status"], "healthy")
        self.assertIn("firebase", res_health.json())

    def test_default_user_login(self):
        """Verify seeded default user can login."""
        payload = {
            "email": "ugeshraja@example.com",
            "password": "password123"
        }
        res = client.post("/api/auth/login", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("access_token", data)
        self.assertEqual(data["user"]["name"], "UGESHRAJA S")
        self.assertEqual(data["user"]["preferred_language"], "ta")

    def test_login_invalid_credentials(self):
        """Verify invalid password returns 401."""
        payload = {
            "email": "ugeshraja@example.com",
            "password": "wrongpassword"
        }
        res = client.post("/api/auth/login", json=payload)
        self.assertEqual(res.status_code, 401)

    def test_signup_and_protected_profile(self):
        """Verify full signup -> me -> profile update flow."""
        unique_email = f"farmer_{os.urandom(4).hex()}@smartfarm.org"
        signup_data = {
            "name": "Kavitha Raman",
            "email": unique_email,
            "password": "SecurePassword123",
            "phone": "+91 94444 11223",
            "preferred_language": "ta",
            "farm_location": "Salem, Tamil Nadu",
            "farm_details": {
                "farm_area": "5 Acres",
                "primary_crops": ["Tomato", "Brinjal"],
                "soil_type": "Clay Loam",
                "irrigation_type": "Drip Irrigation"
            }
        }

        # 1. Sign Up
        res_signup = client.post("/api/auth/signup", json=signup_data)
        self.assertEqual(res_signup.status_code, 201)
        signup_resp = res_signup.json()
        self.assertIn("access_token", signup_resp)
        token = signup_resp["access_token"]
        user = signup_resp["user"]
        self.assertEqual(user["name"], "Kavitha Raman")
        self.assertEqual(user["preferred_language"], "ta")
        self.assertEqual(user["email"], unique_email.lower())

        # 2. Access /api/auth/me without token -> 401
        res_unauth = client.get("/api/auth/me")
        self.assertEqual(res_unauth.status_code, 401)

        # 3. Access /api/auth/me with valid Bearer token -> 200
        headers = {"Authorization": f"Bearer {token}"}
        res_me = client.get("/api/auth/me", headers=headers)
        self.assertEqual(res_me.status_code, 200)
        self.assertEqual(res_me.json()["email"], unique_email.lower())

        # 4. Update Profile
        update_data = {
            "name": "Kavitha R.",
            "farm_location": "Attur, Salem, Tamil Nadu",
            "preferred_language": "en"
        }
        res_update = client.put("/api/auth/profile", json=update_data, headers=headers)
        self.assertEqual(res_update.status_code, 200)
        updated_user = res_update.json()
        self.assertEqual(updated_user["name"], "Kavitha R.")
        self.assertEqual(updated_user["farm_location"], "Attur, Salem, Tamil Nadu")
        self.assertEqual(updated_user["preferred_language"], "en")

    def test_signup_validation_errors(self):
        """Verify Pydantic validation on invalid inputs."""
        payload = {
            "name": "A",
            "email": "not-an-email",
            "password": "123"
        }
        res = client.post("/api/auth/signup", json=payload)
        self.assertEqual(res.status_code, 422)

    def test_forgot_password(self):
        """Verify forgot password endpoint."""
        res = client.post("/api/auth/forgot-password", json={"email": "ugeshraja@example.com"})
        self.assertEqual(res.status_code, 200)
        self.assertIn("message", res.json())

    def test_logout(self):
        """Verify logout endpoint."""
        res = client.post("/api/auth/logout")
        self.assertEqual(res.status_code, 200)
        self.assertIn("message", res.json())


if __name__ == "__main__":
    unittest.main()
