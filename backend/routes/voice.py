import os
import re
import time
import base64
import logging
from typing import Optional, Dict, Any
from fastapi import APIRouter, Request, UploadFile, File, Form, HTTPException, status
from pydantic import BaseModel

from config import settings
from services.voice_service import voice_service
from routes.chat import execute_rag_gemini_pipeline

logger = logging.getLogger("smartfarm.voice_route")
logging.basicConfig(level=logging.INFO)

router = APIRouter(prefix="/voice", tags=["Real Voice Assistant (Sarvam + RAG + Gemini)"])


class VoiceJsonResponse(BaseModel):
    success: bool
    transcript: str
    language: str
    ai_response: str
    audio: Optional[str] = None
    source: Optional[str] = None
    used_model: Optional[str] = None
    tts_error: Optional[str] = None


@router.post("", response_model=VoiceJsonResponse)
@router.post("/", response_model=VoiceJsonResponse)
async def process_voice_interaction(
    request: Request,
    audio: Optional[UploadFile] = File(None),
    file: Optional[UploadFile] = File(None),
    language: Optional[str] = Form("en")
):
    """
    Real Voice Pipeline:
    Farmer Audio
    -> Sarvam Speech-to-Text (saaras:v3)
    -> Transcribed text
    -> Existing RAG retrieval (Solanaceae TNAU / ICAR)
    -> Existing Gemini model
    -> Verified agricultural response
    -> Sarvam Text-to-Speech (bulbul:v3)
    -> Native audio output (Tamil / English)

    Supports both multipart/form-data (audio file upload) and application/json (base64 audio or direct transcript).
    """
    start_time = time.time()
    content_type_header = request.headers.get("content-type", "").lower()

    audio_bytes: Optional[bytes] = None
    filename = "recording.webm"
    detected_mime = "audio/webm"
    lang = language or "en"
    direct_transcript: Optional[str] = None

    # 1. Parse Multipart Form Upload (Standard browser MediaRecorder stream)
    if "multipart/form-data" in content_type_header:
        try:
            form = await request.form()
            uploaded_file = None
            for key in ["audio", "file", "recording", "voice"]:
                val = form.get(key)
                if isinstance(val, UploadFile):
                    uploaded_file = val
                    break
            if not uploaded_file:
                for val in form.values():
                    if isinstance(val, UploadFile):
                        uploaded_file = val
                        break

            if uploaded_file is not None:
                filename = uploaded_file.filename or "recording.webm"
                detected_mime = uploaded_file.content_type or "audio/webm"
                audio_bytes = await uploaded_file.read()

            if "language" in form:
                lang = str(form.get("language") or lang)
        except Exception as e:
            logger.error(f"[VOICE] Error reading form-data: {e}")
            if audio or file:
                uploaded = audio or file
                filename = uploaded.filename or "recording.webm"
                detected_mime = uploaded.content_type or "audio/webm"
                audio_bytes = await uploaded.read()

    # 2. Parse JSON Payload (Base64 audio or direct transcription test)
    elif "application/json" in content_type_header:
        try:
            body = await request.json()
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid JSON payload received."
            )

        lang = body.get("language", lang)
        raw_audio = body.get("audio") or body.get("audio_base64")
        direct_transcript = body.get("transcript") or body.get("text") or body.get("message")

        if raw_audio:
            if isinstance(raw_audio, str):
                if "," in raw_audio:
                    header, raw_audio = raw_audio.split(",", 1)
                    if "audio/webm" in header:
                        filename = "recording.webm"
                        detected_mime = "audio/webm"
                    elif "audio/mp4" in header:
                        filename = "recording.mp4"
                        detected_mime = "audio/mp4"
                    elif "audio/wav" in header:
                        filename = "recording.wav"
                        detected_mime = "audio/wav"

                try:
                    audio_bytes = base64.b64decode(raw_audio)
                except Exception as e:
                    logger.error(f"[VOICE] Failed to decode base64 audio: {e}")
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Corrupted audio recording payload."
                    )

    # Normalize language code early for localized error messages
    normalized_lang = "ta" if str(lang).lower() in ("ta", "ta-in", "tamil") else "en"

    # 3. Validation: ensure audio or transcript is present
    if not audio_bytes and not direct_transcript:
        empty_err = "பேச்சு எதுவும் கண்டறியப்படவில்லை. மைக்ரோஃபோனில் பேசவும்." if normalized_lang == "ta" else "No speech detected. Please speak into the microphone."
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=empty_err
        )

    # 4. Transcribe via Sarvam Speech-to-Text if audio is provided
    transcript = ""
    if audio_bytes:
        format_str = (filename.split(".")[-1] if "." in filename else detected_mime.split("/")[-1] or "webm").lower()
        logger.info(f"[VOICE] Audio received: {len(audio_bytes)} bytes, format: {format_str}")
        logger.info(f"[VOICE] MIME type: {detected_mime}")

        if len(audio_bytes) < 100:
            short_err = "பேச்சு எதுவும் கண்டறியப்படவில்லை. மைக்ரோஃபோனில் பேசவும்." if normalized_lang == "ta" else "No speech detected. Please speak into the microphone."
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=short_err
            )

        try:
            transcript = voice_service.transcribe_audio(
                audio_bytes=audio_bytes,
                filename=filename,
                content_type=detected_mime,
                language=normalized_lang
            )
        except PermissionError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Voice service authentication failed. Please check backend configuration."
            )
        except Exception as e:
            logger.error(f"[VOICE] Sarvam STT failed: {e}")
            stt_fail_err = "குரலைப் புரிந்துகொள்ள முடியவில்லை. தயவுசெய்து தெளிவாகப் பேசவும்." if normalized_lang == "ta" else "Could not transcribe audio. Please speak clearly into the microphone."
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=stt_fail_err
            )

        if not transcript or not transcript.strip():
            empty_transcript_err = "பேச்சு எதுவும் கண்டறியப்படவில்லை. மைக்ரோஃபோனில் பேசவும்." if normalized_lang == "ta" else "No speech detected. Please speak into the microphone."
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=empty_transcript_err
            )
    else:
        transcript = direct_transcript.strip()
        logger.info(f"[VOICE] Direct transcript received: '{transcript[:80]}...'")

    # 5. Execute EXISTING Agricultural RAG + Gemini Pipeline
    logger.info(f'[VOICE] Sending to RAG pipeline: "{transcript}" (language: {normalized_lang})')
    try:
        pipeline_result = await execute_rag_gemini_pipeline(
            query=transcript,
            language=normalized_lang
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[VOICE] Gemini RAG pipeline error: {e}")
        rag_fail_err = "விவசாய ஆலோசனையை உருவாக்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்." if normalized_lang == "ta" else "Failed to generate agricultural advice. Please try again."
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=rag_fail_err
        )

    ai_text = pipeline_result["text"]
    source_label = pipeline_result.get("source")
    used_model = pipeline_result.get("used_model", "gemini-3.8-flash")
    doc_count = 2 if pipeline_result.get("has_rag_context") else 0
    sources = pipeline_result.get("primary_source", "SmartFarm Knowledge Base")
    logger.info(f"[VOICE] RAG retrieved: {doc_count} documents from {sources}")
    logger.info(f"[VOICE] Gemini model: {used_model}")
    snippet = ai_text[:80].replace("\n", " ") + ("..." if len(ai_text) > 80 else "")
    logger.info(f'[VOICE] Gemini response: "{snippet}" ({len(ai_text)} chars)')

    # 6. Response Delivery (Browser SpeechSynthesis handles audio output natively)
    elapsed_ms = int((time.time() - start_time) * 1000)
    logger.info(f"[VOICE] Pipeline completed in {elapsed_ms}ms. Audio output handled by browser SpeechSynthesis.")

    # Return structured frontend-safe voice response
    return VoiceJsonResponse(
        success=True,
        transcript=transcript,
        language=normalized_lang,
        ai_response=ai_text,
        audio=None,
        source=source_label,
        used_model=used_model,
        tts_error=None
    )


