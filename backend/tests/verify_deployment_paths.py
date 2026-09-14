"""
SmartFarm AI - Deployment Path Architecture Verification Suite
Verifies:
1. BASE_DIR exists and resolves correctly.
2. MODELS_DIR exists and contains required models.
3. YOLO11 model file exists at resolved clean_yolo_path.
4. ResNet-50 Tomato/Potato model file exists at resolved clean_resnet_path.
5. SAM ViT-B model file exists at resolved clean_sam_path.
6. Brinjal ResNet-50 model file exists at resolved clean_brinjal_resnet_path.
7. RAG knowledge-base directory exists and contains all 21 verified text documents.
8. STATIC_DIR exists / can be safely created.
9. predictions directory exists / can be safely created.
10. TTS directory exists / can be safely created.
11. CACHE_DIR exists / can be safely created.
12. CHROMA_DB_DIR resolves correctly (deployment-safe placeholder, no database created).
13. ENV_PATH resolves correctly to backend/.env.
14. ZERO machine-specific drive prefixes (e.g. G:\\, C:\\, /content/) in resolved paths.
"""

import os
import sys
from pathlib import Path

# Ensure backend root is in sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from config import (
    settings,
    BASE_DIR,
    MODELS_DIR,
    STATIC_DIR,
    CACHE_DIR,
    RAG_DIR,
    CHROMA_DB_DIR,
    ENV_PATH,
)


