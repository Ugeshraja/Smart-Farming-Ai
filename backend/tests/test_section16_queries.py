import sys
import os
import io
import time
import base64
import asyncio

# Ensure UTF-8 output on Windows
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from services.voice_service import voice_service
import pytest
from routes.voice import process_voice_interaction, VoiceJsonResponse
from routes.chat import execute_rag_gemini_pipeline
from fastapi import Request, HTTPException

@pytest.mark.anyio
async def test_section_16_queries():
    print("=" * 80)
    print("RUNNING SECTION 16 REAL QUERY VERIFICATION")
    print("=" * 80)

    queries = [
        {
            "id": 1,
            "desc": "Tamil Solanaceae Query (Tomato yellow leaves)",
            "lang": "ta",
            "text": "என் தக்காளி செடிகளில் இலைகள் மஞ்சளாகிறது, என்ன செய்ய வேண்டும்?",
            "expect_rag": True
        },
        {
            "id": 2,
            "desc": "English Solanaceae Query (Brinjal shoot and fruit borer)",
            "lang": "en",
            "text": "How to control shoot and fruit borer in brinjal?",
            "expect_rag": True
        },
        {
            "id": 3,
            "desc": "Tamil Non-Solanaceae Query (Rice blast disease)",
            "lang": "ta",
            "text": "நெல் பயிரில் குலை நோய் மேலாண்மை பற்றி கூறுங்கள்",
            "expect_rag": False
        },
        {
            "id": 4,
            "desc": "Off-topic Query (Cricket match winner)",
            "lang": "ta",
            "text": "நாளை கிரிக்கெட் மேட்ச் யார் ஜெயிப்பா?",
            "expect_rag": False
        },
        {
            "id": 5,
            "desc": "Tanglish Query (Tomato leaf curl)",
            "lang": "ta",
            "text": "Tomato plant la leaf curl problem irukku, enna treatment?",
            "expect_rag": True
        }
    ]

    for q in queries:
        print(f"\n--- Running Query {q['id']}: {q['desc']} ---")
        print(f"Language: {q['lang']}")
        print(f"Prompt text: {q['text']}")

        # Step A: Synthesize query into actual speech using Sarvam TTS to produce authentic test audio
        print(f"Synthesizing test spoken audio using Sarvam TTS ({q['lang']})...")
        audio_b64 = voice_service.synthesize_speech(text=q["text"], language=q["lang"])
        assert audio_b64 is not None, f"Failed to synthesize test audio for Query {q['id']}"
        raw_audio = base64.b64decode(audio_b64)
        print(f"Generated spoken audio: {len(raw_audio)} bytes WAV")

        # Step B: Pass audio to Sarvam STT to transcribe
        print(f"Transcribing spoken audio with Sarvam STT (saaras:v3)...")
        transcript = voice_service.transcribe_audio(
            audio_bytes=raw_audio,
            filename="farmer_recording.wav",
            content_type="audio/wav",
            language=q["lang"]
        )
        print(f"Transcribed Text: {transcript}")
        assert len(transcript.strip()) > 0, f"STT transcript was empty for Query {q['id']}"

        # Step C: Execute RAG + Gemini
        print("Dispatching to RAG + Gemini pipeline...")
        pipeline_res = await execute_rag_gemini_pipeline(query=transcript, language=q["lang"])
        ai_text = pipeline_res["text"]
        source = pipeline_res.get("source")
        used_model = pipeline_res.get("used_model")
        print(f"Source: {source}")
        print(f"Model used: {used_model}")
        print(f"Response snippet: {ai_text[:120]}...")
        assert len(ai_text) > 30, f"AI response too short for Query {q['id']}"

        # Step D: Confirm server-side cloud TTS is disabled and handled by browser SpeechSynthesis
        ans_audio_b64 = voice_service.synthesize_speech(text=ai_text, language=q["lang"])
        assert ans_audio_b64 is None, f"Server-side TTS should be disabled for Query {q['id']}"
        print(f"Voice output confirmed: Browser SpeechSynthesis active (server audio is None)")
        print(f">> Query {q['id']} PASSED successfully!")

    print("\n" + "=" * 80)
    print("ALL 5 SECTION 16 QUERIES PASSED END-TO-END!")
    print("=" * 80)

if __name__ == "__main__":
    asyncio.run(test_section_16_queries())
