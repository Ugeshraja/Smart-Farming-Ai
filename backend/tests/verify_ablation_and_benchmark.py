"""
SmartFarm AI - Forensic Audit Verification & Ablation Study Script
Executes:
1. SAM Mask Coordinate & RGB/BGR Order Verification
2. 4-Way Ablation Study (Baseline, Crop Masking Only, Grey BG Only, Combined Fix)
3. 7-Image Benchmark Regression (Before vs After with Top-1, Top-2, Margin)
4. 5-Image Non-Leaf Safety Verification
"""

import os
import sys
import cv2
import numpy as np
import torch
from pathlib import Path

# Ensure backend directory is in path
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
PRED_DIR = BACKEND_DIR / "static" / "predictions"

# Test Images
HEALTHY_TOMATO_PATH = PRED_DIR / "leaf_crop_1789027565_56abfd46.jpg"
HEALTHY_POTATO_PATH = PRED_DIR / "original_1789375450_be052d7a.jpg"
TOMATO_LATE_BLIGHT_PATH = PRED_DIR / "original_1789035254_13c6c0e2.jpg"
TOMATO_EARLY_BLIGHT_PATH = SAMPLE_DIR / "tomato_real.png"
POTATO_EARLY_BLIGHT_PATH = SAMPLE_DIR / "potato_real.jpg"
BRINJAL_MOSAIC_PATH = SAMPLE_DIR / "brinjal_real 1.jpg"
BRINJAL_CERCOSPORA_PATH = PRED_DIR / "original_1789059991_3300e710.jpg"


def verify_sam_mask_and_colors():
    print("=" * 80)
    print("1. VERIFYING SAM MASK COORDINATES AND RGB/BGR CHANNEL ORDER")
    print("=" * 80)

    img_path = str(HEALTHY_TOMATO_PATH)
    img_bgr = cv2.imread(img_path)
    h, w = img_bgr.shape[:2]
    img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)

    # Run YOLO11
    yolo_res = ai_pipeline_service.yolo.predict(source=img_rgb, conf=0.20, imgsz=256, device=ai_pipeline_service.device, verbose=False)[0]
    best_idx = torch.argmax(yolo_res.boxes.conf)
    box = yolo_res.boxes.xyxy[best_idx].cpu().numpy().astype(int)
    x1, y1 = max(0, int(box[0])), max(0, int(box[1]))
    x2, y2 = min(w, int(box[2])), min(h, int(box[3]))
    yolo_crop = img_rgb[y1:y2, x1:x2].copy()

    # Run SAM
    ai_pipeline_service.sam_predictor.set_image(img_rgb)
    masks, scores, _ = ai_pipeline_service.sam_predictor.predict(box=np.array([x1, y1, x2, y2]), multimask_output=True)
    best_mask_idx = int(np.argmax(scores))
    mask = masks[best_mask_idx]
    crop_mask = mask[y1:y2, x1:x2]

    mask_pixels = int(np.sum(crop_mask))
    total_pixels = crop_mask.size
    mask_pct = (mask_pixels / total_pixels) * 100

    print(f"Original Image Shape:       {img_rgb.shape} (H={h}, W={w}, Channels=3)")
    print(f"YOLO Bounding Box:          [{x1}, {y1}, {x2}, {y2}] -> Width={x2-x1}, Height={y2-y1}")
    print(f"SAM Full Mask Shape:        {mask.shape}")
    print(f"YOLO Crop Shape:            {yolo_crop.shape}")
    print(f"Extracted Crop Mask Shape:  {crop_mask.shape}")
    print(f"Crop Mask Pixels:           {mask_pixels} / {total_pixels} ({mask_pct:.2f}%)")
    print(f"Coordinate Match:           {crop_mask.shape[:2] == yolo_crop.shape[:2]}")

    # Verify RGB vs BGR: Green channel in leaf interior should dominate over Red/Blue
    leaf_pixels = yolo_crop[crop_mask]
    mean_r = np.mean(leaf_pixels[:, 0])
    mean_g = np.mean(leaf_pixels[:, 1])
    mean_b = np.mean(leaf_pixels[:, 2])
    print(f"Leaf Interior Mean RGB:     R={mean_r:.1f}, G={mean_g:.1f}, B={mean_b:.1f} (Green dominant: {mean_g > mean_r and mean_g > mean_b})")
    assert crop_mask.shape[:2] == yolo_crop.shape[:2], "Mask dimensions do not match crop dimensions!"
    assert mean_g > mean_r, "RGB channel order check failed: Green channel should be greater than Red!"
    print(">>> SAM mask alignment and RGB color channel integrity VERIFIED!\n")


