import os
import re
import time
import logging
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from config import settings
from services.rag_service import rag_service

logger = logging.getLogger("smartfarm.chat")
logging.basicConfig(level=logging.INFO)

router = APIRouter(prefix="/chat", tags=["AI Farmer Assistant & RAG"])

# Optional import of google-genai SDK
GENAI_AVAILABLE = False
try:
    from google import genai
    from google.genai import types, errors as genai_errors
    GENAI_AVAILABLE = True
except ImportError:
    GENAI_AVAILABLE = False
    logger.warning("google-genai SDK not installed. Please install with: pip install google-genai")


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, description="Farmer agricultural question")
    language: str = Field("en", description="Language code ('en' or 'ta')")


class ChatResponse(BaseModel):
    id: int
    sender: str = "ai"
    text: str
    source: Optional[str] = None
    timestamp: str


class ApiKeyPayload(BaseModel):
    api_key: str = Field(..., min_length=10, description="Gemini API Key")


def get_current_gemini_key() -> str:
    """Safely retrieves configured Gemini API key without logging or exposing it."""
    key = settings.gemini_api_key
    if key:
        return key

    # Dynamic fallback check in backend/.env
    env_path = settings.ENV_PATH
    if os.path.exists(env_path):
        try:
            with open(env_path, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line.startswith("#") or "=" not in line:
                        continue
                    k_name, _, k_val = line.partition("=")
                    k_name = k_name.strip()
                    k_val = k_val.strip().strip('"').strip("'")
                    if k_name in ("GEMINI_API_KEY", "LLM_API_KEY") and k_val:
                        return k_val
        except Exception:
            pass
    return ""


@router.get("/status")
async def get_assistant_status():
    """Returns AI Assistant status and configuration state without exposing API keys."""
    key = get_current_gemini_key()
    return {
        "status": "online",
        "gemini_sdk_available": GENAI_AVAILABLE,
        "api_key_configured": bool(key),
        "configured_model": settings.LLM_MODEL,
        "rag_knowledge_base_size": len(rag_service.kb)
    }


@router.post("/set-key")
async def set_gemini_api_key(payload: ApiKeyPayload):
    """
    Safely saves Gemini API key to backend/.env and activates it immediately in settings.
    """
    raw_key = payload.api_key.strip()
    if not raw_key or len(raw_key) < 15:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide a valid Gemini API key (typically starts with AIzaSy...)."
        )

    # 1. Update in-memory settings
    settings.GEMINI_API_KEY = raw_key
    settings.LLM_API_KEY = raw_key

    # 2. Persist to backend/.env securely
    env_path = settings.ENV_PATH
    try:
        content = ""
        if os.path.exists(env_path):
            with open(env_path, "r", encoding="utf-8") as f:
                content = f.read()

        if "GEMINI_API_KEY=" in content:
            content = re.sub(r'GEMINI_API_KEY=.*', f'GEMINI_API_KEY="{raw_key}"', content)
        else:
            content += f'\nGEMINI_API_KEY="{raw_key}"\n'

        if "LLM_API_KEY=" in content:
            content = re.sub(r'LLM_API_KEY=.*', f'LLM_API_KEY="{raw_key}"', content)
        else:
            content += f'\nLLM_API_KEY="{raw_key}"\n'

        with open(env_path, "w", encoding="utf-8") as f:
            f.write(content)
        logger.info("Successfully persisted updated GEMINI_API_KEY to backend/.env")
    except Exception as e:
        logger.error(f"Failed to persist API key to .env: {e}")

    return {
        "status": "success",
        "message": "Gemini API key activated and saved successfully."
    }


