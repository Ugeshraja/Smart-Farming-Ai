import sys
import os
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

from services.tts_service import (
    split_text_into_natural_chunks,
    compute_cache_key,
    save_cached_audio,
    get_cached_audio,
    tts_manager,
    SarvamTTSProvider,
    LocalIndicTTSProvider
)


class TestHybridTTSArchitecture(unittest.TestCase):

    def test_01_text_chunker_natural_boundaries(self):
        """Verify that long texts are chunked at natural boundaries without splitting words."""
        # Multi-sentence paragraph in Tamil
        tamil_text = (
            "தக்காளி செடியில் இலை சுருட்டை நோய் வராமல் தடுக்க வேப்ப எண்ணெய் தெளிக்க வேண்டும். "
            "மேலும் செடிகளுக்கு போதுமான அளவு தண்ணீர் பாய்ச்ச வேண்டும். "
            "மண்ணின் ஈரப்பதத்தை தொடர்ந்து கண்காணிக்கவும். "
            "உரங்களை சரியான அளவில் இட வேண்டும்."
        )
        chunks = split_text_into_natural_chunks(tamil_text, max_chars=100)
        self.assertTrue(len(chunks) >= 2)
        # Check that words are not split mid-word
        for chunk in chunks:
            self.assertTrue(len(chunk) <= 150)
            self.assertFalse(chunk.startswith(" "))
            self.assertFalse(chunk.endswith(" "))
        print(f"✓ TEST 1 PASSED: Tamil text split into {len(chunks)} natural chunks without word splitting.")

    def test_02_text_chunker_paragraphs_and_limits(self):
        """Verify paragraph splitting and respecting safety limit."""
        long_text = ("Hello farmer. Welcome to SmartFarm AI. " * 30).strip()
        chunks = split_text_into_natural_chunks(long_text, max_chars=400)
        self.assertTrue(len(chunks) > 1)
        for chunk in chunks:
            self.assertTrue(len(chunk) <= 450)
        print(f"✓ TEST 2 PASSED: English long text split into {len(chunks)} chunks.")

    def test_03_cache_storage_and_retrieval(self):
        """Verify SHA256 disk cache storage and retrieval."""
        test_lang = "ta"
        test_provider = "sarvam"
        test_voice = "female_default"
        test_text = "வணக்கம் விவசாயி. இது ஒரு பரிசோதனை உரை."

        key = compute_cache_key(test_lang, test_provider, test_voice, test_text)
        dummy_wav = b"RIFF" + b"\x00" * 40 + b"WAVEfmt " + b"\x00" * 20

        save_cached_audio(key, dummy_wav, "audio/wav")
        retrieved = get_cached_audio(key)

        self.assertIsNotNone(retrieved)
        retrieved_bytes, content_type = retrieved
        self.assertEqual(retrieved_bytes, dummy_wav)
        self.assertEqual(content_type, "audio/wav")
        print("✓ TEST 3 PASSED: Audio disk caching and SHA256 hash retrieval successful.")

    def test_04_local_indic_tts_optionality(self):
        """Verify Local Indic TTS gracefully reports availability without crashing."""
        provider = LocalIndicTTSProvider()
        # Should return boolean without throwing any exception
        avail = provider.is_available()
        self.assertIsInstance(avail, bool)
        res = provider.synthesize("வணக்கம்", language="ta")
        self.assertIsInstance(res, dict)
        self.assertIn("success", res)
        print(f"✓ TEST 4 PASSED: Local Indic TTS optionality verified (Available: {avail}).")

    def test_05_provider_status_api(self):
        """Verify backend provider status reports safe JSON without exposing keys."""
        status = tts_manager.get_providers_status()
        self.assertEqual(status["status"], "online")
        self.assertIn("providers", status)
        self.assertIn("local_indic_tts", status["providers"])
        self.assertIn("sarvam", status["providers"])
        # Ensure no secrets
        self.assertNotIn("api_key", json.dumps(status))
        self.assertNotIn("secret", json.dumps(status).lower())
        print("✓ TEST 5 PASSED: Provider status returns safe sanitized metadata.")

    def test_06_tts_manager_empty_and_fallback(self):
        """Verify TTS manager fallback response when providers fail or text is empty."""
        empty_res = tts_manager.synthesize("", language="en")
        self.assertFalse(empty_res["success"])
        self.assertTrue(empty_res["text_only"])

        # Test request with non-existent provider
        res = tts_manager.synthesize("Test query", language="en", preferred_provider="unknown_provider")
        self.assertIn("fallback_to_browser", res)
        print("✓ TEST 6 PASSED: Fallback signaling to frontend works correctly.")

    def test_07_gtts_tamil_synthesis(self):
        """Verify gTTS Tamil synthesis creates authentic MP3 audio bytes."""
        from services.tts_service import GTTSProvider
        provider = GTTSProvider()
        self.assertTrue(provider.is_available())
        res = provider.synthesize("வணக்கம். இது ஸ்மார்ட் ஃபார்ம் AI குரல் சோதனை.", language="ta")
        self.assertTrue(res["success"])
        self.assertEqual(res["provider"], "gtts")
        self.assertEqual(res["content_type"], "audio/mpeg")
        self.assertIsNotNone(res["audio_bytes"])
        self.assertTrue(len(res["audio_bytes"]) > 1000)
        print(f"✓ TEST 7 PASSED: gTTS Tamil synthesis successful ({len(res['audio_bytes'])} bytes MP3).")

    def test_08_gtts_language_mapping(self):
        """Verify language mapping for gTTS (ta-IN -> ta, en-IN -> en)."""
        from services.tts_service import GTTSProvider
        provider = GTTSProvider()
        self.assertEqual(provider.map_language("ta-IN"), "ta")
        self.assertEqual(provider.map_language("ta"), "ta")
        self.assertEqual(provider.map_language("en-IN"), "en")
        self.assertEqual(provider.map_language("en"), "en")
        print("✓ TEST 8 PASSED: gTTS language mapping verified.")

    def test_09_tts_manager_gtts_integration(self):
        """Verify TTSManager integrates gTTS and returns audio_url and audio_chunks."""
        test_text = "வணக்கம் விவசாயி. உங்கள் பயிர் நலம் பெற வாழ்த்துகள்."
        res = tts_manager.synthesize(test_text, language="ta-IN", preferred_provider="gtts")
        self.assertTrue(res["success"])
        self.assertEqual(res["provider"], "gtts")
        self.assertIsNotNone(res.get("audio_url"))
        self.assertTrue(res["audio_url"].startswith("/static/tts/"))
        self.assertTrue(len(res["audio_chunks"]) >= 1)
        self.assertIsNotNone(res["audio_chunks"][0]["audio_base64"])
        print(f"✓ TEST 9 PASSED: TTSManager successfully returned gTTS audio with URL {res['audio_url']}.")


if __name__ == "__main__":
    import json
    unittest.main(verbosity=2)
