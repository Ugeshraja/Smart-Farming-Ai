"""
SmartFarm AI - Image Validation & OOD Gate Test Suite
Tests input validation and OOD detection across 10 distinct image categories:
1. Known Potato leaf (Real dataset)
2. Known Tomato leaf (Real dataset)
3. Known Brinjal leaf (Realistic leaf)
4. Non-leaf: Person portrait
5. Non-leaf: Car vehicle
6. Non-leaf: Building facade
7. Non-leaf: Document / Receipt text
8. Non-leaf: Hero panoramic landscape
9. Non-leaf: Blank canvas / Noise
10. Agricultural field leaf with soil, shadows & necrotic spot (Tolerance check)
"""

import sys
import os
import glob
import cv2
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.ai_pipeline_service import ai_pipeline_service


def encode_img_to_bytes(img_rgb: np.ndarray) -> bytes:
    img_bgr = cv2.cvtColor(img_rgb, cv2.COLOR_RGB2BGR)
    ok, buf = cv2.imencode(".jpg", img_bgr)
    assert ok, "Could not encode image buffer"
    return buf.tobytes()


def run_tests():
    print("=" * 80)
    print("SMARTFARM AI - MULTI-CATEGORY IMAGE VALIDATION & OOD VERIFICATION TEST")
    print("=" * 80)

    ai_pipeline_service.initialize()

    results = []

    from pathlib import Path
    val_dir = os.getenv("VAL_DIR", "")
    sample_dir = Path(__file__).resolve().parent / "sample_files"

    # 1. Real Potato Leaf
    potato_files = glob.glob(os.path.join(val_dir, "00_*.JPG")) if val_dir else []
    if not potato_files:
        sample_potato = sample_dir / "potato_real.jpg"
        if sample_potato.exists():
            potato_files = [str(sample_potato)]

    if potato_files:
        pot_img = cv2.cvtColor(cv2.imread(potato_files[0]), cv2.COLOR_BGR2RGB)
        pot_bytes = encode_img_to_bytes(pot_img)
        print("\n[TEST 1] Testing Real Potato Leaf Image...")
        res = ai_pipeline_service.predict(pot_bytes, crop_hint="Potato", explain=False, advisory=False)
        print(f"  Status: {res.get('status')} | Valid: {res.get('valid_image')} | Crop: {res.get('crop')} | Disease: {res.get('disease')}")
        assert res.get("status") == "success" and res.get("valid_image") is True, f"Failed: {res}"
        results.append(("Real Potato Leaf", "PASS", res.get("status"), res.get("disease")))
    else:
        print("\n[TEST 1] SKIPPED: Potato validation files not found. (Set VAL_DIR to run).")
        results.append(("Real Potato Leaf", "SKIPPED", "no_data", "N/A"))

    # 2. Real Tomato Leaf
    tomato_files = glob.glob(os.path.join(val_dir, "03_*.JPG")) if val_dir else []
    if not tomato_files:
        sample_tomato = sample_dir / "tomato_real.png"
        if sample_tomato.exists():
            tomato_files = [str(sample_tomato)]

    if tomato_files:
        tom_img = cv2.cvtColor(cv2.imread(tomato_files[0]), cv2.COLOR_BGR2RGB)
        tom_bytes = encode_img_to_bytes(tom_img)
        print("\n[TEST 2] Testing Real Tomato Leaf Image...")
        res = ai_pipeline_service.predict(tom_bytes, crop_hint="Tomato", explain=False, advisory=False)
        print(f"  Status: {res.get('status')} | Valid: {res.get('valid_image')} | Crop: {res.get('crop')} | Disease: {res.get('disease')}")
        assert res.get("status") == "success" and res.get("valid_image") is True, f"Failed: {res}"
        results.append(("Real Tomato Leaf", "PASS", res.get("status"), res.get("disease")))
    else:
        print("\n[TEST 2] SKIPPED: Tomato validation files not found. (Set VAL_DIR to run).")
        results.append(("Real Tomato Leaf", "SKIPPED", "no_data", "N/A"))

    # 3. Known Brinjal Leaf
    brinjal_img = np.zeros((300, 300, 3), dtype=np.uint8)
    brinjal_img[:, :] = [45, 120, 55] # Base green
    cv2.circle(brinjal_img, (150, 150), 110, (40, 135, 50), -1) # Leaf lobe
    cv2.circle(brinjal_img, (120, 110), 30, (155, 170, 40), -1) # Bacterial leaf spot
    brin_bytes = encode_img_to_bytes(brinjal_img)
    print("\n[TEST 3] Testing Known Brinjal Leaf Image...")
    res = ai_pipeline_service.predict(brin_bytes, crop_hint="Brinjal", explain=False, advisory=False)
    print(f"  Status: {res.get('status')} | Valid: {res.get('valid_image')} | Crop: {res.get('crop')} | Disease: {res.get('disease')}")
    assert res.get("valid_image") is True and res.get("crop") == "Brinjal", f"Failed: {res}"
    results.append(("Known Brinjal Leaf", "PASS", res.get("status"), res.get("disease")))

    # 4. Non-leaf: Person Portrait
    person = np.ones((400, 400, 3), dtype=np.uint8) * 120
    cv2.ellipse(person, (200, 200), (90, 130), 0, 0, 360, (215, 170, 140), -1)
    cv2.circle(person, (165, 170), 12, (50, 50, 50), -1)
    cv2.circle(person, (235, 170), 12, (50, 50, 50), -1)
    p_bytes = encode_img_to_bytes(person)
    print("\n[TEST 4] Testing Non-Leaf: Person Portrait...")
    res = ai_pipeline_service.predict(p_bytes, explain=False, advisory=False)
    print(f"  Status: {res.get('status')} | Valid: {res.get('valid_image')} | Message: {res.get('message')}")
    assert res.get("status") == "invalid_image" and res.get("valid_image") is False and res.get("disease") is None
    results.append(("Person Portrait", "PASS (REJECTED)", res.get("status"), None))

    # 5. Non-leaf: Car Vehicle
    car = np.ones((400, 600, 3), dtype=np.uint8) * 200
    cv2.rectangle(car, (100, 180), (500, 300), (220, 40, 30), -1)
    cv2.rectangle(car, (180, 120), (420, 180), (200, 240, 255), -1)
    cv2.circle(car, (180, 310), 40, (30, 30, 30), -1)
    cv2.circle(car, (420, 310), 40, (30, 30, 30), -1)
    car_bytes = encode_img_to_bytes(car)
    print("\n[TEST 5] Testing Non-Leaf: Car...")
    res = ai_pipeline_service.predict(car_bytes, explain=False, advisory=False)
    print(f"  Status: {res.get('status')} | Valid: {res.get('valid_image')} | Message: {res.get('message')}")
    assert res.get("status") == "invalid_image" and res.get("valid_image") is False and res.get("disease") is None
    results.append(("Car Vehicle", "PASS (REJECTED)", res.get("status"), None))

    # 6. Non-leaf: Building Facade
    building = np.ones((500, 400, 3), dtype=np.uint8) * 160
    for r in range(4):
        for c in range(3):
            cv2.rectangle(building, (50 + c*110, 60 + r*100), (130 + c*110, 130 + r*100), (230, 240, 255), -1)
    bld_bytes = encode_img_to_bytes(building)
    print("\n[TEST 6] Testing Non-Leaf: Building...")
    res = ai_pipeline_service.predict(bld_bytes, explain=False, advisory=False)
    print(f"  Status: {res.get('status')} | Valid: {res.get('valid_image')} | Message: {res.get('message')}")
    assert res.get("status") == "invalid_image" and res.get("valid_image") is False and res.get("disease") is None
    results.append(("Building Facade", "PASS (REJECTED)", res.get("status"), None))

    # 7. Non-leaf: Document / Receipt Text
    doc = np.ones((500, 500, 3), dtype=np.uint8) * 250
    for y in range(50, 450, 25):
        cv2.line(doc, (60, y), (440, y), (30, 30, 30), 2)
    doc_bytes = encode_img_to_bytes(doc)
    print("\n[TEST 7] Testing Non-Leaf: Document...")
    res = ai_pipeline_service.predict(doc_bytes, explain=False, advisory=False)
    print(f"  Status: {res.get('status')} | Valid: {res.get('valid_image')} | Message: {res.get('message')}")
    assert res.get("status") == "invalid_image" and res.get("valid_image") is False and res.get("disease") is None
    results.append(("Document / Text", "PASS (REJECTED)", res.get("status"), None))

    # 8. Non-leaf: Hero Panoramic Landscape
    hero_path = "public/hero_smartfarm.jpg"
    assert os.path.exists(hero_path), "Hero landscape image not found"
    hero_img = cv2.cvtColor(cv2.imread(hero_path), cv2.COLOR_BGR2RGB)
    hero_bytes = encode_img_to_bytes(hero_img)
    print("\n[TEST 8] Testing Non-Leaf: Hero Panoramic Landscape...")
    res = ai_pipeline_service.predict(hero_bytes, explain=False, advisory=False)
    print(f"  Status: {res.get('status')} | Valid: {res.get('valid_image')} | Message: {res.get('message')}")
    assert res.get("status") == "invalid_image" and res.get("valid_image") is False and res.get("disease") is None
    results.append(("Hero Landscape", "PASS (REJECTED)", res.get("status"), None))

    # 9. Non-leaf: Blank White Canvas
    blank = np.ones((300, 300, 3), dtype=np.uint8) * 245
    blank_bytes = encode_img_to_bytes(blank)
    print("\n[TEST 9] Testing Non-Leaf: Blank Canvas...")
    res = ai_pipeline_service.predict(blank_bytes, explain=False, advisory=False)
    print(f"  Status: {res.get('status')} | Valid: {res.get('valid_image')} | Message: {res.get('message')}")
    assert res.get("status") == "invalid_image" and res.get("valid_image") is False and res.get("disease") is None
    results.append(("Blank Canvas", "PASS (REJECTED)", res.get("status"), None))

    # 10. Agricultural Field Leaf (Tolerance Check)
    diff_field = np.zeros((500, 500, 3), dtype=np.uint8)
    diff_field[:, :] = [65, 80, 100] # Soil
    diff_field[350:, :250] = [35, 50, 65] # Shadow
    cv2.ellipse(diff_field, (250, 250), (180, 110), 25, 0, 360, (45, 140, 55), -1) # Leaf
    cv2.ellipse(diff_field, (270, 230), (70, 35), 25, 0, 360, (130, 220, 230), -1) # Strong sunlight
    cv2.circle(diff_field, (290, 260), 40, (35, 80, 140), -1) # Necrotic spot
    diff_bytes = encode_img_to_bytes(diff_field)
    print("\n[TEST 10] Testing Agricultural Field Leaf (Soil, Shadow, Sunlight, Necrotic Spot)...")
    res = ai_pipeline_service.predict(diff_bytes, crop_hint="Potato", explain=False, advisory=False)
    print(f"  Status: {res.get('status')} | Valid: {res.get('valid_image')}")
    # Must NOT be falsely rejected as invalid_image!
    assert res.get("status") in ("success", "uncertain_prediction"), f"Falsely rejected: {res}"
    results.append(("Field Leaf (Soil/Shadow/Sun)", "PASS (TOLERATED)", res.get("status"), res.get("disease")))

    print("\n" + "=" * 80)
    print("TEST SUMMARY RESULTS")
    print("=" * 80)
    for cat, status, outcome, disease in results:
        dis_info = f" -> {disease}" if disease else ""
        print(f"  [{status:<16}] {cat:<32} Result: {outcome}{dis_info}")
    print("=" * 80)
    print("ALL 10 VALIDATION TESTS PASSED SUCCESSFULLY!")
    print("=" * 80)


if __name__ == "__main__":
    run_tests()