async def execute_rag_gemini_pipeline(query: str, language: str = "en") -> Dict[str, Any]:
    """
    Core RAG + Gemini Agricultural decision pipeline.
    Reused identically by both /api/chat and /api/voice to ensure exact consistency.
    """
    query = query.strip()
    if not query:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Question message cannot be empty."
        )

    language = "ta" if language == "ta" else "en"

    # 1. RAG RETRIEVAL: Retrieve verified Solanaceae agricultural knowledge
    try:
        rag_data = rag_service.retrieve_rag_context(
            query=query,
            top_k=2,
            language=language
        )
        rag_context = rag_data.get("context_text", "")
        primary_source = rag_data.get("primary_source", "TNAU Agritech Knowledge Base")
    except Exception as e:
        logger.error(f"RAG Retrieval Error: {e}")
        rag_context = ""
        primary_source = "SmartFarm Agricultural Knowledge Base"

    # 2. CHECK GEMINI CONFIGURATION
    api_key = get_current_gemini_key()
    if not api_key:
        logger.error("Gemini API Key Missing: Neither GEMINI_API_KEY nor LLM_API_KEY is configured in backend/.env")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="AI service authentication failed. Please check the backend configuration."
        )

    if not GENAI_AVAILABLE:
        logger.error("google-genai package is not installed in the python environment.")
        if rag_context:
            logger.info("Engaging verified Agricultural Knowledge Base (RAG) fallback response.")
            if language == "ta":
                fallback_text = (
                    "குறிப்பு: நேரடி AI மொழி மாதிரி சேவை தற்காலிகமாக கிடைக்கவில்லை. "
                    "வேளாண் தரவுத்தளத்திலிருந்து சரிபார்க்கப்பட்ட பரிந்துரைகள் கீழே வழங்கப்பட்டுள்ளன:\n\n"
                    f"{rag_context}\n\n"
                    "பரிந்துரை: துல்லியமான உர அளவு மற்றும் மருந்து பயன்பாட்டிற்கு உள்ளூர் வேளாண்மை விரிவாக்க அலுவலர் அல்லது TNAU வழிகாட்டுதலை ஆலோசிக்கவும்."
                )
            else:
                fallback_text = (
                    "Note: Direct AI model inference is temporarily unavailable. "
                    "The following verified agronomic guidance was retrieved from the agricultural knowledge base (RAG):\n\n"
                    f"{rag_context}\n\n"
                    "Recommendation: For exact chemical dosages and application schedules, please consult your local agricultural extension officer or ICAR/TNAU advisories."
                )
            return {
                "text": fallback_text,
                "source": f"Verified Knowledge Base • {primary_source} (Knowledge Base Fallback)",
                "primary_source": primary_source,
                "used_model": "rag-knowledge-base",
                "has_rag_context": True,
                "rag_context": rag_context
            }
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI service is temporarily unavailable. Please try again."
        )

    # 3. BUILD GROUNDED SYSTEM & USER PROMPTS
    lang_name = "Tamil (தமிழ்)" if language == "ta" else "English"

    if rag_context:
        system_instruction = (
            "You are the SmartFarm AI Agricultural Assistant, an expert decision support advisor for Indian and global farming.\n\n"
            f"Language Directive: You MUST respond strictly in {lang_name}. "
            "If Tamil is selected, provide your complete response in natural, fluent, grammatically correct, farmer-friendly Tamil (தமிழ்).\n\n"
            "Grounding Directive: Ground your answer primarily in the provided Verified Agricultural Knowledge Base context. "
            "Integrate the specific management practices, treatments, and dosages from the context.\n\n"
            "Source Integrity: Do NOT invent institutional citations (e.g. do not claim 'TNAU recommends' or 'ICAR recommends') "
            "unless explicitly stated in the retrieved context.\n\n"
            "Structuring Directive: Structure your response cleanly with:\n"
            "1. Identification & Cause (அறிகுறிகள் & காரணங்கள்)\n"
            "2. Recommended Management & Remedies (மேலாண்மை முறைகள் & தீர்வுகள்)\n"
            "3. Preventive & Cultural Practices (வருமுன் காக்கும் மேலாண்மை & பராமரிப்பு)\n\n"
            "Safety Note: Mention that exact dosages and application may vary based on crop variety, growth stage, soil conditions, and local agricultural extension guidance.\n"
            "Tone: Respectful, reassuring, practical, and farmer-first."
        )

        full_prompt = (
            f"VERIFIED AGRICULTURAL KNOWLEDGE BASE CONTEXT:\n"
            f"----------------------------------------\n"
            f"{rag_context}\n"
            f"----------------------------------------\n\n"
            f"FARMER QUESTION: {query}\n\n"
            f"Please provide your verified agricultural advice in {lang_name}."
        )
    else:
        system_instruction = (
            "You are the SmartFarm AI Agricultural Assistant, a comprehensive general agricultural expert assisting farmers "
            "with all crops (cereals like rice, maize, wheat; cash crops like sugarcane, cotton; fruits like banana, mango; "
            "vegetables like onion, chilli; pulses, oilseeds, spices), soil science, irrigation, fertilizers, weather impacts, and agronomy.\n\n"
            "Scope Directive: You support ALL agricultural questions and crops across farming. Never restrict questions to Solanaceae crops. "
            "Never tell the farmer you only support tomato, potato, or brinjal. Never ask them to select tomato, potato, or brinjal.\n\n"
            f"Language Directive: You MUST respond strictly in {lang_name}. "
            "If Tamil is selected, provide your complete response in natural, fluent, grammatically correct, farmer-friendly Tamil (தமிழ்).\n\n"
            "Agricultural Accuracy & Safety Directive:\n"
            "- Provide sound, practical agronomic guidance.\n"
            "- Do NOT invent institutional citations. Do NOT falsely claim 'TNAU recommends' or 'ICAR recommends' without verified source material.\n"
            "- For fertilizers, pesticides, and weedicides, provide general nutrient guidelines or active ingredients, but state clearly that exact dosages depend on soil test results, crop variety, growth stage, field conditions, and local agricultural extension guidance.\n\n"
            "Tone: Helpful, respectful, practical, scientific yet accessible, and farmer-first."
        )

        full_prompt = (
            f"FARMER QUESTION: {query}\n\n"
            f"Please provide your expert agricultural advice in {lang_name}."
        )

    # 4. CALL GEMINI API VIA GOOGLE GENAI SDK
    # Prioritize active, verified canonical models to prevent sequential 404s
    candidate_models = [
        "gemini-3.6-flash",
        "gemini-flash-latest",
        "gemini-flash-lite-latest",
        "gemini-2.5-flash",
        "gemini-2.0-flash",
        "gemini-1.5-flash"
    ]
    configured_model = (settings.LLM_MODEL or "").strip()
    if configured_model and configured_model not in candidate_models:
        candidate_models.insert(0, configured_model)

    client = genai.Client(api_key=api_key)
    ai_text = None
    used_model = candidate_models[0]
    last_error = None

    for model_name in candidate_models:
        try:
            logger.info(f"Dispatching query to Gemini model: {model_name}")
            chat = client.chats.create(
                model=model_name,
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    temperature=0.3,
                    max_output_tokens=1500,
                )
            )
            response = chat.send_message(full_prompt)

            if response and response.text:
                ai_text = response.text.strip()
                used_model = model_name
                logger.info(f"Gemini response generated successfully using {model_name}")
                break
        except genai_errors.ClientError as ce:
            last_error = ce
            err_str = str(ce)
            logger.error(f"Gemini ClientError on model {model_name}: {err_str[:250]}")

            if "API key not valid" in err_str or "API_KEY_INVALID" in err_str:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="AI service authentication failed. Please check the backend configuration."
                )
            if "RESOURCE_EXHAUSTED" in err_str or "429" in err_str:
                time.sleep(0.3)
                continue
            if "NOT_FOUND" in err_str or "404" in err_str:
                continue
            continue
        except (genai_errors.ServerError, Exception) as e:
            last_error = e
            logger.error(f"Error communicating with Gemini ({model_name}): {e}")
            time.sleep(0.5)
            continue

    # Graceful fallback: If Gemini models are unavailable/rate-limited, return RAG knowledge rather than generic 503
    if not ai_text:
        logger.warning(f"Gemini API failure on candidate models: {last_error}")
        if rag_context:
            logger.info("Engaging verified Agricultural Knowledge Base (RAG) fallback response.")
            if language == "ta":
                fallback_text = (
                    "குறிப்பு: நேரடி AI மொழி மாதிரி சேவை தற்காலிகமாக கிடைக்கவில்லை. "
                    "வேளாண் தரவுத்தளத்திலிருந்து சரிபார்க்கப்பட்ட பரிந்துரைகள் கீழே வழங்கப்பட்டுள்ளன:\n\n"
                    f"{rag_context}\n\n"
                    "பரிந்துரை: துல்லியமான உர அளவு மற்றும் மருந்து பயன்பாட்டிற்கு உள்ளூர் வேளாண்மை விரிவாக்க அலுவலர் அல்லது TNAU வழிகாட்டுதலை ஆலோசிக்கவும்."
                )
            else:
                fallback_text = (
                    "Note: Direct AI model inference is temporarily unavailable. "
                    "The following verified agronomic guidance was retrieved from the agricultural knowledge base (RAG):\n\n"
                    f"{rag_context}\n\n"
                    "Recommendation: For exact chemical dosages and application schedules, please consult your local agricultural extension officer or ICAR/TNAU advisories."
                )
            source_label = f"Verified Knowledge Base • {primary_source} (Knowledge Base Fallback)"
            return {
                "text": fallback_text,
                "source": source_label,
                "primary_source": primary_source,
                "used_model": "rag-knowledge-base",
                "has_rag_context": True,
                "rag_context": rag_context
            }

        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI service is temporarily unavailable. Please try again."
        )

    source_label = f"Verified RAG • {primary_source} • {used_model}" if (rag_context and primary_source) else f"SmartFarm AI Advisor • {used_model}"
    return {
        "text": ai_text,
        "source": source_label,
        "primary_source": primary_source,
        "used_model": used_model,
        "has_rag_context": bool(rag_context),
        "rag_context": rag_context
    }


@router.post("", response_model=ChatResponse)
@router.post("/", response_model=ChatResponse)
async def chat_with_assistant(request: ChatRequest):
    """
    Unified RAG + Gemini Farmer Assistant endpoint.
    1. Retrieves verified agronomic context from the Solanaceae knowledge base (TNAU/ICAR).
    2. Sends the question + retrieved context to the Gemini LLM.
    3. Returns grounded, farmer-friendly recommendations in English or Tamil.
    """
    query = request.message.strip()
    language = "ta" if request.language == "ta" else "en"
    timestamp_str = datetime.now().strftime("%I:%M %p")
    res_id = int(time.time() * 1000)

    result = await execute_rag_gemini_pipeline(query=query, language=language)

    return ChatResponse(
        id=res_id,
        sender="ai",
        text=result["text"],
        source=result["source"],
        timestamp=timestamp_str
    )

