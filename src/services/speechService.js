/**
 * SmartFarm AI - Google TTS (gTTS) Speech Service
 *
 * Exclusively uses Google TTS (gTTS) generated MP3 audio via backend endpoint (/api/voice/tts).
 * - No browser SpeechSynthesis
 * - No Local Indic TTS
 * - No Sarvam TTS
 * - HTML5 Audio() sequential chunk queue (waits for onended before next chunk)
 * - Safe natural text cleaning (preserves Tamil and English phrasing)
 * - Silent error handling: voice failure never affects or removes AI text
 * - Immediate full stop: halts current audio, clears queue, cancels pending playbacks
 */

import { apiService } from './apiService';

class SpeechService {
  constructor() {
    this.currentAudio = null;
    this.audioQueue = [];
    this.currentQueueIndex = 0;
    this.playbackSessionId = 0;
    this.isPlaying = false;
    this.isPaused = false;
    this.currentCallbacks = null;
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
   * Resolves audio_url from backend into a full browser-accessible URL.
   */
  resolveAudioUrl(url) {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
      return url;
    }
    // In dev, Vite proxies /static to http://127.0.0.1:8000
    // In production, resolve against backend origin if VITE_API_BASE_URL is configured
    const cleanPath = url.startsWith('/') ? url : `/${url}`;
    const apiBase = import.meta.env.VITE_API_BASE_URL || '';
    const backendOrigin = apiBase.startsWith('http') ? apiBase.replace(/\/api\/?$/, '') : '';
    return backendOrigin ? `${backendOrigin}${cleanPath}` : cleanPath;
  }

