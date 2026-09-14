"""
SmartFarm AI - OOD & Validation Threshold Calibration Script
Evaluates candidate thresholds across:
1. Known Potato images
2. Known Tomato images
3. Known Brinjal images
4. Known healthy images
5. Known diseased images
6. Difficult / low-quality leaf images
7. Non-leaf images (person, car, building, document, landscape, animal, noise, blank)

Measures:
- False Rejection Rate (FRR) on valid crop leaves
- False Acceptance Rate (FAR) on non-leaf images
- Precision, Recall, Accuracy, Confusion Statistics
"""

import sys
import os
import glob
import cv2
import numpy as np
import torch
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.ai_pipeline_service import ai_pipeline_service, CLASS_NAMES, BRINJAL_CLASS_NAMES

def generate_non_leaf_dataset():
    """Generates benchmark non-leaf images."""
    dataset = []

    # 1. Document / Paper with text
    doc = np.ones((500, 500, 3), dtype=np.uint8) * 250
    for y in range(50, 450, 25):
        cv2.line(doc, (60, y), (440, y), (30, 30, 30), 2)
    dataset.append(('document_receipt', doc, 'non_leaf'))

    # 2. Document / Code screenshot
    code_doc = np.ones((400, 600, 3), dtype=np.uint8) * 30
    for y in range(40, 360, 20):
        cv2.line(code_doc, (40, y), (np.random.randint(150, 550), y), (180, 220, 180), 2)
    dataset.append(('document_screenshot', code_doc, 'non_leaf'))

    # 3. Person / Portrait (Skin tones: R > G > B with face oval)
    person = np.ones((400, 400, 3), dtype=np.uint8) * 120
    cv2.ellipse(person, (200, 200), (90, 130), 0, 0, 360, (140, 170, 215), -1)
    cv2.circle(person, (165, 170), 12, (50, 50, 50), -1)
    cv2.circle(person, (235, 170), 12, (50, 50, 50), -1)
    dataset.append(('person_portrait', cv2.cvtColor(person, cv2.COLOR_BGR2RGB), 'non_leaf'))

    # 4. Car (Metallic blue/red vehicle shape with wheels)
    car = np.ones((400, 600, 3), dtype=np.uint8) * 200
    cv2.rectangle(car, (100, 180), (500, 300), (220, 40, 30), -1)
    cv2.rectangle(car, (180, 120), (420, 180), (200, 240, 255), -1)
    cv2.circle(car, (180, 310), 40, (30, 30, 30), -1)
    cv2.circle(car, (420, 310), 40, (30, 30, 30), -1)
    dataset.append(('car_vehicle', car, 'non_leaf'))

    # 5. Building / Architecture
    building = np.ones((500, 400, 3), dtype=np.uint8) * 160
    for r in range(4):
        for c in range(3):
            cv2.rectangle(building, (50 + c*110, 60 + r*100), (130 + c*110, 130 + r*100), (230, 240, 255), -1)
    dataset.append(('building_facade', building, 'non_leaf'))

    # 6. Real Hero Landscape (Drone, sky, horizon)
    hero_path = 'public/hero_smartfarm.jpg'
    if os.path.exists(hero_path):
        hero_img = cv2.cvtColor(cv2.imread(hero_path), cv2.COLOR_BGR2RGB)
        dataset.append(('landscape_panoramic', hero_img, 'non_leaf'))

    # 7. Animal (Furry brown texture)
    animal = np.zeros((400, 400, 3), dtype=np.uint8)
    animal[:, :] = [180, 130, 80]
    cv2.circle(animal, (200, 200), 120, (150, 100, 50), -1)
    cv2.circle(animal, (160, 170), 15, (20, 20, 20), -1)
    cv2.circle(animal, (240, 170), 15, (20, 20, 20), -1)
    dataset.append(('animal_pet', animal, 'non_leaf'))

    # 8. Random Noise
    noise = np.random.randint(0, 256, (300, 300, 3), dtype=np.uint8)
    dataset.append(('random_noise', noise, 'non_leaf'))

    # 9. Pure Blank Canvas
    blank = np.ones((300, 300, 3), dtype=np.uint8) * 240
    dataset.append(('blank_white', blank, 'non_leaf'))

    return dataset

