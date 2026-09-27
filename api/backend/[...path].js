import { handleCropPrediction } from '../hfGradioPredict.js';
import { handleGeminiChat } from '../geminiChat.js';
import { handleWeatherRequest } from '../weatherHandler.js';
import { handleVoiceRequest } from '../voiceHandler.js';

export const config = {
  api: {
    bodyParser: false,
  },
};

export const maxDuration = 60;

export default async function handler(req, res) {
  const path = req.query.path;
  const targetPath = Array.isArray(path) ? path.join('/') : path || '';
  const cleanPath = targetPath.replace(/^\/+/, '');

  let rawBody = null;
  // GET and HEAD requests cannot include a body
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    rawBody = Buffer.concat(chunks);
  }

  // 1. Route crop prediction requests to Hugging Face ZeroGPU Space
  const normalizedPath = cleanPath.replace(/\/+$/, '');
  const isPredict =
    req.method === 'POST' &&
    (normalizedPath === 'api/predict' || normalizedPath === 'predict');

  if (isPredict) {
    return handleCropPrediction(req, res, rawBody);
  }

  // 2. Route Weather requests to serverless OpenWeather handler
  const isWeather =
    cleanPath.startsWith('api/weather') ||
    cleanPath.startsWith('weather');

  if (isWeather) {
    const subPath = cleanPath.replace(/^api\/weather\/?/, '').replace(/^weather\/?/, '');
    return handleWeatherRequest(req, res, subPath);
  }

  // 3. Route Voice Assistant interaction and Status requests to serverless handler
  const isVoice =
    cleanPath === 'api/voice' ||
    cleanPath === 'voice' ||
    cleanPath === 'api/voice/' ||
    cleanPath === 'voice/' ||
    cleanPath.startsWith('api/voice/') ||
    cleanPath.startsWith('voice/');

  if (isVoice) {
    return handleVoiceRequest(req, res, rawBody, cleanPath);
  }

  // 4. Forward all other requests (including /api/chat and /api/tts) directly to production FastAPI backend
  const backendUrl = process.env.FASTAPI_BACKEND_URL || process.env.BACKEND_URL || process.env.LIGHTNING_BACKEND_URL;
  const lightningApiKey = process.env.FASTAPI_API_KEY || process.env.BACKEND_API_KEY || process.env.LIGHTNING_API_KEY;

  const isTtsRoute =
    cleanPath === 'api/tts' ||
    cleanPath === 'tts' ||
    cleanPath === 'api/tts/' ||
    cleanPath === 'tts/' ||
    cleanPath.startsWith('api/tts/') ||
    cleanPath.startsWith('tts/');

  if (!backendUrl) {
    if (isTtsRoute) {
      console.warn('[Proxy] Backend URL not configured, falling back to serverless voice handler for TTS.');
      return handleVoiceRequest(req, res, rawBody, cleanPath);
    }
    return res.status(500).json({
      error: 'Backend proxy is not configured',
    });
  }

  const queryString = new URLSearchParams(req.query);
  queryString.delete('path');

  const query = queryString.toString();
  const base = backendUrl.replace(/\/+$/, '');

  // Normalize path so /api/chat, /api/tts route correctly to ${base}/api/...
  let forwardPath = cleanPath;
  if (!forwardPath.startsWith('api/') && !base.endsWith('/api')) {
    forwardPath = `api/${forwardPath}`;
  } else if (forwardPath.startsWith('api/') && base.endsWith('/api')) {
    forwardPath = forwardPath.replace(/^api\//, '');
  }

  const targetUrl =
    (forwardPath ? `${base}/${forwardPath}` : base) +
    (query ? `?${query}` : '');

  try {
    const forwardHeaders = {};
    if (req.headers['authorization']) {
      forwardHeaders['Authorization'] = req.headers['authorization'];
    } else if (lightningApiKey) {
      forwardHeaders['Authorization'] = `Bearer ${lightningApiKey}`;
    }

    const contentType = req.headers['content-type'];
    if (contentType) {
      forwardHeaders['Content-Type'] = contentType;
    }

    if (req.headers['accept']) {
      forwardHeaders['Accept'] = req.headers['accept'];
    }

    const fetchOptions = {
      method: req.method,
      headers: forwardHeaders,
    };

    if (rawBody && rawBody.length > 0) {
      fetchOptions.body = rawBody;
      forwardHeaders['Content-Length'] = String(rawBody.length);
    }

    const response = await fetch(targetUrl, fetchOptions);

    // If FastAPI backend returned an error for TTS, fallback to serverless voice handler
    if (!response.ok && isTtsRoute) {
      console.warn(`[Proxy] FastAPI /api/tts returned status ${response.status}. Falling back to serverless voice handler.`);
      return handleVoiceRequest(req, res, rawBody, cleanPath);
    }

    for (const [key, val] of response.headers.entries()) {
      const lower = key.toLowerCase();
      if (lower.startsWith('x-tts-') || lower === 'content-type' || lower === 'content-length') {
        res.setHeader(key, val);
      }
    }

    const body = await response.arrayBuffer();
    return res.status(response.status).send(Buffer.from(body));
  } catch (error) {
    console.error('Backend proxy error:', error?.message || 'Request failed');
    if (isTtsRoute) {
      console.warn('[Proxy] Render backend unreachable for TTS. Falling back to serverless voice handler.');
      return handleVoiceRequest(req, res, rawBody, cleanPath);
    }
    return res.status(500).json({
      error: 'Backend proxy request failed',
      detail: error?.message || 'Request failed',
      target: targetUrl,
    });
  }
}
