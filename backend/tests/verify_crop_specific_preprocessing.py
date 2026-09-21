"""
SmartFarm AI - Crop-Specific Preprocessing & Final Verification Suite
Tests:
1. Healthy Tomato false-positive retest
2. Potato: 25 Early Blight, 3 Late Blight, 3 Healthy
3. Brinjal: 25 Cercospora, 3 Bacterial Leaf Spot, 3 Healthy
4. LIME Explainability alignment
5. Payload segmentation_visualization vs classification_input verification
6. Non-leaf safety verification (5 categories)
7. Final 10-Class Benchmark with Accuracy, Precision, Recall, F1, Confusion Matrix
"""

import os
import sys
import cv2
import json
import numpy as np
from pathlib import Path
from collections import defaultdict

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
POTATO_VAL_DIR = SAMPLE_DIR / "potato_val"
BRINJAL_VAL_DIR = SAMPLE_DIR / "brinjal_val"

HEALTHY_TOMATO_PATH = PRED_DIR / "leaf_crop_1789027565_56abfd46.jpg"
POTATO_REAL_PATH = SAMPLE_DIR / "potato_real.jpg"


def test_healthy_tomato():
    print("=" * 80)
    print("1. RETEST HEALTHY TOMATO FALSE-POSITIVE BENCHMARK")
    print("=" * 80)
    with open(HEALTHY_TOMATO_PATH, "rb") as f:
        img_bytes = f.read()

    res = ai_pipeline_service.predict(img_bytes, crop_hint="Tomato", explain=False, advisory=False)
    pred = res.get("disease")
    conf = res.get("confidence")
    diag = res.get("diagnostics", {})
    class_input = res.get("classification_input", {})
    seg_vis = res.get("segmentation_visualization", {})

    print(f"Predicted Disease : {pred}")
    print(f"Confidence        : {conf * 100:.2f}%")
    print(f"Classification In : {class_input.get('type')} ({class_input.get('description')})")
    print(f"Segmentation Vis  : {seg_vis.get('available')}")
    print(f"Preprocessing Diag: {diag.get('preprocessing')}")
    print(f"Top-3 Predictions :")
    for t in res.get("top3_predictions", []):
        print(f"  - {t['disease']}: {t['confidence_percent']}%")

    assert pred == "Tomato___healthy", f"Expected Tomato___healthy, got {pred}"
    print(">>> PASS: Healthy Tomato correctly predicted as Tomato___healthy!")
    print()
    return res


