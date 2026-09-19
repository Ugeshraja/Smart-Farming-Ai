"""
Second-Stage Fix Verification Suite
Validates:
TEST A: "மாடியில் செடி வளர்ப்பது எப்படி" (Tamil terrace gardening) via /api/chat & /api/backend/api/chat
TEST B: "தக்காளிக்கு என்ன உரம் போட வேண்டும்?" (Tamil tomato fertilizer)
TEST C: "How can I grow tomato plants?" (English tomato cultivation)
TEST D: "How can I grow rice?" (General agriculture - Rice)
TEST E: "How do I grow kiwi?" (Out-of-RAG - Kiwi fruit)
"""

import sys
import os
import asyncio
from pathlib import Path
from fastapi.testclient import TestClient

backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from main import app

client = TestClient(app)

def test_endpoint(path, message, language="en"):
    print(f"\n--- Testing {path} with: '{message}' (lang: {language}) ---")
    payload = {
        "message": message,
        "language": language,
        "history": []
    }
    response = client.post(path, json=payload)
    print(f"Status: {response.status_code}")
    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    data = response.json()
    print(f"Response Sender: {data.get('sender')}")
    print(f"Response Source: {data.get('source')}")
    snippet = data.get("text", "")[:120].replace("\n", " ")
    print(f"Response Snippet: {snippet}...")
    assert "AI service unavailable" not in data.get("text", ""), "Error text detected!"
    assert "தற்போது கிடைக்கவில்லை" not in data.get("text", ""), "Error text detected!"
    assert "தற்காலிகமாக கிடைக்கவில்லை" not in data.get("text", ""), "Error text detected!"
    assert data.get("source") != "System Notice", "System Notice detected!"
    return data

def run_tests():
    print("=" * 70)
    print("STARTING SMARTFARM AI SECOND-STAGE FIX VERIFICATION")
    print("=" * 70)

    # TEST A: Tamil Terrace Gardening
    test_endpoint("/api/chat", "மாடியில் செடி வளர்ப்பது எப்படி", "ta")
    test_endpoint("/api/backend/api/chat", "மாடியில் செடி வளர்ப்பது எப்படி", "ta")

    # TEST B: Tamil Tomato Fertilizer
    test_endpoint("/api/chat", "தக்காளிக்கு என்ன உரம் போட வேண்டும்?", "ta")

    # TEST C: English Tomato Cultivation
    test_endpoint("/api/chat", "How can I grow tomato plants?", "en")

    # TEST D: General Question (Rice)
    test_endpoint("/api/chat", "How can I grow rice?", "en")

    # TEST E: Out-of-RAG Question (Kiwi)
    test_endpoint("/api/chat", "How do I grow kiwi?", "en")

    print("\n" + "=" * 70)
    print("ALL SECOND-STAGE FIX TESTS PASSED (HTTP 200 + REAL AI RESPONSES)!")
    print("=" * 70)

if __name__ == "__main__":
    run_tests()
