/**
 * SmartFarm AI - Canonical Speech Service (Google Cloud Text-to-Speech)
 *
 * Replaces browser SpeechSynthesis with server-side Google Cloud Text-to-Speech:
 * - Direct HTTP POST /api/tts returning audio/mpeg (MP3)
 * - Safe HTMLAudioElement playback (speak, pause, resume, stop, replay)
 * - Zero API keys or secrets exposed in frontend code
 * - Authentic Tamil ('ta-IN' - Wavenet/Standard) and English ('en-IN' - Wavenet/Standard)
 * - Object URL lifecycle management with automatic cleanup
 * - Error resilience: TTS failure never affects AI text response
 */

class SpeechService {
  constructor() {
    this.audio = null;
    this.currentObjectUrl = null;
    this.isPlaying = false;
    this.isPaused = false;
    this.currentCallbacks = null;
    this.lastText = '';
    this.lastLanguage = 'en';
    this.abortController = null;
    this.isLoading = false;
  }

  /**
   * Cleans AI markdown formatting for spoken text clarity.
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
   * Completely stops currently playing or loading audio.
   * Optionally keeps the object URL for Replay.
   */
  stop(revokeUrl = false) {
    if (this.abortController) {
      try {
        this.abortController.abort();
      } catch (e) {}
      this.abortController = null;
    }

    this.isLoading = false;
    this.isPlaying = false;
    this.isPaused = false;

    if (this.audio) {
      try {
        this.audio.pause();
        this.audio.currentTime = 0;
      } catch (e) {
        console.warn('[SpeechService] Stop audio error:', e);
      }
    }

    if (revokeUrl && this.currentObjectUrl) {
      try {
        URL.revokeObjectURL(this.currentObjectUrl);
      } catch (e) {}
      this.currentObjectUrl = null;
      if (this.audio) {
        this.audio.src = '';
      }
      this.lastText = '';
      this.lastLanguage = 'en';
    }

    if (this.currentCallbacks?.onEnd) {
      const cb = this.currentCallbacks.onEnd;
      this.currentCallbacks = null;
      try { cb(); } catch (e) {}
    } else {
      this.currentCallbacks = null;
    }
  }

  /**
   * Clears all audio state, revoking object URL and resetting text.
   * Call when language changes or component unmounts.
   */
  clear() {
    this.stop(true);
  }

  /**
   * Pauses active audio playback.
   */
  pause() {
    if (!this.isPlaying || this.isPaused || !this.audio) return;
    try {
      this.audio.pause();
      this.isPaused = true;
      this.isPlaying = false;
    } catch (e) {
      console.warn('[SpeechService] Pause error:', e);
    }
  }

