import { handleCropPrediction } from '../hfGradioPredict.js';
import { handleGeminiChat } from '../geminiChat.js';
import { handleWeatherRequest } from '../weatherHandler.js';

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

  // 1. Route POST prediction requests to Hugging Face ZeroGPU Space
  const isPredict =
    req.method === 'POST' &&
    (cleanPath === 'api/predict' || cleanPath === 'predict');

  if (isPredict) {
    return handleCropPrediction(req, res, rawBody);
  }

  // 2. Route AI Farmer Assistant requests to serverless Gemini API
  const isChat =
    cleanPath === 'api/chat' ||
    cleanPath === 'chat' ||
    cleanPath === 'api/chat/status' ||
    cleanPath === 'chat/status';

  if (isChat) {
    return handleGeminiChat(req, res, rawBody);
  }

  // 3. Route Weather requests to serverless OpenWeather handler
  const isWeather =
    cleanPath.startsWith('api/weather') ||
    cleanPath.startsWith('weather');

  if (isWeather) {
    const subPath = cleanPath.replace(/^api\/weather\/?/, '').replace(/^weather\/?/, '');
    return handleWeatherRequest(req, res, subPath);
  }

  // Preserve existing Lightning proxy fallback for non-prediction endpoints
  const backendUrl = process.env.LIGHTNING_BACKEND_URL;
  const lightningApiKey = process.env.LIGHTNING_API_KEY;

  if (!backendUrl || !lightningApiKey) {
    return res.status(500).json({
      error: 'Backend proxy is not configured',
    });
  }

  const queryString = new URLSearchParams(req.query);
  queryString.delete('path');

  const query = queryString.toString();
  const base = backendUrl.replace(/\/+$/, '');
  const targetUrl =
    (cleanPath ? `${base}/${cleanPath}` : base) +
    (query ? `?${query}` : '');

  try {
    const forwardHeaders = {
      Authorization: `Bearer ${lightningApiKey}`,
    };

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

    const resContentType = response.headers.get('content-type');
    if (resContentType) {
      res.setHeader('Content-Type', resContentType);
    }

    const body = await response.arrayBuffer();
    return res.status(response.status).send(Buffer.from(body));
  } catch (error) {
    console.error('Backend proxy error:', error?.message || 'Request failed');
    return res.status(500).json({
      error: 'Backend proxy request failed',
    });
  }
}
