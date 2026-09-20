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


class ChatMessage(BaseModel):
    sender: str = Field(..., description="Message sender ('user' or 'ai')")
    text: str = Field(..., description="Message text content")


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, description="Farmer agricultural question")
    language: str = Field("en", description="Language code ('en' or 'ta')")
    history: Optional[List[ChatMessage]] = Field(default=[], description="Recent conversation history")


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


async def execute_rag_gemini_pipeline(
    query: str,
    language: str = "en",
    history: Optional[List[Dict[str, str]]] = None
) -> Dict[str, Any]:
    """
    Core RAG + Gemini Agricultural decision pipeline.
    Accepts ANY agricultural question across all crops, pests, diseases, soil, irrigation, and practices.
    Integrates conversation history, Tanglish comprehension, RAG grounding, and Gemini LLM.
    """
    query = query.strip()
    if not query:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Question message cannot be empty."
        )

    language = "ta" if language == "ta" else "en"

    # 1. RAG RETRIEVAL: Retrieve verified Solanaceae / soil / irrigation knowledge if matched
    try:
        rag_data = rag_service.retrieve_rag_context(
            query=query,
            top_k=2,
            language=language
        )
        has_rag = rag_data.get("has_context", False)
        rag_context = rag_data.get("context_text", "") if has_rag else ""
        primary_source = rag_data.get("primary_source", "TNAU Agritech Knowledge Base")
    except Exception as e:
        logger.error(f"RAG Retrieval Error: {e}")
        has_rag = False
        rag_context = ""
        primary_source = None

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
                "source": f"Verified Knowledge Base • {primary_source}",
                "primary_source": primary_source,
                "used_model": "rag-knowledge-base",
                "has_rag_context": True,
                "rag_context": rag_context
            }
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI service is temporarily unavailable. Please try again."
        )

    # 3. BUILD CONVERSATION HISTORY CONTEXT
    history_prompt_section = ""
    if history and len(history) > 0:
        recent_turns = history[-6:]
        history_lines = []
        for h in recent_turns:
            role = "Farmer" if h.get("sender") == "user" else "Assistant"
            text_val = (h.get("text") or "").strip()
            if text_val:
                history_lines.append(f"{role}: {text_val}")
        if history_lines:
            history_prompt_section = (
                "RECENT CONVERSATION HISTORY:\n"
                "----------------------------------------\n"
                + "\n".join(history_lines) +
                "\n----------------------------------------\n"
                "Note: Use the conversation history above to understand context and resolve references (such as 'it', 'that crop', 'that disease', 'the fertilizer').\n\n"
            )

    # 4. BUILD GROUNDED SYSTEM & USER PROMPTS
    lang_name = "Tamil (தமிழ்)" if language == "ta" else "English"

    if rag_context:
        system_instruction = (
            "You are the SmartFarm AI Agricultural Assistant, an expert decision support advisor for Indian and global farming.\n\n"
            "Scope: You support ALL agriculture questions. Ground your answer primarily in the provided Verified Agricultural Knowledge Base context.\n\n"
            f"Language & Script Directive:\n"
            f"- You MUST respond strictly in {lang_name}.\n"
            "- If Tamil (ta) is selected, provide your complete response in natural, fluent, grammatically correct, farmer-friendly Tamil script (தமிழ்).\n"
            "- If English (en) is selected, provide your response in clear, concise English.\n"
            "- Tanglish Comprehension: Farmers may ask questions in Tanglish (Tamil words written in English/Latin script, e.g. 'tomato ku eppo water kudukanum?', 'nel payiruku enna fertilizer use panlam?'). "
            "You MUST understand Tanglish questions accurately and respond in the selected language.\n\n"
            "Source Integrity Directive:\n"
            "- Ground specific disease and crop management in the provided Verified Knowledge Base context.\n"
            "- Do NOT invent institutional citations unless explicitly present in the retrieved context.\n\n"
            "Structuring Directive:\n"
            "Keep answers practical and structured:\n"
            "1. Identification & Cause (அறிகுறிகள் & காரணங்கள்)\n"
            "2. Recommended Management & Remedies (மேலாண்மை முறைகள் & தீர்வுகள்)\n"
            "3. Preventive & Cultural Practices (வருமுன் காக்கும் மேலாண்மை & பராமரிப்பு)\n\n"
            "Safety Note: Mention that exact dosages and application may vary based on crop variety, growth stage, soil conditions, and local agricultural extension guidance.\n"
            "Tone: Respectful, reassuring, practical, and farmer-first."
        )

        full_prompt = (
            f"{history_prompt_section}"
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
            "with ALL crops (cereals like rice, wheat, maize; cash crops like sugarcane, cotton; fruits like banana, mango, citrus; "
            "vegetables like onion, chilli, tomato, potato, brinjal, okra; pulses, oilseeds, spices), soil science, irrigation, fertilizers, weather impacts, and agronomy.\n\n"
            "Scope Directive:\n"
            "- You support ANY agricultural question asked by the farmer. Never restrict answers to Solanaceae crops.\n"
            "- Never tell the farmer you only answer tomato, potato, or brinjal questions. Never reject a valid agricultural inquiry.\n\n"
            f"Language & Script Directive:\n"
            f"- You MUST respond strictly in {lang_name}.\n"
            "- If Tamil (ta) is selected, provide your complete response in natural, fluent, grammatically correct, farmer-friendly Tamil script (தமிழ்).\n"
            "- If English (en) is selected, provide your response in clear, concise English.\n"
            "- Tanglish Comprehension: Farmers may ask questions in Tanglish (Tamil words written in English/Latin script, e.g. 'tomato ku eppo water kudukanum?', 'nel payiruku enna fertilizer use panlam?', 'chilli ilai manjal aaguthu enna pannanum?'). "
            "You MUST understand Tanglish questions accurately and respond in the selected language.\n\n"
            "Agricultural Accuracy & Safety Directive:\n"
            "- Provide sound, practical agronomic guidance.\n"
            "- Do NOT invent exact chemical dosages or institutional citations.\n"
            "- For fertilizers and pesticides, explain active ingredients or general guidelines, and advise following product labels and local agricultural extension / TNAU / ICAR recommendations.\n\n"
            "Response Formatting:\n"
            "- Keep answers farmer-friendly: brief explanation + key action steps + practical advice.\n"
            "Tone: Helpful, respectful, practical, scientific yet accessible, and farmer-first."
        )

        full_prompt = (
            f"{history_prompt_section}"
            f"FARMER QUESTION: {query}\n\n"
            f"Please provide your expert agricultural advice in {lang_name}."
        )

    # 5. CALL GEMINI API VIA GOOGLE GENAI SDK
    primary_model = (settings.LLM_MODEL or "gemini-3.8-flash").strip()
    fallback_models = [
        "gemini-3.6-flash",
        "gemini-3.5-flash-lite",
        "gemini-3.5-flash",
        "gemini-flash-lite-latest"
    ]
    candidate_models = [primary_model] + [m for m in fallback_models if m != primary_model]

    client = genai.Client(api_key=api_key)
    ai_text = None
    used_model = candidate_models[0]
    last_error = None

    logger.info(f"Primary Gemini model: {primary_model}")

    for idx, model_name in enumerate(candidate_models):
        try:
            if idx == 0:
                logger.info(f"Attempting primary Gemini model: {model_name}")
            else:
                logger.info(f"Attempting fallback Gemini model: {model_name}")

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
                if idx == 0:
                    logger.info(f"Primary model response: SUCCESS ({model_name})")
                else:
                    logger.info(f"Fallback model used: {model_name}")
                break
        except genai_errors.ClientError as ce:
            last_error = ce
            err_str = str(ce)
            safe_err = re.sub(r'key=[^&\s]+', 'key=[REDACTED]', err_str)
            safe_err = re.sub(r'AIza[0-9A-Za-z-_]{35}', '[REDACTED]', safe_err)

            if idx == 0:
                logger.warning(f"Primary model failed: {safe_err[:250]}")
            else:
                logger.warning(f"Fallback model {model_name} failed: {safe_err[:250]}")

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
            err_str = str(e)
            safe_err = re.sub(r'key=[^&\s]+', 'key=[REDACTED]', err_str)
            safe_err = re.sub(r'AIza[0-9A-Za-z-_]{35}', '[REDACTED]', safe_err)

            if idx == 0:
                logger.warning(f"Primary model failed: {safe_err[:250]}")
            else:
                logger.warning(f"Fallback model {model_name} failed: {safe_err[:250]}")
            time.sleep(0.5)
            continue

    if not ai_text:
        logger.warning(f"Gemini API failure on candidate models: {last_error}")
        technical_err = (
            "AI சேவையுடன் தற்போது இணைக்க முடியவில்லை. தயவுசெய்து சிறிது நேரம் கழித்து மீண்டும் முயற்சிக்கவும்."
            if language == "ta"
            else "Unable to connect to the AI service. Please try again later."
        )
        return {
            "text": technical_err,
            "source": "System Notice",
            "primary_source": None,
            "used_model": "technical-error",
            "has_rag_context": False,
            "rag_context": ""
        }

    # Label accurately: "Verified Knowledge Base" only when RAG context was used
    if rag_context and primary_source:
        source_label = f"Verified Knowledge Base • {primary_source}"
    else:
        source_label = "SmartFarm AI Advisor"

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
    Accepts ANY farmer agricultural question.
    1. Retrieves verified agronomic context from the knowledge base if matched.
    2. Sends the question + conversation history + retrieved context to Gemini LLM.
    3. Returns grounded, farmer-friendly recommendations in English or Tamil.
    """
    query = request.message.strip()
    language = "ta" if request.language == "ta" else "en"
    history_dicts = [h.dict() for h in request.history] if request.history else []
    timestamp_str = datetime.now().strftime("%I:%M %p")
    res_id = int(time.time() * 1000)

    logger.info("--------------------------------------------------")
    logger.info("CHAT REQUEST RECEIVED: /api/chat")
    logger.info(f"VOICE TRANSCRIPT: {query}")
    logger.info(f"LANGUAGE: {language}")

    result = await execute_rag_gemini_pipeline(
        query=query,
        language=language,
        history=history_dicts
    )

    rag_status = "matched" if result.get("has_rag_context") else "no match"
    logger.info(f"GEMINI MODEL: {result.get('used_model', 'gemini-3.8-flash')}")
    logger.info(f"RAG: {rag_status}")
    logger.info("RESPONSE: success")
    logger.info("--------------------------------------------------")

    return ChatResponse(
        id=res_id,
        sender="ai",
        text=result["text"],
        source=result["source"],
        timestamp=timestamp_str
    )


