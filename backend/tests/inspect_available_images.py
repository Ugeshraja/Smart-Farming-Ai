import os
import sys
from pathlib import Path
import numpy as np

BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

from services.ai_pipeline_service import ai_pipeline_service, CLASS_NAMES, BRINJAL_CLASS_NAMES

ai_pipeline_service.initialize()

sample_dir = BACKEND_DIR / "tests" / "sample_files"
pred_dir = BACKEND_DIR / "static" / "predictions"

print("=" * 80)
print("INSPECTING SAMPLE FILES")
print("=" * 80)

for p in sorted(sample_dir.glob("*.*")):
    if p.suffix.lower() in [".jpg", ".jpeg", ".png"]:
        with open(p, "rb") as f:
            b = f.read()
        res_p = ai_pipeline_service.predict(b, crop_hint="Potato", explain=False, advisory=False)
        res_b = ai_pipeline_service.predict(b, crop_hint="Brinjal", explain=False, advisory=False)
        p_dis = res_p.get("disease", "N/A")
        p_conf = res_p.get("confidence", 0.0) or 0.0
        b_dis = res_b.get("disease", "N/A")
        b_conf = res_b.get("confidence", 0.0) or 0.0
        print(f"{p.name:<25s} | Potato: {str(p_dis):<25s} ({p_conf*100:5.1f}%) | Brinjal: {str(b_dis):<25s} ({b_conf*100:5.1f}%)")

print("\n" + "=" * 80)
print("INSPECTING UNIQUE ORIGINAL PREDICTION IMAGES (FIRST 30)")
print("=" * 80)

seen_sizes = set()
unique_preds = []
for p in sorted(pred_dir.glob("original_*.jpg")):
    sz = p.stat().st_size
    if sz not in seen_sizes:
        seen_sizes.add(sz)
        unique_preds.append(p)

for p in unique_preds[:30]:
    with open(p, "rb") as f:
        b = f.read()
    res_p = ai_pipeline_service.predict(b, crop_hint="Potato", explain=False, advisory=False)
    res_b = ai_pipeline_service.predict(b, crop_hint="Brinjal", explain=False, advisory=False)
    p_dis = res_p.get("disease", "N/A")
    p_conf = res_p.get("confidence", 0.0) or 0.0
    b_dis = res_b.get("disease", "N/A")
    b_conf = res_b.get("confidence", 0.0) or 0.0
    print(f"{p.name:<35s} | Potato: {str(p_dis):<25s} ({p_conf*100:5.1f}%) | Brinjal: {str(b_dis):<25s} ({b_conf*100:5.1f}%)")
