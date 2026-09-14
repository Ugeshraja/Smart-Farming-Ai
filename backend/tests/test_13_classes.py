import os
import glob
import random
import time
import requests

VAL_DIR = os.getenv("VAL_DIR", "")
API_URL = "http://127.0.0.1:8000/api/predict"

if not VAL_DIR or not os.path.exists(VAL_DIR):
    print(f"NOTICE: Validation dataset directory not found (VAL_DIR='{VAL_DIR}').")
    print("Set VAL_DIR environment variable to point to validation image directory to run this regression test.")
    import sys
    sys.exit(0)

CLASS_NAMES = [
    "Potato___Early_blight",
    "Potato___Late_blight",
    "Potato___healthy",
    "Tomato___Bacterial_spot",
    "Tomato___Early_blight",
    "Tomato___Late_blight",
    "Tomato___Leaf_Mold",
    "Tomato___Septoria_leaf_spot",
    "Tomato___Spider_mites Two-spotted_spider_mite",
    "Tomato___Target_Spot",
    "Tomato___Tomato_Yellow_Leaf_Curl_Virus",
    "Tomato___Tomato_mosaic_virus",
    "Tomato___healthy"
]

print("=" * 90)
print("SmartFarm AI - 13-Class AI Pipeline Regression Verification Test")
print("=" * 90)

random.seed(42)
selected_images = []

for class_id in range(13):
    expected_class = CLASS_NAMES[class_id]
    patterns = [
        os.path.join(VAL_DIR, f"{class_id:02d}_*.JPG"),
        os.path.join(VAL_DIR, f"{class_id:02d}_*.jpg"),
        os.path.join(VAL_DIR, f"{class_id:02d}_*.JPEG"),
        os.path.join(VAL_DIR, f"{class_id:02d}_*.jpeg"),
    ]
    files = []
    for pattern in patterns:
        files.extend(glob.glob(pattern))

    if not files:
        print(f"[{class_id:02d}] WARNING: No image for class {expected_class}")
        continue

    image_path = random.choice(files)
    selected_images.append((class_id, expected_class, image_path))

results = []
total_start = time.time()

for class_id, expected_class, image_path in selected_images:
    filename = os.path.basename(image_path)
    crop_hint = "Potato" if expected_class.startswith("Potato") else "Tomato"

    t0 = time.time()
    try:
        with open(image_path, "rb") as f:
            files = {"image": (filename, f, "image/jpeg")}
            data = {"crop": crop_hint, "explain": "false", "advisory": "false"}
            res = requests.post(API_URL, files=files, data=data, timeout=60.0)

        elapsed = time.time() - t0
        if res.status_code == 200:
            res_json = res.json()
            pred = res_json.get("prediction", {})
            pred_disease = pred.get("disease", "UNKNOWN")
            confidence = pred.get("confidence", 0.0)
            yolo_info = res_json.get("yolo", {})
            yolo_conf = yolo_info.get("confidence")
            sam_info = res_json.get("segmentation", {})
            sam_score = sam_info.get("score")
            sam_used = sam_info.get("used", False)
            match = (pred_disease == expected_class)

            results.append({
                "class_id": class_id,
                "expected": expected_class,
                "predicted": pred_disease,
                "confidence": confidence,
                "yolo_conf": yolo_conf,
                "sam_used": sam_used,
                "sam_score": sam_score,
                "match": match,
                "time_s": round(elapsed, 2)
            })
            status_str = "PASS" if match else "MISMATCH"
            print(f"[{class_id:02d}] {status_str:8s} | Expected: {expected_class:<45s} | Pred: {pred_disease:<45s} | Conf: {confidence*100:5.1f}% | SAM: {sam_score or 0:.3f} | {elapsed:.2f}s")
        else:
            print(f"[{class_id:02d}] FAIL HTTP {res.status_code}: {res.text[:100]}")
            results.append({
                "class_id": class_id,
                "expected": expected_class,
                "predicted": f"HTTP_{res.status_code}",
                "confidence": 0.0,
                "yolo_conf": None,
                "sam_used": False,
                "sam_score": None,
                "match": False,
                "time_s": round(elapsed, 2)
            })
    except Exception as e:
        print(f"[{class_id:02d}] ERROR: {e}")
        results.append({
            "class_id": class_id,
            "expected": expected_class,
            "predicted": f"ERROR: {str(e)[:30]}",
            "confidence": 0.0,
            "yolo_conf": None,
            "sam_used": False,
            "sam_score": None,
            "match": False,
            "time_s": 0.0
        })

total_elapsed = time.time() - total_start
correct_count = sum(1 for r in results if r["match"])
accuracy = (correct_count / len(results)) * 100 if results else 0

print("=" * 90)
print(f"REGRESSION RESULT: {correct_count}/{len(results)} classes matched ground truth ({accuracy:.1f}% accuracy)")
print(f"Total regression test time: {total_elapsed:.2f}s across {len(results)} classes")
print("=" * 90)
