"""
SmartFarm AI - Brinjal Cercospora Diagnostic
Evaluates 25 Cercospora Leaf Spot images, 5 Bacterial Leaf Spot, and 5 Healthy images.
Computes Accuracy, Precision, Recall, F1, and Confusion Matrix.
"""

import os
import sys
from pathlib import Path
import numpy as np
import torch
from PIL import Image

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(line_buffering=True)

BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

from services.ai_pipeline_service import ai_pipeline_service, BRINJAL_CLASS_NAMES

ai_pipeline_service.initialize()

SAMPLE_DIR = BACKEND_DIR / "tests" / "sample_files"
BRINJAL_VAL_DIR = SAMPLE_DIR / "brinjal_val"
BRINJAL_BENCHMARK = BACKEND_DIR / "static" / "predictions" / "original_1789059991_3300e710.jpg"

print("=" * 100, flush=True)
print("BRINJAL CERCOSPORA DIAGNOSTIC", flush=True)
print("=" * 100, flush=True)

# Collect unique Cercospora files
cercospora_files = sorted(list(set(BRINJAL_VAL_DIR.glob("cercospora_*.*"))))[:24]
brinjal_test_list = []
if BRINJAL_BENCHMARK.exists():
    brinjal_test_list.append(("benchmark_cercospora.jpg (Benchmark)", str(BRINJAL_BENCHMARK), "Cercospora_Leaf_Spot"))
for f in cercospora_files:
    brinjal_test_list.append((f.name, str(f), "Cercospora_Leaf_Spot"))

# Add Bacterial Leaf Spot and Healthy for multi-class confusion matrix
bacterial_files = sorted(list(set(BRINJAL_VAL_DIR.glob("bacterial_*.*"))))[:5]
healthy_b_files = sorted(list(set(BRINJAL_VAL_DIR.glob("healthy_*.*"))))[:5]

for f in bacterial_files:
    brinjal_test_list.append((f.name, str(f), "Bacterial_Leaf_Spot"))
for f in healthy_b_files:
    brinjal_test_list.append((f.name, str(f), "Healthy"))

print(f"Total Brinjal images to evaluate: {len(brinjal_test_list)} (25 Cercospora, 5 Bacterial Leaf Spot, 5 Healthy)\n", flush=True)

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
        "cercospora_prob": float(probs[3]),
        "bacterial_prob": float(probs[1])
    })

print("BRINJAL CERCOSPORA INDIVIDUAL RESULTS (25 IMAGES):", flush=True)
print(f"{'Image Name':<45s} | {'True Class':<22s} | {'Predicted':<22s} | {'Conf':<7s} | {'Top-3 Probabilities':<55s} | {'Match'}", flush=True)
print("-" * 165, flush=True)
for r in brinjal_records:
    if r["true_class"] == "Cercospora_Leaf_Spot":
        top3_str = ", ".join([f"{c}: {p}%" for c, p in r["top3"]])
        print(f"{r['name']:<45s} | {r['true_class']:<22s} | {r['pred']:<22s} | {r['conf']*100:5.1f}% | {top3_str:<55s} | {r['correct']}", flush=True)

# Brinjal Confusion Matrix
# Rows: Actual (Cercospora, Bacterial LS, Healthy)
# Cols: Predicted (Cercospora, Bacterial LS, Healthy, Other)
b_cm = np.zeros((3, 4), dtype=int)
for r in brinjal_records:
    actual = r["true_class"]
    pred = r["pred"]
    r_idx = 0 if actual == "Cercospora_Leaf_Spot" else (1 if actual == "Bacterial_Leaf_Spot" else 2)
    if pred == "Cercospora_Leaf_Spot":
        c_idx = 0
    elif pred == "Bacterial_Leaf_Spot":
        c_idx = 1
    elif pred == "Healthy":
        c_idx = 2
    else:
        c_idx = 3
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
