/**
 * SmartFarm AI - Canonical Speech Service (Browser SpeechSynthesis)
 *
 * Implements native browser SpeechSynthesis for Tamil ('ta-IN') and English ('en-IN').
 * - Zero external API keys or serverless dependencies
 * - Full controls: Speak, Pause, Resume, Stop, Replay
 * - Safe natural text cleaning (preserves Tamil and English phrasing)
 * - Safe error handling: voice failure never affects or removes AI text
 */

class SpeechService {
  constructor() {
    this.currentUtterance = null;
    this.isPlaying = false;
    this.isPaused = false;
    this.currentCallbacks = null;
    this.lastText = '';
    this.lastLanguage = 'en';
    this.voices = [];
    this.voicesLoaded = false;
    this.initVoices();
  }

  /**
   * Safe asynchronous voice loading for Chrome/Chromium browsers.
   */
  initVoices() {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    const updateVoices = () => {
      try {
        const list = window.speechSynthesis.getVoices();
        if (list && list.length > 0) {
          this.voices = list;
          this.voicesLoaded = true;
        }
      } catch (e) {
        console.warn('[SpeechService] getVoices error:', e);
      }
    };

    updateVoices();

    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }

  /**
   * Returns current list of available voices, refreshing from speechSynthesis if empty.
   */
  getVoices() {
    if (typeof window === 'undefined' || !window.speechSynthesis) return [];
    try {
      const list = window.speechSynthesis.getVoices();
      if (list && list.length > 0) {
        this.voices = list;
        this.voicesLoaded = true;
      }
    } catch (e) {}
    return this.voices;
  }

  /**
   * Finds an authentic Tamil voice (ta-IN or starting with 'ta').
   * Returns null if no Tamil voice is installed.
   */
  getTamilVoice() {
    const voices = this.getVoices();
    if (!voices || voices.length === 0) return null;

    return (
      voices.find(v => v.lang === 'ta-IN') ||
      voices.find(v => v.lang === 'ta_IN') ||
      voices.find(v => v.lang?.toLowerCase().startsWith('ta-')) ||
      voices.find(v => v.lang?.toLowerCase().startsWith('ta_')) ||
      voices.find(v => v.lang?.toLowerCase() === 'ta') ||
      voices.find(v => v.name?.toLowerCase().includes('tamil'))
    ) || null;
  }

  /**
   * Finds an English voice, prioritizing en-IN for Indian farming terminology.
   */
  getEnglishVoice() {
    const voices = this.getVoices();
    if (!voices || voices.length === 0) return null;

    return (
      voices.find(v => v.lang === 'en-IN') ||
      voices.find(v => v.lang === 'en_IN') ||
      voices.find(v => v.lang?.toLowerCase().startsWith('en-in')) ||
      voices.find(v => v.lang?.toLowerCase().startsWith('en-')) ||
      voices.find(v => v.lang?.toLowerCase() === 'en')
    ) || null;
  }

  /**
   * Returns boolean indicating if a Tamil voice is available in the browser.
   */
  hasTamilVoice() {
    return this.getTamilVoice() !== null;
  }

  /**
   * Development-only diagnostic report on STT/TTS support and available voices.
   * NEVER logs API keys, passwords, or secrets.
   */
  logDiagnostics() {
    if (typeof window === 'undefined') return null;

    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    const hasSTT = Boolean(SpeechRec);
    const hasTTS = typeof window.speechSynthesis !== 'undefined';
    const voices = this.getVoices();
    const tamilVoice = this.getTamilVoice();
    const englishVoice = this.getEnglishVoice();

    console.log('=== [SmartFarm AI] Voice Diagnostics ===');
    console.log('SpeechRecognition:', hasSTT ? 'supported' : 'NOT supported');
    console.log('SpeechSynthesis:', hasTTS ? 'supported' : 'NOT supported');
    console.log('Available voices:', voices.length);
    if (tamilVoice) {
      console.log('Tamil voice: available');
      console.log('Selected voice:', tamilVoice.name);
      console.log('Voice language:', tamilVoice.lang);
    } else {
      console.log('Tamil voice: NOT AVAILABLE');
    }
    if (englishVoice) {
      console.log('English voice:', englishVoice.name, `(${englishVoice.lang})`);
    }
    console.log('========================================');

    return {
      speechRecognitionSupported: hasSTT,
      speechSynthesisSupported: hasTTS,
      availableVoicesCount: voices.length,
      tamilVoiceAvailable: Boolean(tamilVoice),
      selectedTamilVoiceName: tamilVoice?.name || null,
      selectedTamilVoiceLang: tamilVoice?.lang || null,
      selectedEnglishVoiceName: englishVoice?.name || null,
      selectedEnglishVoiceLang: englishVoice?.lang || null,
    };
  }

