/**
 * SmartFarm AI - Direct Hugging Face ZeroGPU Gradio Prediction Service
 * 
 * Bypasses serverless proxy timeout limitations (such as Vercel Hobby 10s-15s cap)
 * by establishing a direct streaming client-to-Space connection.
 * ZeroGPU inference pipeline (YOLO11 -> SAM ViT-B -> ResNet-50 -> LIME -> RAG -> Gemini)
 * typically takes ~20-25 seconds, which exceeds standard serverless function limits.
 */

const HF_SPACE_URL = (typeof import.meta !== 'undefined' && import.meta?.env?.VITE_HF_SPACE_URL) ||
  (typeof process !== 'undefined' && process?.env?.VITE_HF_SPACE_URL) ||
  'https://ugeshraja007-smartfarm-ai-backend.hf.space';

/**
 * Executes crop disease prediction directly against the Hugging Face Gradio API.
 * 
 * @param {FormData} formData - FormData containing 'image' (File/Blob) and optional 'crop' ('Tomato' | 'Potato' | 'Brinjal')
 * @returns {Promise<Object>} Formatted prediction result dictionary from deep learning pipeline
 */
export async function predictViaDirectHfSpace(formData) {
  const imageEntry = formData.get('image') || formData.get('file');
  const cropHint = formData.get('crop') || formData.get('crop_type') || 'Tomato';

  if (!imageEntry) {
    throw new Error('No crop image uploaded. Please upload a clear leaf image.');
  }

  // Normalize crop type to Tomato | Potato | Brinjal
  let cropType = 'Tomato';
  if (typeof cropHint === 'string') {
    const lower = cropHint.toLowerCase().trim();
    if (lower.includes('potato')) cropType = 'Potato';
    else if (lower.includes('brinjal') || lower.includes('eggplant')) cropType = 'Brinjal';
    else cropType = 'Tomato';
  }

  const filename = imageEntry.name || 'leaf.jpg';
  const cleanSpaceUrl = HF_SPACE_URL.replace(/\/+$/, '');

  // 1. Upload leaf image to Hugging Face Space Gradio upload endpoint
  console.info(`[HF Direct] Uploading leaf image (${filename}) to Hugging Face ZeroGPU Space...`);
  const uploadFormData = new FormData();
  uploadFormData.append('files', imageEntry, filename);

  const uploadRes = await fetch(`${cleanSpaceUrl}/gradio_api/upload`, {
    method: 'POST',
    body: uploadFormData,
    signal: AbortSignal.timeout(45000), // 45s upload timeout
  });

  if (!uploadRes.ok) {
    const errText = await uploadRes.text();
    console.error('[HF Direct] File upload failed:', uploadRes.status, errText);
    const err = new Error(`Hugging Face Space upload failed with HTTP ${uploadRes.status}.`);
    err.status = uploadRes.status;
    throw err;
  }

  const uploadJson = await uploadRes.json();
  const filePath = Array.isArray(uploadJson) ? uploadJson[0] : null;
  if (!filePath) {
    throw new Error('Hugging Face Space returned an invalid upload file path.');
  }

  // 2. Initiate predict_crop job call
  console.info(`[HF Direct] Initiating predict_crop job for ${cropType}...`);
  const callRes = await fetch(`${cleanSpaceUrl}/gradio_api/call/predict_crop`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      data: [
        { path: filePath, meta: { _type: 'gradio.FileData' } },
        cropType,
      ],
    }),
    signal: AbortSignal.timeout(45000),
  });

  if (!callRes.ok) {
    const errText = await callRes.text();
    console.error('[HF Direct] predict_crop call initiation failed:', callRes.status, errText);
    const err = new Error(`Hugging Face predict_crop call failed with HTTP ${callRes.status}.`);
    err.status = callRes.status;
    throw err;
  }

  const { event_id } = await callRes.json();
  if (!event_id) {
    throw new Error('Hugging Face Space did not return a valid job event ID.');
  }

  // 3. Listen to SSE event stream until ZeroGPU inference completes
  console.info(`[HF Direct] Listening to ZeroGPU inference stream for event ID: ${event_id}...`);
  const sseRes = await fetch(`${cleanSpaceUrl}/gradio_api/call/predict_crop/${event_id}`, {
    headers: {
      Accept: 'text/event-stream',
    },
    signal: AbortSignal.timeout(90000), // 90s max for full pipeline + LIME explainability
  });

  if (!sseRes.ok) {
    const errText = await sseRes.text();
    console.error('[HF Direct] SSE stream connection failed:', sseRes.status, errText);
    const err = new Error(`Hugging Face event stream failed with HTTP ${sseRes.status}.`);
    err.status = sseRes.status;
    throw err;
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
            // Non-JSON heartbeat/progress frames are skipped
          }
        }
      }
    }

    if (predictionResult || errorMessage) {
      try {
        await reader.cancel();
      } catch {
        // Safe ignore
      }
      break;
    }
  }

  if (errorMessage) {
    console.error('[HF Direct] Gradio stream returned error:', errorMessage);
    let parsedError = errorMessage;
    try {
      const errObj = JSON.parse(errorMessage);
      if (errObj.error) parsedError = errObj.error;
    } catch {
      // Use raw string
    }

    const lowerErr = String(parsedError).toLowerCase();
    const isQuota = lowerErr.includes('quota') || lowerErr.includes('rate limit') || lowerErr.includes('exceeded') || lowerErr.includes('zerogpu');
    const err = new Error(isQuota
      ? 'ZeroGPU inference quota exceeded. Please wait a few moments and try again.'
      : `ZeroGPU inference error: ${parsedError}`);
    err.status = isQuota ? 429 : 502;
    err.isQuota = isQuota;
    throw err;
  }

  if (!predictionResult) {
    throw new Error('Hugging Face ZeroGPU stream closed without returning prediction results.');
  }

  console.info('[HF Direct] Inference completed successfully:', {
    crop: predictionResult.crop,
    disease: predictionResult.disease,
    confidence: predictionResult.confidence,
    status: predictionResult.status,
  });

  return predictionResult;
}
