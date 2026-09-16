/**
 * SmartFarm AI - Hugging Face ZeroGPU Gradio Prediction Proxy
 * Routes crop disease prediction requests from frontend (/api/backend/api/predict)
 * to the Hugging Face Space Gradio API.
 */

import { uploadLeafImageToSupabase } from './supabaseStorage.js';

const HF_SPACE_URL = process.env.HF_SPACE_URL || 'https://ugeshraja007-smartfarm-ai-backend.hf.space';

export async function handleCropPrediction(req, res, rawBody) {
  try {
    const contentType = req.headers['content-type'] || '';
    if (!contentType.includes('multipart/form-data')) {
      return res.status(400).json({
        success: false,
        status: 'invalid_image',
        valid_image: false,
        message: 'Prediction requires multipart/form-data upload with leaf image.',
      });
    }

    const webReq = new Request('http://localhost', {
      method: 'POST',
      headers: { 'content-type': contentType },
      body: rawBody,
      duplex: 'half',
    });

    const formData = await webReq.formData();
    const imageEntry = formData.get('image') || formData.get('file');
    const cropHint = formData.get('crop') || formData.get('crop_type') || 'Tomato';

    if (!imageEntry || typeof imageEntry === 'string') {
      return res.status(400).json({
        success: false,
        status: 'invalid_image',
        valid_image: false,
        message: 'No image file uploaded. Please upload a clear leaf image.',
      });
    }

    // Normalize crop type to Tomato | Potato | Brinjal
    let cropType = 'Tomato';
    if (typeof cropHint === 'string') {
      const lower = cropHint.toLowerCase().trim();
      if (lower.includes('potato')) cropType = 'Potato';
      else if (lower.includes('brinjal') || lower.includes('eggplant')) cropType = 'Brinjal';
      else cropType = 'Tomato';
    }

    const imageBuffer = Buffer.from(await imageEntry.arrayBuffer());
    const filename = imageEntry.name || 'leaf.jpg';
    const mimeType = imageEntry.type || 'image/jpeg';

    const hfToken = process.env.HF_TOKEN;
    const authHeaders = hfToken ? { Authorization: `Bearer ${hfToken}` } : {};

    // 1. Upload image to Hugging Face Gradio upload endpoint
    const uploadFormData = new FormData();
    uploadFormData.append('files', new Blob([imageBuffer], { type: mimeType }), filename);

    const uploadRes = await fetch(`${HF_SPACE_URL}/gradio_api/upload`, {
      method: 'POST',
      headers: { ...authHeaders },
      body: uploadFormData,
      signal: AbortSignal.timeout(30000),
    });

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      console.error('[HF Proxy] Upload failed:', uploadRes.status, errText);
      return res.status(uploadRes.status || 502).json({
        success: false,
        status: 'connection_error',
        valid_image: false,
        message: `Hugging Face file upload failed with status ${uploadRes.status}.`,
      });
    }

    const uploadJson = await uploadRes.json();
    const filePath = Array.isArray(uploadJson) ? uploadJson[0] : null;
    if (!filePath) {
      return res.status(502).json({
        success: false,
        status: 'connection_error',
        valid_image: false,
        message: 'Hugging Face Space returned invalid file path.',
      });
    }

    // 2. Initiate predict_crop call
    const callRes = await fetch(`${HF_SPACE_URL}/gradio_api/call/predict_crop`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      body: JSON.stringify({
        data: [
          { path: filePath, meta: { _type: 'gradio.FileData' } },
          cropType,
        ],
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!callRes.ok) {
      const errText = await callRes.text();
      console.error('[HF Proxy] Call failed:', callRes.status, errText);
      return res.status(callRes.status || 502).json({
        success: false,
        status: 'connection_error',
        valid_image: false,
        message: `Hugging Face predict_crop call failed with status ${callRes.status}.`,
      });
    }

    const { event_id } = await callRes.json();
    if (!event_id) {
      return res.status(502).json({
        success: false,
        status: 'connection_error',
        valid_image: false,
        message: 'Hugging Face Space did not return an event ID.',
      });
    }

    // 3. Read SSE event stream for ZeroGPU inference completion
    const sseRes = await fetch(`${HF_SPACE_URL}/gradio_api/call/predict_crop/${event_id}`, {
      headers: {
        Accept: 'text/event-stream',
        ...authHeaders,
      },
      signal: AbortSignal.timeout(55000),
    });

    if (!sseRes.ok) {
      const errText = await sseRes.text();
      console.error('[HF Proxy] SSE failed:', sseRes.status, errText);
      return res.status(sseRes.status || 502).json({
        success: false,
        status: 'connection_error',
        valid_image: false,
        message: `Hugging Face event stream failed with status ${sseRes.status}.`,
      });
    }

    const reader = sseRes.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let currentEvent = '';
    let predictionResult = null;
    let errorMessage = null;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        if (trimmed.startsWith('event:')) {
          currentEvent = trimmed.slice(6).trim();
        } else if (trimmed.startsWith('data:')) {
          const rawData = trimmed.slice(5).trim();
          if (currentEvent === 'error') {
            errorMessage = rawData;
          } else {
            try {
              const parsed = JSON.parse(rawData);
              if (Array.isArray(parsed) && parsed.length > 0) {
                predictionResult = parsed[0];
              } else if (parsed && typeof parsed === 'object') {
                predictionResult = parsed;
              }
            } catch {
              // Non-json chunk (e.g. heartbeat)
            }
          }
        }
      }

      if (predictionResult || errorMessage) {
        try {
          await reader.cancel();
        } catch {
          // ignore reader cancel error
        }
        break;
      }
    }

    if (errorMessage) {
      console.error('[HF Proxy] Gradio error event:', errorMessage);
      let parsedError = errorMessage;
      try {
        const errObj = JSON.parse(errorMessage);
        if (errObj.error) parsedError = errObj.error;
      } catch {
        // use raw string
      }

      const lowerErr = parsedError.toLowerCase();
      const isQuota = lowerErr.includes('quota') || lowerErr.includes('rate limit') || lowerErr.includes('exceeded') || lowerErr.includes('zerogpu');
      return res.status(isQuota ? 429 : 502).json({
        success: false,
        status: isQuota ? 'prediction_quota_exceeded' : 'prediction_service_unavailable',
        valid_image: true,
        message: isQuota
          ? 'ZeroGPU inference quota exceeded. Please wait a few moments and try again.'
          : `Hugging Face ZeroGPU inference error: ${parsedError}`,
      });
    }

    if (!predictionResult) {
      return res.status(502).json({
        success: false,
        status: 'prediction_service_unavailable',
        valid_image: true,
        message: 'Hugging Face Space closed event stream without returning prediction result.',
      });
    }

    // Persist leaf image to Supabase Storage if configured
    try {
      const storageUpload = await uploadLeafImageToSupabase(imageBuffer, filename, mimeType);
      if (storageUpload.success && storageUpload.url) {
        predictionResult.image_url = storageUpload.url;
        predictionResult.persistent_image_url = storageUpload.url;
        if (!predictionResult.original_image || typeof predictionResult.original_image !== 'object') {
          predictionResult.original_image = {};
        }
        predictionResult.original_image.image_url = storageUpload.url;
        if (!predictionResult.leaf_crop || typeof predictionResult.leaf_crop !== 'object') {
          predictionResult.leaf_crop = {};
        }
        predictionResult.leaf_crop.image_url = storageUpload.url;
      }
    } catch (storageErr) {
      console.warn('[HF Proxy] Non-blocking Supabase Storage error:', storageErr?.message);
    }

    return res.status(200).json(predictionResult);
  } catch (error) {
    console.error('[HF Proxy] Prediction handler error:', error?.message || error);
    const isTimeout =
      error?.name === 'TimeoutError' ||
      error?.name === 'AbortError' ||
      error?.message?.toLowerCase().includes('timeout');

    return res.status(isTimeout ? 504 : 500).json({
      success: false,
      status: isTimeout ? 'prediction_timeout' : 'prediction_service_unavailable',
      valid_image: true,
      message: isTimeout
        ? 'Hugging Face ZeroGPU inference timed out. Please try again.'
        : `Crop prediction failed: ${error?.message || 'Internal proxy error'}`,
    });
  }
}
