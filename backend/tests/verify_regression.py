import os
import sys
import json
from pathlib import Path
import requests

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

BASE_URL = os.getenv("BASE_URL", "http://127.0.0.1:8000")


class UnifiedClient:
    """
    Unified client that routes to a live backend if available,
    or falls back to FastAPI TestClient in-memory (with lifespan/startup events) for zero-setup execution.
    """
    def __init__(self, base_url: str = BASE_URL):
        self.base_url = base_url.rstrip("/")
        self.is_live = False
        self._client_cm = None
        self.test_client = None

        try:
            r = requests.get(f"{self.base_url}/api/health", timeout=1.5)
            if r.status_code == 200:
                self.is_live = True
        except Exception:
            self.is_live = False

        if self.is_live:
            print(f"[verify_regression] Connected to live backend at {self.base_url}")
        else:
            print("[verify_regression] Live backend not reachable on port 8000; executing via FastAPI TestClient...")
            backend_root = str(Path(__file__).resolve().parent.parent)
            if backend_root not in sys.path:
                sys.path.insert(0, backend_root)
            from fastapi.testclient import TestClient
            from main import app
            self._client_cm = TestClient(app)
            # Entering the context manager executes FastAPI startup events (loading AI models & bootstrapping)
            self.test_client = self._client_cm.__enter__()

    def get(self, path: str, **kwargs):
        if self.is_live:
            return requests.get(f"{self.base_url}{path}", **kwargs)
        kwargs.pop("timeout", None)
        return self.test_client.get(path, **kwargs)

    def post(self, path: str, **kwargs):
        if self.is_live:
            return requests.post(f"{self.base_url}{path}", **kwargs)
        kwargs.pop("timeout", None)
        return self.test_client.post(path, **kwargs)

    def close(self):
        if self._client_cm is not None:
            try:
                self._client_cm.__exit__(None, None, None)
            except Exception:
                pass


client = UnifiedClient()


def test_health():
    print("\n--- 1. Testing GET /api/health ---")
    resp = client.get("/api/health", timeout=10)
    print(f"Status Code: {resp.status_code}")
    data = resp.json()
    print("Response JSON:")
    print(json.dumps(data, indent=2))
    assert resp.status_code == 200
    assert data.get("status") == "healthy"
    assert "ai_pipeline" in data
    assert data["ai_pipeline"]["is_loaded"] is True
    print(">>> /api/health PASSED!")


def test_auth():
    print("\n--- 2. Testing POST /api/auth/login ---")
    payload = {
        "email": "ugeshraja@example.com",
        "password": "password123"
    }
    resp = client.post("/api/auth/login", json=payload, timeout=10)
    print(f"Status Code: {resp.status_code}")
    data = resp.json()
    print("Response JSON:")
    print(json.dumps(data, indent=2))
    assert resp.status_code == 200
    assert "access_token" in data
    assert data["user"]["email"] == "ugeshraja@example.com"
    print(">>> /api/auth/login PASSED!")


def test_chat_english():
    print("\n--- 3. Testing POST /api/chat (English) ---")
    payload = {
        "message": "How do I control potato early blight?",
        "language": "en"
    }
    resp = client.post("/api/chat", json=payload, timeout=60)
    print(f"Status Code: {resp.status_code}")
    data = resp.json()
    print("Response JSON:")
    print(json.dumps(data, indent=2))
    assert resp.status_code == 200
    assert "text" in data
    assert len(data["text"]) > 20
    print(">>> /api/chat (English) PASSED!")


def test_chat_tamil():
    print("\n--- 4. Testing POST /api/chat (Tamil) ---")
    payload = {
        "message": "தக்காளி இலை கருகல் நோயை எவ்வாறு கட்டுப்படுத்துவது?",
        "language": "ta"
    }
    resp = client.post("/api/chat", json=payload, timeout=60)
    print(f"Status Code: {resp.status_code}")
    data = resp.json()
    print("Response JSON (snippet):")
    text = data.get("text", "")
    print(text[:300] + "...")
    assert resp.status_code == 200
    assert len(text) > 20
    print(">>> /api/chat (Tamil) PASSED!")


def test_predict_fast():
    print("\n--- 5. Testing POST /api/predict (Potato Early Blight) ---")
    val_dir = os.getenv("VAL_DIR", "")
    sample_dir = Path(__file__).resolve().parent / "sample_files"
    cand = Path(val_dir) / "00_6edb7358-f41f-4fd2-8371-12700bdbc94c___RS_Early.B 6801.JPG" if val_dir else (sample_dir / "potato_early_blight.jpg")
    img_path = os.getenv("POTATO_TEST_IMG", str(cand) if cand else "")
    if not img_path or not os.path.exists(img_path) or os.path.getsize(img_path) < 1000:
        print(f"Notice: Valid test image (>1KB) not found at '{img_path}'. Skipping filesystem image prediction test.")
        return
    with open(img_path, "rb") as f:
        files = {"image": ("potato.jpg", f.read(), "image/jpeg")}
        data = {"crop": "potato", "explain": "false", "advisory": "false"}
        resp = client.post("/api/predict", files=files, data=data, timeout=90)
    print(f"Status Code: {resp.status_code}")
    result = resp.json()
    print("Response JSON:")
    print(json.dumps(result, indent=2))
    assert resp.status_code == 200
    assert result.get("success") is True
    assert result["prediction"]["disease"] == "Potato___Early_blight"
    assert result["prediction"]["confidence"] >= 0.90
    print(">>> /api/predict PASSED!")


if __name__ == "__main__":
    try:
        test_health()
        test_auth()
        test_chat_english()
        test_chat_tamil()
        test_predict_fast()
        print("\n==========================================")
        print("ALL REGRESSION & ENDPOINT TESTS SUCCEEDED!")
        print("==========================================")
    finally:
        client.close()