  /**
   * Complete Stop:
   * - Pauses and resets current Audio object
   * - Clears audio queue and session
   * - Prevents subsequent chunks from playing
   * - Resets speaking state
   */
  stop() {
    this.playbackSessionId++; // Invalidate active session
    this.isPlaying = false;
    this.isPaused = false;

    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
        this.currentAudio.src = '';
        this.currentAudio.load();
      } catch (e) {
        // Ignore abort/unload errors
      }
      this.currentAudio = null;
    }

    this.audioQueue = [];
    this.currentQueueIndex = 0;

    if (this.currentCallbacks?.onEnd) {
      const cb = this.currentCallbacks.onEnd;
      this.currentCallbacks = null;
      cb();
    } else {
      this.currentCallbacks = null;
    }
  }

  /**
   * Pause currently playing audio chunk.
   */
  pause() {
    if (!this.isPlaying || this.isPaused) return;

    if (this.currentAudio && !this.currentAudio.paused) {
      try {
        this.currentAudio.pause();
        this.isPaused = true;
      } catch (e) {
        console.warn('[SpeechService] Pause error:', e);
      }
    }
  }

  /**
   * Resume paused audio chunk.
   */
  resume() {
    if (!this.isPlaying || !this.isPaused) return;

    if (this.currentAudio && this.currentAudio.paused) {
      this.currentAudio.play().then(() => {
        this.isPaused = false;
      }).catch((err) => {
        console.warn('[SpeechService] Resume error:', err);
      });
    }
  }

  /**
   * Plays sequential audio chunks returned by Google TTS backend.
   * Chunks play one after another waiting strictly for onended.
   */
  playSequentialQueue(chunks, sessionId, callbacks = {}) {
    if (!chunks || chunks.length === 0) {
      this.isPlaying = false;
      this.isPaused = false;
      if (callbacks.onEnd) callbacks.onEnd();
      return;
    }

    this.audioQueue = chunks;
    this.currentQueueIndex = 0;
    this.isPlaying = true;
    this.isPaused = false;
    this.currentCallbacks = callbacks;

    const playNextChunk = () => {
      // If user stopped or started a new playback session, abort immediately
      if (sessionId !== this.playbackSessionId) return;

      if (this.currentQueueIndex >= this.audioQueue.length) {
        this.isPlaying = false;
        this.isPaused = false;
        this.currentAudio = null;
        if (callbacks.onEnd) callbacks.onEnd();
        return;
      }

      const chunk = this.audioQueue[this.currentQueueIndex];
      const targetUrl = this.resolveAudioUrl(chunk.audio_url);

      if (!targetUrl) {
        this.currentQueueIndex++;
        playNextChunk();
        return;
      }

      const audio = new Audio(targetUrl);
      this.currentAudio = audio;

      audio.onplay = () => {
        if (sessionId !== this.playbackSessionId) {
          try { audio.pause(); } catch (e) { }
          return;
        }
        if (this.currentQueueIndex === 0 && callbacks.onStart) {
          callbacks.onStart();
        }
      };

      audio.onended = () => {
        if (sessionId !== this.playbackSessionId) return;
        this.currentQueueIndex++;
        playNextChunk();
      };

      audio.onerror = (e) => {
        console.warn(`[SpeechService] Audio chunk ${this.currentQueueIndex} playback error:`, e);
        if (sessionId !== this.playbackSessionId) return;
        // Attempt next chunk or finish gracefully
        this.currentQueueIndex++;
        if (this.currentQueueIndex < this.audioQueue.length) {
          playNextChunk();
        } else {
          this.isPlaying = false;
          this.isPaused = false;
          this.currentAudio = null;
          if (callbacks.onError) callbacks.onError(e);
          else if (callbacks.onEnd) callbacks.onEnd();
        }
      };

      audio.play().catch((err) => {
        console.warn('[SpeechService] Audio.play() rejected:', err);
        if (sessionId !== this.playbackSessionId) return;
        this.isPlaying = false;
        this.isPaused = false;
        this.currentAudio = null;
        if (callbacks.onError) callbacks.onError(err);
        else if (callbacks.onEnd) callbacks.onEnd();
      });
    };

    playNextChunk();
  }

  /**
   * Main TTS Entry Point:
   * 1. Clean input text
   * 2. Send text & language to backend Google TTS endpoint (/api/voice/tts)
   * 3. Play generated MP3 audio chunks sequentially via HTML5 Audio()
   * 4. Fails silently on network/gTTS errors without affecting AI text
   */
  async speakText(text, language = 'en', options = {}) {
    const { onStart, onEnd, onError } = options;

    // Reset previous audio
    this.stop();

    if (!text || !text.trim()) {
      if (onEnd) onEnd();
      return { success: false, reason: 'empty_text' };
    }

    const normLang = String(language || 'en').toLowerCase().startsWith('ta') ? 'ta' : 'en';
    const cleanedText = this.cleanTextForSpeech(text, normLang);

    if (!cleanedText) {
      if (onEnd) onEnd();
      return { success: false, reason: 'empty_cleaned_text' };
    }

    const currentSessionId = ++this.playbackSessionId;

    try {
      const res = await apiService.synthesizeSpeech(cleanedText, normLang);

      // Verify session is still valid (user didn't click stop while fetching)
      if (currentSessionId !== this.playbackSessionId) {
        return { success: false, reason: 'aborted' };
      }

      if (res && res.success && res.audio_chunks && res.audio_chunks.length > 0) {
        this.playSequentialQueue(res.audio_chunks, currentSessionId, { onStart, onEnd, onError });
        return { success: true, chunks: res.audio_chunks.length };
      } else if (res && res.success && res.audio_url) {
        this.playSequentialQueue([{ chunk_index: 0, audio_url: res.audio_url }], currentSessionId, { onStart, onEnd, onError });
        return { success: true, chunks: 1 };
      } else {
        // Silent failure: log technical info only to dev console
        console.warn('[SpeechService] gTTS synthesis returned no audio:', res?.reason);
        if (onError) onError(new Error(res?.reason || 'gtts_unavailable'));
        return { success: false, reason: res?.reason || 'no_audio' };
      }
    } catch (err) {
      // Fail silently: log only to console, never break user UI or text
      console.warn('[SpeechService] gTTS network/service error:', err?.message || err);
      if (currentSessionId === this.playbackSessionId) {
        this.isPlaying = false;
        this.isPaused = false;
        if (onError) onError(err);
      }
      return { success: false, reason: 'network_error' };
    }
  }
}

export const speechService = new SpeechService();
export const speakText = (text, language, options) => speechService.speakText(text, language, options);
export const stopSpeaking = () => speechService.stop();
export const pauseSpeaking = () => speechService.pause();
export const resumeSpeaking = () => speechService.resume();
export default speechService;