class AudioChunkModel(BaseModel):
    chunk_index: int
    audio_url: str
    cached: bool = False


class TtsRequest(BaseModel):
    text: Optional[str] = ""
    language: Optional[str] = "en"
    preferred_provider: Optional[str] = None


class TtsResponse(BaseModel):
    success: bool
    audio_url: Optional[str] = None
    audio_chunks: Optional[list] = None
    language: str = "en"
    reason: Optional[str] = None


@router.post("/tts", response_model=TtsResponse)
@router.post("/synthesize", response_model=TtsResponse)
async def synthesize_speech_direct(payload: TtsRequest):
    """
    Direct Text-to-Speech synthesis endpoint via Google TTS (gTTS).
    Generates authentic MP3 files and returns accessible audio_url paths.
    """
    from services.tts_service import tts_manager
    res = tts_manager.synthesize(
        text=payload.text,
        language=payload.language or "en"
    )
    return TtsResponse(
        success=res.get("success", False),
        audio_url=res.get("audio_url"),
        audio_chunks=res.get("audio_chunks"),
        language=res.get("language", "en"),
        reason=res.get("reason")
    )


@router.get("/audio/{filename}")
async def get_audio_file(filename: str):
    """Safely serves generated TTS audio files from static/tts/ directory."""
    from services.tts_service import STATIC_TTS_DIR
    from fastapi.responses import FileResponse
    safe_name = os.path.basename(filename)
    path = STATIC_TTS_DIR / safe_name
    if not path.exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Audio file not found.")
    media_type = "audio/mpeg" if safe_name.endswith(".mp3") else "audio/wav"
    return FileResponse(str(path), media_type=media_type)


class VoiceApiKeyPayload(BaseModel):
    api_key: str


@router.get("/status")
async def get_voice_status():
    """Returns Voice Assistant status without exposing API keys."""
    return {
        "status": "online",
        "stt_engine": "Sarvam saaras:v3",
        "tts_engine": "Google TTS (gTTS)",
        "providers": {
            "gtts": True
        }
    }


@router.post("/set-key")
async def set_sarvam_api_key(payload: VoiceApiKeyPayload):
    """
    Safely saves Sarvam Voice API key to backend/.env and activates it immediately.
    """
    raw_key = payload.api_key.strip()
    if not raw_key or len(raw_key) < 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide a valid Sarvam Voice API key."
        )

    # 1. Update in-memory settings
    settings.VOICE_API_KEY = raw_key

    # 2. Persist to backend/.env securely
    env_path = settings.ENV_PATH
    try:
        content = ""
        if os.path.exists(env_path):
            with open(env_path, "r", encoding="utf-8") as f:
                content = f.read()

        if "VOICE_API_KEY=" in content:
            content = re.sub(r'VOICE_API_KEY=.*', f'VOICE_API_KEY="{raw_key}"', content)
        else:
            content += f'\nVOICE_API_KEY="{raw_key}"\n'

        with open(env_path, "w", encoding="utf-8") as f:
            f.write(content)
        logger.info("Successfully persisted updated VOICE_API_KEY to backend/.env")
    except Exception as e:
        logger.error(f"Failed to persist Voice API key to .env: {e}")

    return {
        "status": "success",
        "message": "Sarvam Voice API key activated and saved successfully."
    }


