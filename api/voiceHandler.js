/**
 * SmartFarm AI - Serverless Google TTS (gTTS) Handler
 *
 * Implements Google Translate TTS HTTP request mechanism for Node.js serverless environment.
 * - Zero GPU consumption (completely independent from Hugging Face ZeroGPU)
 * - Zero external API keys or credentials needed
 * - Free, reliable Google TTS for English ('en') and Tamil ('ta')
 * - Natural sentence chunking (prevents Google TTS length limit errors)
 * - Outputs standard base64 MP3 Data URLs for sequential HTML5 Audio playback
 */

/**
 * Normalizes language codes safely to 'en' or 'ta'.
 */
export function normalizeLanguage(lang) {
  if (!lang) return 'en';
  const str = String(lang).trim().toLowerCase();
  if (str.startsWith('ta') || str.includes('tamil') || str.includes('தமிழ்')) {
    return 'ta';
  }
  return 'en';
}

/**
 * Natural text chunking around target size of ~160 characters.
 * Google TTS endpoint limits query length to <200 chars.
 * Prioritizes natural sentence and clause boundaries without splitting words.
 */
export function splitTextIntoNaturalChunks(text, maxChars = 160) {
  if (!text || typeof text !== 'string') return [];
  const cleaned = text.replace(/\r\n/g, '\n').trim();
  if (!cleaned) return [];
  if (cleaned.length <= maxChars) return [cleaned];

  const chunks = [];
  // 1. Split by paragraphs and sentence terminators (. ! ? । \n)
  const sentencePattern = /([.!?।\n]+)/;
  const rawParts = cleaned.split(sentencePattern);

  let current = '';
  for (let i = 0; i < rawParts.length; i += 2) {
    const textPart = rawParts[i] || '';
    const punctPart = rawParts[i + 1] || '';
    const part = (textPart + punctPart).trim();
    if (!part) continue;

    if (part.length <= maxChars) {
      if (!current) {
        current = part;
      } else if (current.length + 1 + part.length <= maxChars) {
        current = current + ' ' + part;
      } else {
        chunks.push(current);
        current = part;
      }
    } else {
      // 2. Clause level split (, ; : -)
      const subParts = part.split(/([,;:\-]+)/);
      for (let j = 0; j < subParts.length; j += 2) {
        const subText = subParts[j] || '';
        const subPunct = subParts[j + 1] || '';
        const sub = (subText + subPunct).trim();
        if (!sub) continue;

        if (sub.length <= maxChars) {
          if (!current) {
            current = sub;
          } else if (current.length + 1 + sub.length <= maxChars) {
            current = current + ' ' + sub;
          } else {
            chunks.push(current);
            current = sub;
          }
        } else {
          // 3. Word level split (never split words)
          const words = sub.split(/\s+/);
          for (const word of words) {
            if (!word) continue;
            if (!current) {
              current = word;
            } else if (current.length + 1 + word.length <= maxChars) {
              current = current + ' ' + word;
            } else {
              chunks.push(current);
              current = word;
            }
          }
        }
      }
    }
  }

  if (current) {
    chunks.push(current);
  }

  return chunks.filter(c => c && c.trim().length > 0);
}

/**
 * Fetches Google TTS MP3 audio for a single short chunk (< 180 chars).
 */
async function fetchGoogleTtsChunk(chunkText, lang) {
  const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(chunkText)}&tl=${lang}&client=tw-ob`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Referer': 'https://translate.google.com/',
      'Accept': 'audio/mpeg, audio/*;q=0.9, */*;q=0.8'
    },
    // 10s timeout
    signal: AbortSignal.timeout ? AbortSignal.timeout(10000) : undefined
  });

  if (!response.ok) {
    throw new Error(`Google TTS request failed with status: ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Main handler for Voice / TTS requests.
 * Used directly by api/backend.js proxy, Vercel serverless functions, and Vite dev middleware.
 */