  /**
   * Resumes paused audio playback.
   */
  resume() {
    if (!this.audio || !this.isPaused) return;
    try {
      const playPromise = this.audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            this.isPlaying = true;
            this.isPaused = false;
          })
          .catch((err) => {
            console.warn('[SpeechService] Resume play error:', err);
          });
      }
    } catch (e) {
      console.warn('[SpeechService] Resume error:', e);
    }
  }

  /**
   * Replays existing audio if available without re-calling Piper TTS.
   */
  replay(options = {}) {
    if (this.audio && this.currentObjectUrl && this.lastText) {
      this.stop(false);
      this.currentCallbacks = options;
      try {
        this.audio.currentTime = 0;
        const playPromise = this.audio.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              this.isPlaying = true;
              this.isPaused = false;
              if (options.onStart) options.onStart();
            })
            .catch((err) => {
              console.warn('[SpeechService] Replay play error:', err);
              if (options.onError) options.onError(err);
            });
        }
        return { success: true, replayed: true };
      } catch (e) {
        console.warn('[SpeechService] Replay error:', e);
      }
    }

    if (!this.lastText) return { success: false, reason: 'no_previous_text' };
    return this.speak(this.lastText, this.lastLanguage, options);
  }

  /**
   * Main Text-to-Speech method:
   * 1. If exact same text and language already loaded, replays without calling /api/tts.
   * 2. Otherwise stops previous audio and revokes previous object URL.
   * 3. Sends POST /api/tts { text, language }.
   * 4. Receives MP3 audio/mpeg.
   * 5. Creates Blob and URL.createObjectURL(blob).
   * 6. Plays via HTMLAudioElement.
   */
  async speak(text, language = 'en', options = {}) {
    const { onStart, onEnd, onError } = options;

    if (!text || typeof text !== 'string' || !text.trim()) {
      if (onEnd) onEnd();
      return { success: false, reason: 'empty_text' };
    }

    const normLang = String(language || 'en').trim().toLowerCase().startsWith('ta') ? 'ta' : 'en';
    const cleanedText = this.cleanTextForSpeech(text, normLang);

    if (!cleanedText) {
      if (onEnd) onEnd();
      return { success: false, reason: 'empty_cleaned_text' };
    }

    // Check if same audio is already loaded -> replay without calling /api/tts
    if (
      this.lastText === cleanedText &&
      this.lastLanguage === normLang &&
      this.audio &&
      this.currentObjectUrl
    ) {
      return this.replay(options);
    }

    // Stop and cleanup previous audio
    this.stop(true);

    this.currentCallbacks = options;
    this.isLoading = true;
    this.abortController = new AbortController();

    const errorMessage =
      normLang === 'ta'
        ? 'தமிழ் குரல் சேவை தற்போது கிடைக்கவில்லை. தயவுசெய்து மீண்டும் முயற்சிக்கவும்.'
        : 'Voice service is currently unavailable. Please try again.';

    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'audio/wav, audio/*;q=0.9, */*;q=0.8'
        },
        body: JSON.stringify({
          text: cleanedText,
          language: normLang
        }),
        signal: this.abortController.signal
      });

      if (!response.ok) {
        throw new Error(`TTS server responded with status: ${response.status}`);
      }

      const contentType = response.headers.get('content-type') || '';
      let blob;

      // Handle direct audio/mpeg or JSON response containing audio_url
      if (contentType.includes('application/json')) {
        const json = await response.json();
        if (json.audio_url) {
          const audioRes = await fetch(json.audio_url, { signal: this.abortController.signal });
          blob = await audioRes.blob();
        } else {
          throw new Error('TTS response did not contain audio data');
        }
      } else {
        blob = await response.blob();
      }

      if (!blob || blob.size < 100) {
        throw new Error('Received empty audio stream from TTS service');
      }

      // Revoke previous URL if any existed
      if (this.currentObjectUrl) {
        try { URL.revokeObjectURL(this.currentObjectUrl); } catch (e) {}
      }

      const audioUrl = URL.createObjectURL(blob);
      this.currentObjectUrl = audioUrl;
      this.lastText = cleanedText;
      this.lastLanguage = normLang;
      this.isLoading = false;

      const audio = new Audio(audioUrl);
      this.audio = audio;

      audio.onplay = () => {
        this.isPlaying = true;
        this.isPaused = false;
        if (this.currentCallbacks?.onStart) {
          this.currentCallbacks.onStart();
        }
      };

      audio.onended = () => {
        this.isPlaying = false;
        this.isPaused = false;
        if (this.currentCallbacks?.onEnd) {
          this.currentCallbacks.onEnd();
        }
      };

      audio.onerror = (e) => {
        console.warn('[SpeechService] HTMLAudioElement playback error:', e);
        this.isPlaying = false;
        this.isPaused = false;
        const err = new Error(errorMessage);
        err.reason = 'audio_playback_error';
        if (this.currentCallbacks?.onError) {
          this.currentCallbacks.onError(err);
        }
      };

      audio.onpause = () => {
        if (!audio.ended && this.isPlaying) {
          this.isPaused = true;
          this.isPlaying = false;
        }
      };

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        await playPromise;
      }

      return { success: true, audioUrl };
    } catch (err) {
      this.isLoading = false;
      this.isPlaying = false;
      this.isPaused = false;

      // Don't report abort as a user error
      if (err.name === 'AbortError') {
        return { success: false, reason: 'aborted' };
      }

      console.warn('[SpeechService] Piper TTS error:', err?.message || err);
      const userErr = new Error(errorMessage);
      userErr.reason = 'tts_service_unavailable';
      userErr.detail = err?.message;

      if (this.currentCallbacks?.onError) {
        this.currentCallbacks.onError(userErr);
      }

      return {
        success: false,
        reason: 'tts_failed',
        message: errorMessage
      };
    }
  }

  /**
   * Diagnostic report on STT support and TTS endpoint without exposing secrets.
   */
  logDiagnostics() {
    if (typeof window === 'undefined') return null;

    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    const hasSTT = Boolean(SpeechRec);

    console.log('=== [SmartFarm AI] Voice Diagnostics ===');
    console.log('SpeechRecognition (STT):', hasSTT ? 'supported' : 'NOT supported');
    console.log('Text-to-Speech (TTS):', 'Piper TTS (Local/Self-Hosted) via POST /api/tts');
    console.log('Tamil Voice (ta):', 'ta_IN-rasa_female-medium (22,050 Hz)');
    console.log('English Voice (en):', 'en_US-lessac-medium (22,050 Hz)');
    console.log('Audio Player:', 'HTMLAudioElement (WAV / audio/wav)');
    console.log('========================================');

    return {
      speechRecognitionSupported: hasSTT,
      ttsEngine: 'Piper TTS (Local/Self-Hosted)',
      ttsEndpoint: '/api/tts',
      tamilVoice: 'ta_IN-rasa_female-medium',
      englishVoice: 'en_US-lessac-medium',
      audioFormat: 'audio/wav (22050 Hz)'
    };
  }
}

export const speechService = new SpeechService();
export const speak = (text, language, options) => speechService.speak(text, language, options);
export const speakText = (text, language, options) => speechService.speak(text, language, options);
export const stopSpeaking = () => speechService.stop(false);
export const pauseSpeaking = () => speechService.pause();
export const resumeSpeaking = () => speechService.resume();
export const replaySpeaking = (options) => speechService.replay(options);
export const logVoiceDiagnostics = () => speechService.logDiagnostics();
export default speechService;
