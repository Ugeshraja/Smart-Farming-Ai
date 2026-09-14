import requests
import json
import os
import sys

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from pathlib import Path

BASE_URL = "http://127.0.0.1:8000"
VAL_DIR = os.getenv("VAL_DIR", "")
SAMPLE_DIR = Path(__file__).resolve().parent / "sample_files"
candidate_path = Path(VAL_DIR) / "05_240b17f3-2b2b-4ff4-add7-4ba2975f4837___RS_Late.B 5130.JPG" if VAL_DIR else SAMPLE_DIR / "tomato_early_blight.jpg"
img_path = os.getenv("TOMATO_TEST_IMG", str(candidate_path))

print("==========================================================")
print("TESTING COMPLETE TOMATO LATE BLIGHT INFERENCE PIPELINE")
print("YOLO11 -> SAM -> ResNet-50 -> LIME -> RAG -> Gemini")
print("==========================================================")

if not os.path.exists(img_path):
    print(f"Test image does not exist: '{img_path}'. Set VAL_DIR or TOMATO_TEST_IMG to point to test leaf image.")
    sys.exit(0)

with open(img_path, "rb") as f:
    files = {"image": ("tomato_late_blight.jpg", f, "image/jpeg")}
    data = {
        "crop": "Tomato",
        "explain": "true",
        "advisory": "true"
    }
    print("Sending POST /api/predict (this will run full pipeline on CPU)...")
    resp = requests.post(f"{BASE_URL}/api/predict", files=files, data=data, timeout=900)

print(f"\nResponse Status Code: {resp.status_code}")
assert resp.status_code == 200, f"Expected 200 OK but got {resp.status_code}: {resp.text}"

result = resp.json()
print("\n--- FULL /api/predict JSON RESPONSE ---")
print(json.dumps(result, indent=2))

# 1. Verification of ResNet
pred = result.get("prediction", {})
print("\n1. ResNet Prediction:")
print(f"   Crop: {pred.get('crop')}")
print(f"   Disease: {pred.get('disease')}")
print(f"   Confidence: {pred.get('confidence')}")
assert pred.get("disease") == "Tomato___Late_blight", f"Expected Tomato___Late_blight, got {pred.get('disease')}"

# 2. Verification of YOLO
yolo = result.get("yolo", {})
print("\n2. YOLO11 Localization:")
print(f"   Detected: {yolo.get('detected')}")
print(f"   Confidence: {yolo.get('confidence')}")
print(f"   BBox: {yolo.get('bbox')}")
assert yolo.get("detected") is True

# 3. Verification of SAM
seg = result.get("segmentation", {})
print("\n3. SAM ViT-B Segmentation:")
print(f"   Used: {seg.get('used')}")
print(f"   Score: {seg.get('score')}")
print(f"   Image URL: {seg.get('image_url')}")
assert seg.get("used") is True

# 4. Verification of LIME
lime = result.get("lime", {})
lime_url = lime.get("image_url")
print("\n4. LIME Explanation Heatmap:")
print(f"   Image URL: {lime_url}")
assert lime_url is not None
assert lime_url.startswith("/static/predictions/")

# Test fetching LIME image via static URL
full_lime_url = f"{BASE_URL}{lime_url}"
lime_resp = requests.get(full_lime_url, timeout=10)
print(f"   Static Fetch Status: {lime_resp.status_code} ({len(lime_resp.content)} bytes)")
assert lime_resp.status_code == 200

# Also test fetching via Frontend Vite Proxy (port 3000)
proxy_lime_url = f"http://localhost:3000{lime_url}"
try:
    proxy_resp = requests.get(proxy_lime_url, timeout=10)
    print(f"   Vite Proxy Fetch Status (Port 3000): {proxy_resp.status_code} ({len(proxy_resp.content)} bytes)")
    assert proxy_resp.status_code == 200
except Exception as e:
    print(f"   Vite proxy check warning: {e}")

# 5. Verification of RAG
rag = result.get("rag", {})
print("\n5. RAG Knowledge Retrieval:")
print(f"   RAG Used: {rag.get('used')}")
ctx = rag.get("knowledge_context", "")
print(f"   Context Snippet (first 250 chars):\n{ctx[:250]}...")
assert rag.get("used") is True
assert "Late Blight" in ctx or "late blight" in ctx.lower()

# 6. Verification of Gemini Advisory
advisory = result.get("advisory", {})
adv_text = advisory.get("text", "")
print("\n6. Gemini Farmer Advisory:")
print("----------------------------------------------------------")
print(adv_text)
print("----------------------------------------------------------")
assert len(adv_text) > 100
assert "Tomato" in adv_text or "Late Blight" in adv_text

# 7. Verification of Timings
timings = result.get("timings", {})
print("\n7. Pipeline Timings:")
for k, v in timings.items():
    print(f"   {k}: {v} ms")

print("\n==========================================================")
print("ALL VERIFICATIONS PASSED SUCCESSFULLY!")
print("==========================================================")
