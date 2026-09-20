import sys
import io
import wave
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_tamil_tts():
    print("Testing Tamil POST /api/tts...")
    resp = client.post(
        "/api/tts",
        json={"text": "வணக்கம். இது SmartFarm AI தமிழ் குரல் சோதனை.", "language": "ta"}
    )
    print("Tamil status:", resp.status_code)
    print("Content-Type:", resp.headers.get("content-type"))
    print("Bytes:", len(resp.content))

    assert resp.status_code == 200
    assert resp.headers.get("content-type") == "audio/wav"
    assert len(resp.content) > 1000

    # Verify WAV structure
    with wave.open(io.BytesIO(resp.content), "rb") as wf:
        channels = wf.getnchannels()
        rate = wf.getframerate()
        frames = wf.getnframes()
        duration = frames / float(rate)
        print(f"Tamil WAV: channels={channels}, rate={rate}, frames={frames}, duration={duration:.2f}s")
        assert channels == 1
        assert rate == 22050
        assert duration > 0.5


def test_english_tts():
    print("Testing English POST /api/tts...")
    resp = client.post(
        "/api/tts",
        json={"text": "Hello. This is a SmartFarm AI English voice test.", "language": "en"}
    )
    print("English status:", resp.status_code)
    print("Content-Type:", resp.headers.get("content-type"))
    print("Bytes:", len(resp.content))

    assert resp.status_code == 200
    assert resp.headers.get("content-type") == "audio/wav"
    assert len(resp.content) > 1000

    # Verify WAV structure
    with wave.open(io.BytesIO(resp.content), "rb") as wf:
        channels = wf.getnchannels()
        rate = wf.getframerate()
        frames = wf.getnframes()
        duration = frames / float(rate)
        print(f"English WAV: channels={channels}, rate={rate}, frames={frames}, duration={duration:.2f}s")
        assert channels == 1
        assert rate == 22050
        assert duration > 0.5


def test_empty_text_rejection():
    print("Testing empty text validation...")
    resp = client.post("/api/tts", json={"text": "", "language": "en"})
    assert resp.status_code == 400


if __name__ == "__main__":
    test_tamil_tts()
    test_english_tts()
    test_empty_text_rejection()
    print("\nALL PIPER TTS ENDPOINT TESTS PASSED SUCCESSFULLY!")
