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
img_path = os.getenv("LIME_TEXT_TEST_IMG", str(candidate_path))

print("=" * 60)
print("TESTING LIME TEXTUAL EXPLANATION PIPELINE (NO HEATMAP IMAGE)")
print("=" * 60)

if not os.path.exists(img_path):
    print(f"Image file does not exist: {img_path}. Set VAL_DIR or LIME_TEXT_TEST_IMG to point to test leaf image.")
    sys.exit(0)

# Record static files before request
static_pred_dir = Path(__file__).resolve().parent.parent / "static" / "predictions"
files_before = set(os.listdir(static_pred_dir)) if static_pred_dir.exists() else set()

with open(img_path, "rb") as f:
    orig_bytes = f.read()
    files = {"image": ("tomato_late_blight.jpg", orig_bytes, "image/jpeg")}
    data = {
        "crop": "Tomato",
        "explain": "true",
        "advisory": "true"
    }
    print("Sending POST /api/predict (running YOLO11 -> SAM -> ResNet-50 -> LIME -> RAG -> Gemini)...")
    resp = requests.post(f"{BASE_URL}/api/predict", files=files, data=data, timeout=900)

print(f"\nResponse Status Code: {resp.status_code}")
assert resp.status_code == 200, f"Expected 200 OK but got {resp.status_code}: {resp.text}"

result = resp.json()

# 1. Verify Original Image
orig_img_info = result.get("original_image", {})
orig_url = orig_img_info.get("image_url")
print(f"\n1. Original Uploaded Image URL: {orig_url}")
assert orig_url is not None, "original_image.image_url must be present in response"
assert orig_url.startswith("/static/predictions/original_"), "Must be stored in original_* static file"
orig_resp = requests.get(f"{BASE_URL}{orig_url}")
assert orig_resp.status_code == 200, "Original uploaded image must be accessible via HTTP 200"
assert orig_resp.content == orig_bytes, "Served original image must EXACTLY match uploaded bytes!"
print("   [PASS] Exact uploaded image preserved and verified byte-for-byte!")

# 2. Verify YOLO & SAM & ResNet
pred = result.get("prediction", {})
print("\n2. Prediction & Model Pipeline:")
print(f"   Crop: {pred.get('crop')}")
print(f"   Disease: {pred.get('disease')}")
print(f"   Confidence: {pred.get('confidence')}")
assert pred.get("disease") == "Tomato___Late_blight", f"Expected Tomato___Late_blight, got {pred.get('disease')}"

yolo = result.get("yolo", {})
print(f"   YOLO Detected: {yolo.get('detected')} (conf: {yolo.get('confidence')})")
assert yolo.get("detected") is True

sam = result.get("segmentation", {})
print(f"   SAM Used: {sam.get('used')} (score: {sam.get('score')})")
assert sam.get("used") is True

# 3. Verify NO LIME Heatmap Image Generated or Saved
files_after = set(os.listdir(static_pred_dir)) if os.path.exists(static_pred_dir) else set()
new_files = files_after - files_before
new_lime_images = [f for f in new_files if "lime" in f.lower()]
print(f"\n3. Checking for any newly created LIME images: {new_lime_images}")
assert len(new_lime_images) == 0, f"No LIME images should be saved to disk! Found: {new_lime_images}"

lime_data = result.get("lime", {})
print(f"   LIME image_url in response: {lime_data.get('image_url')}")
assert lime_data.get("image_url") is None, "LIME image_url must NOT be present in response!"
print("   [PASS] Zero LIME heatmap images generated or saved!")

# 4. Verify LIME Textual Explanation
print("\n4. LIME Textual Explanation:")
assert lime_data.get("available") is True, "LIME available flag must be True"
explanation = lime_data.get("explanation")
assert explanation is not None, "LIME explanation object must be present"

summary = explanation.get("summary")
print(f"   Summary: {summary}")
assert summary is not None and len(summary) > 0

pos_contribs = explanation.get("positive_contributions", [])
print("\n   Important Contributing Regions:")
for pc in pos_contribs:
    print(f"     • {pc}")
assert len(pos_contribs) > 0, "Must contain positive contributing regions derived from LIME"

neg_contribs = explanation.get("negative_contributions", [])
print("\n   Less Influential / Negative Contributing Regions:")
for nc in neg_contribs:
    print(f"     • {nc}")

why_pred = explanation.get("why_predicted", [])
print("\n   Why the model predicted this:")
for wp in why_pred:
    print(f"     • {wp}")
assert len(why_pred) > 0, "Must contain dynamic why_predicted explanation items"

less_inf = explanation.get("less_influential_summary")
print(f"\n   Less Influential Summary: {less_inf}")
assert less_inf is not None

model_interp = explanation.get("model_interpretation")
print(f"\n   Model Interpretation: {model_interp}")
assert model_interp is not None

# 5. Verify RAG and Gemini
rag = result.get("rag", {})
print(f"\n5. RAG Used: {rag.get('used')}")
advisory = result.get("advisory", {})
adv_text = advisory.get("text", "")
print(f"   Gemini Advisory Length: {len(adv_text)} chars")
assert len(adv_text) > 50, "Gemini advisory text must be present"

print("\n" + "=" * 60)
print("SUCCESS: ALL LIME TEXT EXPLANATION & NO-IMAGE VERIFICATIONS PASSED!")
print("=" * 60)
