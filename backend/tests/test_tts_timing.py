import sys
import time
from pathlib import Path

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from services.tts_service import tts_manager, clean_text_for_piper, get_process_memory_mb

def test_timing_and_cleaning():
    print("=== Testing clean_text_for_piper ===")
    sample_ta = "**வணக்கம்!** [1] 🌾 தக்காளி பயிரில் 50% உரம் இடவும். https://example.com"
    cleaned_ta = clean_text_for_piper(sample_ta, "ta")
    print(f"Original TA: {sample_ta}")
    print(f"Cleaned TA:  {cleaned_ta}")
    assert "🌾" not in cleaned_ta, "Emoji should be removed"
    assert "https://" not in cleaned_ta, "URL should be removed"
    assert "[1]" not in cleaned_ta, "Bracket citation should be removed"
    assert "**" not in cleaned_ta, "Markdown should be removed"
    assert "சதவீதம்" in cleaned_ta, "Percent should be normalized"

    sample_en = "## Advisory 🚜: Apply 10% nitrogen fertilizer! [source: TNAU] Visit http://agri.tnau.ac.in"
    cleaned_en = clean_text_for_piper(sample_en, "en")
    print(f"Original EN: {sample_en}")
    print(f"Cleaned EN:  {cleaned_en}")
    assert "🚜" not in cleaned_en, "Emoji should be removed"
    assert "http://" not in cleaned_en, "URL should be removed"
    assert "[source: TNAU]" not in cleaned_en, "Bracket citation should be removed"
    assert "percent" in cleaned_en, "Percent should be normalized"

    print("\n=== Testing process memory ===")
    mem = get_process_memory_mb()
    print(f"Process RSS: {mem:.2f} MB")

    print("\n=== Testing preload_models ===")
    preload_res = tts_manager.preload_models()
    print(f"Preload results: {preload_res}")

    print("\n=== Testing synthesis timing ===")
    # Tamil test
    t0 = time.time()
    wav_ta, timing_ta = tts_manager.synthesize_bytes("வணக்கம், பயிர் பாதுகாப்பு ஆலோசனை.", language="ta", return_metadata=True)
    elapsed_ta = time.time() - t0
    print(f"Tamil Synthesis - Bytes: {len(wav_ta)}, Timing: {timing_ta}, Total elapsed: {elapsed_ta:.3f}s")

    # Tamil cached test
    t0 = time.time()
    wav_ta_cache, timing_ta_cache = tts_manager.synthesize_bytes("வணக்கம், பயிர் பாதுகாப்பு ஆலோசனை.", language="ta", return_metadata=True)
    elapsed_ta_cache = time.time() - t0
    print(f"Tamil Cache - Bytes: {len(wav_ta_cache)}, Timing: {timing_ta_cache}, Total elapsed: {elapsed_ta_cache:.3f}s")
    assert timing_ta_cache["cache_hit"] is True, "Expected cache hit"

    # English test
    t0 = time.time()
    wav_en, timing_en = tts_manager.synthesize_bytes("Hello, here is your crop management plan.", language="en", return_metadata=True)
    elapsed_en = time.time() - t0
    print(f"English Synthesis - Bytes: {len(wav_en)}, Timing: {timing_en}, Total elapsed: {elapsed_en:.3f}s")

    # English cached test
    t0 = time.time()
    wav_en_cache, timing_en_cache = tts_manager.synthesize_bytes("Hello, here is your crop management plan.", language="en", return_metadata=True)
    elapsed_en_cache = time.time() - t0
    print(f"English Cache - Bytes: {len(wav_en_cache)}, Timing: {timing_en_cache}, Total elapsed: {elapsed_en_cache:.3f}s")
    assert timing_en_cache["cache_hit"] is True, "Expected cache hit"

    print("\nALL LOCAL TIMING TESTS PASSED!")

if __name__ == "__main__":
    test_timing_and_cleaning()
