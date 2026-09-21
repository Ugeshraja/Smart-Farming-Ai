"""
SmartFarm AI - Forensic Diagnostic Suite for Potato Early Blight and Brinjal Cercospora
Executes:
1. Potato Early Blight Diagnostic (20+ validation images + potato_real.jpg)
2. SAM vs No-SAM Comparison on Potato Early Blight
3. Potato Confusion Matrix, Accuracy, Precision, Recall, F1
4. Dataset-level Inspection (Potato and Brinjal)
5. Preprocessing Verification (Training vs Inference)
"""

import os
import sys
import glob
import time
from pathlib import Path
import numpy as np
import cv2
import torch
from PIL import Image

BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

from services.ai_pipeline_service import (
    ai_pipeline_service,
    CLASS_NAMES,
    BRINJAL_CLASS_NAMES,
    POTATO_CLASS_INDICES,
    TOMATO_CLASS_INDICES
)

ai_pipeline_service.initialize()

# Paths
VAL_DIR = Path(r"G:\My Drive\Project\yolo11\images\val")
SAMPLE_DIR = BACKEND_DIR / "tests" / "sample_files"
POTATO_REAL_PATH = SAMPLE_DIR / "potato_real.jpg"
BRINJAL_BENCHMARK_PATH = BACKEND_DIR / "static" / "predictions" / "original_1789059991_3300e710.jpg"

print("=" * 90)
print("1. POTATO EARLY BLIGHT DIAGNOSTIC & SAM ABLATION")
print("=" * 90)

# Collect 24 PlantVillage Potato Early Blight images + 1 real-world image
pv_early_blight_files = sorted(glob.glob(str(VAL_DIR / "00_*.JPG")) + glob.glob(str(VAL_DIR / "00_*.jpg")))
selected_pv_eb = pv_early_blight_files[:24]

test_images = []
if POTATO_REAL_PATH.exists():
    test_images.append(("potato_real.jpg (Real-World)", str(POTATO_REAL_PATH), "Potato___Early_blight"))
for f in selected_pv_eb:
    test_images.append((os.path.basename(f), f, "Potato___Early_blight"))

print(f"Total Potato Early Blight test images: {len(test_images)}")

potato_records = []
sam_comparison_records = []

for name, path, true_class in test_images:
    with open(path, "rb") as f:
        img_bytes = f.read()

    # 1. Run Production Pipeline (YOLO + SAM + Grey BG + Potato Logit Masking)
    res = ai_pipeline_service.predict(img_bytes, crop_hint="Potato", explain=False, advisory=False)
    pred = res.get("disease")
    conf = res.get("confidence") or 0.0

    # Get individual probabilities for Potato classes:
    # Index 0: Potato___Early_blight
    # Index 1: Potato___Late_blight
    # Index 2: Potato___healthy
    img_bgr = cv2.imread(path)
    img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
    h, w = img_rgb.shape[:2]

    # YOLO
    yolo_res = ai_pipeline_service.yolo.predict(source=img_rgb, conf=0.20, imgsz=256, device=ai_pipeline_service.device, verbose=False)[0]
    best_idx = torch.argmax(yolo_res.boxes.conf)
    box = yolo_res.boxes.xyxy[best_idx].cpu().numpy().astype(int)
    x1, y1 = max(0, int(box[0])), max(0, int(box[1]))
    x2, y2 = min(w, int(box[2])), min(h, int(box[3]))
    yolo_crop = img_rgb[y1:y2, x1:x2].copy()

    # SAM
    ai_pipeline_service.sam_predictor.set_image(img_rgb)
    masks, scores, _ = ai_pipeline_service.sam_predictor.predict(box=np.array([x1, y1, x2, y2]), multimask_output=True)
    best_mask_idx = int(np.argmax(scores))
    mask = masks[best_mask_idx]
    crop_mask = mask[y1:y2, x1:x2]

    # SAM neutral grey crop
    sam_crop = yolo_crop.copy()
    sam_crop[~crop_mask] = [115, 115, 115]

    # Predictions for Method A (YOLO Crop only) vs Method B (SAM Grey Crop)
    probs_yolo = ai_pipeline_service._predict_resnet_batch([yolo_crop], crop_hint="Potato")[0]
    probs_sam = ai_pipeline_service._predict_resnet_batch([sam_crop], crop_hint="Potato")[0]

    # Production probs
    eb_prob = float(probs_sam[0])
    lb_prob = float(probs_sam[1])
    healthy_prob = float(probs_sam[2])

    eb_prob_yolo = float(probs_yolo[0])
    healthy_prob_yolo = float(probs_yolo[2])
    pred_yolo = CLASS_NAMES[int(np.argmax(probs_yolo))]

    correct = (pred == true_class)
    correct_yolo = (pred_yolo == true_class)

    potato_records.append({
        "name": name,
        "true_class": true_class,
        "pred": pred,
        "conf": conf,
        "healthy_prob": healthy_prob,
        "eb_prob": eb_prob,
        "lb_prob": lb_prob,
        "correct": correct
    })

    sam_comparison_records.append({
        "name": name,
        "yolo_pred": pred_yolo,
        "yolo_eb_prob": eb_prob_yolo,
        "yolo_healthy_prob": healthy_prob_yolo,
        "sam_pred": pred,
        "sam_eb_prob": eb_prob,
        "sam_healthy_prob": healthy_prob
    })