def test_potato_dataset():
    print("=" * 80)
    print("2. RETEST POTATO: 25 EARLY BLIGHT, 3 LATE BLIGHT, 3 HEALTHY")
    print("=" * 80)

    # 1. 25 Early Blight images (benchmark + 24 validation)
    eb_files = sorted(list(POTATO_VAL_DIR.glob("00_*.JPG")))[:24]
    eb_paths = [POTATO_REAL_PATH] + eb_files

    eb_correct = 0
    eb_results = []
    for p in eb_paths:
        with open(p, "rb") as f:
            bdata = f.read()
        res = ai_pipeline_service.predict(bdata, crop_hint="Potato", explain=False, advisory=False)
        pred = res.get("disease")
        conf = res.get("confidence", 0.0)
        is_corr = (pred == "Potato___Early_blight")
        if is_corr:
            eb_correct += 1
        eb_results.append({
            "file": p.name,
            "pred": pred,
            "conf": conf,
            "correct": is_corr,
            "class_input": res.get("classification_input", {}).get("type")
        })

    print(f"Potato Early Blight: {eb_correct}/{len(eb_paths)} Correct ({eb_correct / len(eb_paths) * 100:.1f}% Recall)")
    for r in eb_results[:5]:
        print(f"  {r['file']:<35s} | Pred: {r['pred']:<22s} | Conf: {r['conf']*100:.2f}% | Input: {r['class_input']} | Correct: {r['correct']}")
    print(f"  ... ({len(eb_paths) - 5} more images verified)")

    # 2. 3 Late Blight images
    lb_files = sorted(list(POTATO_VAL_DIR.glob("01_*.JPG")))[:3]
    lb_correct = 0
    for p in lb_files:
        with open(p, "rb") as f:
            bdata = f.read()
        res = ai_pipeline_service.predict(bdata, crop_hint="Potato", explain=False, advisory=False)
        pred = res.get("disease")
        conf = res.get("confidence", 0.0)
        is_corr = (pred == "Potato___Late_blight")
        if is_corr:
            lb_correct += 1
        print(f"Late Blight: {p.name:<30s} | Pred: {pred:<22s} | Conf: {conf*100:.2f}% | Correct: {is_corr}")

    # 3. 3 Healthy images
    hl_files = sorted(list(POTATO_VAL_DIR.glob("02_*.JPG")))[:3]
    hl_correct = 0
    for p in hl_files:
        with open(p, "rb") as f:
            bdata = f.read()
        res = ai_pipeline_service.predict(bdata, crop_hint="Potato", explain=False, advisory=False)
        pred = res.get("disease")
        conf = res.get("confidence", 0.0)
        is_corr = (pred == "Potato___healthy")
        if is_corr:
            hl_correct += 1
        print(f"Healthy    : {p.name:<30s} | Pred: {pred:<22s} | Conf: {conf*100:.2f}% | Correct: {is_corr}")

    print(f"\nPotato Totals: EB={eb_correct}/{len(eb_paths)}, LB={lb_correct}/{len(lb_files)}, HL={hl_correct}/{len(hl_files)}")
    assert eb_correct >= 24, f"Expected at least 24/25 EB correct, got {eb_correct}"
    assert lb_correct == 3, f"Expected 3/3 LB correct, got {lb_correct}"
    assert hl_correct == 3, f"Expected 3/3 HL correct, got {hl_correct}"
    print(">>> PASS: Potato test passed with high recall!")
    print()
    return {"eb_correct": eb_correct, "lb_correct": lb_correct, "hl_correct": hl_correct}


def test_brinjal_dataset():
    print("=" * 80)
    print("3. RETEST BRINJAL: 25 CERCOSPORA, 3 BACTERIAL LEAF SPOT, 3 HEALTHY")
    print("=" * 80)

    # 1. 25 Cercospora images
    cls_files = sorted(list(BRINJAL_VAL_DIR.glob("cercospora_*.jpg")))[:25]
    cls_correct = 0
    for p in cls_files:
        with open(p, "rb") as f:
            bdata = f.read()
        res = ai_pipeline_service.predict(bdata, crop_hint="Brinjal", explain=False, advisory=False)
        pred = res.get("disease")
        conf = res.get("confidence", 0.0)
        is_corr = (pred == "Cercospora_Leaf_Spot")
        if is_corr:
            cls_correct += 1

    print(f"Brinjal Cercospora Leaf Spot: {cls_correct}/{len(cls_files)} Correct ({cls_correct / len(cls_files) * 100:.1f}% Recall)")

    # 2. 3 Bacterial Leaf Spot images
    bs_files = sorted(list(BRINJAL_VAL_DIR.glob("bacterial_*.jpg")))[:3]
    bs_correct = 0
    for p in bs_files:
        with open(p, "rb") as f:
            bdata = f.read()
        res = ai_pipeline_service.predict(bdata, crop_hint="Brinjal", explain=False, advisory=False)
        pred = res.get("disease")
        conf = res.get("confidence", 0.0)
        is_corr = (pred == "Bacterial_Leaf_Spot")
        if is_corr:
            bs_correct += 1
        print(f"Bacterial LS: {p.name:<25s} | Pred: {pred:<22s} | Conf: {conf*100:.2f}% | Correct: {is_corr}")

    # 3. 3 Healthy images
    h_files = sorted(list(BRINJAL_VAL_DIR.glob("healthy_*.jpg")))[:3]
    h_correct = 0
    for p in h_files:
        with open(p, "rb") as f:
            bdata = f.read()
        res = ai_pipeline_service.predict(bdata, crop_hint="Brinjal", explain=False, advisory=False)
        pred = res.get("disease")
        conf = res.get("confidence", 0.0)
        is_corr = (pred == "Healthy")
        if is_corr:
            h_correct += 1
        print(f"Healthy     : {p.name:<25s} | Pred: {pred:<22s} | Conf: {conf*100:.2f}% | Correct: {is_corr}")

    print(f"\nBrinjal Totals: CLS={cls_correct}/{len(cls_files)}, BS={bs_correct}/{len(bs_files)}, H={h_correct}/{len(h_files)}")
    assert cls_correct >= 24, f"Expected >= 24/25 Cercospora correct, got {cls_correct}"
    assert bs_correct == 3, f"Expected 3/3 Bacterial LS correct, got {bs_correct}"
    assert h_correct == 3, f"Expected 3/3 Healthy correct, got {h_correct}"
    print(">>> PASS: Brinjal test passed!")
    print()
    return {"cls_correct": cls_correct, "bs_correct": bs_correct, "h_correct": h_correct}


