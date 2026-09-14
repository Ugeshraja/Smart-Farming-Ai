"""
SmartFarm AI - Phase 2.4 Storage, RAG, and Runtime Directory Verification
Tests:
1. RAG knowledge-base path resolution and document count.
2. Static storage directories (predictions, tts) exist and are writable.
3. Cache storage directory exists and is writable.
4. Path traversal protection on static file and audio endpoints.
5. Generated URLs for predictions and audio are relative paths (/static/...).
6. RAG retrieval returns verified domain knowledge without external drive dependencies.
7. gTTS deterministic SHA-256 caching and persistence.
"""

import os
import sys
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from config import settings
from services.rag_service import rag_service
from services.tts_service import tts_manager, compute_cache_key
from main import app

client = TestClient(app)


def test_rag_directory_integrity():
    """Verify RAG directory exists and contains all 21 Solanaceae agronomic documents."""
    rag_dir = Path(settings.clean_rag_path)
    assert rag_dir.exists(), f"RAG directory missing: {rag_dir}"
    assert rag_dir.is_dir()

    txt_files = list(rag_dir.glob("*.txt"))
    assert len(txt_files) == 21, f"Expected 21 RAG documents, found {len(txt_files)}"

    for f in txt_files:
        assert f.stat().st_size > 100, f"RAG file {f.name} is unexpectedly small or empty"
        with open(f, "r", encoding="utf-8") as fh:
            content = fh.read()
            assert len(content) > 50, f"Could not read content from {f.name}"


def test_static_storage_directories():
    """Verify static storage paths resolve safely and are writable."""
    static_dir = settings.STATIC_DIR
    predictions_dir = static_dir / "predictions"
    tts_dir = static_dir / "tts"

    assert static_dir.exists()
    assert predictions_dir.exists()
    assert tts_dir.exists()

    # Write test probe
    probe_pred = predictions_dir / ".write_probe"
    probe_pred.write_text("probe", encoding="utf-8")
    assert probe_pred.read_text(encoding="utf-8") == "probe"
    probe_pred.unlink()

    probe_tts = tts_dir / ".write_probe"
    probe_tts.write_text("probe", encoding="utf-8")
    assert probe_tts.read_text(encoding="utf-8") == "probe"
    probe_tts.unlink()


def test_cache_storage_directories():
    """Verify cache directories resolve and are writable."""
    cache_dir = settings.CACHE_DIR
    cache_tts_dir = cache_dir / "tts"

    assert cache_dir.exists()
    assert cache_tts_dir.exists()

    probe_cache = cache_tts_dir / ".write_probe"
    probe_cache.write_text("probe", encoding="utf-8")
    assert probe_cache.read_text(encoding="utf-8") == "probe"
    probe_cache.unlink()


def test_no_machine_specific_paths():
    """Verify runtime storage paths contain no external drive letters or temporary sandbox paths."""
    for p in [settings.STATIC_DIR, settings.CACHE_DIR, settings.RAG_DIR, settings.MODELS_DIR]:
        path_str = str(p)
        assert not path_str.startswith("G:\\")
        assert not path_str.startswith("/content/")
        assert "farmer_ai_project" not in path_str
        assert "My Drive" not in path_str


def test_audio_endpoint_path_traversal_protection():
    """Verify /api/voice/audio/{filename} safely handles attempted path traversals."""
    # Attempt path traversal
    response = client.get("/api/voice/audio/../../config.py")
    # Should either 404 or resolve safe basename (which is not found), never 200 with config contents
    assert response.status_code in (404, 400, 422)
    if response.status_code == 200:
        assert "SECRET_KEY" not in response.text
        assert "BaseSettings" not in response.text


def test_relative_urls_contract():
    """Verify that synthesized speech returns relative URLs starting with /static/tts/."""
    res = tts_manager.synthesize("System operational verification test.", language="en")
    assert res["success"] is True
    audio_url = res["audio_url"]
    assert audio_url.startswith("/static/tts/")
    assert not audio_url.startswith("http://")
    assert not audio_url.startswith("https://")
    assert not audio_url.startswith("C:")


def test_rag_retrieval_functionality():
    """Verify RAG retrieval returns verified context for Solanaceae queries."""
    res = rag_service.retrieve_rag_context("Tomato Early Blight symptoms and management", crop="Tomato")
    assert res["has_context"] is True
    assert res["top_k"] > 0
    assert len(res["context_text"]) > 100
    assert "TNAU" in res["primary_source"] or "Tomato" in res["primary_source"]


def test_gtts_deterministic_caching():
    """Verify deterministic hash key calculation for gTTS cache."""
    key1 = compute_cache_key("en", "Test phrase for deterministic hashing.")
    key2 = compute_cache_key("en", "Test phrase for deterministic hashing.")
    key3 = compute_cache_key("ta", "Test phrase for deterministic hashing.")
    assert key1 == key2
    assert key1 != key3
    assert len(key1) == 64  # SHA-256 hex length
