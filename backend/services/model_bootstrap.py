"""
SmartFarm AI - Model Bootstrap Service
Automated model checkpoint provisioning from private Hugging Face Hub repository.
Ensures required checkpoints exist and match canonical SHA-256 signatures before
FastAPI AI pipeline initialization.
"""

import os
import shutil
import hashlib
import logging
import threading
from pathlib import Path
from typing import Dict, Any, List

from config import settings

logger = logging.getLogger("smartfarm.model_bootstrap")

_bootstrap_lock = threading.Lock()

# Canonical model definitions with expected remote names and canonical SHA-256 hashes
CANONICAL_MODELS = [
    {
        "name": "YOLO11",
        "remote_filename": "yolo11_best.pt",
        "get_local_path": lambda: Path(settings.clean_yolo_path),
        "expected_sha256": "c6c025dde69bec47f742bffb5bf59955cf11f4de745016a45638a848ad1418e1",
    },
    {
        "name": "SAM ViT-B",
        "remote_filename": "sam_vit_b_01ec64.pth",
        "get_local_path": lambda: Path(settings.clean_sam_path),
        "expected_sha256": "ec2df62732614e57411cdcf32a23ffdf28910380d03139ee0f4fcbe91eb8c912",
    },
    {
        "name": "ResNet-50",
        "remote_filename": "resnet50_best_model.pth",
        "get_local_path": lambda: Path(settings.clean_resnet_path),
        "expected_sha256": "9fb048609272b0b8aa3111baf930e5cb5adf9b7e25a2d84c781a0d7e911a6f9b",
    },
    {
        "name": "Brinjal ResNet-50",
        "remote_filename": "brinjal_best_model.pth",
        "get_local_path": lambda: Path(settings.clean_brinjal_resnet_path),
        "expected_sha256": "463e0595aef3070f1e9ae7eb0f2b81bdf7efbed28d675ccb105ab0620383706c",
    },
]


def calculate_sha256(file_path: Path) -> str:
    """Calculates SHA-256 hash of a file efficiently in 8MB chunks."""
    h = hashlib.sha256()
    with open(file_path, "rb") as f:
        while chunk := f.read(8 * 1024 * 1024):
            h.update(chunk)
    return h.hexdigest().lower()


def verify_file_integrity(file_path: Path, expected_sha256: str) -> bool:
    """Checks whether a local file exists, is non-empty, and matches its expected SHA-256."""
    if not file_path.exists() or file_path.stat().st_size == 0:
        return False
    computed = calculate_sha256(file_path)
    return computed == expected_sha256.lower()


def bootstrap_models() -> Dict[str, Any]:
    """
    Ensures all 4 model checkpoints are present locally and verified against canonical SHA-256 hashes.
    If any model file is missing or corrupted, downloads it from the private Hugging Face repository using HF_TOKEN.

    Startup Order:
      1. Inspect local existence and integrity of all 4 models.
      2. If missing, authenticate to Hugging Face with HF_TOKEN and download only missing files.
      3. Verify SHA-256 checksums on newly downloaded files.
      4. Return status summary.
    """
    with _bootstrap_lock:
        repo_id = settings.HF_MODEL_REPO_ID.strip()
        revision = settings.HF_MODEL_REVISION.strip() or "main"
        token = settings.hf_token

        results: List[Dict[str, Any]] = []
        missing_models: List[Dict[str, Any]] = []

        # 1. Inspect existing local files
        for model_def in CANONICAL_MODELS:
            name = model_def["name"]
            local_path = model_def["get_local_path"]()
            expected_hash = model_def["expected_sha256"]

            if local_path.exists() and local_path.stat().st_size > 0:
                logger.info(f"Model [{name}] found at {local_path}. Verifying integrity...")
                if verify_file_integrity(local_path, expected_hash):
                    logger.info(f"Model [{name}] passed SHA-256 verification. Skipping download.")
                    results.append({
                        "name": name,
                        "path": str(local_path),
                        "status": "ready",
                        "downloaded": False
                    })
                    continue
                else:
                    logger.warning(f"Model [{name}] at {local_path} failed SHA-256 integrity check. Will re-download.")

            missing_models.append(model_def)

        # 2. If all models are ready, return immediately
        if not missing_models:
            logger.info("All required model checkpoints are verified and ready.")
            return {
                "success": True,
                "models": results,
                "repo_id": repo_id,
                "downloads_performed": 0
            }

        # 3. If models are missing, validate that Hugging Face token is provided
        if not token:
            missing_names = [m["name"] for m in missing_models]
            raise RuntimeError(
                f"Missing required model checkpoints: {', '.join(missing_names)}. "
                f"Cannot download from private repository '{repo_id}' because HF_TOKEN is not configured."
            )

        # 4. Download missing models using huggingface_hub
        try:
            from huggingface_hub import hf_hub_download
        except ImportError as exc:
            raise RuntimeError(
                "huggingface_hub is required for automated model bootstrap. "
                "Install it with `pip install huggingface-hub`."
            ) from exc

        logger.info(f"Downloading {len(missing_models)} missing model checkpoint(s) from private repository '{repo_id}'...")

        for model_def in missing_models:
            name = model_def["name"]
            remote_filename = model_def["remote_filename"]
            target_path = model_def["get_local_path"]()
            expected_hash = model_def["expected_sha256"]

            # Ensure parent directory exists (e.g. backend/models/brinjal/)
            target_path.parent.mkdir(parents=True, exist_ok=True)

            logger.info(f"Downloading [{name}] ('{remote_filename}') from '{repo_id}'...")
            try:
                cached_download_path = hf_hub_download(
                    repo_id=repo_id,
                    filename=remote_filename,
                    revision=revision,
                    token=token
                )
            except Exception as e:
                logger.error(f"Hugging Face download failed for [{name}] ('{remote_filename}'): {e}")
                raise RuntimeError(
                    f"Failed to download model [{name}] ('{remote_filename}') from repository '{repo_id}': {e}"
                ) from e

            # Copy cached download to exact target local path
            try:
                shutil.copyfile(cached_download_path, target_path)
            except Exception as e:
                logger.error(f"Failed to copy downloaded model to {target_path}: {e}")
                raise RuntimeError(f"Failed to stage downloaded model [{name}] to {target_path}: {e}") from e

            # 5. Verify SHA-256 integrity of newly downloaded file
            logger.info(f"Verifying SHA-256 integrity of downloaded [{name}] at {target_path}...")
            computed_hash = calculate_sha256(target_path)
            if computed_hash != expected_hash.lower():
                if target_path.exists():
                    try:
                        target_path.unlink()
                    except Exception:
                        pass
                raise RuntimeError(
                    f"Model [{name}] failed SHA-256 integrity verification after download. "
                    f"Expected: {expected_hash}, Got: {computed_hash}"
                )

            logger.info(f"Successfully provisioned and verified model [{name}] at {target_path}.")
            results.append({
                "name": name,
                "path": str(target_path),
                "status": "ready",
                "downloaded": True
            })

        logger.info("All model checkpoints successfully bootstrapped and verified.")
        return {
            "success": True,
            "models": results,
            "repo_id": repo_id,
            "downloads_performed": len(missing_models)
        }