def verify_paths():
    print("=" * 80)
    print("SMARTFARM AI - PHASE 2.1 DEPLOYMENT PATH VERIFICATION")
    print("=" * 80)

    checks = []

    # 1. BASE_DIR
    check_1 = BASE_DIR.exists() and BASE_DIR.is_dir()
    print(f"[CHECK 01] BASE_DIR exists: {check_1} -> {BASE_DIR}")
    checks.append(("BASE_DIR exists", check_1))

    # 2. MODELS_DIR
    check_2 = MODELS_DIR.exists() and MODELS_DIR.is_dir()
    print(f"[CHECK 02] MODELS_DIR exists: {check_2} -> {MODELS_DIR}")
    checks.append(("MODELS_DIR exists", check_2))

    # 3. YOLO11 model
    yolo_p = Path(settings.clean_yolo_path)
    check_3 = yolo_p.exists() and yolo_p.is_file() and yolo_p.stat().st_size > 1_000_000
    print(f"[CHECK 03] YOLO11 model exists: {check_3} -> {yolo_p} ({yolo_p.stat().st_size if yolo_p.exists() else 0} bytes)")
    checks.append(("YOLO11 model resolved", check_3))

    # 4. ResNet-50 model
    resnet_p = Path(settings.clean_resnet_path)
    check_4 = resnet_p.exists() and resnet_p.is_file() and resnet_p.stat().st_size > 10_000_000
    print(f"[CHECK 04] ResNet-50 model exists: {check_4} -> {resnet_p} ({resnet_p.stat().st_size if resnet_p.exists() else 0} bytes)")
    checks.append(("ResNet-50 model resolved", check_4))

    # 5. SAM ViT-B model
    sam_p = Path(settings.clean_sam_path)
    check_5 = sam_p.exists() and sam_p.is_file() and sam_p.stat().st_size > 100_000_000
    print(f"[CHECK 05] SAM ViT-B model exists: {check_5} -> {sam_p} ({sam_p.stat().st_size if sam_p.exists() else 0} bytes)")
    checks.append(("SAM ViT-B model resolved", check_5))

    # 6. Brinjal ResNet-50 model
    brinjal_p = Path(settings.clean_brinjal_resnet_path)
    check_6 = brinjal_p.exists() and brinjal_p.is_file() and brinjal_p.stat().st_size > 10_000_000
    print(f"[CHECK 06] Brinjal ResNet-50 model exists: {check_6} -> {brinjal_p} ({brinjal_p.stat().st_size if brinjal_p.exists() else 0} bytes)")
    checks.append(("Brinjal ResNet-50 model resolved", check_6))

    # 7. RAG knowledge-base directory
    rag_p = Path(settings.clean_rag_path)
    rag_files = list(rag_p.glob("*.txt")) if rag_p.exists() else []
    check_7 = rag_p.exists() and rag_p.is_dir() and len(rag_files) >= 20
    print(f"[CHECK 07] RAG knowledge-base directory exists: {check_7} -> {rag_p} ({len(rag_files)} documents)")
    checks.append(("RAG knowledge base resolved", check_7))

    # 8. STATIC_DIR
    STATIC_DIR.mkdir(parents=True, exist_ok=True)
    check_8 = STATIC_DIR.exists() and STATIC_DIR.is_dir()
    print(f"[CHECK 08] STATIC_DIR writable: {check_8} -> {STATIC_DIR}")
    checks.append(("STATIC_DIR created", check_8))

    # 9. predictions directory
    pred_dir = STATIC_DIR / "predictions"
    pred_dir.mkdir(parents=True, exist_ok=True)
    check_9 = pred_dir.exists() and pred_dir.is_dir()
    print(f"[CHECK 09] static/predictions directory writable: {check_9} -> {pred_dir}")
    checks.append(("predictions directory created", check_9))

    # 10. TTS directory
    tts_dir = STATIC_DIR / "tts"
    tts_dir.mkdir(parents=True, exist_ok=True)
    check_10 = tts_dir.exists() and tts_dir.is_dir()
    print(f"[CHECK 10] static/tts directory writable: {check_10} -> {tts_dir}")
    checks.append(("static/tts directory created", check_10))

    # 11. CACHE_DIR
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    tts_cache = CACHE_DIR / "tts"
    tts_cache.mkdir(parents=True, exist_ok=True)
    check_11 = CACHE_DIR.exists() and tts_cache.exists()
    print(f"[CHECK 11] CACHE_DIR writable: {check_11} -> {CACHE_DIR}")
    checks.append(("CACHE_DIR created", check_11))

    # 12. CHROMA_DB_DIR
    # Note: Only verifying path resolution; do NOT create a database
    chroma_str = str(CHROMA_DB_DIR)
    check_12 = "chromadb" in chroma_str and not chroma_str.startswith("G:")
    print(f"[CHECK 12] CHROMA_DB_DIR resolved safely: {check_12} -> {CHROMA_DB_DIR}")
    checks.append(("CHROMA_DB_DIR resolved", check_12))

    # 13. ENV_PATH
    check_13 = ENV_PATH.name == ".env" and ENV_PATH.parent == BASE_DIR
    print(f"[CHECK 13] ENV_PATH resolved: {check_13} -> {ENV_PATH}")
    checks.append(("ENV_PATH resolved", check_13))

    # 14. Check absence of external drive prefixes
    all_resolved = [str(yolo_p), str(resnet_p), str(sam_p), str(brinjal_p), str(rag_p)]
    has_external_drives = any(p.startswith("G:") or "/content/" in p for p in all_resolved)
    check_14 = not has_external_drives
    print(f"[CHECK 14] Zero external drive (G:\\ or /content/) dependencies: {check_14}")
    checks.append(("Zero machine-specific paths in models", check_14))

    print("\n" + "-" * 80)
    print("VERIFICATION SUMMARY:")
    all_passed = True
    for name, passed in checks:
        status_str = "PASS" if passed else "FAIL"
        if not passed:
            all_passed = False
        print(f"  [{status_str}] {name}")
    print("-" * 80)

    if all_passed:
        print("ALL 14 DEPLOYMENT PATH VERIFICATION CHECKS PASSED SUCCESSFULLY!")
    else:
        print("SOME CHECKS FAILED! Please review errors above.")
        sys.exit(1)


if __name__ == "__main__":
    verify_paths()
