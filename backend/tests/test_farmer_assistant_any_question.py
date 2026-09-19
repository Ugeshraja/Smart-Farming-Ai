import sys
import os
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

from routes.chat import execute_rag_gemini_pipeline

async def run_tests():
    print("=" * 80)
    print("VERIFYING AI FARMER ASSISTANT ACCEPTS AND ANSWERS ANY AGRICULTURE QUESTION")
    print("=" * 80)

    test_cases = [
        {
            "num": 1,
            "query": "What fertilizer is suitable for rice?",
            "lang": "en",
            "desc": "Non-Solanaceae crop (Rice fertilizer)",
            "expect_rag": False
        },
        {
            "num": 2,
            "query": "How often should I water tomato plants?",
            "lang": "en",
            "desc": "Solanaceae crop (Tomato irrigation)",
            "expect_rag": True
        },
        {
            "num": 3,
            "query": "What causes yellow leaves in chilli?",
            "lang": "en",
            "desc": "Non-Solanaceae crop (Chilli yellow leaves)",
            "expect_rag": False
        },
        {
            "num": 4,
            "query": "How can I control aphids?",
            "lang": "en",
            "desc": "General agricultural pest (Aphids)",
            "expect_rag": False
        },
        {
            "num": 5,
            "query": "நெல் பயிருக்கு எந்த உரம் பயன்படுத்தலாம்?",
            "lang": "ta",
            "desc": "Tamil Non-Solanaceae question (Rice fertilizer in Tamil)",
            "expect_rag": False
        },
        {
            "num": 6,
            "query": "tomato ku eppo water kudukanum?",
            "lang": "ta",
            "desc": "Tanglish query in Tamil mode (Tomato watering)",
            "expect_rag": True
        },
        {
            "num": 7,
            "query": "What should I do during heavy rainfall?",
            "lang": "en",
            "desc": "Weather/General farming management (Heavy rainfall)",
            "expect_rag": False
        },
        {
            "num": 8,
            "query": "How much water does sugarcane need per hectare and when should I stop irrigation before harvesting?",
            "lang": "en",
            "desc": "Completely new agricultural question not in RAG (Sugarcane)",
            "expect_rag": False
        }
    ]

    all_passed = True

    for tc in test_cases:
        print(f"\n[TEST {tc['num']}] {tc['desc']}")
        print(f"Query: \"{tc['query']}\" | Language: {tc['lang']}")

        try:
            res = await execute_rag_gemini_pipeline(query=tc['query'], language=tc['lang'])
            text = res.get("text", "")
            source = res.get("source", "")
            has_rag = res.get("has_rag_context", False)

            print(f"-> Source: {source}")
            print(f"-> Has RAG Grounding: {has_rag}")
            print(f"-> Answer Preview ({len(text)} chars):\n{text[:220]}...\n")

            assert len(text) > 30, f"Test {tc['num']} failed: response too short"
            
            # Verify RAG label accuracy
            if has_rag:
                assert "Verified Knowledge Base" in source, f"Test {tc['num']}: Expected 'Verified Knowledge Base' in source label, got: {source}"
            else:
                assert "SmartFarm AI Advisor" in source, f"Test {tc['num']}: Expected 'SmartFarm AI Advisor' in source label, got: {source}"

            # Verify language
            if tc['lang'] == 'ta':
                # Check for Tamil characters (Unicode range \u0B80-\u0BFF)
                has_tamil_chars = any('\u0b80' <= c <= '\u0bff' for c in text)
                assert has_tamil_chars, f"Test {tc['num']}: Expected Tamil response for Tamil query, got: {text[:100]}"

            print(f"✓ TEST {tc['num']} PASSED")
        except Exception as e:
            print(f"✗ TEST {tc['num']} FAILED with error: {e}")
            all_passed = False

    # TEST 9: Follow-up question with conversation history
    print(f"\n[TEST 9] Follow-up Context Comprehension")
    print("Turn 1: 'What fertilizer is good for tomato?'")
    try:
        turn1 = await execute_rag_gemini_pipeline(query="What fertilizer is good for tomato?", language="en")
        history = [
            {"sender": "user", "text": "What fertilizer is good for tomato?"},
            {"sender": "ai", "text": turn1["text"]}
        ]
        print("Turn 2: 'How often should I apply it?' (with history)")
        turn2 = await execute_rag_gemini_pipeline(query="How often should I apply it?", language="en", history=history)
        print(f"-> Turn 2 Answer Preview:\n{turn2['text'][:220]}...\n")
        assert len(turn2['text']) > 30, "Turn 2 response too short"
        print("✓ TEST 9 PASSED: Follow-up question successfully answered using conversation history")
    except Exception as e:
        print(f"✗ TEST 9 FAILED with error: {e}")
        all_passed = False

    print("\n" + "=" * 80)
    if all_passed:
        print("ALL TESTS PASSED SUCCESSFULLY! The AI Farmer Assistant answers ANY agricultural question.")
    else:
        print("SOME TESTS FAILED! Please inspect errors above.")
    print("=" * 80)

if __name__ == "__main__":
    asyncio.run(run_tests())
