import requests
import json
import sys

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

BASE_URL = "http://127.0.0.1:8000"

def test_health():
    print("\n--- 1. Testing GET /api/health ---")
    resp = requests.get(f"{BASE_URL}/api/health", timeout=10)
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
    resp = requests.post(f"{BASE_URL}/api/auth/login", json=payload, timeout=10)
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
    resp = requests.post(f"{BASE_URL}/api/chat", json=payload, timeout=60)
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
    resp = requests.post(f"{BASE_URL}/api/chat", json=payload, timeout=60)
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
    from pathlib import Path
    val_dir = os.getenv("VAL_DIR", "")
    sample_dir = Path(__file__).resolve().parent / "sample_files"
    cand = Path(val_dir) / "00_6edb7358-f41f-4fd2-8371-12700bdbc94c___RS_Early.B 6801.JPG" if val_dir else sample_dir / "tomato_early_blight.jpg"
    img_path = os.getenv("POTATO_TEST_IMG", str(cand))
    if not os.path.exists(img_path):
        print(f"Skipping /api/predict test: image not found at '{img_path}'. Set VAL_DIR or POTATO_TEST_IMG.")
        return
    with open(img_path, "rb") as f:
        files = {"image": ("potato.jpg", f, "image/jpeg")}
        data = {"crop": "potato", "explain": "false", "advisory": "false"}
        resp = requests.post(f"{BASE_URL}/api/predict", files=files, data=data, timeout=90)
    print(f"Status Code: {resp.status_code}")
    result = resp.json()
    print("Response JSON:")
    print(json.dumps(result, indent=2))
    assert resp.status_code == 200
    assert result.get("success") is True
    assert result["prediction"]["disease"] == "Potato___Early_blight"
    assert result["prediction"]["confidence"] >= 0.99
    print(">>> /api/predict PASSED!")

if __name__ == "__main__":
    test_health()
    test_auth()
    test_chat_english()
    test_chat_tamil()
    test_predict_fast()
    print("\n==========================================")
    print("ALL REGRESSION & ENDPOINT TESTS SUCCEEDED!")
    print("==========================================")
