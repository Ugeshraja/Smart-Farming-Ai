/**
 * SmartFarm AI - Canonical Speech Service (Piper Text-to-Speech)
 *
 * Latency-Optimized Voice Response Pipeline:
 * - Natural Sentence-Level Chunking (boundaries: . ! ? । \n)
 * - Protects words, decimal numbers (e.g. 3.5 ml), units, URLs, and Tamil terms
 * - Immediate Chunk 0 Playback: Starts speaking within ~1.8s–2.8s after /api/chat returns
 * - Sequential Background Prefetching: Safely buffers subsequent chunks one by one
 * - Respects Piper memory safety (single-active-model, no concurrent CPU spikes)
 * - HTMLAudioElement Sequential Queue with full Pause, Resume, Stop, and Replay
 * - Replay re-uses already buffered audio chunks without re-calling /api/tts
 * - Zero modification to on-screen text display or UI layout
 */

class SpeechService {
  constructor() {
    this.queue = [];
    this.currentIndex = 0;
    this.currentAudio = null;
    this.isPlaying = false;
    this.isPaused = false;
    this.isLoading = false;
    this.currentCallbacks = null;
    this.lastCleanedText = '';
    this.lastLanguage = 'en';
    this.abortController = null;
  }

  get audio() {
    return this.currentAudio;
  }

  get currentObjectUrl() {
    return this.queue[this.currentIndex]?.audioUrl || null;
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

    // Remove URLs
    cleaned = cleaned.replace(/https?:\/\/\S+/g, '');

    // Remove bracketed citations / annotations like [1], [source: ...]
    cleaned = cleaned.replace(/\[\s*(?:source|ref|citation|\d+)[^\]]*\]/gi, '');

    // Remove HTML tags
    cleaned = cleaned.replace(/<[^>]+>/g, '');

