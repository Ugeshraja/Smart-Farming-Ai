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
   * 2. Configure SpeechSynthesisUtterance for 'ta-IN' or 'en-IN'
   * 3. Attach onstart, onend, onerror handlers
   * 4. Call window.speechSynthesis.speak(utterance)
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

      // Select matching voice if available
      const voices = window.speechSynthesis.getVoices ? window.speechSynthesis.getVoices() : [];
      if (voices && voices.length > 0) {
        const targetPrefix = normLang === 'ta' ? 'ta' : 'en';
        const matchedVoice = voices.find(v => v.lang && v.lang.toLowerCase().startsWith(targetPrefix));
        if (matchedVoice) {
          utterance.voice = matchedVoice;
        }
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
      return { success: true };
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
export default speechService;
