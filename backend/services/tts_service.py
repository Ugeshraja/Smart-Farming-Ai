import os
import re
import io
import time
import wave
import hashlib
import logging
import threading
from pathlib import Path
from typing import Optional, Dict, Any, Tuple, Union

from piper.voice import PiperVoice
from config import settings

logger = logging.getLogger("smartfarm.tts")

STATIC_TTS_DIR: Path = settings.STATIC_DIR / "tts"
CACHE_DIR: Path = settings.CACHE_DIR / "tts"


def get_process_memory_mb() -> float:
    """Returns current process Resident Set Size (RSS) in megabytes."""
    try:
        import psutil
        return psutil.Process(os.getpid()).memory_info().rss / (1024 * 1024)
    except Exception:
        return 0.0


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
    Cleans text specifically for speech synthesis:
    - Preserves complete meaningful answer (no truncation)
    - Removes markdown syntax (bold, italic, headers, bullets, code blocks, blockquotes)
    - Removes emojis and pictographs
    - Removes URLs
    - Removes bracketed citations / UI markers (e.g., [1], [source: ...])
    - Removes HTML tags
    - Normalizes percentages and symbols for spoken language
    - Normalizes spacing and line breaks
    """
    if not text:
        return ""
    cleaned = str(text)

    # 1. Normalize percentages
    if language == "ta":
        cleaned = cleaned.replace("%", " சதவீதம் ")
    else:
        cleaned = cleaned.replace("%", " percent ")

    # 2. Remove URLs
    cleaned = re.sub(r"https?://\S+", "", cleaned)

    # 3. Remove bracketed annotations / citation markers like [1], [source: ...], [image]
    cleaned = re.sub(r"\[\s*(?:source|ref|citation|\d+)[^\]]*\]", "", cleaned, flags=re.IGNORECASE)

    # 4. Remove HTML tags
    cleaned = re.sub(r"<[^>]+>", "", cleaned)

    # 5. Remove Markdown formatting
    cleaned = re.sub(r"\*\*([^*]+)\*\*", r"\1", cleaned)
    cleaned = re.sub(r"\*([^*]+)\*", r"\1", cleaned)
    cleaned = re.sub(r"__([^_]+)__", r"\1", cleaned)
    cleaned = re.sub(r"_([^_]+)_", r"\1", cleaned)
    cleaned = re.sub(r"~~([^~]+)~~", r"\1", cleaned)
    cleaned = re.sub(r"^#+\s*", "", cleaned, flags=re.MULTILINE)
    cleaned = re.sub(r"^\s*[-*•]\s+", "", cleaned, flags=re.MULTILINE)
    cleaned = re.sub(r"^\s*\d+\.\s+", "", cleaned, flags=re.MULTILINE)
    cleaned = re.sub(r"^>\s*", "", cleaned, flags=re.MULTILINE)
    cleaned = re.sub(r"```[^`]*```", "", cleaned)
    cleaned = re.sub(r"`([^`]+)`", r"\1", cleaned)

    # 6. Remove Emojis and Pictographs
    emoji_pattern = re.compile(
        "["
        "\U0001F600-\U0001F64F"  # emoticons
        "\U0001F300-\U0001F5FF"  # symbols & pictographs
        "\U0001F680-\U0001F6FF"  # transport & map symbols
        "\U0001F1E0-\U0001F1FF"  # flags
        "\U00002702-\U000027B0"
        "\U000024C2-\U0001F251"
        "\U0001F900-\U0001F9FF"  # supplemental symbols
        "\U0001FA70-\U0001FAFF"  # symbols and pictographs extended-a
        "\U00002600-\U000026FF"  # misc symbols
        "]+",
        flags=re.UNICODE
    )
    cleaned = emoji_pattern.sub("", cleaned)

    # 7. Normalize spacing and line breaks
    cleaned = re.sub(r"\n{2,}", ". ", cleaned)
    cleaned = re.sub(r"\n", ", ", cleaned)
    cleaned = re.sub(r"\s{2,}", " ", cleaned)
    return cleaned.strip()


def split_text_into_chunks(text: str, max_chars: int = 120) -> list[str]:
    """
    Splits text into natural sentences/clauses for safe, memory-efficient Piper synthesis.
    Splits on sentence terminators (. ! ? । \n) and clause boundaries (, ;).
    Never splits words.
    Prevents ONNX Runtime intermediate buffer spikes under Render Free 512 MB RAM limit.
    """
    if not text:
        return []
    cleaned = text.strip()
    if len(cleaned) <= max_chars:
        return [cleaned]

    sentences = re.split(r'(?<=[.!?।\n])\s+', cleaned)
    chunks = []
    current = ""
    for s in sentences:
        s = s.strip()
        if not s:
            continue
        if len(s) > max_chars:
            sub_parts = re.split(r'(?<=[,;])\s+', s)
            for sp in sub_parts:
                sp = sp.strip()
                if not sp:
                    continue
                if current and len(current) + len(sp) + 1 > max_chars:
                    chunks.append(current)
                    current = sp
                else:
                    current = f"{current} {sp}".strip() if current else sp
        else:
            if current and len(current) + len(s) + 1 > max_chars:
                chunks.append(current)
                current = s
            else:
                current = f"{current} {s}".strip() if current else s

    if current:
        chunks.append(current)
    return chunks if chunks else [cleaned]


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
                os.environ["ESPEAK_DATA_PATH"] = str(p)
                return p
        except Exception:
            continue

    fallback = Path("/usr/share/espeak-ng-data")
    try:
        fallback = Path(piper.voice.ESPEAK_DATA_DIR)
    except Exception:
        pass
    os.environ["ESPEAK_DATA_PATH"] = str(fallback)
    return fallback


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
    - Thread-safe singleton loading for Tamil and English ONNX models.
    - Synthesizes directly to 22,050 Hz mono WAV audio.
    - Deterministic SHA-256 disk caching under static/tts/<hash>.wav.
    - Startup preloading with RAM safety guards.
    - Detailed server-side timing diagnostics.
    """

    def __init__(self):
        ensure_directories()
        self._tamil_voice: Optional[PiperVoice] = None
        self._english_voice: Optional[PiperVoice] = None
        self._lock_ta = threading.Lock()
        self._lock_en = threading.Lock()

    def _get_tamil_voice(self) -> Tuple[PiperVoice, float]:
        """Thread-safe single-active-model loader for Tamil Piper model."""
        load_time = 0.0
        if self._tamil_voice is None:
            with self._lock_ta:
                if self._tamil_voice is None:
                    # Free English model if loaded to preserve Render Free 512 MB limit
                    if self._english_voice is not None:
                        logger.info("[Piper TTS] Releasing English model to free memory for Tamil...")
                        self._english_voice = None
                        import gc
                        gc.collect()

                    model_path = settings.piper_tamil_model_path
                    if not model_path.exists():
                        raise FileNotFoundError(
                            f"Tamil Piper model not found at {model_path}. "
                            "Please run scripts/download_tts_models.py."
                        )
                    logger.info(f"[Piper TTS] MODEL_LOAD_START: model={model_path.name}")
                    t0 = time.time()
                    self._tamil_voice = _load_voice(model_path)
                    load_time = time.time() - t0
                    logger.info(f"[Piper TTS] MODEL_LOAD_END: model={model_path.name}, load_time={load_time:.3f}s")
        return self._tamil_voice, load_time

    def _get_english_voice(self) -> Tuple[PiperVoice, float]:
        """Thread-safe single-active-model loader for English Piper model."""
        load_time = 0.0
        if self._english_voice is None:
            with self._lock_en:
                if self._english_voice is None:
                    # Free Tamil model if loaded to preserve Render Free 512 MB limit
                    if self._tamil_voice is not None:
                        logger.info("[Piper TTS] Releasing Tamil model to free memory for English...")
                        self._tamil_voice = None
                        import gc
                        gc.collect()

                    model_path = settings.piper_english_model_path
                    if not model_path.exists():
                        raise FileNotFoundError(
                            f"English Piper model not found at {model_path}. "
                            "Please run scripts/download_tts_models.py."
                        )
                    logger.info(f"[Piper TTS] MODEL_LOAD_START: model={model_path.name}")
                    t0 = time.time()
                    self._english_voice = _load_voice(model_path)
                    load_time = time.time() - t0
                    logger.info(f"[Piper TTS] MODEL_LOAD_END: model={model_path.name}, load_time={load_time:.3f}s")
        return self._english_voice, load_time

    def preload_models(self) -> Dict[str, Any]:
        """
        Safely preloads the primary Tamil model during server startup if memory permits.
        Render Free has 512 MB RAM. Keeping single-active-model avoids OOM.
        """
        results = {}
        initial_rss = get_process_memory_mb()
        logger.info(f"[Piper TTS Preload] Initial process memory: {initial_rss:.2f} MB")

        MEM_LIMIT_SAFE_MB = 380.0

        # Preload Tamil model only (primary farming language) to keep memory safely under 260 MB
        if initial_rss < MEM_LIMIT_SAFE_MB and settings.piper_tamil_model_path.exists():
            try:
                logger.info("[Piper TTS Preload] Preloading Tamil model...")
                _, load_time = self._get_tamil_voice()
                ta_rss = get_process_memory_mb()
                results["tamil"] = {
                    "loaded": True,
                    "load_time_s": round(load_time, 3),
                    "rss_mb": round(ta_rss, 2)
                }
                logger.info(f"[Piper TTS Preload] Tamil model preloaded in {load_time:.2f}s. Memory: {ta_rss:.2f} MB")
            except Exception as e:
                logger.warning(f"[Piper TTS Preload] Tamil model preload skipped: {e}")
                results["tamil"] = {"loaded": False, "error": str(e)}

        final_rss = get_process_memory_mb()
        logger.info(f"[Piper TTS Preload] Complete. Final process memory: {final_rss:.2f} MB")
        return results

    def get_providers_status(self) -> Dict[str, Any]:
        """Returns safe provider status without exposing secrets."""
        ta_ready = settings.piper_tamil_model_path.exists()
        en_ready = settings.piper_english_model_path.exists()
        return {
            "status": "online" if (ta_ready and en_ready) else "degraded",
            "tts_engine": "Piper TTS (Local/Self-Hosted)",
            "memory_rss_mb": round(get_process_memory_mb(), 2),
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

    def synthesize_bytes(
        self,
        text: Optional[str],
        language: Optional[str] = "en",
        return_metadata: bool = False
    ) -> Union[bytes, Tuple[bytes, Dict[str, Any]]]:
        """
        Synthesizes text into raw WAV audio bytes using Piper TTS.
        Uses natural clause/sentence chunking to prevent memory spikes on Render Free.
        Logs:
          TTS_REQUEST_START
          MODEL_LOAD_START / MODEL_LOAD_END (if not cached/preloaded)
          SYNTHESIS_START / SYNTHESIS_END
          RESPONSE_READY
        Calculates:
          - model loading time
          - synthesis time
          - total TTS response time
        """
        request_start = time.time()
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

        logger.info(
            f"[Piper TTS] TTS_REQUEST_START: language={norm_lang}, text_len={len(cleaned_text)}, model={model_name}"
        )

        # 1. Check disk cache
        ensure_directories()
        cache_key = compute_cache_key(norm_lang, cleaned_text, model_name)
        wav_filename = f"{cache_key}.wav"
        wav_filepath = STATIC_TTS_DIR / wav_filename

        if wav_filepath.exists():
            try:
                if wav_filepath.stat().st_size > 1000:
                    with open(wav_filepath, "rb") as f:
                        wav_bytes = f.read()
                    total_time = time.time() - request_start
                    logger.info(
                        f"[Piper TTS] RESPONSE_READY: language={norm_lang}, model_load_time=0.000s, "
                        f"synthesis_time=0.000s, total_time={total_time:.3f}s, cache_hit=True"
                    )
                    timing = {
                        "model_load_time": 0.0,
                        "synthesis_time": 0.0,
                        "total_time": total_time,
                        "cache_hit": True,
                        "language": norm_lang,
                        "model": model_name
                    }
                    if return_metadata:
                        return wav_bytes, timing
                    return wav_bytes
            except Exception as e:
                logger.warning(f"[Piper Cache] Error reading cache file: {e}")

        # 2. Load model (single active model in memory to strictly stay under 512 MB)
        if norm_lang == "ta":
            voice, model_load_time = self._get_tamil_voice()
        else:
            voice, model_load_time = self._get_english_voice()

        # 3. Synthesize using PiperVoice with clause chunking for safe memory execution
        logger.info(f"[Piper TTS] SYNTHESIS_START: model={model_name}, text_len={len(cleaned_text)}")
        syn_t0 = time.time()

        chunks = split_text_into_chunks(cleaned_text, max_chars=120)
        logger.info(f"[Piper TTS] Synthesizing {len(chunks)} chunks for memory safety...")

        buf = io.BytesIO()
        with wave.open(buf, "wb") as wav_file:
            first_chunk = True
            for chunk in chunks:
                if not chunk.strip():
                    continue
                voice.synthesize_wav(chunk.strip(), wav_file, set_wav_format=first_chunk)
                first_chunk = False

        wav_bytes = buf.getvalue()
        synthesis_time = time.time() - syn_t0
        logger.info(
            f"[Piper TTS] SYNTHESIS_END: model={model_name}, synthesis_time={synthesis_time:.3f}s, "
            f"wav_bytes={len(wav_bytes)}"
        )

        import gc
        gc.collect()

        if not wav_bytes or len(wav_bytes) < 1000:
            raise RuntimeError("Piper TTS synthesis produced empty or corrupted WAV audio.")

        # 4. Save to disk cache safely
        try:
            with open(wav_filepath, "wb") as f_out:
                f_out.write(wav_bytes)
        except Exception as e:
            logger.warning(f"[Piper Cache] Failed to write cache file: {e}")

        total_time = time.time() - request_start
        logger.info(
            f"[Piper TTS] RESPONSE_READY: language={norm_lang}, model_load_time={model_load_time:.3f}s, "
            f"synthesis_time={synthesis_time:.3f}s, total_time={total_time:.3f}s, cache_hit=False"
        )

        timing = {
            "model_load_time": model_load_time,
            "synthesis_time": synthesis_time,
            "total_time": total_time,
            "cache_hit": False,
            "language": norm_lang,
            "model": model_name
        }
        if return_metadata:
            return wav_bytes, timing
        return wav_bytes


# Global instance
tts_manager = PiperTTSManager()