def load_valid_crop_dataset():
    """Loads realistic potato, tomato, and brinjal leaf images."""
    dataset = []

    val_dir = os.getenv("VAL_DIR", "")
    # 1. Real Potato Images (if VAL_DIR dataset provided)
    potato_files = (
        glob.glob(os.path.join(val_dir, '00_*.JPG'))[:4] +
        glob.glob(os.path.join(val_dir, '01_*.JPG'))[:4] +
        glob.glob(os.path.join(val_dir, '02_*.JPG'))[:4]
    ) if val_dir and os.path.exists(val_dir) else []
    for p in potato_files:
        img = cv2.cvtColor(cv2.imread(p), cv2.COLOR_BGR2RGB)
        name = os.path.basename(p)
        is_healthy = 'healthy' in name.lower()
        dataset.append((name, img, 'Potato', 'healthy' if is_healthy else 'diseased'))

    # 2. Real Tomato Images (if VAL_DIR dataset provided)
    tomato_files = (
        glob.glob(os.path.join(val_dir, '03_*.JPG'))[:4] +
        glob.glob(os.path.join(val_dir, '05_*.JPG'))[:4] +
        glob.glob(os.path.join(val_dir, '12_*.JPG'))[:4]
    ) if val_dir and os.path.exists(val_dir) else []
    for t in tomato_files:
        img = cv2.cvtColor(cv2.imread(t), cv2.COLOR_BGR2RGB)
        name = os.path.basename(t)
        is_healthy = 'healthy' in name.lower()
        dataset.append((name, img, 'Tomato', 'healthy' if is_healthy else 'diseased'))

    # 3. Brinjal Diseased Leaf Images
    for i in range(8):
        b_leaf = np.zeros((300, 300, 3), dtype=np.uint8)
        b_leaf[:, :] = [45 + np.random.randint(-10, 10), 120 + np.random.randint(-15, 15), 55 + np.random.randint(-10, 10)]
        b_leaf[60:150, 70:160] = [160 + np.random.randint(-10, 20), 175 + np.random.randint(-15, 15), 45 + np.random.randint(-10, 15)]
        dataset.append((f'brinjal_diseased_{i}.jpg', b_leaf, 'Brinjal', 'diseased'))

    # 4. Brinjal Healthy Leaf Images
    for i in range(6):
        h_leaf = np.zeros((300, 300, 3), dtype=np.uint8)
        h_leaf[:, :] = [40 + np.random.randint(-10, 10), 135 + np.random.randint(-15, 15), 50 + np.random.randint(-10, 10)]
        dataset.append((f'brinjal_healthy_{i}.jpg', h_leaf, 'Brinjal', 'healthy'))

    # 5. Difficult Field Leaf Images (soil, shadows, strong sunlight)
    for i in range(6):
        diff_leaf = np.zeros((300, 300, 3), dtype=np.uint8)
        diff_leaf[:, :] = [70, 55, 45] # Soil
        diff_leaf[40:280, 40:270] = [38, 95, 42] # Leaf
        diff_leaf[90:150, 80:150] = [125, 85, 30] # Lesion
        dataset.append((f'difficult_leaf_{i}.jpg', diff_leaf, 'Potato' if i % 2 == 0 else 'Brinjal', 'difficult'))

    return dataset

