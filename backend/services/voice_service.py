import os
import re
import base64
import logging
import tempfile
import subprocess
from typing import Optional, Dict, Any
import requests

from config import settings

logger = logging.getLogger("smartfarm.voice")

SARVAM_STT_URL = "https://api.sarvam.ai/speech-to-text"
SARVAM_TTS_URL = "https://api.sarvam.ai/text-to-speech"


class VoiceService:
    """
    Dedicated Service for Sarvam AI Speech-to-Text and Text-to-Speech operations.
    Complies strictly with security standards: no API keys in logs or responses.
    """

    def __init__(self):
        self.stt_model = "saaras:v3"
        self.tts_model = "bulbul:v3"

    @property
    def api_key(self) -> str:
        key = settings.voice_api_key
        if not key:
            logger.error("Sarvam Voice API Key is missing in backend configuration.")
        return key

    def convert_to_clean_wav(
        self,
        audio_bytes: bytes,
        filename: str = "recording.webm",
        content_type: str = "audio/webm"
    ) -> bytes:
        """
        Converts any uploaded audio stream (WebM/Opus, MP4/AAC, OGG, or non-standard WAV)
        to standard 16kHz 16-bit mono PCM WAV, guaranteed to be accepted by Sarvam saaras:v3 STT.
        """
        if not audio_bytes or len(audio_bytes) < 44:
            raise ValueError("Audio data is empty or too short.")

        # Determine appropriate file extension for temp file so FFmpeg probes correctly
        suffix = ".webm"
        fn_lower = (filename or "").lower()
        ct_lower = (content_type or "").lower()
        if "wav" in fn_lower or "wav" in ct_lower:
            suffix = ".wav"
        elif "mp4" in fn_lower or "mp4" in ct_lower:
            suffix = ".mp4"
        elif "ogg" in fn_lower or "ogg" in ct_lower:
            suffix = ".ogg"
        elif "m4a" in fn_lower or "m4a" in ct_lower:
            suffix = ".m4a"

        # Resolve FFmpeg executable
        try:
            import imageio_ffmpeg
            ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
        except Exception as e:
            logger.warning(f"Could not load imageio_ffmpeg executable: {e}")
            ffmpeg_exe = "ffmpeg"

        temp_in = None
        temp_out = None
        try:
            with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as f_in:
                f_in.write(audio_bytes)
                temp_in = f_in.name

            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f_out:
                temp_out = f_out.name

            # Run FFmpeg conversion to standard 16kHz mono 16-bit PCM WAV
            cmd = [
                ffmpeg_exe,
                "-y",
                "-i", temp_in,
                "-ar", "16000",
                "-ac", "1",
                "-c:a", "pcm_s16le",
                "-f", "wav",
                temp_out
            ]
            proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=25)

            if proc.returncode != 0:
                err_msg = proc.stderr.decode("utf-8", errors="ignore")[:300]
                logger.error(f"FFmpeg conversion error (code {proc.returncode}): {err_msg}")
                # Fallback: if already a RIFF WAV container, return original bytes
                if audio_bytes.startswith(b"RIFF"):
                    return audio_bytes
                raise RuntimeError("Failed to decode and convert audio stream to standard WAV format.")

            with open(temp_out, "rb") as f_res:
                converted_wav = f_res.read()

            if not converted_wav or len(converted_wav) < 44:
                raise RuntimeError("Converted WAV file is empty or corrupted.")

            return converted_wav

        finally:
            if temp_in and os.path.exists(temp_in):
                try:
                    os.remove(temp_in)
                except Exception:
                    pass
            if temp_out and os.path.exists(temp_out):
                try:
                    os.remove(temp_out)
                except Exception:
                    pass

    def clean_text_for_speech(self, text: str, max_chars: int = 1200, language: str = "en") -> str:
        """
        Cleans markdown formatting, citations, and headers from AI responses
        to generate fluid, natural speech without pronunciation of punctuation/symbols.
        """
        if not text:
            return ""

        # Normalize specific abbreviations for natural speech
        if language == "ta":
            cleaned = text.replace("%", " சதவீதம் ").replace(":", " ")
        else:
            cleaned = text.replace("%", " percent ").replace(":", " ")

        # Remove bold/italic markdown symbols
        cleaned = re.sub(r"\*\*([^*]+)\*\*", r"\1", cleaned)
        cleaned = re.sub(r"\*([^*]+)\*", r"\1", cleaned)
        cleaned = re.sub(r"__([^_]+)__", r"\1", cleaned)
        cleaned = re.sub(r"_([^_]+)_", r"\1", cleaned)

        # Remove markdown headers (e.g. #, ##, ###)
        cleaned = re.sub(r"^#+\s*", "", cleaned, flags=re.MULTILINE)

        # Clean markdown list bullets and dashes
        cleaned = re.sub(r"^\s*[-*•]\s+", "", cleaned, flags=re.MULTILINE)
        cleaned = re.sub(r"^\s*\d+\.\s+", "", cleaned, flags=re.MULTILINE)

        # Remove backticks and blockquotes
        cleaned = cleaned.replace("`", "").replace(">", "")

        # Normalize multiple spaces and extra newlines to readable pauses
        cleaned = re.sub(r"\n{2,}", ". ", cleaned)
        cleaned = re.sub(r"\n", ", ", cleaned)
        cleaned = re.sub(r"\s{2,}", " ", cleaned).strip()

        # Enforce character limit for Sarvam TTS (bulbul max ~2500, optimal ~1200)
        if len(cleaned) > max_chars:
            truncated = cleaned[:max_chars]
            last_period = max(
                truncated.rfind("."),
                truncated.rfind("।"),
                truncated.rfind("?"),
                truncated.rfind("!")
            )
            if last_period > max_chars // 2:
                cleaned = truncated[:last_period + 1]
            else:
                cleaned = truncated + "..."

        return cleaned

    def transcribe_audio(
        self,
        audio_bytes: bytes,
        filename: str = "audio.wav",
        content_type: str = "audio/wav",
        language: str = "en"
    ) -> str:
        """
        Calls Sarvam Speech-to-Text API to convert recorded farmer audio into text.
        Converts any browser format to clean 16kHz PCM WAV before calling Sarvam STT.
        Supports both Tamil ('ta-IN') and English ('en-IN').
        """
        api_key = self.api_key
        if not api_key:
            raise ValueError("Sarvam Voice API Key is not configured.")

        # Map language code to Sarvam BCP-47
        lang_code = "ta-IN" if language == "ta" else "en-IN"

        # Log received audio metadata (safe, no keys)
        logger.info(f"[VOICE] Audio received: filename={filename}, mime={content_type}, size={len(audio_bytes)} bytes")

        # 1. Convert audio to standard 16kHz 16-bit mono PCM WAV
        clean_wav = self.convert_to_clean_wav(
            audio_bytes=audio_bytes,
            filename=filename,
            content_type=content_type
        )
        logger.info(f"[VOICE] Audio converted to 16kHz mono WAV: {len(clean_wav)} bytes")

        # 2. Prepare Sarvam STT request
        headers = {
            "api-subscription-key": api_key
        }

        files = {
            "file": ("speech.wav", clean_wav, "audio/wav")
        }

        data = {
            "model": self.stt_model,
            "language_code": lang_code,
            "mode": "transcribe"
        }

        logger.info(f"[VOICE] Sending to Sarvam STT (model: {self.stt_model}, language: {lang_code})")

        sarvam_success = False
        transcript = ""

        try:
            response = requests.post(
                SARVAM_STT_URL,
                headers=headers,
                files=files,
                data=data,
                timeout=30
            )
            logger.info(f"[VOICE] Sarvam STT response status: {response.status_code}")
            if response.status_code == 200:
                res_json = response.json()
                transcript = res_json.get("transcript", "").strip()
                if transcript:
                    logger.info(f'[VOICE] Sarvam STT transcribed: "{transcript}"')
                    return transcript
                sarvam_success = True
            else:
                logger.warning(f"[VOICE] Sarvam STT returned status {response.status_code}: {response.text[:200]}")
        except Exception as e:
            logger.warning(f"[VOICE] Sarvam STT request error: {e}")

        # Resilient Multimodal Speech-to-Text Fallback (using Google Gemini 3.6/3.8 Flash)
        gemini_key = settings.gemini_api_key
        if gemini_key:
            logger.info("[VOICE] Activating Gemini multimodal audio speech-to-text fallback...")
            try:
                from google import genai
                from google.genai import types
                client = genai.Client(api_key=gemini_key)
                lang_prompt = "Tamil" if language == "ta" else "English"
                stt_instruction = (
                    f"Listen carefully to this audio recording of a farmer speaking in {lang_prompt} (or mixed Tamil and English). "
                    "Transcribe the spoken agricultural question accurately into text. "
                    "If the farmer speaks in Tamil, write the output in Tamil script (தமிழ்). "
                    "If the farmer speaks in English, write in English. "
                    "Do NOT add any conversational filler, explanations, markdown, or commentary. "
                    "Return ONLY the verbatim transcribed words, or return 'NO_SPEECH' if there is only background noise, static, or silence."
                )

                candidate_models = []
                for m in [settings.LLM_MODEL, "gemini-3.8-flash", "gemini-3.7-flash", "gemini-3.6-flash", "gemini-flash-latest"]:
                    if m and m not in candidate_models:
                        candidate_models.append(m)

                for model_candidate in candidate_models:
                    try:
                        resp = client.models.generate_content(
                            model=model_candidate,
                            contents=[
                                types.Part.from_bytes(data=clean_wav, mime_type="audio/wav"),
                                stt_instruction
                            ]
                        )
                        cand_text = (resp.text or "").strip()
                        if "NO_SPEECH" in cand_text:
                            logger.info("[VOICE] Gemini audio transcription detected no speech.")
                            return ""
                        if cand_text:
                            logger.info(f'[VOICE] Gemini audio STT successfully transcribed: "{cand_text}" using {model_candidate}')
                            return cand_text
                    except Exception as mod_err:
                        logger.warning(f"[VOICE] Gemini model {model_candidate} audio STT attempt error: {mod_err}")
            except Exception as gem_err:
                logger.error(f"[VOICE] Gemini audio STT fallback failed: {gem_err}")

        return transcript

    def synthesize_speech(
        self,
        text: str,
        language: str = "en",
        speaker: Optional[str] = None
    ) -> Optional[str]:
        """
        Synthesizes speech using backend TTSManager (Local Indic TTS or Sarvam Bulbul v3 with cache).
        Returns base64 audio string or None if unavailable/fallback required.
        """
        try:
            from services.tts_service import tts_manager
            res = tts_manager.synthesize(text, language=language)
            if res.get("success") and res.get("audio_chunks"):
                return res["audio_chunks"][0]["audio_base64"]
        except Exception as e:
            logger.warning(f"[VOICE] synthesize_speech error: {e}")
        return None


voice_service = VoiceService()
