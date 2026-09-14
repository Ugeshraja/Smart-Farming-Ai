import os
import re
import io
import time
import hashlib
import logging
from pathlib import Path
from typing import Optional, Dict, Any, List
from gtts import gTTS

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


def map_language(language: Optional[str]) -> str:
    """
    Authoritative language code mapping for Google TTS (gTTS):
      ta-IN -> ta
      ta    -> ta
      en-IN -> en
      en    -> en
    """
    norm = (language or "").strip().lower()
    if norm.startswith("ta"):
        return "ta"
    return "en"


def compute_cache_key(language: str, text: str) -> str:
    """
    Computes SHA256('gtts|<language>|<chunk text>').
    Deterministic unique filename hash.
    """
    normalized_text = re.sub(r"\s+", " ", text).strip()
    raw = f"gtts|{language}|{normalized_text}".encode("utf-8")
    return hashlib.sha256(raw).hexdigest()


def split_text_into_natural_chunks(text: str, max_chars: int = 1500) -> List[str]:
    """
    Splits text into natural chunks around target size of ~1500 characters.
    Prioritizes natural boundaries:
      1. Paragraph boundaries (\\n\\n)
      2. Sentence boundaries (. ! ? । Tamil virama / full stop)
      3. Punctuation boundaries (, ; : -)
      4. Whitespace boundaries

    Never cuts in the middle of a word or Tamil Unicode character.
    """
    if not text or not text.strip():
        return []

    cleaned = re.sub(r"\r\n", "\n", text).strip()
    if len(cleaned) <= max_chars:
        return [cleaned]

    chunks: List[str] = []
    # 1. Split by paragraphs
    paragraphs = [p.strip() for p in cleaned.split("\n\n") if p.strip()]

    for para in paragraphs:
        if len(para) <= max_chars:
            chunks.append(para)
            continue

        # 2. Split by sentences (. ! ? ।)
        sentence_pattern = r"(?<=[.!?।])\s+"
        sentences = [s.strip() for s in re.split(sentence_pattern, para) if s.strip()]

        current_chunk = ""
        for sentence in sentences:
            if not current_chunk:
                if len(sentence) <= max_chars:
                    current_chunk = sentence
                else:
                    # 3. Sentence itself exceeds max_chars -> split by punctuation
                    sub_parts = [p.strip() for p in re.split(r"(?<=[,;:\n])\s+", sentence) if p.strip()]
                    for part in sub_parts:
                        if not current_chunk:
                            if len(part) <= max_chars:
                                current_chunk = part
                            else:
                                # 4. Split by whitespace words (never split mid-word)
                                words = part.split(" ")
                                for word in words:
                                    if not word:
                                        continue
                                    if len(current_chunk) + len(word) + 1 <= max_chars:
                                        current_chunk = f"{current_chunk} {word}".strip()
                                    else:
                                        if current_chunk:
                                            chunks.append(current_chunk)
                                        current_chunk = word
                        elif len(current_chunk) + len(part) + 1 <= max_chars:
                            current_chunk = f"{current_chunk} {part}"
                        else:
                            chunks.append(current_chunk)
                            current_chunk = part
            elif len(current_chunk) + len(sentence) + 1 <= max_chars:
                current_chunk = f"{current_chunk} {sentence}"
            else:
                chunks.append(current_chunk)
                current_chunk = sentence

        if current_chunk:
            chunks.append(current_chunk)

    return [c for c in chunks if c.strip()]


