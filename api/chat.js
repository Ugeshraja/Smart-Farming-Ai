export const config = {
  api: {
    bodyParser: false,
  },
};

export const maxDuration = 60;

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Read raw body
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  const rawBody = Buffer.concat(chunks);

  const backendUrl =
    process.env.FASTAPI_BACKEND_URL ||
    process.env.BACKEND_URL ||
    process.env.LIGHTNING_BACKEND_URL;
  const apiKey =
    process.env.FASTAPI_API_KEY ||
    process.env.BACKEND_API_KEY ||
    process.env.LIGHTNING_API_KEY;

  if (!backendUrl) {
    return res.status(500).json({
      error: 'Backend proxy is not configured',
      detail: 'Neither FASTAPI_BACKEND_URL, BACKEND_URL, nor LIGHTNING_BACKEND_URL is set.',
    });
  }

  const base = backendUrl.replace(/\/+$/, '');
  const targetUrl = base.endsWith('/api') ? `${base}/chat` : `${base}/api/chat`;

  try {
    const forwardHeaders = {};
    if (apiKey) {
      forwardHeaders['Authorization'] = `Bearer ${apiKey}`;
    }

    const contentType = req.headers['content-type'] || 'application/json';
    forwardHeaders['Content-Type'] = contentType;

    if (req.headers['accept']) {
      forwardHeaders['Accept'] = req.headers['accept'];
    }

    const fetchOptions = {
      method: 'POST',
      headers: forwardHeaders,
      body: rawBody,
    };

    const response = await fetch(targetUrl, fetchOptions);

    const resContentType = response.headers.get('content-type');
    if (resContentType) {
      res.setHeader('Content-Type', resContentType);
    }

    const body = await response.arrayBuffer();
    return res.status(response.status).send(Buffer.from(body));
  } catch (error) {
    console.error('FastAPI chat proxy error:', error);
    return res.status(500).json({
      error: 'Backend proxy request failed',
      detail: error?.message || 'Request failed',
      target: targetUrl,
    });
  }
}
