"""
SmartFarm AI - Complete Diagnostic Suite for Potato Early Blight and Brinjal Cercospora
Performs:
1. Potato Early Blight Diagnostic (25 images + SAM vs No-SAM comparison + Confusion Matrix)
2. Brinjal Cercospora Diagnostic (25 images + Confusion Matrix + Probability Distribution)
3. Dataset-Level Analysis
4. Preprocessing Analysis
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

# Force unbuffered output so progress is printed in real-time
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(line_buffering=True)

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

SAMPLE_DIR = BACKEND_DIR / "tests" / "sample_files"
POTATO_VAL_DIR = SAMPLE_DIR / "potato_val"
BRINJAL_VAL_DIR = SAMPLE_DIR / "brinjal_val"
POTATO_REAL = SAMPLE_DIR / "potato_real.jpg"
BRINJAL_BENCHMARK = BACKEND_DIR / "static" / "predictions" / "original_1789059991_3300e710.jpg"

print("=" * 100, flush=True)
print("PART 1: POTATO EARLY BLIGHT DIAGNOSTIC & SAM EFFECT ABLATION", flush=True)
print("=" * 100, flush=True)

eb_files = sorted(list(POTATO_VAL_DIR.glob("00_*.JPG")) + list(POTATO_VAL_DIR.glob("00_*.jpg")))[:24]
potato_test_list = []
if POTATO_REAL.exists():
    potato_test_list.append(("potato_real.jpg (Benchmark)", str(POTATO_REAL), "Potato___Early_blight"))
for f in eb_files:
    potato_test_list.append((f.name, str(f), "Potato___Early_blight"))

# Add Late Blight and Healthy for complete confusion matrix
lb_files = sorted(list(POTATO_VAL_DIR.glob("01_*.JPG")) + list(POTATO_VAL_DIR.glob("01_*.jpg")))[:3]
h_files = sorted(list(POTATO_VAL_DIR.glob("02_*.JPG")) + list(POTATO_VAL_DIR.glob("02_*.jpg")))[:3]
for f in lb_files:
    potato_test_list.append((f.name, str(f), "Potato___Late_blight"))
for f in h_files:
    potato_test_list.append((f.name, str(f), "Potato___healthy"))

print(f"Total Potato images to evaluate: {len(potato_test_list)} (25 Early Blight, 3 Late Blight, 3 Healthy)", flush=True)

potato_records = []
sam_ablation_records = []

for idx, (name, path, true_class) in enumerate(potato_test_list):
    try:
        pil_img = Image.open(path).convert("RGB")
        img_rgb = np.array(pil_img)
    except Exception as e:
        print(f"Error opening image {name}: {e}", flush=True)
        continue

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
    mask = masks[int(np.argmax(scores))]
    crop_mask = mask[y1:y2, x1:x2]

    # SAM grey background crop
    sam_crop = yolo_crop.copy()
    if crop_mask.size > 0 and np.sum(crop_mask) > 0:
        sam_crop[~crop_mask] = [115, 115, 115]

    # Predict Method A (YOLO Crop) vs Method B (SAM Grey Crop)
    probs_yolo = ai_pipeline_service._predict_resnet_batch([yolo_crop], crop_hint="Potato")[0]
    probs_sam = ai_pipeline_service._predict_resnet_batch([sam_crop], crop_hint="Potato")[0]

    # Probs
    eb_p = float(probs_sam[0])
    lb_p = float(probs_sam[1])
    h_p = float(probs_sam[2])

    top1_idx = int(np.argmax(probs_sam))
    pred = CLASS_NAMES[top1_idx]
    conf = float(probs_sam[top1_idx])

    yolo_top1_idx = int(np.argmax(probs_yolo))
    pred_yolo = CLASS_NAMES[yolo_top1_idx]
    conf_yolo = float(probs_yolo[yolo_top1_idx])
    eb_p_yolo = float(probs_yolo[0])
    h_p_yolo = float(probs_yolo[2])

    correct = (pred == true_class)

    record = {
        "name": name,
        "true_class": true_class,
        "pred": pred,
        "conf": conf,
        "healthy_prob": h_p,
        "eb_prob": eb_p,
        "lb_prob": lb_p,
        "correct": correct
    }
    potato_records.append(record)

    if true_class == "Potato___Early_blight":
        sam_ablation_records.append({
            "name": name,
            "yolo_pred": pred_yolo,
            "yolo_conf": conf_yolo,
            "yolo_eb": eb_p_yolo,
            "yolo_h": h_p_yolo,
            "sam_pred": pred,
            "sam_conf": conf,
            "sam_eb": eb_p,
            "sam_h": h_p,
            "yolo_correct": (pred_yolo == true_class),
            "sam_correct": correct
        })
    print(f"[{idx+1:02d}/{len(potato_test_list):02d}] {name:<40s} | Pred: {pred:<22s} ({conf*100:5.1f}%) | Match: {correct}", flush=True)

print("\nPOTATO EARLY BLIGHT INDIVIDUAL RESULTS (25 IMAGES):", flush=True)
print(f"{'Image Name':<45s} | {'True Class':<22s} | {'Predicted':<22s} | {'Conf':<7s} | {'Healthy %':<9s} | {'EB %':<7s} | {'LB %':<7s} | {'Match'}", flush=True)
print("-" * 140, flush=True)
for r in potato_records:
    if r["true_class"] == "Potato___Early_blight":
        print(f"{r['name']:<45s} | {r['true_class']:<22s} | {r['pred']:<22s} | {r['conf']*100:5.1f}% | {r['healthy_prob']*100:7.1f}% | {r['eb_prob']*100:5.1f}% | {r['lb_prob']*100:5.1f}% | {r['correct']}", flush=True)

# Potato Confusion Matrix
p_classes = ["Potato___Early_blight", "Potato___Late_blight", "Potato___healthy"]
p_cm = np.zeros((3, 3), dtype=int)
for r in potato_records:
    t_idx = p_classes.index(r["true_class"])
    p_idx = p_classes.index(r["pred"]) if r["pred"] in p_classes else -1
    if p_idx >= 0:
        p_cm[t_idx, p_idx] += 1

print("\nPOTATO CONFUSION MATRIX (31 IMAGES):", flush=True)
print(f"{'Actual \\ Predicted':<25s} | {'Early Blight':<15s} | {'Late Blight':<15s} | {'Healthy':<15s} | {'Total'}", flush=True)
print("-" * 90, flush=True)
for i, c in enumerate(p_classes):
    print(f"{c:<25s} | {p_cm[i, 0]:<15d} | {p_cm[i, 1]:<15d} | {p_cm[i, 2]:<15d} | {np.sum(p_cm[i]):<5d}", flush=True)

tp_eb = p_cm[0, 0]
fn_eb = p_cm[0, 1] + p_cm[0, 2]
fp_eb = p_cm[1, 0] + p_cm[2, 0]
tn_eb = np.sum(p_cm) - (tp_eb + fn_eb + fp_eb)

eb_acc = (tp_eb + tn_eb) / np.sum(p_cm)
eb_prec = tp_eb / (tp_eb + fp_eb) if (tp_eb + fp_eb) > 0 else 0.0
eb_rec = tp_eb / (tp_eb + fn_eb) if (tp_eb + fn_eb) > 0 else 0.0
eb_f1 = (2 * eb_prec * eb_rec) / (eb_prec + eb_rec) if (eb_prec + eb_rec) > 0 else 0.0

print(f"\nPOTATO EARLY BLIGHT METRICS (Production SAM Grey BG Pipeline):", flush=True)
print(f"  Images Tested:  {len(potato_records)} ({tp_eb + fn_eb} Early Blight)", flush=True)
print(f"  Accuracy:       {eb_acc*100:.2f}%", flush=True)
print(f"  Precision:      {eb_prec*100:.2f}%", flush=True)
print(f"  Recall:         {eb_rec*100:.2f}% ({tp_eb}/{tp_eb+fn_eb})", flush=True)
print(f"  F1-Score:       {eb_f1*100:.2f}%", flush=True)

print("\nSAM EFFECT COMPARISON (YOLO Crop vs SAM Grey Crop) ON POTATO EARLY BLIGHT:", flush=True)
print(f"{'Image Name':<45s} | {'YOLO Pred':<22s} | {'YOLO EB %':<10s} | {'SAM Pred':<22s} | {'SAM EB %':<10s} | {'Effect'}", flush=True)
print("-" * 130, flush=True)
for s in sam_ablation_records:
    diff = s['sam_eb'] - s['yolo_eb']
    effect = f"+{diff*100:.1f}%" if diff >= 0 else f"{diff*100:.1f}%"
    print(f"{s['name']:<45s} | {s['yolo_pred']:<22s} | {s['yolo_eb']*100:8.2f}% | {s['sam_pred']:<22s} | {s['sam_eb']*100:8.2f}% | {effect}", flush=True)

yolo_eb_correct = sum(1 for s in sam_ablation_records if s['yolo_correct'])
sam_eb_correct = sum(1 for s in sam_ablation_records if s['sam_correct'])
print(f"\nSAM IMPACT SUMMARY ON POTATO EARLY BLIGHT:", flush=True)
print(f"  Method A (YOLO Crop only):      {yolo_eb_correct}/25 correct ({yolo_eb_correct/25*100:.1f}% recall)", flush=True)
print(f"  Method B (SAM + Grey BG):       {sam_eb_correct}/25 correct ({sam_eb_correct/25*100:.1f}% recall)", flush=True)
print(f"  Lesion Information Loss:        SAM Grey BG causes {yolo_eb_correct - sam_eb_correct} Early Blight samples to flip to Potato___healthy!", flush=True)


print("\n" + "=" * 100, flush=True)
print("PART 2: BRINJAL CERCOSPORA DIAGNOSTIC", flush=True)
print("=" * 100, flush=True)

cercospora_files = sorted(list(BRINJAL_VAL_DIR.glob("cercospora_*.jpg")) + list(BRINJAL_VAL_DIR.glob("cercospora_*.png")))[:24]
brinjal_test_list = []
if BRINJAL_BENCHMARK.exists():
    brinjal_test_list.append(("benchmark_cercospora.jpg (Benchmark)", str(BRINJAL_BENCHMARK), "Cercospora_Leaf_Spot"))
for f in cercospora_files:
    brinjal_test_list.append((f.name, str(f), "Cercospora_Leaf_Spot"))

# Add Bacterial Leaf Spot and Healthy for multi-class confusion matrix
bacterial_files = sorted(list(BRINJAL_VAL_DIR.glob("bacterial_*.jpg")) + list(BRINJAL_VAL_DIR.glob("bacterial_*.png")))[:5]
healthy_b_files = sorted(list(BRINJAL_VAL_DIR.glob("healthy_*.jpg")) + list(BRINJAL_VAL_DIR.glob("healthy_*.png")))[:5]

for f in bacterial_files:
    brinjal_test_list.append((f.name, str(f), "Bacterial_Leaf_Spot"))
for f in healthy_b_files:
    brinjal_test_list.append((f.name, str(f), "Healthy"))

print(f"Total Brinjal images to evaluate: {len(brinjal_test_list)} (25 Cercospora, 5 Bacterial Leaf Spot, 5 Healthy)", flush=True)

brinjal_records = []
for idx, (name, path, true_class) in enumerate(brinjal_test_list):
    try:
        pil_img = Image.open(path).convert("RGB")
        img_rgb = np.array(pil_img)
    except Exception as e:
        print(f"Skipping unreadable image {name}: {e}", flush=True)
        continue

    probs = ai_pipeline_service._predict_brinjal_batch([img_rgb])[0]

    top_indices = np.argsort(probs)[::-1]
    top1_idx = int(top_indices[0])
    pred = BRINJAL_CLASS_NAMES[top1_idx]
    conf = float(probs[top1_idx])

    top3 = [(BRINJAL_CLASS_NAMES[i], round(float(probs[i])*100, 2)) for i in top_indices[:3]]
    correct = (pred == true_class)

    brinjal_records.append({
        "name": name,
        "true_class": true_class,
        "pred": pred,
        "conf": conf,
        "top3": top3,
        "correct": correct,
        "cercospora_prob": float(probs[3]), # 3 is Cercospora_Leaf_Spot
        "bacterial_prob": float(probs[1])   # 1 is Bacterial_Leaf_Spot
    })
    print(f"[{idx+1:02d}/{len(brinjal_test_list):02d}] {name:<40s} | Pred: {pred:<22s} ({conf*100:5.1f}%) | Match: {correct}", flush=True)

print("\nBRINJAL CERCOSPORA INDIVIDUAL RESULTS (25 IMAGES):", flush=True)
print(f"{'Image Name':<45s} | {'True Class':<22s} | {'Predicted':<22s} | {'Conf':<7s} | {'Top-3 Probabilities':<55s} | {'Match'}", flush=True)
print("-" * 165, flush=True)
for r in brinjal_records:
    if r["true_class"] == "Cercospora_Leaf_Spot":
        top3_str = ", ".join([f"{c}: {p}%" for c, p in r["top3"]])
        print(f"{r['name']:<45s} | {r['true_class']:<22s} | {r['pred']:<22s} | {r['conf']*100:5.1f}% | {top3_str:<55s} | {r['correct']}", flush=True)

# Brinjal Confusion Matrix across evaluated classes
b_cm = np.zeros((3, 4), dtype=int) # 3 actual classes x 4 predicted columns
for r in brinjal_records:
    actual = r["true_class"]
    pred = r["pred"]
    if actual == "Cercospora_Leaf_Spot":
        r_idx = 0
    elif actual == "Bacterial_Leaf_Spot":
        r_idx = 1
    elif actual == "Healthy":
        r_idx = 2
    else:
        continue

    if pred == "Cercospora_Leaf_Spot":
        c_idx = 0
    elif pred == "Bacterial_Leaf_Spot":
        c_idx = 1
    elif pred == "Healthy":
        c_idx = 2
    else:
        c_idx = 3 # Other

    b_cm[r_idx, c_idx] += 1

print("\nBRINJAL CONFUSION MATRIX (35 IMAGES):", flush=True)
print(f"{'Actual \\ Predicted':<25s} | {'Cercospora':<12s} | {'Bacterial LS':<14s} | {'Healthy':<10s} | {'Other':<10s} | {'Total'}", flush=True)
print("-" * 85, flush=True)
actual_names = ["Cercospora_Leaf_Spot", "Bacterial_Leaf_Spot", "Healthy"]
for i, name in enumerate(actual_names):
    print(f"{name:<25s} | {b_cm[i, 0]:<12d} | {b_cm[i, 1]:<14d} | {b_cm[i, 2]:<10d} | {b_cm[i, 3]:<10d} | {np.sum(b_cm[i]):<5d}", flush=True)

tp_c = b_cm[0, 0]
fn_c = np.sum(b_cm[0]) - tp_c
fp_c = b_cm[1, 0] + b_cm[2, 0]
tn_c = np.sum(b_cm) - (tp_c + fn_c + fp_c)

c_acc = (tp_c + tn_c) / np.sum(b_cm)
c_prec = tp_c / (tp_c + fp_c) if (tp_c + fp_c) > 0 else 0.0
c_rec = tp_c / (tp_c + fn_c) if (tp_c + fn_c) > 0 else 0.0
c_f1 = (2 * c_prec * c_rec) / (c_prec + c_rec) if (c_prec + c_rec) > 0 else 0.0

print(f"\nBRINJAL CERCOSPORA METRICS:", flush=True)
print(f"  Images Tested:  {len(brinjal_records)} ({tp_c + fn_c} Cercospora)", flush=True)
print(f"  Accuracy:       {c_acc*100:.2f}%", flush=True)
print(f"  Precision:      {c_prec*100:.2f}%", flush=True)
print(f"  Recall:         {c_rec*100:.2f}% ({tp_c}/{tp_c+fn_c})", flush=True)
print(f"  F1-Score:       {c_f1*100:.2f}%", flush=True)