  /**
   * Clean AI markdown and special characters for natural spoken comprehension.
   */
  cleanTextForSpeech(text, language = 'en') {
    if (!text) return '';
    let cleaned = String(text);

    const isTa = language === 'ta' || String(language).toLowerCase().startsWith('ta');
    if (isTa) {
      cleaned = cleaned.replace(/%/g, ' சதவீதம் ');
    } else {
      cleaned = cleaned.replace(/%/g, ' percent ');
    }

    cleaned = cleaned
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/__([^_]+)__/g, '$1')
      .replace(/_([^_]+)_/g, '$1')
      .replace(/^#+\s*/gm, '')
      .replace(/^\s*[-*•]\s+/gm, '')
      .replace(/^\s*\d+\.\s+/gm, '')
      .replace(/[`>]/g, '')
      .replace(/\n{2,}/g, '. ')
      .replace(/\n/g, ', ')
      .replace(/\s{2,}/g, ' ')
      .trim();

    return cleaned;
  }

  /**
   * Complete Stop:
   * Cancels browser speechSynthesis, resets state and callbacks.
   */
  stop() {
    this.isPlaying = false;
    this.isPaused = false;

    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {
        console.warn('[SpeechService] Stop error:', e);
      }
    }

    this.currentUtterance = null;

    if (this.currentCallbacks?.onEnd) {
      const cb = this.currentCallbacks.onEnd;
      this.currentCallbacks = null;
      try { cb(); } catch (e) {}
    } else {
      this.currentCallbacks = null;
    }
  }

  /**
   * Pause currently playing speech.
   */
  pause() {
    if (!this.isPlaying || this.isPaused) return;

    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        window.speechSynthesis.pause();
        this.isPaused = true;
      } catch (e) {
        console.warn('[SpeechService] Pause error:', e);
      }
    }
  }

  /**
   * Resume paused speech.
   */
  resume() {
    if (!this.isPlaying || !this.isPaused) return;

    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        window.speechSynthesis.resume();
        this.isPaused = false;
      } catch (e) {
        console.warn('[SpeechService] Resume error:', e);
      }
    }
  }

  /**
   * Replay last spoken text.
   */
  replay(options = {}) {
    if (!this.lastText) return { success: false, reason: 'no_previous_text' };
    return this.speak(this.lastText, this.lastLanguage, options);
  }

  /**
   * Main TTS Entry Point:
   * 1. Clean input text
   * 2. Find matching voice (strictly checks for Tamil voice when language is 'ta')
   * 3. Configure SpeechSynthesisUtterance
   * 4. Attach onstart, onend, onerror handlers
   * 5. Call window.speechSynthesis.speak(utterance)
   */
  speak(text, language = 'en', options = {}) {
    const { onStart, onEnd, onError } = options;

    // Reset previous audio
    this.stop();

    if (!text || typeof text !== 'string' || !text.trim()) {
      if (onEnd) onEnd();
      return { success: false, reason: 'empty_text' };
    }

    if (typeof window === 'undefined' || !window.speechSynthesis) {
      console.warn('[SpeechService] Browser does not support window.speechSynthesis');
      if (onError) onError(new Error('Browser speech synthesis is not supported.'));
      return { success: false, reason: 'unsupported' };
    }

    const normLang = String(language || 'en').trim().toLowerCase().startsWith('ta') ? 'ta' : 'en';
    const cleanedText = this.cleanTextForSpeech(text, normLang);

    if (!cleanedText) {
      if (onEnd) onEnd();
      return { success: false, reason: 'empty_cleaned_text' };
    }

    // Strict Tamil voice check: Do NOT silently speak Tamil text using an English voice
    let selectedVoice = null;
    if (normLang === 'ta') {
      selectedVoice = this.getTamilVoice();
      if (!selectedVoice) {
        const noVoiceMsg = "தமிழ் குரல் தற்போது இந்த உலாவியில் கிடைக்கவில்லை. Chrome/Windows தமிழ் குரல் அமைப்பை சரிபார்க்கவும்.";
        console.warn('[SpeechService] No Tamil voice available in browser/OS.');
        const err = new Error(noVoiceMsg);
        err.reason = 'no_tamil_voice';
        if (onError) onError(err);
        return {
          success: false,
          reason: 'no_tamil_voice',
          message: noVoiceMsg
        };
      }
    } else {
      selectedVoice = this.getEnglishVoice();
    }

    this.lastText = text;
    this.lastLanguage = normLang;
    this.currentCallbacks = options;

    try {
      // Cancel before starting new speech as specified
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(cleanedText);
      utterance.lang = normLang === 'ta' ? 'ta-IN' : 'en-IN';
      utterance.rate = normLang === 'ta' ? 0.95 : 1.0;
      utterance.pitch = 1.0;

      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }

      utterance.onstart = () => {
        this.isPlaying = true;
        this.isPaused = false;
        if (onStart) onStart();
      };

      utterance.onend = () => {
        this.isPlaying = false;
        this.isPaused = false;
        this.currentUtterance = null;
        if (onEnd) onEnd();
      };

      utterance.onerror = (e) => {
        this.isPlaying = false;
        this.isPaused = false;
        this.currentUtterance = null;
        // Don't treat cancel() as a hard error
        if (e.error !== 'canceled' && e.error !== 'interrupted') {
          console.warn('[SpeechService] SpeechSynthesis error:', e?.error);
          if (onError) onError(e);
        } else if (onEnd) {
          onEnd();
        }
      };

      // Store reference on instance to prevent Chromium garbage collection bug
      this.currentUtterance = utterance;

      window.speechSynthesis.speak(utterance);
      return { success: true, voice: selectedVoice?.name || null };
    } catch (err) {
      console.warn('[SpeechService] speak error:', err);
      this.isPlaying = false;
      this.isPaused = false;
      this.currentUtterance = null;
      if (onError) onError(err);
      return { success: false, reason: 'exception', error: err.message };
    }
  }

  speakText(text, language = 'en', options = {}) {
    return this.speak(text, language, options);
  }
}

export const speechService = new SpeechService();
export const speak = (text, language, options) => speechService.speak(text, language, options);
export const speakText = (text, language, options) => speechService.speak(text, language, options);
export const stopSpeaking = () => speechService.stop();
export const pauseSpeaking = () => speechService.pause();
export const resumeSpeaking = () => speechService.resume();
export const replaySpeaking = (options) => speechService.replay(options);
export const logVoiceDiagnostics = () => speechService.logDiagnostics();
export const getAvailableVoices = () => speechService.getVoices();
export const getTamilVoice = () => speechService.getTamilVoice();
export const hasTamilVoice = () => speechService.hasTamilVoice();
export default speechService;
