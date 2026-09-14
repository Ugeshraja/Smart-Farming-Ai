import os
import sys
from pathlib import Path
import requests
import json
import time

VAL_DIR = os.getenv("VAL_DIR", "")
SAMPLE_DIR = Path(__file__).resolve().parent / "sample_files"
candidate_path = Path(VAL_DIR) / "00_6edb7358-f41f-4fd2-8371-12700bdbc94c___RS_Early.B 6801.JPG" if VAL_DIR else SAMPLE_DIR / "tomato_early_blight.jpg"
IMG_PATH = os.getenv("POTATO_TEST_IMG", str(candidate_path))
URL = "http://127.0.0.1:8000/api/predict"

if not os.path.exists(IMG_PATH):
    print(f"Test image not found at '{IMG_PATH}'. Set VAL_DIR or POTATO_TEST_IMG to point to validation dataset.")
    sys.exit(0)

print(f"Testing POST /api/predict with: {IMG_PATH}")
t0 = time.time()

with open(IMG_PATH, "rb") as f:
    files = {"image": ("test_leaf.jpg", f, "image/jpeg")}
    data = {"crop": "Potato"}
    response = requests.post(URL, files=files, data=data, timeout=300.0)

elapsed = time.time() - t0
print(f"Completed in {elapsed:.2f}s | HTTP Status: {response.status_code}")

try:
    result = response.json()
    print(json.dumps(result, indent=2))
except Exception as e:
    print("Response text:", response.text)