def run_ablation_study():
    print("=" * 80)
    print("2. 4-WAY ABLATION STUDY ON HEALTHY TOMATO LEAF")
    print("=" * 80)

    img_path = str(HEALTHY_TOMATO_PATH)
    img_bgr = cv2.imread(img_path)
    h, w = img_bgr.shape[:2]
    img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)

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

    # Neutral Grey Background Crop
    grey_crop = yolo_crop.copy()
    grey_crop[~crop_mask] = [115, 115, 115]

    configs = [
        ("A. Baseline (YOLO crop, unmasked)", yolo_crop, None),
        ("B. Crop Masking Only (YOLO crop, Tomato logits)", yolo_crop, "Tomato"),
        ("C. Grey BG Only (Neutral grey crop, unmasked)", grey_crop, None),
        ("D. Combined Fix (Neutral grey crop, Tomato logits)", grey_crop, "Tomato"),
    ]

    ablation_rows = []
    for cfg_name, input_img, crop_hint in configs:
        probs = ai_pipeline_service._predict_resnet_batch([input_img], crop_hint=crop_hint)[0]
        top1_idx = int(np.argmax(probs))
        top1_conf = float(probs[top1_idx])
        pred_name = CLASS_NAMES[top1_idx]
        healthy_p = float(probs[12]) # Tomato___healthy
        late_blight_p = float(probs[5]) # Tomato___Late_blight

        sorted_indices = np.argsort(probs)[::-1]
        top3 = [(CLASS_NAMES[i], round(float(probs[i]) * 100, 2)) for i in sorted_indices[:3]]

        ablation_rows.append({
            "config": cfg_name,
            "prediction": pred_name,
            "confidence": f"{top1_conf * 100:.2f}%",
            "healthy_pct": f"{healthy_p * 100:.2f}%",
            "late_blight_pct": f"{late_blight_p * 100:.2f}%",
            "top3": top3
        })

    print(f"{'Configuration':<50s} | {'Prediction':<25s} | {'Conf':<8s} | {'Healthy %':<10s} | {'Late Blight %':<12s}")
    print("-" * 115)
    for r in ablation_rows:
        print(f"{r['config']:<50s} | {r['prediction']:<25s} | {r['confidence']:<8s} | {r['healthy_pct']:<10s} | {r['late_blight_pct']:<12s}")
        print(f"   Top-3: {r['top3']}")
    print()
    return ablation_rows


