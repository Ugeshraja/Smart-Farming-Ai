import os
import sys
import json
import base64
import requests

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient
from main import app
from config import settings

client = TestClient(app)

TEST_CASES = [
    {
        "id": "TEST_1_TAMIL_VOICE",
        "name": "TEST 1 — Tamil voice: Tomato yellow leaves",
        "spoken_text": "என் தக்காளி செடிகளின் இலைகள் மஞ்சளாக மாறுகின்றன. என்ன செய்ய வேண்டும்?",
        "language": "ta",
        "lang_code": "ta-IN"
    },
    {
        "id": "TEST_2_ENGLISH_VOICE",
        "name": "TEST 2 — English voice: Tomato yellow leaves",
        "spoken_text": "My tomato leaves are turning yellow. What should I do?",
        "language": "en",
        "lang_code": "en-IN"
    },
    {
        "id": "TEST_3_NEW_TAMIL_VOICE",
        "name": "TEST 3 — New Tamil question: Brinjal flower drop",
        "spoken_text": "கத்தரிக்காய் செடியில் பூக்கள் உதிர்வதை எப்படி குறைக்கலாம்?",
        "language": "ta",
        "lang_code": "ta-IN"
    },
    {
        "id": "TEST_4_NEW_ENGLISH_VOICE",
        "name": "TEST 4 — New English question: Brinjal fertilizer application",
        "spoken_text": "What should I check before applying fertilizer to brinjal?",
        "language": "en",
        "lang_code": "en-IN"
    }
]


def generate_audio_for_query(text: str, lang_code: str) -> bytes:
    """Uses Sarvam TTS to synthesize real voice audio bytes for testing STT."""
    resp = requests.post(
        "https://api.sarvam.ai/text-to-speech",
        headers={
            "api-subscription-key": settings.voice_api_key,
            "Content-Type": "application/json"
        },
        json={
            "text": text,
            "language_code": lang_code,
            "model": "bulbul:v3"
        },
        timeout=30
    )
    if resp.status_code != 200:
        raise RuntimeError(f"Failed to synthesize test query audio: {resp.status_code} - {resp.text[:200]}")

    b64 = resp.json()["audios"][0]
    return base64.b64decode(b64)


def run_all_tests():
    results = []

    print(f"Starting execution of {len(TEST_CASES)} voice pipeline test cases...")

    for i, test in enumerate(TEST_CASES, 1):
        print(f"\n[{i}/{len(TEST_CASES)}] Running {test['id']} ({test['language']})...")

        # 1. Generate real audio wav
        try:
            audio_bytes = generate_audio_for_query(test["spoken_text"], test["lang_code"])
            print(f"  Generated test audio: {len(audio_bytes)} bytes")
        except Exception as e:
            print(f"  Error generating audio: {e}")
            results.append({
                "test_id": test["id"],
                "name": test["name"],
                "status": "FAILED",
                "error": f"Audio synthesis failed: {str(e)}"
            })
            continue

        # 2. Call POST /api/voice
        try:
            resp = client.post(
                "/api/voice",
                files={"audio": ("speech.wav", audio_bytes, "audio/wav")},
                data={"language": test["language"]}
            )
            status_code = resp.status_code
            data = resp.json()

            if status_code == 200 and data.get("success"):
                transcript = data.get("transcript", "")
                ai_resp = data.get("ai_response", "")
                source = data.get("source", "")
                has_audio = bool(data.get("audio"))
                audio_len = len(data.get("audio", "")) if has_audio else 0

                print(f"  Status Code: {status_code}")
                safe_tr = transcript[:60].encode('ascii', 'backslashreplace').decode('ascii')
                safe_src = source.encode('ascii', 'backslashreplace').decode('ascii')
                print(f"  Transcript Received: {safe_tr}...")
                print(f"  RAG / Source: {safe_src}")
                print(f"  AI Response Length: {len(ai_resp)} chars")
                print(f"  TTS Audio Length: {audio_len} base64 chars")

                results.append({
                    "test_id": test["id"],
                    "name": test["name"],
                    "status": "PASSED",
                    "status_code": status_code,
                    "input_text": test["spoken_text"],
                    "transcript": transcript,
                    "language": data.get("language"),
                    "source": source,
                    "used_model": data.get("used_model"),
                    "has_audio": has_audio,
                    "audio_length": audio_len,
                    "ai_response_preview": ai_resp[:180]
                })
            else:
                print(f"  FAILED: Status {status_code}, detail: {data}")
                results.append({
                    "test_id": test["id"],
                    "name": test["name"],
                    "status": "FAILED",
                    "status_code": status_code,
                    "detail": data
                })
        except Exception as e:
            print(f"  Endpoint execution error: {e}")
            results.append({
                "test_id": test["id"],
                "name": test["name"],
                "status": "FAILED",
                "error": str(e)
            })

    output_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "test_results.json")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    print(f"\nAll tests completed. Results saved to {output_path}")
    passed = sum(1 for r in results if r.get("status") == "PASSED")
    print(f"Passed: {passed}/{len(TEST_CASES)}")
    return results


if __name__ == "__main__":
    run_all_tests()