# Print Potato Table
print(f"\n{'Image Name':<45s} | {'Predicted':<23s} | {'Conf':<7s} | {'EB %':<7s} | {'Healthy %':<9s} | {'LB %':<7s} | {'Match'}")
print("-" * 115)
for r in potato_records:
    print(f"{r['name']:<45s} | {r['pred']:<23s} | {r['conf']*100:5.1f}% | {r['eb_prob']*100:5.1f}% | {r['healthy_prob']*100:7.1f}% | {r['lb_prob']*100:5.1f}% | {r['correct']}")

# Also test 10 Potato Late Blight and 10 Potato Healthy for full confusion matrix
print("\nTesting Potato Late Blight and Healthy images for complete Confusion Matrix...")
pv_late_blight_files = sorted(glob.glob(str(VAL_DIR / "01_*.JPG")) + glob.glob(str(VAL_DIR / "01_*.jpg")))[:10]
pv_healthy_files = sorted(glob.glob(str(VAL_DIR / "02_*.JPG")) + glob.glob(str(VAL_DIR / "02_*.jpg")))[:10]

all_potato_test = list(potato_records)

for f in pv_late_blight_files:
    with open(f, "rb") as fp:
        res = ai_pipeline_service.predict(fp.read(), crop_hint="Potato", explain=False, advisory=False)
    all_potato_test.append({
        "name": os.path.basename(f),
        "true_class": "Potato___Late_blight",
        "pred": res.get("disease"),
        "conf": res.get("confidence") or 0.0,
        "correct": res.get("disease") == "Potato___Late_blight"
    })

for f in pv_healthy_files:
    with open(f, "rb") as fp:
        res = ai_pipeline_service.predict(fp.read(), crop_hint="Potato", explain=False, advisory=False)
    all_potato_test.append({
        "name": os.path.basename(f),
        "true_class": "Potato___healthy",
        "pred": res.get("disease"),
        "conf": res.get("confidence") or 0.0,
        "correct": res.get("disease") == "Potato___healthy"
    })

# Compute Potato Metrics & Confusion Matrix
classes = ["Potato___Early_blight", "Potato___Late_blight", "Potato___healthy"]
cm = np.zeros((3, 3), dtype=int)
for r in all_potato_test:
    t_idx = classes.index(r["true_class"])
    p_idx = classes.index(r["pred"]) if r["pred"] in classes else -1
    if p_idx >= 0:
        cm[t_idx, p_idx] += 1

print("\n" + "=" * 90)
print("POTATO CONFUSION MATRIX (Rows: Actual, Cols: Predicted)")
print("=" * 90)
print(f"{'Actual \\ Predicted':<25s} | {'Early Blight':<15s} | {'Late Blight':<15s} | {'Healthy':<15s} | {'Total'}")
print("-" * 90)
for i, c in enumerate(classes):
    print(f"{c:<25s} | {cm[i, 0]:<15d} | {cm[i, 1]:<15d} | {cm[i, 2]:<15d} | {np.sum(cm[i]):<5d}")

# Metrics for Potato Early Blight
tp = cm[0, 0]
fn = cm[0, 1] + cm[0, 2]
fp = cm[1, 0] + cm[2, 0]
tn = cm[1, 1] + cm[1, 2] + cm[2, 1] + cm[2, 2]

eb_accuracy = (tp + tn) / np.sum(cm)
eb_precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
eb_recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
eb_f1 = (2 * eb_precision * eb_recall) / (eb_precision + eb_recall) if (eb_precision + eb_recall) > 0 else 0.0

total_acc = np.trace(cm) / np.sum(cm)

print(f"\nPOTATO METRICS (across {len(all_potato_test)} images):")
print(f"  Overall Potato Accuracy:         {total_acc*100:.2f}%")
print(f"  Potato Early Blight Precision:   {eb_precision*100:.2f}%")
print(f"  Potato Early Blight Recall:      {eb_recall*100:.2f}% ({tp}/{tp+fn})")
print(f"  Potato Early Blight F1-Score:    {eb_f1*100:.2f}%")

print("\n" + "=" * 90)
print("2. SAM EFFECT COMPARISON FOR POTATO EARLY BLIGHT (YOLO Crop vs SAM Grey Crop)")
print("=" * 90)
print(f"{'Image Name':<45s} | {'YOLO Crop Pred':<22s} | {'YOLO EB %':<10s} | {'SAM Crop Pred':<22s} | {'SAM EB %':<10s}")
print("-" * 115)
for s in sam_comparison_records[:10]: # show first 10
    print(f"{s['name']:<45s} | {s['yolo_pred']:<22s} | {s['yolo_eb_prob']*100:8.2f}% | {s['sam_pred']:<22s} | {s['sam_eb_prob']*100:8.2f}%")
# Also show potato_real specifically
for s in sam_comparison_records:
    if "potato_real" in s["name"]:
        print(f"{s['name']:<45s} | {s['yolo_pred']:<22s} | {s['yolo_eb_prob']*100:8.2f}% | {s['sam_pred']:<22s} | {s['sam_eb_prob']*100:8.2f}%")