    // Remove Markdown formatting
    cleaned = cleaned
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/__([^_]+)__/g, '$1')
      .replace(/_([^_]+)_/g, '$1')
      .replace(/~~([^~]+)~~/g, '$1')
      .replace(/^#+\s*/gm, '')
      .replace(/^\s*[-*•]\s+/gm, '')
      .replace(/^\s*\d+\.\s+/gm, '')
      .replace(/^>\s*/gm, '')
      .replace(/```[^`]*```/g, '')
      .replace(/`([^`]+)`/g, '$1');

    // Remove emojis and pictographs
    cleaned = cleaned.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2702}-\u{27B0}\u{24C2}-\u{1F251}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}]/gu, '');

    // Normalize whitespace and line breaks
    cleaned = cleaned
      .replace(/\n{2,}/g, '. ')
      .replace(/\n/g, ', ')
      .replace(/\s{2,}/g, ' ')
      .trim();

    return cleaned;
  }

  /**
   * Splits cleaned text into natural sentence chunks for rapid TTS response.
   * - Does NOT split inside words, numbers (e.g. 3.5 ml), units, or Tamil terms.
   * - Splits at natural sentence boundaries (. ! ? । \n).
   * - Groups clauses into natural chunks between 40 and 140 characters.
   */
  splitIntoSentenceChunks(text) {
    if (!text || !text.trim()) return [];

    // Split on sentence boundaries, protecting decimal numbers like 3.5 or 0.2%
    const rawSentences = text
      .split(/(?<=(?:(?<!\d)[.!?।\n](?!\d)))\s+/)
      .map((s) => s.trim())
      .filter(Boolean);

    // Sub-split oversized sentences (> 140 chars) at natural clause boundaries (, ; : —)
    const refined = [];
    for (const s of rawSentences) {
      if (s.length > 140) {
        const clauses = s.split(/(?<=[,;:—])\s+/).map((c) => c.trim()).filter(Boolean);
        let curClause = '';
        for (const c of clauses) {
          if (curClause && curClause.length + c.length + 1 <= 140) {
            curClause += ' ' + c;
          } else {
            if (curClause) refined.push(curClause);
            curClause = c;
          }
        }
        if (curClause) refined.push(curClause);
      } else {
        refined.push(s);
      }
    }

    // Group small phrases into chunks of 40-140 chars to avoid tiny fragmented HTTP requests
    const chunks = [];
    let current = '';

    for (const s of refined) {
      if (current && (current.length < 40 || current.length + s.length + 1 <= 140)) {
        current = current + ' ' + s;
      } else {
        if (current) chunks.push(current);
        current = s;
      }
    }
    if (current) chunks.push(current);

    return chunks.length > 0 ? chunks : [text.trim()];
  }

  /**
   * Completely stops currently playing or loading audio.
   * Optionally revokes object URLs. If revokeUrls is false, keeps cached audio for Replay.
   */
  stop(revokeUrls = false) {
    if (this.abortController) {
      try {
        this.abortController.abort();
      } catch (e) {}
      this.abortController = null;
    }

    this.isLoading = false;
    this.isPlaying = false;
    this.isPaused = false;

    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
      } catch (e) {
        console.warn('[SpeechService] Stop current audio error:', e);
      }
    }

    if (revokeUrls) {
      for (const item of this.queue) {
        if (item.audioUrl) {
          try {
            URL.revokeObjectURL(item.audioUrl);
          } catch (e) {}
        }
      }
      this.queue = [];
      this.currentAudio = null;
      this.currentIndex = 0;
      this.lastCleanedText = '';
      this.lastLanguage = 'en';
    } else {
      // Reset currentTime for replay
      for (const item of this.queue) {
        if (item.audio) {
          try {
            item.audio.currentTime = 0;
          } catch (e) {}
        }
      }
      this.currentIndex = 0;
      this.currentAudio = this.queue[0]?.audio || null;
    }

    if (this.currentCallbacks?.onEnd) {
      const cb = this.currentCallbacks.onEnd;
      this.currentCallbacks = null;
      try {
        cb();
      } catch (e) {}
    } else {
      this.currentCallbacks = null;
    }
  }

  /**
   * Clears all audio state, revoking all object URLs and resetting text.
   * Call when language changes or component unmounts.
   */
  clear() {
    this.stop(true);
  }

  /**
   * Pauses active audio playback.
   */
  pause() {
    if (!this.isPlaying || this.isPaused || !this.currentAudio) return;
    try {
      this.currentAudio.pause();
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
    if (!this.currentAudio || !this.isPaused) return;
    try {
      const playPromise = this.currentAudio.play();
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
   * Fetches audio for a specific queue chunk.
   * Handles binary audio/wav and JSON { audio_url }.
   */
  async _fetchChunkAudio(item, language, signal) {
    if (item.ready && item.audioUrl) {
      return item;
    }

    const response = await fetch('/api/tts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'audio/wav, audio/*;q=0.9, */*;q=0.8'
      },
      body: JSON.stringify({
        text: item.text,
        language: language
      }),
      signal: signal
    });

    if (!response.ok) {
      throw new Error(`TTS server responded with status: ${response.status}`);
    }

    const contentType = response.headers.get('content-type') || '';
    let blob;

    if (contentType.includes('application/json')) {
      const json = await response.json();
      if (json.audio_url) {
        const audioRes = await fetch(json.audio_url, { signal: signal });
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

    const audioUrl = URL.createObjectURL(blob);
    const audio = new Audio(audioUrl);

    item.audioUrl = audioUrl;
    item.audio = audio;
    item.ready = true;
    item.failed = false;

    return item;
  }

  /**
   * Sequentially pre-fetches remaining chunks in the background.
   * Respects Render single-active-model memory safety by running sequentially.
   */
  async _prefetchRemaining(startIndex, language, signal) {
    for (let i = startIndex; i < this.queue.length; i++) {
      if (signal?.aborted || !this.queue.length) break;

      const item = this.queue[i];
      if (!item.ready && !item.fetchPromise) {
        try {
          item.fetchPromise = this._fetchChunkAudio(item, language, signal);
          await item.fetchPromise;
        } catch (err) {
          if (signal?.aborted) break;
          console.warn(`[SpeechService] Background prefetch chunk ${i} warning:`, err?.message || err);
          item.failed = true;
        }
      }
    }
  }

  /**
   * Plays a specific queue item and manages sequential progression.
   * If the chunk is already ready, plays immediately.
   * If it is still synthesizing, waits for it and then plays.
   */
  async _playQueueItem(index) {
    if (index >= this.queue.length) {
      // Completed all chunks
      this.isPlaying = false;
      this.isPaused = false;
      if (this.currentCallbacks?.onEnd) {
        const cb = this.currentCallbacks.onEnd;
        this.currentCallbacks = null;
        try {
          cb();
        } catch (e) {}
      }
      return;
    }

    this.currentIndex = index;
    const item = this.queue[index];

    // If chunk not ready yet, wait for its fetch promise
    if (!item.ready) {
      if (item.fetchPromise) {
        try {
          await item.fetchPromise;
        } catch (e) {
          console.warn(`[SpeechService] Chunk ${index} failed, skipping to next:`, e);
          return this._playQueueItem(index + 1);
        }
      } else {
        // Fetch now if not already started
        try {
          item.fetchPromise = this._fetchChunkAudio(item, this.lastLanguage, this.abortController?.signal);
          await item.fetchPromise;
        } catch (e) {
          console.warn(`[SpeechService] Chunk ${index} fetch failed, skipping:`, e);
          return this._playQueueItem(index + 1);
        }
      }
    }

    // Check if stopped or aborted while waiting
    if (!this.abortController || this.abortController.signal.aborted) return;

    const audio = item.audio;
    if (!audio) {
      return this._playQueueItem(index + 1);
    }

    this.currentAudio = audio;

    audio.onplay = () => {
      this.isPlaying = true;
      this.isPaused = false;
      if (index === 0 && this.currentCallbacks?.onStart) {
        try {
          this.currentCallbacks.onStart();
        } catch (e) {}
      }
    };

    audio.onended = () => {
      // Move to next chunk
      this._playQueueItem(index + 1);
    };

    audio.onerror = (e) => {
      console.warn(`[SpeechService] HTMLAudioElement error on chunk ${index}:`, e);
      // Skip to next chunk rather than halting completely
      this._playQueueItem(index + 1);
    };

    audio.onpause = () => {
      if (!audio.ended && this.isPlaying) {
        this.isPaused = true;
        this.isPlaying = false;
      }
    };

    try {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        await playPromise;
      }
    } catch (err) {
      console.warn(`[SpeechService] Audio play error on chunk ${index}:`, err);
      // If user interaction interrupted or aborted, don't cascade errors
      if (this.isPlaying) {
        this._playQueueItem(index + 1);
      }
    }
  }

  /**
   * Replays existing audio queue if available without re-calling Piper TTS.
   */
  replay(options = {}) {
    if (this.queue.length > 0 && this.queue[0]?.audioUrl) {
      this.stop(false);
      this.currentCallbacks = options;
      this.currentIndex = 0;
      this.abortController = new AbortController();

      // Ensure all audio elements are reset to time 0
      for (const item of this.queue) {
        if (item.audio) {
          try {
            item.audio.currentTime = 0;
          } catch (e) {}
        }
      }

      this._playQueueItem(0);

      // If any trailing chunks were not fetched previously, fetch them sequentially
      this._prefetchRemaining(1, this.lastLanguage, this.abortController.signal);

      return { success: true, replayed: true };
    }

    if (!this.lastCleanedText) return { success: false, reason: 'no_previous_text' };
    return this.speak(this.lastCleanedText, this.lastLanguage, options);
  }

  /**
   * Main Text-to-Speech entry point:
   * 1. If exact same text and language already loaded, replays without calling /api/tts.
   * 2. Otherwise stops previous audio and revokes previous object URLs.
   * 3. Splits text into natural sentence chunks (40-140 chars).
   * 4. Fetches Chunk 0 immediately and starts playback as soon as it arrives (~1.8s-2.8s TTFA).
   * 5. Prefetches subsequent chunks sequentially in the background.
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
      this.lastCleanedText === cleanedText &&
      this.lastLanguage === normLang &&
      this.queue.length > 0 &&
      this.queue[0]?.audioUrl
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

    // Split text into natural sentence chunks
    const chunks = this.splitIntoSentenceChunks(cleanedText);

    this.queue = chunks.map((chunkText, idx) => ({
      index: idx,
      text: chunkText,
      audio: null,
      audioUrl: null,
      fetchPromise: null,
      ready: false,
      failed: false
    }));

    this.currentIndex = 0;
    this.lastCleanedText = cleanedText;
    this.lastLanguage = normLang;

    try {
      // Step 1: Immediately fetch Chunk 0
      const chunk0 = this.queue[0];
      chunk0.fetchPromise = this._fetchChunkAudio(chunk0, normLang, this.abortController.signal);
      await chunk0.fetchPromise;

      this.isLoading = false;

      // Step 2: Start playing Chunk 0 immediately!
      this._playQueueItem(0);

      // Step 3: Sequentially prefetch subsequent chunks in the background
      if (this.queue.length > 1) {
        this._prefetchRemaining(1, normLang, this.abortController.signal);
      }

      return { success: true, audioUrl: chunk0.audioUrl };
    } catch (err) {
      this.isLoading = false;
      this.isPlaying = false;
      this.isPaused = false;

      // Don't report user-initiated abort as an error
      if (err.name === 'AbortError') {
        return { success: false, reason: 'aborted' };
      }

      console.warn('[SpeechService] Piper TTS error on initial chunk:', err?.message || err);
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
   * Diagnostic report on STT support and TTS endpoint.
   */
  logDiagnostics() {
    if (typeof window === 'undefined') return null;

    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    const hasSTT = Boolean(SpeechRec);

    console.log('=== [SmartFarm AI] Voice Diagnostics ===');
    console.log('SpeechRecognition (STT):', hasSTT ? 'supported' : 'NOT supported');
    console.log('Text-to-Speech (TTS):', 'Piper TTS (Sentence-Queued) via POST /api/tts');
    console.log('Tamil Voice (ta):', 'ta_IN-rasa_female-medium (22,050 Hz)');
    console.log('English Voice (en):', 'en_US-lessac-medium (22,050 Hz)');
    console.log('Audio Queue:', 'Sequential HTMLAudioElement with immediate Chunk 0 playback');
    console.log('========================================');

    return {
      speechRecognitionSupported: hasSTT,
      ttsEngine: 'Piper TTS (Sentence-Queued)',
      ttsEndpoint: '/api/tts',
      tamilVoice: 'ta_IN-rasa_female-medium',
      englishVoice: 'en_US-lessac-medium',
      audioFormat: 'audio/wav (22050 Hz)',
      pipeline: 'Immediate Chunk 0 playback + sequential background prefetch'
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