class GoogleTTSManager:
    """
    Dedicated Google TTS (gTTS) Manager.
    Sole engine for Tamil and English Text-to-Speech synthesis in SmartFarm AI.
    Handles:
      - Canonical language mapping ('ta-IN' -> 'ta', 'en-IN' -> 'en')
      - Natural chunking (~1500 chars)
      - Deterministic SHA-256 disk caching under static/tts/<hash>.mp3
      - Direct audio_url output (/static/tts/<hash>.mp3)
      - Silent error resilience
    """

    def __init__(self):
        ensure_directories()

    def get_providers_status(self) -> Dict[str, Any]:
        """Returns safe provider status."""
        return {
            "status": "online",
            "tts_engine": "Google TTS (gTTS)",
            "providers": {
                "gtts": True
            }
        }

    def _synthesize_single_chunk(self, chunk_text: str, mapped_lang: str) -> Dict[str, Any]:
        """
        Synthesizes a single chunk using gTTS and caches as <hash>.mp3.
        Returns audio_url on success, or reason on failure.
        """
        ensure_directories()
        cache_key = compute_cache_key(mapped_lang, chunk_text)
        mp3_filename = f"{cache_key}.mp3"
        mp3_filepath = os.path.join(STATIC_TTS_DIR, mp3_filename)
        audio_url = f"/static/tts/{mp3_filename}"

        # 1. Check if cached audio file already exists
        if os.path.exists(mp3_filepath):
            try:
                if os.path.getsize(mp3_filepath) > 100:
                    logger.info(f"[gTTS Cache] Cache hit for {mapped_lang} ({cache_key[:10]}...)")
                    return {
                        "success": True,
                        "audio_url": audio_url,
                        "cached": True
                    }
            except Exception as e:
                logger.warning(f"[gTTS Cache] Error reading cache file: {e}")

        # 2. Synthesize using Google TTS (gTTS)
        try:
            logger.info(f"[gTTS] Generating MP3 audio for {len(chunk_text)} chars in '{mapped_lang}'...")
            tts = gTTS(text=chunk_text, lang=mapped_lang, slow=False)
            fp = io.BytesIO()
            tts.write_to_fp(fp)
            audio_bytes = fp.getvalue()

            if audio_bytes and len(audio_bytes) > 100:
                with open(mp3_filepath, "wb") as f_out:
                    f_out.write(audio_bytes)
                logger.info(f"[gTTS] Successfully saved {len(audio_bytes)} bytes to {mp3_filename}")
                return {
                    "success": True,
                    "audio_url": audio_url,
                    "cached": False
                }
            else:
                logger.warning("[gTTS] Synthesis produced empty audio stream.")
                return {
                    "success": False,
                    "reason": "gtts_empty_audio"
                }
        except Exception as e:
            logger.warning(f"[gTTS] Synthesis failed: {e}")
            return {
                "success": False,
                "reason": str(e)
            }

    def synthesize(self, text: Optional[str], language: Optional[str] = "en", preferred_provider: Optional[str] = None) -> Dict[str, Any]:
        """
        Synthesizes response text into sequential audio_url chunks via Google TTS.
        Never crashes or raises unhandled exceptions.
        """
        mapped_lang = map_language(language)

        # Handle empty/whitespace text safely
        if not text or not str(text).strip():
            logger.info("[gTTS] Empty text received. Skipping TTS safely.")
            return {
                "success": False,
                "audio_url": None,
                "audio_chunks": [],
                "language": mapped_lang,
                "reason": "empty_text"
            }

        # Natural chunking around target 1500 chars
        chunks = split_text_into_natural_chunks(str(text), max_chars=1500)
        if not chunks:
            return {
                "success": False,
                "audio_url": None,
                "audio_chunks": [],
                "language": mapped_lang,
                "reason": "empty_chunks"
            }

        audio_chunks: List[Dict[str, Any]] = []

        for idx, chunk_text in enumerate(chunks):
            result = self._synthesize_single_chunk(chunk_text, mapped_lang)
            if not result.get("success"):
                logger.warning(f"[gTTS] Failed to synthesize chunk {idx}: {result.get('reason')}")
                return {
                    "success": False,
                    "audio_url": None,
                    "audio_chunks": [],
                    "language": mapped_lang,
                    "reason": result.get("reason", "gtts_failed")
                }

            audio_chunks.append({
                "chunk_index": idx,
                "audio_url": result["audio_url"],
                "cached": result.get("cached", False)
            })

        first_url = audio_chunks[0]["audio_url"] if audio_chunks else None

        return {
            "success": True,
            "audio_url": first_url,
            "audio_chunks": audio_chunks,
            "language": mapped_lang,
            "total_chunks": len(audio_chunks)
        }


# Global instance
tts_manager = GoogleTTSManager()
