import axios from 'axios';
import {
  mockPredictions,
  mockLatestSensors,
  mockSensorHistory,
  mockRecentSensorActivity,
  generateLeafSvg,
  mockAiInsights,
  mockCommunityPosts,
  mockLibraryCategories,
  mockLibraryArticles,
  mockCropPlanningConfigs,
  mockFarmPlan,
  mockCropTimelineStages,
  mockFarmActivities,
  mockMonthlyCalendarEvents
} from './mockData';
import { fetchOpenWeatherData, geocodeLocation } from './weatherService';
import { VERIFIED_GOVERNMENT_SCHEMES, evaluateSchemeEligibility as evalRules } from './schemesData';
import { evaluateFieldSuitability } from './fieldEvaluator';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/backend/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 8000,
});

// Auto-attach JWT auth token if stored and handle FormData Content-Type
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('smartfarm_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // When sending FormData, delete Content-Type so browser sets multipart/form-data with boundary
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
    if (config.headers.common) {
      delete config.headers.common['Content-Type'];
    }
  }
  return config;
}, (error) => Promise.reject(error));

/**
 * Resolves relative static media paths (e.g. /static/predictions/...)
 * against the origin of VITE_API_BASE_URL.
 * - If url is null/undefined/empty, returns it unchanged.
 * - If url is already an absolute http:// or https:// URL, returns it unchanged.
 * - If url begins with "/", resolves it against the origin of VITE_API_BASE_URL.
 * - Does NOT append /api to static media URLs.
 */
export function resolveBackendMediaUrl(url) {
  if (!url) return url;
  if (typeof url !== 'string') return url;
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:') || url.startsWith('blob:')) {
    return url;
  }
  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  const apiBase = import.meta.env.VITE_API_BASE_URL || '/api/backend/api';
  try {
    const parsed = new URL(apiBase);
    return `${parsed.origin}${cleanPath}`;
  } catch (e) {
    const origin = apiBase.replace(/\/api\/?$/, '');
    return origin ? `${origin}${cleanPath}` : cleanPath;
  }
}

/**
 * Validates whether an image URL is a usable, non-broken URL.
 * Rejects localhost, 127.0.0.1, 0.0.0.0, internal IPs, /tmp/, file://, /static/, and /api/backend/static/.
 * Accepts valid HTTPS/HTTP (non-local) and data:image/ URLs.
 */
export function isValidImageUrl(url) {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed || trimmed === 'null' || trimmed === 'undefined') return false;

  // Reject loopback, localhost, and local IPs
  if (
    trimmed.includes('localhost') ||
    trimmed.includes('127.0.0.1') ||
    trimmed.includes('0.0.0.0') ||
    trimmed.includes('10.') ||
    trimmed.includes('192.168.')
  ) {
    return false;
  }

  // Reject local file/temp paths
  if (trimmed.startsWith('file://') || trimmed.startsWith('/tmp') || trimmed.includes('/tmp/')) {
    return false;
  }

  // Reject relative static prediction paths (ephemeral server paths that cannot be served by Vercel functions)
  if (
    trimmed.startsWith('/static/') ||
    trimmed.startsWith('static/') ||
    trimmed.startsWith('/api/backend/static/') ||
    trimmed.includes('/static/predictions/')
  ) {
    return false;
  }

  // Allow valid Data URLs (e.g. uploaded preview Data URL)
  if (trimmed.startsWith('data:image/')) {
    return true;
  }

  // Allow valid HTTPS / HTTP remote URLs (e.g. Supabase Storage)
  if (trimmed.startsWith('https://') || (trimmed.startsWith('http://') && !trimmed.includes('localhost'))) {
    return true;
  }

  return false;
}

/**
 * Resolves a crop leaf thumbnail URL from a prediction record
 * adhering to the strict priority order:
 * 1. Persistent cloud image URL
 * 2. Existing original image URL
 * 3. Existing thumbnail URL
 * 4. Existing stored uploaded image/preview
 *
 * Rejects broken/temporary paths (localhost, 127.0.0.1, 0.0.0.0, file://, /tmp/, temporary server paths).
 */
