import { IncomingForm } from 'formidable';
import fs from 'fs';
import FormData from 'form-data';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  const backendUrl = process.env.LIGHTNING_BACKEND_URL;
  const lightningApiKey = process.env.LIGHTNING_API_KEY;

  if (!backendUrl || !lightningApiKey) {
    return res.status(500).json({
      error: 'Backend proxy is not configured',
    });
  }

  const path = req.query.path;
  const targetPath = Array.isArray(path) ? path.join('/') : path || '';

  const queryString = new URLSearchParams(req.query);
  queryString.delete('path');

  const query = queryString.toString();
  const targetUrl =
    `${backendUrl.replace(/\/$/, '')}/${targetPath}` +
    (query ? `?${query}` : '');

  try {
    // GET/HEAD requests do not need multipart parsing.
    if (req.method === 'GET' || req.method === 'HEAD') {
      const response = await fetch(targetUrl, {
        method: req.method,
        headers: {
          Authorization: `Bearer ${lightningApiKey}`,
        },
      });

      const contentType = response.headers.get('content-type');

      if (contentType) {
        res.setHeader('Content-Type', contentType);
      }

      const body = await response.arrayBuffer();

      return res.status(response.status).send(Buffer.from(body));
    }

    // Multipart handling for image/file uploads.
    const form = new IncomingForm({
      multiples: true,
      keepExtensions: true,
    });

    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve([fields, files]);
      });
    });

    const formData = new FormData();

    for (const [key, value] of Object.entries(fields)) {
      const values = Array.isArray(value) ? value : [value];

      for (const item of values) {
        formData.append(key, item);
      }
    }

    for (const [key, value] of Object.entries(files)) {
      const fileList = Array.isArray(value) ? value : [value];

      for (const file of fileList) {
        formData.append(
          key,
          fs.createReadStream(file.filepath),
          {
            filename: file.originalFilename || 'upload',
            contentType: file.mimetype || 'application/octet-stream',
          }
        );
      }
    }

    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        ...formData.getHeaders(),
        Authorization: `Bearer ${lightningApiKey}`,
      },
      body: formData,
    });

    const contentType = response.headers.get('content-type');

    if (contentType) {
      res.setHeader('Content-Type', contentType);
    }

    const body = await response.arrayBuffer();

    return res.status(response.status).send(Buffer.from(body));
  } catch (error) {
    console.error('Backend proxy error:', error);

    return res.status(500).json({
      error: 'Backend proxy request failed',
    });
  }
}