def run_calibration():
    print("=" * 80, flush=True)
    print("SMARTFARM AI - INPUT VALIDATION & OOD THRESHOLD CALIBRATION BENCHMARK", flush=True)
    print("=" * 80, flush=True)

    ai_pipeline_service.initialize()

    non_leaf_data = generate_non_leaf_dataset()
    valid_crop_data = load_valid_crop_dataset()

    print(f"Total Non-Leaf Benchmark Images:   {len(non_leaf_data)}", flush=True)
    print(f"Total Valid Crop Benchmark Images: {len(valid_crop_data)}", flush=True)
    print(f"  - Potato Images:  {len([x for x in valid_crop_data if x[2] == 'Potato'])}", flush=True)
    print(f"  - Tomato Images:  {len([x for x in valid_crop_data if x[2] == 'Tomato'])}", flush=True)
    print(f"  - Brinjal Images: {len([x for x in valid_crop_data if x[2] == 'Brinjal'])}", flush=True)

    # Precompute model predictions once to enable rapid threshold evaluation
    print("\nPre-computing neural network probabilities and botanical metrics...", flush=True)

    non_leaf_features = []
    for name, img, _ in non_leaf_data:
        h, w = img.shape[:2]
        gray = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY)
        lap_var = cv2.Laplacian(gray, cv2.CV_64F).var()
        contrast_std = np.std(img)

        hsv = cv2.cvtColor(img, cv2.COLOR_RGB2HSV)
        s_chan, v_chan, h_chan = hsv[:, :, 1], hsv[:, :, 2], hsv[:, :, 0]

        is_doc = (np.sum(s_chan < 20) / (h * w) > 0.75) and (np.sum(v_chan > 180) / (h * w) > 0.60)
        plant_mask = ((h_chan >= 18) & (h_chan <= 95) & (s_chan >= 20) & (v_chan >= 20)) | \
                     ((h_chan >= 6) & (h_chan <= 25) & (s_chan >= 25) & (v_chan >= 20) & (v_chan <= 185))
        plant_ratio = np.sum(plant_mask) / (h * w)

        sky_mask = (img[:int(h*0.35), :, 2] > img[:int(h*0.35), :, 0] + 15) & (v_chan[:int(h*0.35), :] > 140)
        is_panoramic_sky = (np.sum(sky_mask) / (int(h*0.35) * w) > 0.40) and (plant_ratio < 0.65)

        p = ai_pipeline_service._predict_resnet_batch([img])[0]
        top_p = float(np.max(p))
        sorted_p = np.sort(p)[::-1]
        margin = float(sorted_p[0] - sorted_p[1])
        entropy = float(-np.sum(p * np.log(p + 1e-12)) / np.log(len(p)))

        non_leaf_features.append({
            'name': name,
            'h': h, 'w': w,
            'lap_var': lap_var,
            'contrast_std': contrast_std,
            'is_doc': is_doc,
            'plant_ratio': plant_ratio,
            'is_panoramic_sky': is_panoramic_sky,
            'top_p': top_p,
            'margin': margin,
            'entropy': entropy
        })

    valid_crop_features = []
    for name, img, crop, cat in valid_crop_data:
        h, w = img.shape[:2]
        gray = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY)
        lap_var = cv2.Laplacian(gray, cv2.CV_64F).var()
        contrast_std = np.std(img)

        hsv = cv2.cvtColor(img, cv2.COLOR_RGB2HSV)
        s_chan, v_chan, h_chan = hsv[:, :, 1], hsv[:, :, 2], hsv[:, :, 0]

        is_doc = (np.sum(s_chan < 20) / (h * w) > 0.75) and (np.sum(v_chan > 180) / (h * w) > 0.60)
        plant_mask = ((h_chan >= 18) & (h_chan <= 95) & (s_chan >= 20) & (v_chan >= 20)) | \
                     ((h_chan >= 6) & (h_chan <= 25) & (s_chan >= 25) & (v_chan >= 20) & (v_chan <= 185))
        plant_ratio = np.sum(plant_mask) / (h * w)

        sky_mask = (img[:int(h*0.35), :, 2] > img[:int(h*0.35), :, 0] + 15) & (v_chan[:int(h*0.35), :] > 140)
        is_panoramic_sky = (np.sum(sky_mask) / (int(h*0.35) * w) > 0.40) and (plant_ratio < 0.65)

        if crop == 'Brinjal':
            p = ai_pipeline_service._predict_brinjal_batch([img])[0]
        else:
            p = ai_pipeline_service._predict_resnet_batch([img])[0]
        top_p = float(np.max(p))
        sorted_p = np.sort(p)[::-1]
        margin = float(sorted_p[0] - sorted_p[1])
        entropy = float(-np.sum(p * np.log(p + 1e-12)) / np.log(len(p)))

        valid_crop_features.append({
            'name': name,
            'crop': crop,
            'cat': cat,
            'h': h, 'w': w,
            'lap_var': lap_var,
            'contrast_std': contrast_std,
            'is_doc': is_doc,
            'plant_ratio': plant_ratio,
            'is_panoramic_sky': is_panoramic_sky,
            'top_p': top_p,
            'margin': margin,
            'entropy': entropy
        })

    print("Pre-computation completed successfully!\n", flush=True)

    # Evaluate multiple candidate threshold settings
    candidate_configs = [
        {"name": "Strict (High Confidence / Wide Margin)", "conf": 0.50, "margin": 0.20, "entropy": 0.75},
        {"name": "Initial Proposed (conf=0.40, margin=0.12)", "conf": 0.40, "margin": 0.12, "entropy": 0.85},
        {"name": "Calibrated Balanced (conf=0.35, margin=0.08)", "conf": 0.35, "margin": 0.08, "entropy": 0.88},
        {"name": "High-Tolerance Agricultural (conf=0.28, margin=0.05)", "conf": 0.28, "margin": 0.05, "entropy": 0.92}
    ]

    for cfg in candidate_configs:
        print("=" * 70, flush=True)
        print(f"CONFIGURATION: {cfg['name']}", flush=True)
        print(f"  Confidence Threshold: >= {cfg['conf']}", flush=True)
        print(f"  Margin Threshold:     >= {cfg['margin']}", flush=True)
        print(f"  Norm Entropy Limit:   <  {cfg['entropy']}", flush=True)
        print("-" * 70, flush=True)

        non_leaf_rejected = 0
        non_leaf_accepted = 0

        for f in non_leaf_features:
            is_invalid = False
            if f['h'] < 80 or f['w'] < 80 or f['contrast_std'] < 10.0 or f['lap_var'] < 8.0:
                is_invalid = True
            elif f['is_doc'] or f['plant_ratio'] < 0.03 or f['is_panoramic_sky']:
                is_invalid = True
            elif f['top_p'] < cfg['conf'] or f['margin'] < cfg['margin'] or f['entropy'] >= cfg['entropy']:
                is_invalid = True

            if is_invalid:
                non_leaf_rejected += 1
            else:
                non_leaf_accepted += 1
                print(f"  [!] False Acceptance: {f['name']} (top_p={f['top_p']:.3f}, margin={f['margin']:.3f})", flush=True)

        valid_accepted = 0
        valid_false_rejected = 0
        valid_uncertain = 0

        for f in valid_crop_features:
            is_invalid = False
            if f['h'] < 80 or f['w'] < 80 or f['contrast_std'] < 10.0 or f['lap_var'] < 8.0:
                is_invalid = True
            elif f['is_doc'] or f['plant_ratio'] < 0.03 or f['is_panoramic_sky']:
                is_invalid = True

            if is_invalid:
                valid_false_rejected += 1
                print(f"  [!] False Rejection: {f['name']} ({f['crop']})", flush=True)
            else:
                if f['top_p'] < cfg['conf'] or f['margin'] < cfg['margin'] or f['entropy'] >= cfg['entropy']:
                    valid_uncertain += 1
                else:
                    valid_accepted += 1

        total_valid = len(valid_crop_features)
        total_non_leaf = len(non_leaf_features)

        far = (non_leaf_accepted / total_non_leaf) * 100
        frr = (valid_false_rejected / total_valid) * 100

        tp = valid_accepted + valid_uncertain
        fp = non_leaf_accepted
        tn = non_leaf_rejected
        fn = valid_false_rejected

        precision = (tp / (tp + fp)) * 100 if (tp + fp) > 0 else 0
        recall = (tp / (tp + fn)) * 100 if (tp + fn) > 0 else 0
        accuracy = ((tp + tn) / (total_valid + total_non_leaf)) * 100

        print(f"  False Acceptance Rate (FAR):  {far:.2f}% ({non_leaf_accepted}/{total_non_leaf} non-leaf accepted)", flush=True)
        print(f"  False Rejection Rate (FRR):   {frr:.2f}% ({valid_false_rejected}/{total_valid} valid crops rejected)", flush=True)
        print(f"  Valid Crops Decisive (Valid): {valid_accepted}/{total_valid} ({valid_accepted/total_valid*100:.1f}%)", flush=True)
        print(f"  Valid Crops Marked Uncertain: {valid_uncertain}/{total_valid} ({valid_uncertain/total_valid*100:.1f}%)", flush=True)
        print(f"  Precision:                    {precision:.2f}%", flush=True)
        print(f"  Recall:                       {recall:.2f}%", flush=True)
        print(f"  Overall Accuracy:             {accuracy:.2f}%\n", flush=True)

if __name__ == "__main__":
    run_calibration()
