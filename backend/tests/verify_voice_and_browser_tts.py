import os
import sys
import json
import requests

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

BASE_URL = "http://127.0.0.1:8000/api"

def test_full_system():
    print("=" * 70)
    print("SMARTFARM AI — END-TO-END BACKEND & FRONTEND VERIFICATION")
    print("=" * 70)

    # 1. Health
    res = requests.get(f"{BASE_URL}/health")
    assert res.status_code == 200, f"Health check failed: {res.status_code}"
    print("✓ [PASS] Backend Health: 200 OK ->", res.json().get("status"))

    # 2. Voice Status
    res = requests.get(f"{BASE_URL}/voice/status")
    assert res.status_code == 200, f"Voice status failed: {res.status_code}"
    data = res.json()
    assert data.get("tts_engine") == "Browser SpeechSynthesis (Web Speech API)"
    print("✓ [PASS] Voice Status: 200 OK -> TTS Engine:", data.get("tts_engine"))

    # 3. Direct TTS endpoint informs client
    res = requests.post(f"{BASE_URL}/voice/tts", json={"text": "hello", "language": "en"})
    assert res.status_code == 200
    tts_data = res.json()
    assert tts_data.get("audio") is None
    print("✓ [PASS] Cloud TTS Disabled: audio is None, client-side Web Speech instructed.")

    # 4. English Voice Pipeline (RAG + Gemini 3.8 Flash)
    en_query = "How often should I water tomato plants?"
    print(f"\nTesting English Voice Pipeline with query: '{en_query}'")
    res = requests.post(f"{BASE_URL}/voice", json={"transcript": en_query, "language": "en"})
    assert res.status_code == 200, f"Voice pipeline failed: {res.status_code}"
    en_res = res.json()
    assert en_res.get("success") is True
    assert en_res.get("audio") is None, "Server audio should be None (browser TTS handles output)"
    assert len(en_res.get("ai_response", "")) > 50
    print("✓ [PASS] English Voice Interaction: 200 OK")
    print(f"       Model: {en_res.get('used_model')}")
    print(f"       Source: {en_res.get('source')}")
    print(f"       AI Response chars: {len(en_res.get('ai_response'))}")
    print(f"       Snippet: {en_res.get('ai_response')[:90]}...")

    # 5. Tamil Voice Pipeline (RAG + Gemini)
    ta_query = "தக்காளி செடிக்கு எப்போது தண்ணீர் ஊற்ற வேண்டும்?"
    print(f"\nTesting Tamil Voice Pipeline with query: '{ta_query}'")
    res = requests.post(f"{BASE_URL}/voice", json={"transcript": ta_query, "language": "ta"})
    assert res.status_code == 200, f"Tamil voice pipeline failed: {res.status_code}"
    ta_res = res.json()
    assert ta_res.get("success") is True
    assert ta_res.get("audio") is None, "Server audio should be None"
    assert len(ta_res.get("ai_response", "")) > 50
    print("✓ [PASS] Tamil Voice Interaction: 200 OK")
    print(f"       Model: {ta_res.get('used_model')}")
    print(f"       Source: {ta_res.get('source')}")
    print(f"       AI Response chars: {len(ta_res.get('ai_response'))}")
    print(f"       Snippet: {ta_res.get('ai_response')[:90]}...")

    # 6. Live Weather Proxy
    res = requests.get(f"{BASE_URL}/weather/data?lat=11.38&lon=77.89")
    assert res.status_code == 200, f"Weather proxy failed: {res.status_code}"
    w_data = res.json()
    assert "current" in w_data
    print(f"\n✓ [PASS] Live Weather Proxy: 200 OK -> Temp: {w_data['current'].get('temperature')}°C, Location: {w_data.get('location_name')}")

    # 7. Chat Assistant Pipeline
    res = requests.post(f"{BASE_URL}/chat", json={"message": "What pests affect brinjal?", "language": "en"})
    assert res.status_code == 200, f"Chat failed: {res.status_code}"
    chat_data = res.json()
    assert len(chat_data.get("text", "")) > 50
    print("✓ [PASS] Farmer Assistant Chat: 200 OK -> Snippet:", chat_data.get("text")[:80], "...")

    print("\n" + "=" * 70)
    print("ALL 7 BACKEND END-TO-END SYSTEM CHECKS PASSED PERFECTLY!")
    print("=" * 70)

if __name__ == "__main__":
    test_full_system()