def test_lime_and_payload_distinction():
    print("=" * 80)
    print("4. VERIFY LIME AND PAYLOAD DISTINCTION (classification_input vs segmentation_visualization)")
    print("=" * 80)

    # Test Potato with explain=True
    with open(POTATO_REAL_PATH, "rb") as f:
        p_bytes = f.read()
    res_p = ai_pipeline_service.predict(p_bytes, crop_hint="Potato", explain=True, advisory=False)
    
    print("Potato:")
    print(f"  Classification Input : {res_p.get('classification_input')}")
    print(f"  Segmentation Vis     : {res_p.get('segmentation_visualization')}")
    print(f"  Segmentation Dict    : {res_p.get('segmentation')}")
    print(f"  LIME Available       : {res_p.get('lime', {}).get('available')}")
    print(f"  LIME Explanation     : {res_p.get('lime', {}).get('explanation')[:100]}...")

    assert res_p["classification_input"]["type"] == "yolo_crop", "Potato must use yolo_crop as classification_input"
    assert res_p["diagnostics"]["classification_input"] == "yolo_crop"
    assert res_p["diagnostics"]["segmentation_used_for_classification"] is False

    # Test Tomato with explain=True
    with open(HEALTHY_TOMATO_PATH, "rb") as f:
        t_bytes = f.read()
    res_t = ai_pipeline_service.predict(t_bytes, crop_hint="Tomato", explain=True, advisory=False)

    print("\nTomato:")
    print(f"  Classification Input : {res_t.get('classification_input')}")
    print(f"  Segmentation Vis     : {res_t.get('segmentation_visualization')}")
    print(f"  Segmentation Dict    : {res_t.get('segmentation')}")
    print(f"  LIME Available       : {res_t.get('lime', {}).get('available')}")
    print(f"  LIME Explanation     : {res_t.get('lime', {}).get('explanation')[:100]}...")

    assert res_t["classification_input"]["type"] == "sam_neutral_grey_crop", "Tomato must use sam_neutral_grey_crop"
    assert res_t["diagnostics"]["classification_input"] == "sam_neutral_grey_crop"
    assert res_t["diagnostics"]["segmentation_used_for_classification"] is True

    # Test Brinjal with explain=True
    b_file = list(BRINJAL_VAL_DIR.glob("cercospora_*.jpg"))[0]
    with open(b_file, "rb") as f:
        b_bytes = f.read()
    res_b = ai_pipeline_service.predict(b_bytes, crop_hint="Brinjal", explain=True, advisory=False)

    print("\nBrinjal:")
    print(f"  Classification Input : {res_b.get('classification_input')}")
    print(f"  Segmentation Vis     : {res_b.get('segmentation_visualization')}")
    print(f"  LIME Available       : {res_b.get('lime', {}).get('available')}")

    assert res_b["classification_input"]["type"] == "raw_image", "Brinjal must use raw_image"
    assert res_b["diagnostics"]["classification_input"] == "raw_image"
    assert res_b["diagnostics"]["segmentation_used_for_classification"] is False

    print("\n>>> PASS: LIME and payload distinction verified across all crops!")
    print()


