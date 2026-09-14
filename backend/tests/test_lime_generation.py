import requests
import json
import os
import sys
from pathlib import Path

BASE_URL = "http://127.0.0.1:8000"
VAL_DIR = os.getenv("VAL_DIR", "")
SAMPLE_DIR = Path(__file__).resolve().parent / "sample_files"
candidate_path = Path(VAL_DIR) / "00_6edb7358-f41f-4fd2-8371-12700bdbc94c___RS_Early.B 6801.JPG" if VAL_DIR else SAMPLE_DIR / "tomato_early_blight.jpg"
img_path = os.getenv("LIME_TEST_IMG", str(candidate_path))

if not os.path.exists(img_path):
    print(f"Test image not found at '{img_path}'. Set VAL_DIR or LIME_TEST_IMG to point to test leaf image.")
    sys.exit(0)

print(f"--- Testing POST /api/predict with explain=true (Image: {img_path}) ---")
with open(img_path, "rb") as f:
    files = {"image": ("test_leaf.jpg", f, "image/jpeg")}
    data = {"crop": "potato", "explain": "true", "advisory": "false"}
    resp = requests.post(f"{BASE_URL}/api/predict", files=files, data=data, timeout=300)

print(f"Status Code: {resp.status_code}")
res = resp.json()
print("Response JSON:")
print(json.dumps(res, indent=2))

lime_url = res.get("lime", {}).get("image_url")
print(f"LIME image_url: {lime_url}")

if lime_url:
    # Test accessing static URL directly via HTTP
    full_url = f"{BASE_URL}{lime_url}"
    print(f"Fetching from: {full_url}")
    img_resp = requests.get(full_url, timeout=10)
    print(f"Static HTTP Status: {img_resp.status_code}")
    print(f"Content-Type: {img_resp.headers.get('content-type')}")
    print(f"Bytes received: {len(img_resp.content)}")
    assert img_resp.status_code == 200
    assert len(img_resp.content) > 1000
    print("SUCCESS: LIME image is generated, saved, and served via FastAPI /static!")
else:
    print("FAILURE: LIME image_url is None!")
