import sys
import os
import io
import wave
import json
import base64
import requests

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

from config import settings
from services.voice_service import voice_service

def inspect_wav_bytes(wav_bytes: bytes) -> dict:
    try:
        with wave.open(io.BytesIO(wav_bytes), "rb") as wf:
            nchannels = wf.getnchannels()
            sampwidth = wf.getsampwidth()
            framerate = wf.getframerate()
            nframes = wf.getnframes()
            duration = nframes / float(framerate)
            return {
                "valid_wav": True,
                "channels": nchannels,
                "sample_width_bytes": sampwidth,
                "frame_rate": framerate,
                "duration_sec": round(duration, 2),
                "size_bytes": len(wav_bytes)
            }
    except Exception as e:
        return {"valid_wav": False, "error": str(e), "size_bytes": len(wav_bytes)}

def run_tests():
    print("=" * 70)
    print("TESTING TAMIL & ENGLISH VOICE PIPELINE")
    print("=" * 70)

    # TEST 1: Tamil text synthesis
    tamil_test_text = "வணக்கம் விவசாய நண்பரே. உங்கள் தக்காளி பயிரை ஆரோக்கியமாக பராமரிக்க சில முக்கியமான வழிமுறைகளை பின்பற்ற வேண்டும்."
    print("\n--- TEST 1: Tamil TTS Synthesis ---")
    print(f"Input text: {tamil_test_text[:60]}...")
    
    ta_b64 = voice_service.synthesize_speech(tamil_test_text, language="ta")
    assert ta_b64 is not None, "Failed: Tamil TTS returned None"
    ta_bytes = base64.b64decode(ta_b64)
    ta_info = inspect_wav_bytes(ta_bytes)
    print("Tamil TTS Result:", json.dumps(ta_info, indent=2))
    assert ta_info["valid_wav"], "Tamil TTS did not produce valid WAV format"
    assert ta_info["duration_sec"] > 1.0, "Tamil TTS audio is too short"
    print(">> TEST 1 PASSED: Tamil TTS generated valid WAV audio!")

    # TEST 2: English text synthesis (Reference)
    en_test_text = "Hello farmer. Follow these important practices to maintain a healthy tomato crop."
    print("\n--- TEST 2: English TTS Synthesis (Reference) ---")
    print(f"Input text: {en_test_text}")
    
    en_b64 = voice_service.synthesize_speech(en_test_text, language="en")
    assert en_b64 is not None, "Failed: English TTS returned None"
    en_bytes = base64.b64decode(en_b64)
    en_info = inspect_wav_bytes(en_bytes)
    print("English TTS Result:", json.dumps(en_info, indent=2))
    assert en_info["valid_wav"], "English TTS did not produce valid WAV format"
    print(">> TEST 2 PASSED: English TTS generated valid WAV audio!")

    # TEST 3: Full End-to-End Voice Interaction (Farmer Spoken Tamil Query)
    farmer_ta_query = "என் தக்காளி செடிகளின் இலைகள் மஞ்சளாக மாறுகின்றன. என்ன செய்ய வேண்டும்?"
    print("\n--- TEST 3: Full Pipeline with Tamil Query ---")
    print(f"Farmer Query: {farmer_ta_query}")

    # Step A: Synthesize query into audio bytes to simulate farmer's voice
    print("Simulating farmer voice recording via Sarvam TTS...")
    query_audio_b64 = voice_service.synthesize_speech(farmer_ta_query, language="ta")
    query_audio_bytes = base64.b64decode(query_audio_b64)
    print(f"Synthesized farmer query audio: {len(query_audio_bytes)} bytes WAV")

    # Step B: Call POST http://127.0.0.1:8000/api/voice with WAV audio
    print("Calling POST http://127.0.0.1:8000/api/voice...")
    files = {"audio": ("recording.wav", query_audio_bytes, "audio/wav")}
    data = {"language": "ta"}
    resp = requests.post("http://127.0.0.1:8000/api/voice", files=files, data=data, timeout=60)
    
    print(f"HTTP Status: {resp.status_code}")
    assert resp.status_code == 200, f"Failed: status={resp.status_code} body={resp.text}"
    
    res_json = resp.json()
    assert res_json.get("success") is True, "Response success is not True"
    transcript = res_json.get("transcript", "")
    ai_response = res_json.get("ai_response", "")
    source = res_json.get("source", "")
    audio_b64 = res_json.get("audio")

    # Safe prints to avoid Windows terminal cp1252 UnicodeEncodeError
    safe_transcript = transcript.encode('ascii', 'backslashreplace').decode('ascii')
    safe_source = source.encode('ascii', 'backslashreplace').decode('ascii')
    safe_ai_preview = ai_response[:120].encode('ascii', 'backslashreplace').decode('ascii')

    print(f"STT Transcript: {safe_transcript}")
    print(f"RAG Source: {safe_source}")
    print(f"AI Response Preview: {safe_ai_preview}...")
    print(f"AI Response Length: {len(ai_response)} chars")

    assert transcript, "STT transcript should not be empty"
    assert ai_response, "AI response should not be empty"
    assert audio_b64, "Tamil TTS audio was not returned in response"

    resp_audio_bytes = base64.b64decode(audio_b64)
    resp_audio_info = inspect_wav_bytes(resp_audio_bytes)
    print("Returned Tamil Voice Audio:", json.dumps(resp_audio_info, indent=2))
    assert resp_audio_info["valid_wav"], "Returned audio is not valid WAV"
    assert resp_audio_info["duration_sec"] > 2.0, "Returned audio too short"

    print("\n>> ALL TESTS PASSED SUCCESSFULLY! <<")

if __name__ == "__main__":
    run_tests()