def test_non_leaf_safety():
    print("=" * 80)
    print("5. NON-LEAF SAFETY VERIFICATION (5 CATEGORIES)")
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

    for name, img_rgb in non_leaf_samples:
        img_bgr = cv2.cvtColor(img_rgb, cv2.COLOR_RGB2BGR)
        _, buf = cv2.imencode('.jpg', img_bgr)
        res = ai_pipeline_service.predict(buf.tobytes(), crop_hint='Tomato', explain=False, advisory=False)
        is_rejected = (res.get("success") is False) or (res.get("status") in ("invalid_image", "uncertain_prediction"))
        print(f"Non-Leaf: {name:<18s} | Status: {res.get('status'):<20s} | Rejected: {is_rejected} | Message: {str(res.get('message'))[:50]}")
        assert is_rejected, f"Non-leaf sample '{name}' was not rejected!"

    print(">>> PASS: All 5 non-leaf samples safely rejected!")
    print()


def test_final_benchmark():
    print("=" * 80)
    print("6. FINAL 10-CLASS BENCHMARK & METRICS EVALUATION")
    print("=" * 80)

    # Dataset definition covering 10 classes
    # Tomato: Healthy, Early Blight, Late Blight
    # Potato: Healthy, Early Blight, Late Blight
    # Brinjal: Healthy, Mosaic Virus, Cercospora, Bacterial Leaf Spot
    benchmark_manifest = [
        # Tomato
        ("Tomato", "Tomato___healthy", HEALTHY_TOMATO_PATH),
        ("Tomato", "Tomato___Early_blight", SAMPLE_DIR / "tomato_real.png"),
        ("Tomato", "Tomato___Late_blight", PRED_DIR / "original_1789035254_13c6c0e2.jpg"),
        # Potato
        ("Potato", "Potato___healthy", list(POTATO_VAL_DIR.glob("02_*.JPG"))[0]),
        ("Potato", "Potato___Early_blight", POTATO_REAL_PATH),
        ("Potato", "Potato___Late_blight", list(POTATO_VAL_DIR.glob("01_*.JPG"))[0]),
        # Brinjal
        ("Brinjal", "Healthy", list(BRINJAL_VAL_DIR.glob("healthy_*.jpg"))[0]),
        ("Brinjal", "Mosaic_Virus", SAMPLE_DIR / "brinjal_real 1.jpg"),
        ("Brinjal", "Cercospora_Leaf_Spot", list(BRINJAL_VAL_DIR.glob("cercospora_*.jpg"))[0]),
        ("Brinjal", "Bacterial_Leaf_Spot", list(BRINJAL_VAL_DIR.glob("bacterial_*.jpg"))[0]),
    ]

    # Let's add multiple samples for each class to compute meaningful metrics
    expanded_manifest = []
    # Tomato:
    expanded_manifest.append(("Tomato", "Tomato___healthy", HEALTHY_TOMATO_PATH))
    expanded_manifest.append(("Tomato", "Tomato___Early_blight", SAMPLE_DIR / "tomato_real.png"))
    expanded_manifest.append(("Tomato", "Tomato___Late_blight", PRED_DIR / "original_1789035254_13c6c0e2.jpg"))

    # Potato:
    for f in list(POTATO_VAL_DIR.glob("02_*.JPG"))[:3]:
        expanded_manifest.append(("Potato", "Potato___healthy", f))
    expanded_manifest.append(("Potato", "Potato___Early_blight", POTATO_REAL_PATH))
    for f in list(POTATO_VAL_DIR.glob("00_*.JPG"))[:4]:
        expanded_manifest.append(("Potato", "Potato___Early_blight", f))
    for f in list(POTATO_VAL_DIR.glob("01_*.JPG"))[:3]:
        expanded_manifest.append(("Potato", "Potato___Late_blight", f))

    # Brinjal:
    for f in list(BRINJAL_VAL_DIR.glob("healthy_*.jpg"))[:3]:
        expanded_manifest.append(("Brinjal", "Healthy", f))
    expanded_manifest.append(("Brinjal", "Mosaic_Virus", SAMPLE_DIR / "brinjal_real 1.jpg"))
    for f in list(BRINJAL_VAL_DIR.glob("cercospora_*.jpg"))[:5]:
        expanded_manifest.append(("Brinjal", "Cercospora_Leaf_Spot", f))
    for f in list(BRINJAL_VAL_DIR.glob("bacterial_*.jpg"))[:3]:
        expanded_manifest.append(("Brinjal", "Bacterial_Leaf_Spot", f))

    y_true = []
    y_pred = []
    crop_list = []
    details = []

    for crop, true_cls, path in expanded_manifest:
        with open(path, "rb") as f:
            bdata = f.read()
        res = ai_pipeline_service.predict(bdata, crop_hint=crop, explain=False, advisory=False)
        pred = res.get("disease")
        conf = res.get("confidence", 0.0)
        preprocessing = res.get("diagnostics", {}).get("preprocessing", "N/A")
        
        y_true.append(true_cls)
        y_pred.append(pred)
        crop_list.append(crop)
        details.append({
            "crop": crop,
            "true_class": true_cls,
            "predicted": pred,
            "confidence": conf,
            "preprocessing": preprocessing,
            "match": (true_cls == pred)
        })

    # Compute metrics per class
    classes = sorted(list(set(y_true)))
    metrics = {}
    total_samples = len(y_true)
    total_correct = sum(1 for t, p in zip(y_true, y_pred) if t == p)

    # Confusion matrix dict: cm[true_cls][pred_cls]
    cm = defaultdict(lambda: defaultdict(int))
    for t, p in zip(y_true, y_pred):
        cm[t][p] += 1

    print(f"{'Crop':<8s} | {'True Class':<25s} | {'Predicted Class':<25s} | {'Conf':<8s} | {'Preprocessing':<28s} | {'Match'}")
    print("-" * 115)
    for d in details:
        print(f"{d['crop']:<8s} | {d['true_class']:<25s} | {str(d['predicted']):<25s} | {d['confidence']*100:6.2f}% | {d['preprocessing']:<28s} | {d['match']}")

    print("\n" + "=" * 80)
    print("BENCHMARK METRICS SUMMARY")
    print("=" * 80)
    print(f"Total Samples Tested: {total_samples}")
    print(f"Overall Accuracy: {total_correct / total_samples * 100:.2f}% ({total_correct}/{total_samples})\n")

    print(f"{'Class':<25s} | {'Support':<8s} | {'Precision':<10s} | {'Recall':<10s} | {'F1-Score':<10s}")
    print("-" * 75)

    macro_prec = []
    macro_rec = []
    macro_f1 = []

    for cls in classes:
        tp = cm[cls][cls]
        fp = sum(cm[other][cls] for other in classes if other != cls)
        fn = sum(cm[cls][other] for other in classes if other != cls)
        support = tp + fn

        prec = tp / (tp + fp) if (tp + fp) > 0 else 0.0
        rec = tp / (tp + fn) if (tp + fn) > 0 else 0.0
        f1 = (2 * prec * rec) / (prec + rec) if (prec + rec) > 0 else 0.0

        macro_prec.append(prec)
        macro_rec.append(rec)
        macro_f1.append(f1)

        print(f"{cls:<25s} | {support:<8d} | {prec*100:8.2f}% | {rec*100:8.2f}% | {f1*100:8.2f}%")

    avg_prec = np.mean(macro_prec)
    avg_rec = np.mean(macro_rec)
    avg_f1 = np.mean(macro_f1)
    print("-" * 75)
    print(f"{'Macro Average':<25s} | {total_samples:<8d} | {avg_prec*100:8.2f}% | {avg_rec*100:8.2f}% | {avg_f1*100:8.2f}%\n")

    print("Confusion Matrix:")
    print(f"{'True \\ Pred':<25s} | " + " | ".join([f"{c[:10]:<10s}" for c in classes]))
    for t in classes:
        row_str = f"{t:<25s} | " + " | ".join([f"{cm[t][p]:<10d}" for p in classes])
        print(row_str)

    print("\nCrop-Specific Preprocessing in Effect:")
    print("  - Tomato : YOLO + SAM + Neutral Grey BG [115,115,115] + Logit Masking [3..12]")
    print("  - Potato : YOLO crop only (SAM bypassed for classification) + Logit Masking [0..2]")
    print("  - Brinjal: Existing direct ResNet pipeline (YOLO & SAM bypassed)")
    print()


if __name__ == "__main__":
    test_healthy_tomato()
    test_potato_dataset()
    test_brinjal_dataset()
    test_lime_and_payload_distinction()
    test_non_leaf_safety()
    test_final_benchmark()
    print("ALL TESTS COMPLETED SUCCESSFULLY!")
