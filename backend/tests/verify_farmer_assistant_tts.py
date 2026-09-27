import io
import wave
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def inspect_wav(content: bytes):
    with wave.open(io.BytesIO(content), "rb") as wf:
        return {
            "channels": wf.getnchannels(),
            "rate": wf.getframerate(),
            "frames": wf.getnframes(),
            "duration": round(wf.getnframes() / float(wf.getframerate()), 2)
        }

def test_case_1():
    print("\n--- TEST 1: Tamil Rice Irrigation Query ---")
    query = "நெல் பயிருக்கு எவ்வளவு தண்ணீர் தேவை?"
    # Typical Gemini/RAG response
    response_text = "நெல் பயிருக்கு மொத்த வளர்ச்சி காலத்தில் சுமார் 1200 முதல் 1400 மிமீ தண்ணீர் தேவைப்படுகிறது. கதிர் வரும் பருவத்தில் வயலில் 2 முதல் 5 செமீ வரை நீர் தேங்கி இருப்பது அவசியம்."
    
    resp = client.post("/api/tts", json={"text": response_text, "language": "ta"})
    assert resp.status_code == 200, f"Status code failed: {resp.status_code}"
    assert resp.headers["content-type"] == "audio/wav"
    wav_info = inspect_wav(resp.content)
    print("Test 1 Result:", wav_info, f"({len(resp.content)} bytes)")
    assert wav_info["channels"] == 1
    assert wav_info["rate"] == 22050
    assert wav_info["duration"] > 3.0
    print(">> TEST 1 PASSED: Tamil Rice Irrigation response synthesized successfully.")

def test_case_2():
    print("\n--- TEST 2: Tamil Tomato Watering Query ---")
    query = "தக்காளி செடிக்கு எப்போது தண்ணீர் ஊற்ற வேண்டும்?"
    response_text = "தக்காளி செடிகளுக்கு காலை வேளையில் தண்ணீர் ஊற்றுவது மிகவும் நல்லது. இலைகளின் மீது தண்ணீர் படாமல் செடியின் வேர்ப்பகுதியில் ஊற்ற வேண்டும். பூக்கும் மற்றும் காய் பிடிக்கும் தருணத்தில் சீரான ஈரப்பதம் அவசியம்."
    
    resp = client.post("/api/tts", json={"text": response_text, "language": "ta"})
    assert resp.status_code == 200
    assert resp.headers["content-type"] == "audio/wav"
    wav_info = inspect_wav(resp.content)
    print("Test 2 Result:", wav_info, f"({len(resp.content)} bytes)")
    assert wav_info["channels"] == 1
    assert wav_info["rate"] == 22050
    assert wav_info["duration"] > 3.0
    print(">> TEST 2 PASSED: Tamil Tomato Watering response synthesized successfully.")

def test_case_3():
    print("\n--- TEST 3: English Tomato Watering Query ---")
    query = "When should I water tomato plants?"
    response_text = "Water tomato plants early in the morning at the base of the plant. Avoid wetting the leaves to prevent fungal infections. Maintain consistent moisture during flowering and fruiting."
    
    resp = client.post("/api/tts", json={"text": response_text, "language": "en"})
    assert resp.status_code == 200
    assert resp.headers["content-type"] == "audio/wav"
    wav_info = inspect_wav(resp.content)
    print("Test 3 Result:", wav_info, f"({len(resp.content)} bytes)")
    assert wav_info["channels"] == 1
    assert wav_info["rate"] == 22050
    assert wav_info["duration"] > 3.0
    print(">> TEST 3 PASSED: English Tomato Watering response synthesized successfully.")

def test_case_4():
    print("\n--- TEST 4: Tamil with Numbers and English Agricultural Terms ---")
    # Response containing numbers (3.5, 100%, 20-20-20), units (ml, kg), and terms (NPK, Trichoderma, Pseudomonas)
    response_text = "தக்காளி பயிருக்கு ஏக்கருக்கு 500 கிராம் Trichoderma viride மற்றும் 100% NPK 19-19-19 உரத்தை 3.5 கிராம் வீதம் 1 லிட்டர் நீரில் கலந்து தெளிக்கவும்."
    
    resp = client.post("/api/tts", json={"text": response_text, "language": "ta"})
    assert resp.status_code == 200
    assert resp.headers["content-type"] == "audio/wav"
    wav_info = inspect_wav(resp.content)
    print("Test 4 Result:", wav_info, f"({len(resp.content)} bytes)")
    assert wav_info["channels"] == 1
    assert wav_info["rate"] == 22050
    assert wav_info["duration"] > 3.0
    print(">> TEST 4 PASSED: Tamil with numbers and agronomic terms synthesized without error.")

def test_case_5():
    print("\n--- TEST 5: Long Tamil Agricultural Advisory ---")
    long_response = (
        "கத்தரி மற்றும் தக்காளி பயிர்களில் இலைப்புள்ளி மற்றும் கருகல் நோய்களைக் கட்டுப்படுத்த ஒருங்கிணைந்த மேலாண்மை முறைகள் அவசியமாகும். "
        "முதல் கட்டமாக பாதிக்கப்பட்ட இலைகளை உடனே அகற்றி அழிக்க வேண்டும். "
        "இரண்டாம் கட்டமாக காப்பர் ஆக்ஸிகுளோரைடு அல்லது மாங்கோசெப் மருந்தினை 2.5 கிராம் வீதம் ஒரு லிட்டர் தண்ணீரில் கலந்து தெளிக்க வேண்டும். "
        "மண் ஈரப்பதத்தை சீராகப் பராமரித்து, நுண்ணூட்டச் சத்துக்களை சரியான இடைவெளியில் வழங்க வேண்டும்."
    )
    
    resp = client.post("/api/tts", json={"text": long_response, "language": "ta"})
    assert resp.status_code == 200
    assert resp.headers["content-type"] == "audio/wav"
    wav_info = inspect_wav(resp.content)
    print("Test 5 Result:", wav_info, f"({len(resp.content)} bytes)")
    assert wav_info["channels"] == 1
    assert wav_info["rate"] == 22050
    assert wav_info["duration"] > 6.0  # Full response spoken without truncation
    print(">> TEST 5 PASSED: Long Tamil advisory fully synthesized without truncation.")

if __name__ == "__main__":
    print("=" * 60)
    print("VERIFYING ALL 5 USER-SPECIFIED TTS TEST CASES")
    print("=" * 60)
    test_case_1()
    test_case_2()
    test_case_3()
    test_case_4()
    test_case_5()
    print("\n" + "=" * 60)
    print("ALL 5 REQUIRED CASES TESTED AND VERIFIED: PASS")
    print("=" * 60)
