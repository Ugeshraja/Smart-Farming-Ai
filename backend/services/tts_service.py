import os
import re
import io
import time
import wave
import hashlib
import logging
import threading
from pathlib import Path
from typing import Optional, Dict, Any

from piper.voice import PiperVoice
from config import settings

logger = logging.getLogger("smartfarm.tts")

STATIC_TTS_DIR: Path = settings.STATIC_DIR / "tts"
CACHE_DIR: Path = settings.CACHE_DIR / "tts"


def ensure_directories():
    """Safely ensures static and cache TTS storage directories exist."""
    try:
        STATIC_TTS_DIR.mkdir(parents=True, exist_ok=True)
        CACHE_DIR.mkdir(parents=True, exist_ok=True)
    except Exception as e:
        logger.warning(f"[TTS Cache] Directory creation notice: {e}")


def normalize_language(language: Optional[str]) -> str:
    """
    Normalizes input language string to canonical 'ta' or 'en'.
    Accepts:
      'ta', 'ta-in', 'tamil' -> 'ta'
      'en', 'en-in', 'en-us', 'english' -> 'en'
    """
    norm = (language or "").strip().lower()
    if norm.startswith("ta") or "tamil" in norm:
        return "ta"
    return "en"


def compute_cache_key(language: str, text: str, model_name: str) -> str:
    """
    Computes deterministic SHA256(language + ":" + text + ":" + model_name).
    """
    normalized_text = re.sub(r"\s+", " ", text).strip()
    raw = f"{language}:{normalized_text}:{model_name}".encode("utf-8")
    return hashlib.sha256(raw).hexdigest()


def clean_text_for_piper(text: str, language: str = "en") -> str:
    """
    Cleans markdown formatting and special characters for clean Piper synthesis.
    """
    if not text:
        return ""
    cleaned = str(text)

    # Normalize percentage
    if language == "ta":
        cleaned = cleaned.replace("%", " சதவீதம் ")
    else:
        cleaned = cleaned.replace("%", " percent ")

    # Strip markdown syntax
    cleaned = re.sub(r"\*\*([^*]+)\*\*", r"\1", cleaned)
    cleaned = re.sub(r"\*([^*]+)\*", r"\1", cleaned)
    cleaned = re.sub(r"__([^_]+)__", r"\1", cleaned)
    cleaned = re.sub(r"_([^_]+)_", r"\1", cleaned)
    cleaned = re.sub(r"^#+\s*", "", cleaned, flags=re.MULTILINE)
    cleaned = re.sub(r"^\s*[-*•]\s+", "", cleaned, flags=re.MULTILINE)
    cleaned = re.sub(r"^\s*\d+\.\s+", "", cleaned, flags=re.MULTILINE)
    cleaned = re.sub(r"[`>]", "", cleaned)
    cleaned = re.sub(r"\n{2,}", ". ", cleaned)
    cleaned = re.sub(r"\n", ", ", cleaned)
    cleaned = re.sub(r"\s{2,}", " ", cleaned)
    return cleaned.strip()


def find_espeak_data_dir() -> Path:
    """
    Locates the espeak-ng-data directory across environments (Debian Bookworm, Ubuntu, Windows, Docker).
    Guarantees that the returned directory contains 'phontab' required by libpiper_phonemize / espeakbridge,
    preventing SIGABRT / C++ abort on Linux containers.
    """
    import piper.voice
    candidates = [
        Path("/usr/share/espeak-ng-data"),
        Path("/usr/lib/espeak-ng-data"),
        Path("/usr/lib/x86_64-linux-gnu/espeak-ng-data"),
        Path("/usr/local/share/espeak-ng-data"),
        Path("/app/espeak-ng-data"),
    ]
    try:
        if hasattr(piper.voice, "ESPEAK_DATA_DIR") and piper.voice.ESPEAK_DATA_DIR:
            candidates.append(Path(piper.voice.ESPEAK_DATA_DIR))
        import piper
        candidates.append(Path(os.path.dirname(piper.__file__)) / "espeak-ng-data")
    except Exception:
        pass

    for p in candidates:
        try:
            if p.exists() and (p / "phontab").exists():
                logger.info(f"[Piper TTS] Verified espeak-ng-data at: {p}")
                return p
        except Exception:
            continue

    # Fallback to piper.voice default if none explicitly verified
    try:
        return Path(piper.voice.ESPEAK_DATA_DIR)
    except Exception:
        return Path("/usr/share/espeak-ng-data")


def _load_voice(model_path: Path) -> PiperVoice:
    """
    Loads PiperVoice with conservative ONNX Runtime SessionOptions (to avoid OOM
    under Render Free's 512 MB memory limit) and verified espeak-ng data directory.
    """
    import json
    import onnxruntime
    from piper.voice import PiperConfig, PiperVoice

    config_path = model_path.with_suffix(".onnx.json")
    if not config_path.exists():
        config_path = Path(f"{model_path}.json")
    if not config_path.exists():
        raise FileNotFoundError(f"Model config not found for {model_path}")

    with open(config_path, "r", encoding="utf-8") as f:
        config_dict = json.load(f)

    sess_options = onnxruntime.SessionOptions()
    sess_options.enable_cpu_mem_arena = False
    sess_options.execution_mode = onnxruntime.ExecutionMode.ORT_SEQUENTIAL
    sess_options.inter_op_num_threads = 1
    sess_options.intra_op_num_threads = 1

    espeak_dir = find_espeak_data_dir()

    session = onnxruntime.InferenceSession(
        str(model_path),
        sess_options=sess_options,
        providers=["CPUExecutionProvider"]
    )

    return PiperVoice(
        config=PiperConfig.from_dict(config_dict),
        session=session,
        espeak_data_dir=espeak_dir,
        download_dir=model_path.parent
    )