export function resolveThumbnailUrl(pred) {
  if (!pred) return null;

  // 1. Persistent cloud image URL
  const persistentCandidates = [
    pred.persistent_image_url,
    pred.persistentImageUrl,
    pred.cloud_image_url,
    pred.cloudImageUrl,
    pred.rawBackend?.persistent_image_url
  ];
  for (const url of persistentCandidates) {
    if (isValidImageUrl(url)) return url;
  }

  // 2. Existing original image URL
  const originalCandidates = [
    pred.original_image?.image_url,
    pred.original_image?.url,
    pred.originalImage?.image_url,
    pred.originalImage?.url,
    pred.originalImage,
    pred.image_url,
    pred.imageUrl,
    pred.rawBackend?.original_image?.image_url,
    pred.rawBackend?.image_url
  ];
  for (const url of originalCandidates) {
    if (isValidImageUrl(url)) return url;
  }

  // 3. Existing thumbnail URL
  const thumbnailCandidates = [
    pred.thumbnail_url,
    pred.thumbnailUrl,
    pred.thumb_url,
    pred.thumbUrl,
    pred.leaf_crop?.image_url,
    pred.leaf_crop?.url,
    pred.rawBackend?.thumbnail_url
  ];
  for (const url of thumbnailCandidates) {
    if (isValidImageUrl(url)) return url;
  }

  // 4. Existing stored uploaded image/preview
  const previewCandidates = [
    pred.preview_url,
    pred.previewUrl,
    pred.imagePreviewUrl,
    pred.preview,
    pred.upload_preview,
    pred.uploadPreview,
    pred.rawBackend?.imagePreviewUrl
  ];
  for (const url of previewCandidates) {
    if (isValidImageUrl(url)) return url;
  }

  return null;
}

