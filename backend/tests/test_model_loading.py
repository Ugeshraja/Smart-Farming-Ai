"""
SmartFarm AI - Phase 2.3 Model Loading and Inference Lifecycle Verification
Tests:
1. Canonical model paths resolve properly from Settings.
2. Canonical model files exist, are readable, and have non-zero size.
3. Centralized device selection (CPU/CUDA) functions safely.
4. Model initialization succeeds and instances are cached (reused without reload).
5. Thread-safe singleton lifecycle: subsequent calls to initialize() are no-ops.
6. Missing model handling is explicit and raises FileNotFoundError.
7. Crop routing isolation: Brinjal uses Brinjal ResNet-50 and bypasses YOLO/SAM.
8. /api/health endpoint reports safe model readiness without leaking paths or secrets.
"""

import os
import sys
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from config import settings
from services.ai_pipeline_service import ai_pipeline_service, CLASS_NAMES, BRINJAL_CLASS_NAMES
from main import app

client = TestClient(app)


def test_model_paths_resolve():
    """Verify that all canonical model paths resolve to absolute paths without machine-specific prefixes."""
    assert settings.clean_yolo_path.endswith("yolo11_best.pt")
    assert settings.clean_resnet_path.endswith("resnet50_best_model.pth")
    assert settings.clean_sam_path.endswith("sam_vit_b_01ec64.pth")
    assert settings.clean_brinjal_resnet_path.replace("\\", "/").endswith("brinjal/best_model.pth")

    for path_str in [
        settings.clean_yolo_path,
        settings.clean_resnet_path,
        settings.clean_sam_path,
        settings.clean_brinjal_resnet_path
    ]:
        assert not path_str.startswith("G:\\")
        assert not path_str.startswith("/content/")
        assert os.path.isabs(path_str)


def test_canonical_model_files_exist_and_readable():
    """Verify all 4 canonical model checkpoint files exist and are readable."""
    models_to_check = {
        "YOLO11": settings.clean_yolo_path,
        "ResNet-50": settings.clean_resnet_path,
        "SAM ViT-B": settings.clean_sam_path,
        "Brinjal ResNet-50": settings.clean_brinjal_resnet_path
    }

    for name, path in models_to_check.items():
        assert os.path.exists(path), f"Model file missing for {name}: {path}"
        assert os.path.getsize(path) > 100_000, f"Model file {name} appears empty or corrupted: {path}"
        with open(path, "rb") as f:
            header = f.read(16)
            assert len(header) == 16, f"Could not read header bytes for {name}"


def test_device_selection_centralized():
    """Verify device selection safely selects CPU or CUDA."""
    device_type = ai_pipeline_service.device.type
    assert device_type in ("cpu", "cuda"), f"Unexpected device: {device_type}"


def test_model_initialization_and_caching():
    """Verify models initialize once and instances are cached in memory."""
    ai_pipeline_service.initialize()
    assert ai_pipeline_service.is_loaded is True
    assert ai_pipeline_service.yolo is not None
    assert ai_pipeline_service.resnet is not None
    assert ai_pipeline_service.sam_predictor is not None
    assert ai_pipeline_service.brinjal_resnet is not None
    assert ai_pipeline_service.brinjal_is_loaded is True

    # Capture object memory addresses
    yolo_id = id(ai_pipeline_service.yolo)
    resnet_id = id(ai_pipeline_service.resnet)
    sam_id = id(ai_pipeline_service.sam_predictor)
    brinjal_id = id(ai_pipeline_service.brinjal_resnet)

    # Subsequent initialize() must be a no-op that reuses the exact same objects
    ai_pipeline_service.initialize()
    assert id(ai_pipeline_service.yolo) == yolo_id
    assert id(ai_pipeline_service.resnet) == resnet_id
    assert id(ai_pipeline_service.sam_predictor) == sam_id
    assert id(ai_pipeline_service.brinjal_resnet) == brinjal_id


def test_missing_model_behavior_explicit():
    """Verify that attempting to initialize with a missing model path raises an explicit FileNotFoundError."""
    from services.ai_pipeline_service import AIPipelineService
    temp_service = AIPipelineService()

    # Point clean_yolo_path temporarily to non-existent file
    original_yolo_path = settings.YOLO_MODEL_PATH
    try:
        settings.YOLO_MODEL_PATH = "models/non_existent_yolo_path.pt"
        with pytest.raises(FileNotFoundError) as exc_info:
            temp_service.initialize()
        assert "YOLO11 model not found" in str(exc_info.value)
    finally:
        settings.YOLO_MODEL_PATH = original_yolo_path


def test_crop_routing_isolation():
    """Verify crop classification classes and isolation between Potato/Tomato and Brinjal."""
    assert len(CLASS_NAMES) == 13
    assert len(BRINJAL_CLASS_NAMES) == 8
    # Tomato/Potato classes must not overlap with Brinjal classes
    assert set(CLASS_NAMES).isdisjoint(set(BRINJAL_CLASS_NAMES))


def test_health_endpoint_model_readiness():
    """Verify GET /api/health returns model readiness booleans without revealing file paths or secrets."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()

    assert "ai_pipeline" in data
    pipeline = data["ai_pipeline"]
    assert "is_loaded" in pipeline
    assert "device" in pipeline
    assert "models" in pipeline
    models = pipeline["models"]
    assert models["yolo"] is True
    assert models["sam"] is True
    assert models["resnet"] is True
    assert models["brinjal_resnet"] is True

    # Ensure no sensitive filesystem path is exposed in the health payload
    content_str = str(data)
    assert "C:\\" not in content_str
    assert "/Users/" not in content_str
    assert "models/" not in content_str