class PiperTTSManager:
    """
    Local / Self-Hosted Piper Text-to-Speech Manager.
    - Thread-safe lazy singleton loading for Tamil and English ONNX models.
    - Synthesizes directly to 22,050 Hz mono WAV audio.
    - Deterministic SHA-256 disk caching under static/tts/<hash>.wav.
    - Zero external API keys or cloud service dependencies.
    """

    def __init__(self):
        ensure_directories()
        self._tamil_voice: Optional[PiperVoice] = None
        self._english_voice: Optional[PiperVoice] = None
        self._lock_ta = threading.Lock()
        self._lock_en = threading.Lock()

    def _get_tamil_voice(self) -> PiperVoice:
        """Thread-safe lazy singleton loader for Tamil Piper model."""
        if self._tamil_voice is None:
            with self._lock_ta:
                if self._tamil_voice is None:
                    model_path = settings.piper_tamil_model_path
                    if not model_path.exists():
                        raise FileNotFoundError(
                            f"Tamil Piper model not found at {model_path}. "
                            "Please run scripts/download_tts_models.py."
                        )
                    logger.info(f"[Piper TTS] Loading Tamil model from {model_path}...")
                    t0 = time.time()
                    self._tamil_voice = _load_voice(model_path)
                    logger.info(f"[Piper TTS] Tamil model loaded in {time.time() - t0:.2f}s.")
        return self._tamil_voice

    def _get_english_voice(self) -> PiperVoice:
        """Thread-safe lazy singleton loader for English Piper model."""
        if self._english_voice is None:
            with self._lock_en:
                if self._english_voice is None:
                    model_path = settings.piper_english_model_path
                    if not model_path.exists():
                        raise FileNotFoundError(
                            f"English Piper model not found at {model_path}. "
                            "Please run scripts/download_tts_models.py."
                        )
                    logger.info(f"[Piper TTS] Loading English model from {model_path}...")
                    t0 = time.time()
                    self._english_voice = _load_voice(model_path)
                    logger.info(f"[Piper TTS] English model loaded in {time.time() - t0:.2f}s.")
        return self._english_voice

    def get_providers_status(self) -> Dict[str, Any]:
        """Returns safe provider status without exposing secrets."""
        ta_ready = settings.piper_tamil_model_path.exists()
        en_ready = settings.piper_english_model_path.exists()
        return {
            "status": "online" if (ta_ready and en_ready) else "degraded",
            "tts_engine": "Piper TTS (Local/Self-Hosted)",
            "models": {
                "tamil": {
                    "model": "ta_IN-rasa_female-medium",
                    "installed": ta_ready,
                    "loaded": self._tamil_voice is not None
                },
                "english": {
                    "model": "en_US-lessac-medium",
                    "installed": en_ready,
                    "loaded": self._english_voice is not None
                }
            }
        }

    def synthesize_bytes(self, text: Optional[str], language: Optional[str] = "en") -> bytes:
        """
        Synthesizes text into raw WAV audio bytes using Piper TTS.
        1. Validates text
        2. Normalizes language
        3. Cleans text
        4. Checks deterministic disk cache
        5. Synthesizes with PiperVoice
        6. Caches and returns WAV bytes
        """
        if not text or not str(text).strip():
            raise ValueError("Text cannot be empty.")

        raw_text = str(text).strip()
        if len(raw_text) > 8000:
            raise ValueError(f"Text length ({len(raw_text)} chars) exceeds maximum allowable limit (8000).")

        norm_lang = normalize_language(language)
        cleaned_text = clean_text_for_piper(raw_text, norm_lang)
        if not cleaned_text:
            raise ValueError("Text contains no speakable characters.")

        model_name = "ta_IN-rasa_female-medium" if norm_lang == "ta" else "en_US-lessac-medium"

        # 1. Check disk cache
        ensure_directories()
        cache_key = compute_cache_key(norm_lang, cleaned_text, model_name)
        wav_filename = f"{cache_key}.wav"
        wav_filepath = STATIC_TTS_DIR / wav_filename

        if wav_filepath.exists():
            try:
                if wav_filepath.stat().st_size > 1000:
                    logger.info(f"[Piper Cache] Cache hit for {norm_lang} ({cache_key[:10]}...)")
                    with open(wav_filepath, "rb") as f:
                        return f.read()
            except Exception as e:
                logger.warning(f"[Piper Cache] Error reading cache file: {e}")

        # 2. Synthesize using PiperVoice
        logger.info(f"[Piper TTS] Synthesizing {len(cleaned_text)} chars in '{norm_lang}' with {model_name}...")
        t0 = time.time()

        if norm_lang == "ta":
            voice = self._get_tamil_voice()
        else:
            voice = self._get_english_voice()

        buf = io.BytesIO()
        with wave.open(buf, "wb") as wav_file:
            voice.synthesize_wav(cleaned_text, wav_file)

        wav_bytes = buf.getvalue()
        elapsed = time.time() - t0
        logger.info(f"[Piper TTS] Synthesis completed in {elapsed:.2f}s ({len(wav_bytes)} bytes).")

        if not wav_bytes or len(wav_bytes) < 1000:
            raise RuntimeError("Piper TTS synthesis produced empty or corrupted WAV audio.")

        # 3. Save to disk cache
        try:
            with open(wav_filepath, "wb") as f_out:
                f_out.write(wav_bytes)
        except Exception as e:
            logger.warning(f"[Piper Cache] Failed to write cache file: {e}")

        return wav_bytes


# Global instance
tts_manager = PiperTTSManager()