export async function handleVoiceRequest(req, res, rawBody = null, routePath = '') {
  // Helpers to support both Vercel/Express response and Node.js raw http.ServerResponse
  const sendJson = (statusCode, data) => {
    res.setHeader('Content-Type', 'application/json');
    if (typeof res.status === 'function' && typeof res.json === 'function') {
      return res.status(statusCode).json(data);
    }
    res.statusCode = statusCode;
    return res.end(JSON.stringify(data));
  };

  const sendBuffer = (statusCode, contentType, buf) => {
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', String(buf.length));
    if (typeof res.status === 'function' && typeof res.send === 'function') {
      return res.status(statusCode).send(buf);
    }
    res.statusCode = statusCode;
    return res.end(buf);
  };

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    if (typeof res.status === 'function') return res.status(200).end();
    res.statusCode = 200;
    return res.end();
  }

  const cleanPath = String(routePath || req.query?.path || '').replace(/^\/+/, '');

  // 1. Health / Voice Status Endpoint
  if (req.method === 'GET' || cleanPath.endsWith('/status') || cleanPath === 'status') {
    return sendJson(200, {
      status: 'online',
      tts_engine: 'Google TTS (gTTS)',
      providers: {
        gtts: true
      }
    });
  }

  if (req.method !== 'POST') {
    return sendJson(405, { error: 'Method not allowed' });
  }

  // 2. Parse request payload
  let payload = {};
  try {
    if (req.body && typeof req.body === 'object') {
      payload = req.body;
    } else if (rawBody && rawBody.length > 0) {
      payload = JSON.parse(rawBody.toString('utf-8'));
    } else if (typeof req.body === 'string' && req.body.trim()) {
      payload = JSON.parse(req.body);
    }
  } catch (err) {
    return sendJson(400, {
      success: false,
      error: 'Invalid JSON payload'
    });
  }

  const text = payload.text || payload.transcript || '';
  const language = normalizeLanguage(payload.language || payload.lang || req.query?.language || 'en');

  // 3. Graceful handling of empty or whitespace text
  if (!text || typeof text !== 'string' || !text.trim()) {
    return sendJson(200, {
      success: false,
      reason: 'empty_text',
      language,
      audio_url: null,
      audio_chunks: [],
      total_chunks: 0
    });
  }

  // 4. Split text into natural chunks below Google TTS length limit
  const chunks = splitTextIntoNaturalChunks(text, 160);
  if (!chunks || chunks.length === 0) {
    return sendJson(200, {
      success: false,
      reason: 'empty_chunks',
      language,
      audio_url: null,
      audio_chunks: [],
      total_chunks: 0
    });
  }

  try {
    // 5. Synthesize chunks via Google TTS HTTP mechanism
    const audioBuffers = await Promise.all(
      chunks.map(chunk => fetchGoogleTtsChunk(chunk, language))
    );

    // If direct audio requested via format query parameter or Accept header
    const format = req.query?.format || '';
    const accept = req.headers?.['accept'] || '';
    if (format === 'audio' || (accept.includes('audio/') && !accept.includes('application/json'))) {
      const combined = Buffer.concat(audioBuffers);
      return sendBuffer(200, 'audio/mpeg', combined);
    }

    // Convert buffers to standard base64 Data URLs for HTML5 Audio playback
    const audioChunks = audioBuffers.map((buf, idx) => ({
      chunk_index: idx,
      audio_url: `data:audio/mp3;base64,${buf.toString('base64')}`,
      text: chunks[idx]
    }));

    return sendJson(200, {
      success: true,
      language,
      audio_url: audioChunks[0]?.audio_url || null,
      audio_chunks: audioChunks,
      total_chunks: audioChunks.length
    });
  } catch (err) {
    console.error('[VoiceHandler] Google TTS synthesis error:', err?.message || err);
    return sendJson(500, {
      success: false,
      reason: 'tts_generation_failed',
      detail: 'Unable to synthesize audio stream.',
      language
    });
  }
}

export default async function handler(req, res) {
  return handleVoiceRequest(req, res);
}