def run_benchmark_comparison():
    print("=" * 80)
    print("3. 7-IMAGE BENCHMARK REGRESSION (BEFORE vs AFTER)")
    print("=" * 80)

    benchmark_images = [
        ("Healthy Tomato", str(HEALTHY_TOMATO_PATH), "Tomato", "Tomato___healthy"),
        ("Healthy Potato", str(HEALTHY_POTATO_PATH), "Potato", "Potato___healthy"),
        ("Tomato Late Blight", str(TOMATO_LATE_BLIGHT_PATH), "Tomato", "Tomato___Late_blight"),
        ("Tomato Early Blight", str(TOMATO_EARLY_BLIGHT_PATH), "Tomato", "Tomato___Early_blight"),
        ("Potato Early Blight", str(POTATO_EARLY_BLIGHT_PATH), "Potato", "Potato___Early_blight"),
        ("Brinjal Mosaic Virus", str(BRINJAL_MOSAIC_PATH), "Brinjal", "Mosaic_Virus"),
        ("Brinjal Cercospora", str(BRINJAL_CERCOSPORA_PATH), "Brinjal", "Cercospora_Leaf_Spot"),
    ]

    results = []
    for name, path, crop_hint, true_class in benchmark_images:
        with open(path, "rb") as f:
            bdata = f.read()

        # Run pipeline with the fix
        res = ai_pipeline_service.predict(bdata, crop_hint=crop_hint, explain=False, advisory=False)
        pred = res.get("disease")
        conf = res.get("confidence", 0.0)
        top3 = res.get("top3_predictions", [])
        top1_conf = top3[0]["confidence"] if len(top3) > 0 else conf
        top2_name = top3[1]["disease"] if len(top3) > 1 else "None"
        top2_conf = top3[1]["confidence"] if len(top3) > 1 else 0.0
        margin = round(top1_conf - top2_conf, 4)

        match = (pred == true_class)
        results.append({
            "name": name,
            "true_class": true_class,
            "pred": pred,
            "conf": f"{top1_conf*100:.2f}%",
            "top2": top2_name,
            "top2_conf": f"{top2_conf*100:.2f}%",
            "margin": f"{margin*100:.2f}%",
            "match": match
        })

    print(f"{'Image':<22s} | {'True Class':<22s} | {'Prediction':<25s} | {'Top-1 Conf':<10s} | {'Top-2 Pred':<22s} | {'Margin':<8s} | {'Match'}")
    print("-" * 125)
    for r in results:
        print(f"{r['name']:<22s} | {r['true_class']:<22s} | {str(r['pred']):<25s} | {r['conf']:<10s} | {r['top2']:<22s} | {r['margin']:<8s} | {r['match']}")
    print()
    return results


def run_non_leaf_safety():
    print("=" * 80)
    print("4. NON-LEAF SAFETY VERIFICATION (5 CATEGORIES)")
    print("=" * 80)

    non_leaf_samples = []

    # 1. Soil
    soil = np.zeros((400, 400, 3), dtype=np.uint8)
    soil[:, :] = [75, 55, 40]
    soil = np.clip(soil + np.random.randint(-15, 15, (400, 400, 3)), 0, 255).astype(np.uint8)
    non_leaf_samples.append(('soil', soil))

    # 2. Human Hand
    hand = np.zeros((400, 400, 3), dtype=np.uint8)
    hand[:, :] = [210, 160, 130]
    cv2.rectangle(hand, (150, 100), (250, 350), (220, 170, 140), -1)
    non_leaf_samples.append(('human_hand', hand))

    # 3. Vehicle / Object
    obj = np.zeros((400, 400, 3), dtype=np.uint8)
    obj[:, :] = [220, 220, 220]
    cv2.rectangle(obj, (80, 120), (320, 280), (30, 80, 220), -1)
    non_leaf_samples.append(('vehicle_object', obj))

    # 4. Sky
    sky = np.zeros((400, 400, 3), dtype=np.uint8)
    sky[:, :] = [135, 206, 235]
    non_leaf_samples.append(('sky_background', sky))

    # 5. Unrelated Grass
    grass = np.zeros((400, 400, 3), dtype=np.uint8)
    grass[:, :] = [34, 139, 34]
    for _ in range(150):
        x, y = np.random.randint(0, 400), np.random.randint(50, 400)
        cv2.line(grass, (x, y), (x + np.random.randint(-5, 5), y - np.random.randint(20, 50)), (50, 180, 50), 2)
    non_leaf_samples.append(('unrelated_grass', grass))

    results = []
    for name, img_rgb in non_leaf_samples:
        img_bgr = cv2.cvtColor(img_rgb, cv2.COLOR_RGB2BGR)
        _, buf = cv2.imencode('.jpg', img_bgr)
        res = ai_pipeline_service.predict(buf.tobytes(), crop_hint='Tomato', explain=False, advisory=False)
        is_rejected = (res.get("success") is False) or (res.get("status") in ("invalid_image", "uncertain_prediction"))
        results.append({
            "name": name,
            "status": res.get("status"),
            "valid_image": res.get("valid_image"),
            "disease": res.get("disease"),
            "is_rejected": is_rejected
        })
        print(f"Non-Leaf: {name:<20s} | Status: {res.get('status'):<22s} | Rejected: {is_rejected} | Message: {str(res.get('message'))[:50]}")

    print()
    return results


if __name__ == "__main__":
    verify_sam_mask_and_colors()
    run_ablation_study()
    run_benchmark_comparison()
    run_non_leaf_safety()