export const apiService = {
  resolveBackendMediaUrl,
  isValidImageUrl,
  resolveThumbnailUrl,

  // 1. Agriculture Library Endpoints
  async getLibraryCategories() {
    return mockLibraryCategories;
  },

  async getLibraryArticles(query = '', cropId = '', category = '') {
    try {
      const response = await apiClient.get('/library/articles', {
        params: { query, cropId, category }
      });
      return response.data;
    } catch (error) {
      let filtered = [...mockLibraryArticles];
      if (cropId && cropId !== 'all') {
        filtered = filtered.filter(a => a.cropId === cropId);
      }
      if (category && category !== 'all') {
        filtered = filtered.filter(a => a.category.toLowerCase() === category.toLowerCase());
      }
      if (query.trim()) {
        const q = query.toLowerCase();
        filtered = filtered.filter(a =>
          a.titleEn.toLowerCase().includes(q) ||
          a.titleTa.toLowerCase().includes(q) ||
          a.summaryEn.toLowerCase().includes(q) ||
          a.category.toLowerCase().includes(q)
        );
      }
      return filtered;
    }
  },

  // 2. Smart Crop & Harvest Planner Endpoints
  async getFarmPlan() {
    return mockFarmPlan;
  },

  async getCropPlanningConfig(crop = 'Tomato') {
    return mockCropPlanningConfigs[crop] || mockCropPlanningConfigs.Tomato;
  },

  async getAllCropConfigs() {
    return mockCropPlanningConfigs;
  },

  async getCropTimeline(crop = 'Tomato') {
    const config = mockCropPlanningConfigs[crop] || mockCropPlanningConfigs.Tomato;
    return config.stages;
  },

  async getFarmActivities(crop = 'Tomato') {
    const config = mockCropPlanningConfigs[crop] || mockCropPlanningConfigs.Tomato;
    return config.activities;
  },

  async toggleActivityStatus(id) {
    let found = null;
    Object.values(mockCropPlanningConfigs).forEach(cfg => {
      const a = cfg.activities.find(act => act.id === id);
      if (a) {
        a.status = a.status === 'Completed' ? 'Upcoming' : 'Completed';
        found = a;
      }
    });
    return found || { id, status: 'Completed' };
  },

  async getCalendarEvents() {
    return mockMonthlyCalendarEvents;
  },

  async generateAiPlanAdvisory({ crop, location, plantingDate, stage, harvestWindow, weather, language = 'en' }) {
    try {
      const prompt = `Provide agronomic pre-planning advisory for ${crop} crop in ${location}. Planting date: ${plantingDate}, Stage: ${stage}, Expected harvest: ${harvestWindow}. Weather alert: ${weather?.alert || 'Moderate temperatures'}.`;
      const response = await this.sendChatMessage(prompt, language);
      return response;
    } catch (err) {
      console.error("AI Plan Advisory error:", err);
      return null;
    }
  },

  // 3. Weather API Service Endpoints (Real OpenWeather Backend Proxy)
  async getWeatherCurrent(location = "Tiruchengode, Tamil Nadu") {
    try {
      const geo = await geocodeLocation(location);
      const data = await fetchOpenWeatherData(geo.lat, geo.lon);
      if (data && data.current) {
        return {
          ...data.current,
          location: data.location_name || geo.name,
          condition: data.current.condition,
          conditionTa: data.current.description,
          rainProbability: data.current.rain_probability
        };
      }
      return null;
    } catch (error) {
      console.error("apiService.getWeatherCurrent error:", error);
      return null;
    }
  },

  async getWeatherForecast(location = "Tiruchengode, Tamil Nadu") {
    try {
      const geo = await geocodeLocation(location);
      const data = await fetchOpenWeatherData(geo.lat, geo.lon);
      return data ? {
        location: data.location_name || geo.name,
        hourly: data.hourly || [],
        daily: data.daily || []
      } : null;
    } catch (error) {
      console.error("apiService.getWeatherForecast error:", error);
      return null;
    }
  },

  async getWeatherAlerts(location = "Tiruchengode, Tamil Nadu") {
    try {
      const geo = await geocodeLocation(location);
      const data = await fetchOpenWeatherData(geo.lat, geo.lon);
      return data ? (data.official_alerts || []) : [];
    } catch (error) {
      console.error("apiService.getWeatherAlerts error:", error);
      return [];
    }
  },

  // 4. Predict Crop Disease (YOLO11 -> SAM -> ResNet-50 -> LIME)
  async predictDisease(formData) {
    try {
      const response = await apiClient.post('/predict', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 900000 // 15 minutes for deep learning pipeline (LIME)
      });
      const data = response.data;
      if (data && data.success) {
        const rawDisease = data.disease || data.prediction?.disease;
        const rawConf = data.confidence ?? data.prediction?.confidence;

        // If backend response does not contain a disease or confidence, treat as uncertain prediction
        if (!rawDisease || rawConf === undefined || rawConf === null) {
          return {
            id: `PRED-UNC-${Date.now()}`,
            success: false,
            status: 'uncertain_prediction',
            valid_image: true,
            message: data.message || "The disease prediction is uncertain or incomplete. Please upload a clearer leaf image.",
            crop: data.crop || formData.get('crop') || 'Crop',
            imageUrl: formData.get('imagePreviewUrl') || '',
            disease: null,
            confidence: null,
            advisory: null
          };
        }

        const crop = data.crop || data.prediction?.crop || formData.get('crop') || 'Tomato';
        // Clean disease display (e.g. "Tomato___Late_blight" -> "Late Blight", "Potato___Early_blight" -> "Early Blight", "Mosaic_Virus" -> "Mosaic Virus")
        const diseaseClean = data.disease_clean || (rawDisease.includes('___')
          ? rawDisease.split('___')[1].replace(/_/g, ' ')
          : rawDisease.replace(/_/g, ' '));

        const isHealthy = diseaseClean.toLowerCase().includes('healthy');
        const confidencePct = Number((rawConf <= 1.0 ? rawConf * 100 : rawConf).toFixed(1));

        // Ensure Original Leaf Photo resolves to persistent storage URL if valid, else uploaded preview Data URL
        const rawPersistentUrl = data.persistent_image_url || data.original_image?.image_url || data.image_url;
        const persistentImageUrl = isValidImageUrl(rawPersistentUrl) ? rawPersistentUrl : null;
        const previewFallback = formData?.get ? formData.get('imagePreviewUrl') : null;
        const imageUrl = persistentImageUrl || (isValidImageUrl(previewFallback) ? previewFallback : '') || '';
        const resolvedOriginalUrl = persistentImageUrl || resolveBackendMediaUrl(data.original_image?.image_url || data.image_url);
        const resolvedLeafCropUrl = resolveBackendMediaUrl(data.leaf_crop?.image_url);

        const top3Predictions = data.top3_predictions || [];
        const segmentationData = data.segmentation ? {
          ...data.segmentation,
          image_url: resolveBackendMediaUrl(data.segmentation.image_url)
        } : null;

        const originalImageData = data.original_image ? {
          ...data.original_image,
          image_url: resolvedOriginalUrl
        } : null;

        const leafCropData = data.leaf_crop ? {
          ...data.leaf_crop,
          image_url: resolvedLeafCropUrl
        } : null;

        const ragData = data.rag || null;
        const limeDetails = data.lime?.details || (typeof data.lime?.explanation === 'string' ? {
          explanation: data.lime.explanation,
          summary: data.lime.explanation,
          why_predicted: [data.lime.explanation]
        } : data.lime?.explanation);
        const limeText = typeof data.lime?.explanation === 'string' ? data.lime.explanation : (data.lime?.explanation?.summary || '');

        const totalMs = data.timings?.total_ms || 0;
        const processingTimeStr = totalMs >= 1000
          ? `${(totalMs / 1000).toFixed(2)} sec`
          : totalMs > 0 ? `${Math.round(totalMs)} ms` : '--';

        const newId = `PRED-${Math.floor(1000 + Math.random() * 9000)}`;
        const advisoryText = data.advisory?.text || (typeof data.advisory === 'string' ? data.advisory : '');

        const newPrediction = {
          id: newId,
          crop: crop,
          disease: diseaseClean,
          confidence: confidencePct,
          status: isHealthy ? "Healthy" : "Disease Detected",
          imageUrl: imageUrl,
          original_image: originalImageData,
          leaf_crop: leafCropData,
          top3Predictions: top3Predictions,
          segmentation: segmentationData,
          rag: ragData,
          limeExplanation: limeDetails,
          limeText: limeText,
          processingTime: processingTimeStr,
          createdAt: new Date().toLocaleString(),
          advisory: {
            text: advisoryText,
            en: advisoryText,
            ta: advisoryText
          },
          rawBackend: data
        };

        return newPrediction;
      }
      // If backend responded with invalid_image or uncertain_prediction
      if (data && (data.status === 'invalid_image' || data.valid_image === false)) {
        return {
          id: `PRED-INV-${Date.now()}`,
          success: false,
          status: 'invalid_image',
          valid_image: false,
          message: data.message || "Please upload a clear Potato, Tomato, or Brinjal leaf image for disease analysis.",
          crop: data.crop || formData.get('crop') || 'Crop',
          imageUrl: formData.get('imagePreviewUrl') || '',
          disease: null,
          confidence: null,
          advisory: null
        };
      }

      if (data && data.status === 'uncertain_prediction') {
        return {
          id: `PRED-UNC-${Date.now()}`,
          success: false,
          status: 'uncertain_prediction',
          valid_image: true,
          message: data.message || "The image appears to contain a supported crop, but the disease prediction is uncertain. Please upload a clearer leaf image.",
          crop: data.crop || formData.get('crop') || 'Crop',
          imageUrl: formData.get('imagePreviewUrl') || '',
          disease: null,
          confidence: null,
          advisory: null
        };
      }

      throw new Error(data?.message || data?.error || "Model prediction returned unsuccessful status");
    } catch (error) {
      console.error("apiService.predictDisease error:", error);

      const status = error?.response?.status;
      const resData = error?.response?.data;

      // P4: Handle HTTP 400 validation rejection (unsupported file format, corrupted, empty file)
      if (status === 400 && resData) {
        const detailMsg = typeof resData.detail === 'string'
          ? resData.detail
          : (resData.message || "Invalid image file. Please upload a clear Potato, Tomato, or Brinjal leaf photograph (JPG, PNG, or WEBP).");

        return {
          id: `PRED-INV-${Date.now()}`,
          success: false,
          status: 'invalid_image',
          valid_image: false,
          message: detailMsg,
          crop: formData.get('crop') || 'Crop',
          imageUrl: formData.get('imagePreviewUrl') || '',
          disease: null,
          confidence: null,
          advisory: null
        };
      }

      // Check if the server returned a structured invalid_image or uncertain_prediction in error.response
      if (resData && (resData.status === 'invalid_image' || resData.valid_image === false)) {
        return {
          id: `PRED-INV-${Date.now()}`,
          success: false,
          status: 'invalid_image',
          valid_image: false,
          message: resData.message || resData.detail || "Please upload a clear Potato, Tomato, or Brinjal leaf image for disease analysis.",
          crop: resData.crop || formData.get('crop') || 'Crop',
          imageUrl: formData.get('imagePreviewUrl') || '',
          disease: null,
          confidence: null,
          advisory: null
        };
      }

      if (resData && resData.status === 'uncertain_prediction') {
        return {
          id: `PRED-UNC-${Date.now()}`,
          success: false,
          status: 'uncertain_prediction',
          valid_image: true,
          message: resData.message || resData.detail || "The image appears to contain a supported crop, but the disease prediction is uncertain. Please upload a clearer leaf image.",
          crop: resData.crop || formData.get('crop') || 'Crop',
          imageUrl: formData.get('imagePreviewUrl') || '',
          disease: null,
          confidence: null,
          advisory: null
        };
      }

      // Handle HTTP 429 Too Many Requests / GPU inference quota limit
      if (
        status === 429 ||
        resData?.status === 'prediction_quota_exceeded' ||
        (typeof error?.message === 'string' && (error.message.includes('429') || error.message.toLowerCase().includes('too many requests'))) ||
        (typeof resData?.message === 'string' && (resData.message.toLowerCase().includes('quota') || resData.message.toLowerCase().includes('rate limit')))
      ) {
        return {
          id: `PRED-QUOTA-${Date.now()}`,
          success: false,
          status: 'quota_exceeded',
          valid_image: true,
          title: "AI Service Temporarily Busy",
          title_ta: "AI சேவை தற்காலிகமாக பிஸியாக உள்ளது",
          message: "The GPU inference service has reached its current usage limit. Please try again after the quota resets.",
          message_ta: "GPU பயன்பாட்டு வரம்பு தற்போது எட்டப்பட்டுள்ளது. Quota reset ஆன பிறகு மீண்டும் முயற்சிக்கவும்.",
          crop: formData?.get ? (formData.get('crop') || 'Crop') : 'Crop',
          imageUrl: formData?.get ? (formData.get('imagePreviewUrl') || '') : '',
          disease: null,
          confidence: null,
          advisory: null
        };
      }

      // True network/transport or server crash error: report connection error honestly without inventing fake diseases
      return {
        id: `ERR-${Date.now()}`,
        success: false,
        status: 'connection_error',
        valid_image: false,
        message: resData?.detail || error?.message || "BACKEND CONNECTION ERROR: Could not reach the SmartFarm AI server. Please verify the backend is running.",
        imageUrl: formData.get('imagePreviewUrl') || '',
        disease: null,
        confidence: null,
        advisory: null
      };
    }
  },

  // 5. Chat with RAG-LLM Farmer Assistant
  async sendChatMessage(message, language = 'en') {
    try {
      const response = await apiClient.post('/chat', { message, language }, { timeout: 60000 });
      return response.data;
    } catch (error) {
      console.error("AI Assistant backend error:", error?.response?.data || error?.message || error);
      const status = error?.response?.status;
      const serverDetail = String(error?.response?.data?.detail || '');

      let errorText = "AI service is temporarily unavailable. Please try again.";
      if (status === 401 || serverDetail.toLowerCase().includes('authentication') || serverDetail.toLowerCase().includes('api key')) {
        errorText = language === 'ta'
          ? "AI சேவை அங்கீகரிப்பு தோல்வியடைந்தது. பின்தள அமைப்புகளைச் சரிபார்க்கவும்."
          : "AI service authentication failed. Please check the backend configuration.";
      } else if (serverDetail.toLowerCase().includes('knowledge') || serverDetail.toLowerCase().includes('retrieval')) {
        errorText = language === 'ta'
          ? "வேளாண் தரவுத்தள தகவல் பெறுதல் தற்காலிகமாக கிடைக்கவில்லை."
          : "Knowledge retrieval is temporarily unavailable.";
      } else if (language === 'ta') {
        errorText = "AI சேவை தற்காலிகமாக கிடைக்கவில்லை. சிறிது நேரம் கழித்து மீண்டும் முயற்சிக்கவும்.";
      }

      return {
        id: Date.now(),
        sender: "ai",
        text: errorText,
        source: "System Notice",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
    }
  },

  // 6. Voice Assistant Process (Real Sarvam STT + Solanaceae RAG + Gemini + Sarvam TTS)
  async processVoiceInput(audioBlobOrData, language = 'en') {
    let response;
    if (audioBlobOrData instanceof Blob) {
      const formData = new FormData();
      const mime = audioBlobOrData.type || 'audio/webm';
      const ext = mime.includes('mp4') ? 'mp4' : mime.includes('wav') ? 'wav' : mime.includes('ogg') ? 'ogg' : 'webm';
      formData.append('audio', audioBlobOrData, `voice_recording.${ext}`);
      formData.append('language', language);

      // In Axios, omitting/undefining Content-Type allows Axios and browser to set multipart/form-data with the boundary string
      response = await apiClient.post('/voice', formData, {
        headers: { 'Content-Type': undefined },
        timeout: 90000,
      });
    } else if (audioBlobOrData instanceof FormData) {
      response = await apiClient.post('/voice', audioBlobOrData, {
        headers: { 'Content-Type': undefined },
        timeout: 90000,
      });
    } else {
      // Base64 or object payload
      const payload = typeof audioBlobOrData === 'string'
        ? { audio: audioBlobOrData, language }
        : { ...audioBlobOrData, language };

      response = await apiClient.post('/voice', payload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 90000,
      });
    }
    return response.data;
  },

  // 6b. Google TTS Synthesis via backend serverless endpoint (/voice/tts)
  async synthesizeSpeech(text, language = 'en') {
    try {
      const normLang = String(language || 'en').trim().toLowerCase().startsWith('ta') ? 'ta' : 'en';
      const response = await apiClient.post('/voice/tts', {
        text,
        language: normLang,
      }, {
        timeout: 30000
      });
      return response.data;
    } catch (error) {
      console.warn('[apiService] synthesizeSpeech error:', error?.message);
      const status = error?.response?.status;
      return {
        success: false,
        status,
        reason: status === 429 ? 'rate_limited' : (error?.response?.data?.reason || error?.response?.data?.error || 'network_error')
      };
    }
  },

  // 6c. Get Voice Status & Backend Providers (without exposing keys)
  async getVoiceStatus() {
    try {
      const response = await apiClient.get('/voice/status');
      return response.data;
    } catch (error) {
      return {
        status: 'offline',
        providers: { local_indic_tts: false, sarvam: false }
      };
    }
  },


  // 7. Community Posts API
  async getCommunityPosts() {
    try {
      const response = await apiClient.get('/community');
      return response.data;
    } catch (error) {
      try {
        return JSON.parse(localStorage.getItem('smartfarm_community_posts') || '[]');
      } catch {
        return [];
      }
    }
  },

  async createCommunityPost(postData) {
    try {
      const response = await apiClient.post('/community', postData);
      return response.data;
    } catch (error) {
      const newPost = {
        id: `POST-${Math.floor(100 + Math.random() * 900)}`,
        farmerName: postData.farmerName || "Farmer",
        createdAt: "Just now",
        crop: postData.crop || "Tomato",
        topic: postData.topic || "General Discussion",
        language: postData.language || "en",
        content: postData.content,
        likes: 0,
        comments: []
      };
      try {
        const current = JSON.parse(localStorage.getItem('smartfarm_community_posts') || '[]');
        current.unshift(newPost);
        localStorage.setItem('smartfarm_community_posts', JSON.stringify(current));
      } catch (e) {
        console.warn("Local post save error:", e);
      }
      return newPost;
    }
  },

  // 8. Sensor Telemetry (ESP32)
  async getLatestSensors() {
    try {
      const response = await apiClient.get('/sensors/latest');
      return response.data;
    } catch (error) {
      return mockLatestSensors;
    }
  },

  async getSensorHistory() {
    try {
      const response = await apiClient.get('/sensors/history');
      return response.data;
    } catch (error) {
      return mockSensorHistory;
    }
  },

  async getRecentSensorActivity() {
    return mockRecentSensorActivity;
  },

  // 9. Predictions & Reports
  async getPredictions(params = {}) {
    try {
      const stored = localStorage.getItem('smartfarm_predictions');
      if (stored !== null) {
        // Distinguish: key exists (even if empty array []) -> do NOT restore mock data
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn("Error reading stored predictions:", e);
    }
    // Key does not exist in localStorage -> use existing mock predictions
    return mockPredictions;
  },

  async getPredictionById(id) {
    try {
      const stored = localStorage.getItem('smartfarm_predictions');
      if (stored !== null) {
        const list = JSON.parse(stored);
        if (Array.isArray(list)) {
          if (list.length === 0) return null;
          if (id) {
            const found = list.find(p => p.id === id);
            return found || null;
          }
          return list[0] || null;
        }
      }
    } catch (e) {}

    if (!id) return mockPredictions[0];
    const found = mockPredictions.find(p => p.id === id);
    return found || null;
  },

  async savePrediction(prediction) {
    if (!prediction || !prediction.id) return { success: false };

    try {
      let current = [];
      const stored = localStorage.getItem('smartfarm_predictions');
      if (stored !== null) {
        current = JSON.parse(stored);
        if (!Array.isArray(current)) current = [];
      } else {
        current = [...mockPredictions];
      }

      // Check if duplicate by exact ID
      const existingIdx = current.findIndex(p => p.id === prediction.id);
      if (existingIdx >= 0) {
        current[existingIdx] = { ...current[existingIdx], ...prediction };
      } else {
        current.unshift(prediction);
      }

      localStorage.setItem('smartfarm_predictions', JSON.stringify(current));
      return { success: true, count: current.length };
    } catch (e) {
      console.warn("Error saving prediction to localStorage:", e);
      return { success: false, error: e.message };
    }
  },

  async deletePrediction(id) {
    if (!id) return { success: false };

    try {
      let current = [];
      const stored = localStorage.getItem('smartfarm_predictions');
      if (stored !== null) {
        current = JSON.parse(stored);
        if (!Array.isArray(current)) current = [];
      } else {
        current = [...mockPredictions];
      }

      // Delete only the selected localStorage record by its exact ID
      const updated = current.filter(p => p.id !== id);
      localStorage.setItem('smartfarm_predictions', JSON.stringify(updated));
      return { success: true, remaining: updated };
    } catch (e) {
      console.warn("Error deleting prediction from localStorage:", e);
      return { success: false, error: e.message };
    }
  },

  async getSummaryMetrics() {
    return {
      metrics: {
        cropHealth: { healthy: 78, atRisk: 16, critical: 6 },
        diseaseDetections: { total: 142, thisWeek: 18, accuracy: 96.8 }
      },
      insights: mockAiInsights
    };
  },

  // 10. Authentication & Profile Endpoints
  async signup(userData) {
    const response = await apiClient.post('/auth/signup', userData);
    return response.data;
  },

  async login(email, password) {
    const response = await apiClient.post('/auth/login', { email, password });
    return response.data;
  },

  async logout() {
    try {
      await apiClient.post('/auth/logout');
    } catch (e) {
      console.warn("Backend logout notification failed:", e);
    }
  },

  async getProfile() {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  async updateProfile(profileData) {
    const response = await apiClient.put('/auth/profile', profileData);
    return response.data;
  },

  async forgotPassword(email) {
    const response = await apiClient.post('/auth/forgot-password', { email });
    return response.data;
  },

  async getAuthStatus() {
    try {
      const response = await apiClient.get('/auth/status');
      return response.data;
    } catch (e) {
      return { mode: 'offline', is_connected: false };
    }
  },

  // 11. My Field Profile Endpoints
  async getFieldProfile() {
    let profile = null;
    let assessment = null;

    // 1. Try Backend API
    try {
      const response = await apiClient.get('/field');
      if (response.data) {
        profile = response.data.field || response.data;
        if (response.data.assessment) {
          assessment = response.data.assessment;
        }
      }
    } catch (e) {
      console.warn("Backend getFieldProfile failed, using local storage fallback:", e?.message);
    }

    // 2. Local Storage Fallback if backend failed
    if (!profile) {
      try {
        const stored = localStorage.getItem('smartfarm_field_profile');
        if (stored) {
          profile = JSON.parse(stored);
        }
      } catch { }
    }

    // 3. Default demo profile if no saved profile exists
    if (!profile) {
      profile = {
        crop_type: "Brinjal",
        soil_type: "Loamy",
        soil_ph: 6.4,
        water_capacity: "72%",
        field_size: 2.0,
        field_size_unit: "Acre",
        npk_nitrogen: 80,
        npk_phosphorus: 40,
        npk_potassium: 40,
        sowing_date: "2026-06-15",
        irrigation_method: "Drip",
        field_location: "Tamil Nadu",
        season: "Kharif"
      };
    }

    // 4. Clean stored profile (strip stale assessment field if embedded)
    const cleanProfile = { ...profile };
    delete cleanProfile.assessment;
    delete cleanProfile.field;

    // 5. Always calculate the assessment from THAT EXACT profile!
    // Never reuse a stale assessment that could mismatch current field parameters.
    assessment = evaluateFieldSuitability(cleanProfile);

    // Save synchronized state to localStorage
    try {
      localStorage.setItem('smartfarm_field_profile', JSON.stringify(cleanProfile));
      localStorage.setItem('smartfarm_field_assessment', JSON.stringify(assessment));
    } catch { }

    return {
      ...cleanProfile,
      field: cleanProfile,
      assessment: assessment
    };
  },

  async updateFieldProfile(profileData) {
    // 1. Clean and normalize the profile
    const current = await this.getFieldProfile();
    const currentField = current.field || current;

    // Normalize water_capacity (handle number 0, string '0', '0%', etc.)
    let normWater = profileData.water_capacity !== undefined ? profileData.water_capacity : currentField.water_capacity;
    if (typeof normWater === 'number') {
      normWater = `${normWater}%`;
    } else if (typeof normWater === 'string' && normWater.trim() !== '' && !normWater.includes('%')) {
      const parsedNum = parseFloat(normWater);
      if (Number.isFinite(parsedNum)) {
        normWater = `${parsedNum}%`;
      }
    }

    const updated = {
      ...currentField,
      ...profileData,
      soil_ph: profileData.soil_ph !== undefined ? (Number.isFinite(parseFloat(profileData.soil_ph)) ? parseFloat(profileData.soil_ph) : currentField.soil_ph) : currentField.soil_ph,
      water_capacity: normWater ?? "72%",
      field_size: profileData.field_size !== undefined ? (Number.isFinite(parseFloat(profileData.field_size)) ? parseFloat(profileData.field_size) : currentField.field_size) : currentField.field_size,
      npk_nitrogen: profileData.npk_nitrogen !== undefined ? (Number.isFinite(parseInt(profileData.npk_nitrogen, 10)) ? parseInt(profileData.npk_nitrogen, 10) : currentField.npk_nitrogen) : currentField.npk_nitrogen,
      npk_phosphorus: profileData.npk_phosphorus !== undefined ? (Number.isFinite(parseInt(profileData.npk_phosphorus, 10)) ? parseInt(profileData.npk_phosphorus, 10) : currentField.npk_phosphorus) : currentField.npk_phosphorus,
      npk_potassium: profileData.npk_potassium !== undefined ? (Number.isFinite(parseInt(profileData.npk_potassium, 10)) ? parseInt(profileData.npk_potassium, 10) : currentField.npk_potassium) : currentField.npk_potassium,
    };
    delete updated.assessment;
    delete updated.field;

    // 2. Immediately calculate suitability from the updated canonical profile
    const calculatedAssessment = evaluateFieldSuitability(updated);

    // 3. Persist canonical state immediately to localStorage
    try {
      localStorage.setItem('smartfarm_field_profile', JSON.stringify(updated));
      localStorage.setItem('smartfarm_field_assessment', JSON.stringify(calculatedAssessment));
    } catch { }

    // 4. Try syncing with backend API if reachable
    let finalAssessment = calculatedAssessment;
    try {
      const response = await apiClient.put('/field', updated);
      if (response.data) {
        const backendField = response.data.field || response.data;
        delete backendField.assessment;
        delete backendField.field;
        if (response.data.assessment) {
          finalAssessment = response.data.assessment;
          try {
            localStorage.setItem('smartfarm_field_assessment', JSON.stringify(finalAssessment));
          } catch { }
        }
      }
    } catch (e) {
      console.warn("Backend updateFieldProfile failed, using verified client-side assessment:", e?.message);
    }

    return {
      ...updated,
      field: updated,
      assessment: finalAssessment
    };
  },

  async evaluateField(fieldData) {
    // 1. Clean/normalize fieldData
    const cleanData = {
      ...fieldData,
      soil_ph: fieldData.soil_ph !== undefined && fieldData.soil_ph !== null ? (Number.isFinite(parseFloat(fieldData.soil_ph)) ? parseFloat(fieldData.soil_ph) : fieldData.soil_ph) : fieldData.soil_ph,
      field_size: fieldData.field_size !== undefined && fieldData.field_size !== null ? (Number.isFinite(parseFloat(fieldData.field_size)) ? parseFloat(fieldData.field_size) : 2.0) : 2.0,
      npk_nitrogen: fieldData.npk_nitrogen !== undefined && fieldData.npk_nitrogen !== null ? (Number.isFinite(parseInt(fieldData.npk_nitrogen, 10)) ? parseInt(fieldData.npk_nitrogen, 10) : 0) : 0,
      npk_phosphorus: fieldData.npk_phosphorus !== undefined && fieldData.npk_phosphorus !== null ? (Number.isFinite(parseInt(fieldData.npk_phosphorus, 10)) ? parseInt(fieldData.npk_phosphorus, 10) : 0) : 0,
      npk_potassium: fieldData.npk_potassium !== undefined && fieldData.npk_potassium !== null ? (Number.isFinite(parseInt(fieldData.npk_potassium, 10)) ? parseInt(fieldData.npk_potassium, 10) : 0) : 0,
    };

    // 2. Try the existing backend /field/evaluate endpoint
    try {
      const response = await apiClient.post('/field/evaluate', cleanData);
      if (response.data?.assessment) {
        return response.data.assessment;
      }
    } catch (e) {
      console.warn("Backend evaluateField failed, using client-side agronomic rule evaluator:", e?.message);
    }

    // 3. Client-side agronomic rule evaluator fallback
    return evaluateFieldSuitability(cleanData);
  },

  // 12. Government Agriculture Schemes Endpoints
  async getGovernmentSchemes(params = {}) {
    try {
      const response = await apiClient.get('/schemes', { params });
      if (response.data && Array.isArray(response.data)) {
        return response.data;
      }
    } catch (e) {
      console.warn("Backend getGovernmentSchemes failed, using verified registry fallback:", e?.message);
    }

    // Client-side fallback filtering
    let schemes = [...VERIFIED_GOVERNMENT_SCHEMES];
    const { query = '', state = 'all', crop = 'all', category = 'all' } = params;

    if (state && state !== 'all') {
      const stNorm = state.toLowerCase();
      schemes = schemes.filter(s => {
        const supported = (s.rules?.supportedStates || ['All India']).map(x => x.toLowerCase());
        return supported.includes('all india') || supported.some(x => x.includes(stNorm) || stNorm.includes(x));
      });
    }

    if (crop && crop !== 'all') {
      const cNorm = crop.toLowerCase();
      schemes = schemes.filter(s => {
        const supported = (s.rules?.supportedCrops || ['All']).map(x => x.toLowerCase());
        return supported.includes('all') || supported.some(x => x.includes(cNorm) || cNorm.includes(x));
      });
    }

    if (category && category !== 'all') {
      const catNorm = category.toLowerCase();
      schemes = schemes.filter(s => s.category.toLowerCase().includes(catNorm) || catNorm.includes(s.category.toLowerCase()));
    }

    if (query && query.trim()) {
      const q = query.toLowerCase().trim();
      schemes = schemes.filter(s =>
        s.name.toLowerCase().includes(q) ||
        (s.nameTa && s.nameTa.toLowerCase().includes(q)) ||
        s.agency.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.benefits.toLowerCase().includes(q)
      );
    }

    return schemes;
  },

  async evaluateSchemeEligibility(fieldProfile) {
    try {
      const response = await apiClient.post('/schemes/evaluate', { field_profile: fieldProfile });
      if (response.data) {
        return response.data;
      }
    } catch (e) {
      console.warn("Backend evaluateSchemeEligibility failed, using client-side rule engine:", e?.message);
    }

    // Client-side rule evaluation
    const evaluations = {};
    let likelyEligibleCount = 0;
    VERIFIED_GOVERNMENT_SCHEMES.forEach(scheme => {
      const res = evalRules(scheme, fieldProfile);
      evaluations[scheme.id] = res;
      if (res.status === 'likely_eligible') {
        likelyEligibleCount++;
      }
    });

    return {
      field_profile_summary: {
        crop: fieldProfile?.crop_type,
        field_size: fieldProfile?.field_size,
        location: fieldProfile?.field_location
      },
      total_schemes_evaluated: VERIFIED_GOVERNMENT_SCHEMES.length,
      likely_eligible_count: likelyEligibleCount,
      evaluations
    };
  }
};
