import sys
import os
import io
import wave
import json
import base64
import requests

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

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
    print("TESTING FARMING PLANNER AI ADVISORY VOICE (SARVAM TTS BULBUL:V3)")
    print("=" * 70)

    # 1. Test Tamil advisory prompt requested by user
    ta_prompt = "வணக்கம் விவசாய நண்பரே. தக்காளி பயிரின் ஆரோக்கியமான வளர்ச்சிக்கு சீரான நீர்ப்பாசனம் மற்றும் சரியான ஊட்டச்சத்து மேலாண்மை அவசியம்."
    print("\n--- TEST 1: Tamil Advisory Text ---")
    print(f"Text: {ta_prompt[:60]}...")

    res1 = requests.post(
        "http://127.0.0.1:8000/api/voice/tts",
        json={"text": ta_prompt, "language": "ta"},
        timeout=45
    )
    print(f"Status Code: {res1.status_code}")
    assert res1.status_code == 200, f"Error: {res1.text}"
    data1 = res1.json()
    assert data1.get("success") is True, "Success should be True"
    assert data1.get("language") == "ta", "Language should be ta"
    assert data1.get("audio"), "Audio base64 missing"

    bytes1 = base64.b64decode(data1["audio"])
    info1 = inspect_wav_bytes(bytes1)
    print("Tamil TTS Audio Info:", json.dumps(info1, indent=2))
    assert info1["valid_wav"] is True, "Must be valid WAV"
    assert info1["duration_sec"] > 2.0, "Must have valid audio duration"
    print(">> TEST 1 PASSED!")

    # 2. Test English advisory prompt requested by user
    en_prompt = "Hello farmer. Regular irrigation and proper nutrient management are important for healthy tomato crop growth."
    print("\n--- TEST 2: English Advisory Text ---")
    print(f"Text: {en_prompt}")

    res2 = requests.post(
        "http://127.0.0.1:8000/api/voice/tts",
        json={"text": en_prompt, "language": "en"},
        timeout=45
    )
    print(f"Status Code: {res2.status_code}")
    assert res2.status_code == 200, f"Error: {res2.text}"
    data2 = res2.json()
    assert data2.get("success") is True, "Success should be True"
    assert data2.get("language") == "en", "Language should be en"
    assert data2.get("audio"), "Audio base64 missing"

    bytes2 = base64.b64decode(data2["audio"])
    info2 = inspect_wav_bytes(bytes2)
    print("English TTS Audio Info:", json.dumps(info2, indent=2))
    assert info2["valid_wav"] is True, "Must be valid WAV"
    assert info2["duration_sec"] > 2.0, "Must have valid audio duration"
    print(">> TEST 2 PASSED!")

    # 3. Test with actual long Farming Planner advisory in Tamil
    long_ta_advisory = (
        "திட்டமிடப்பட்ட பயிர்: தக்காளி (2.5 ஏக்கர்) • இடம்: திருச்செங்கோடு / நாமக்கல் • "
        "விதைப்பு தேதி: 11 செப் 2026. எதிர்பார்க்கப்படும் அறுவடை காலம்: 10 டிசம்பர் 2026 – 30 டிசம்பர் 2026. "
        "பயிர் வளர்ச்சி நிலைகள்: நாற்று நடும் நிலை, கிளைகள் வளரும் நிலை, பூக்கும் பருவம், காய் பிடிக்கும் நிலை மற்றும் அறுவடை நிலை. "
        "மண்ணின் ஈரப்பதத்தை தொடர்ந்து கவனித்து சொட்டு நீர் பாசனம் அமைப்பது வேர் வளர்ச்சியை ஊக்குவிக்கும். "
        "பூச்சிகள் மற்றும் பூஞ்சை நோய்களை முன்கூட்டியே கட்டுப்படுத்த இயற்கை வேப்பங்கொட்டை கரைசல் தெளிக்கவும்."
    )
    print("\n--- TEST 3: Actual Long Farming Planner Advisory (Tamil) ---")
    print(f"Advisory length: {len(long_ta_advisory)} chars")

    res3 = requests.post(
        "http://127.0.0.1:8000/api/voice/tts",
        json={"text": long_ta_advisory, "language": "ta"},
        timeout=45
    )
    print(f"Status Code: {res3.status_code}")
    assert res3.status_code == 200, f"Error: {res3.text}"
    data3 = res3.json()
    assert data3.get("success") is True, "Success should be True"
    assert data3.get("language") == "ta", "Language should be ta"
    assert data3.get("audio"), "Audio base64 missing"

    bytes3 = base64.b64decode(data3["audio"])
    info3 = inspect_wav_bytes(bytes3)
    print("Long Tamil Advisory Audio Info:", json.dumps(info3, indent=2))
    assert info3["valid_wav"] is True, "Must be valid WAV"
    assert info3["duration_sec"] > 10.0, "Must have substantial duration"
    print(">> TEST 3 PASSED!")

    print("\n>> ALL PLANNER VOICE TESTS PASSED SUCCESSFULLY! <<")

if __name__ == "__main__":
    run_tests()
