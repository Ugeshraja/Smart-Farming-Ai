"""
SmartFarm AI - Configuration & Environment Security Test Suite (Phase 2.2)
Verifies:
1. ENVIRONMENT defaults to 'development' with correct boolean flags (is_production, is_development).
2. CORS parsing works for comma-separated origins and defaults safely.
3. DATABASE_URL configuration is ready for future PostgreSQL connection.
4. Relative model paths resolve to canonical backend/models/ files without machine-specific prefixes.
5. RAG path resolves to backend/rag/knowledge_base/.
6. validate_configuration() reports readiness cleanly without revealing secrets.
7. Health endpoint (/api/health) returns system status, environment, and readiness without exposing credentials.
8. Chat status endpoint (/api/chat/status) never reveals API key values or key lengths.
"""

import os
import sys
import unittest
from pathlib import Path

# Add backend directory to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from config import Settings, BASE_DIR, MODELS_DIR, RAG_DIR, ENV_PATH
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


class TestProductionConfiguration(unittest.TestCase):

    def test_01_environment_defaults(self):
        """Verify environment defaults to development and helper properties work."""
        dev_settings = Settings(ENVIRONMENT="development")
        self.assertEqual(dev_settings.ENVIRONMENT, "development")
        self.assertTrue(dev_settings.is_development)
        self.assertFalse(dev_settings.is_production)

        prod_settings = Settings(ENVIRONMENT="production")
        self.assertEqual(prod_settings.ENVIRONMENT, "production")
        self.assertTrue(prod_settings.is_production)
        self.assertFalse(prod_settings.is_development)

    def test_02_database_configuration_readiness(self):
        """Verify DATABASE_URL setting is supported without establishing active connection."""
        s_empty = Settings(DATABASE_URL="")
        self.assertFalse(s_empty.database_configured)

        s_configured = Settings(DATABASE_URL="postgresql://user:pass@localhost:5432/smartfarm")
        self.assertTrue(s_configured.database_configured)
        self.assertEqual(s_configured.DATABASE_URL, "postgresql://user:pass@localhost:5432/smartfarm")

    def test_03_cors_origin_parsing(self):
        """Verify CORS_ORIGINS parses comma-separated lists and trims spaces."""
        s = Settings(CORS_ORIGINS="https://app.smartfarm.org, http://localhost:3000 , https://farmer.ai ")
        origins = s.cors_origins_list
        self.assertEqual(len(origins), 3)
        self.assertIn("https://app.smartfarm.org", origins)
        self.assertIn("http://localhost:3000", origins)
        self.assertIn("https://farmer.ai", origins)

    def test_04_model_path_resolution(self):
        """Verify all model paths resolve safely to local canonical files."""
        s = Settings()
        for path_name, resolved in [
            ("yolo11", s.clean_yolo_path),
            ("resnet50", s.clean_resnet_path),
            ("sam_vit_b", s.clean_sam_path),
            ("brinjal", s.clean_brinjal_resnet_path)
        ]:
            self.assertNotIn("G:", resolved, f"{path_name} contains hardcoded G: drive")
            self.assertNotIn("/content/", resolved, f"{path_name} contains hardcoded /content/")
            self.assertTrue(os.path.exists(resolved), f"{path_name} file does not exist at {resolved}")

    def test_05_rag_path_resolution(self):
        """Verify RAG knowledge base path resolves to local knowledge_base directory."""
        s = Settings()
        rag_path = s.clean_rag_path
        self.assertNotIn("G:", rag_path)
        self.assertTrue(os.path.exists(rag_path))
        txt_files = list(Path(rag_path).glob("*.txt"))
        self.assertGreaterEqual(len(txt_files), 20)

    def test_06_configuration_validation_safe_reporting(self):
        """Verify validate_configuration reports status without exposing secret values."""
        s = Settings(ENVIRONMENT="development", GEMINI_API_KEY="")
        val = s.validate_configuration()
        self.assertIn("environment", val)
        self.assertIn("is_valid", val)
        self.assertIn("models_present", val)
        self.assertIn("gemini_configured", val)
        self.assertIn("database_configured", val)
        # Check that no actual secrets are in issues or keys
        val_str = str(val)
        self.assertNotIn("AQ.", val_str)
        self.assertNotIn("AIza", val_str)

    def test_07_health_endpoint_no_secrets(self):
        """Verify /api/health endpoint returns system health without leaking secrets."""
        res = client.get("/api/health")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "healthy")
        self.assertIn("environment", data)
        self.assertIn("firebase", data)
        self.assertIn("ai_pipeline", data)
        self.assertIn("rag", data)
        self.assertIn("config_readiness", data)

        data_str = str(data)
        self.assertNotIn("api_key", data_str.lower())
        self.assertNotIn("private_key", data_str.lower())
        self.assertNotIn("secret", data_str.lower())
        self.assertNotIn("password", data_str.lower())

    def test_08_chat_status_no_secrets(self):
        """Verify /api/chat/status endpoint returns status without exposing key material or key length."""
        res = client.get("/api/chat/status")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "online")
        self.assertIn("api_key_configured", data)
        self.assertIsInstance(data["api_key_configured"], bool)
        self.assertNotIn("key_length", data)
        self.assertNotIn("api_key", data)


if __name__ == "__main__":
    unittest.main()
