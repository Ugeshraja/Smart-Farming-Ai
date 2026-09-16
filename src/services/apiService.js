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

export const apiService = {
  resolveBackendMediaUrl,

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

        // Ensure Original Leaf Photo resolves to persistent storage URL
        const resolvedOriginalUrl = resolveBackendMediaUrl(data.original_image?.image_url || data.image_url);
        const resolvedLeafCropUrl = resolveBackendMediaUrl(data.leaf_crop?.image_url);
        const persistentImageUrl = data.persistent_image_url || (resolvedOriginalUrl?.startsWith('http') ? resolvedOriginalUrl : null);
        const imageUrl = persistentImageUrl || resolvedOriginalUrl || formData.get('imagePreviewUrl') || resolvedLeafCropUrl || '';

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

  // 6b. Hybrid TTS Synthesis (Backend Local Indic TTS & Sarvam Bulbul v3 with caching)
  async synthesizeSpeech(text, language = 'en', preferredProvider = 'auto') {
    try {
      const response = await apiClient.post('/voice/tts', {
        text,
        language,
        preferred_provider: preferredProvider
      }, {
        timeout: 35000
      });
      return response.data;
    } catch (error) {
      console.warn('[apiService] synthesizeSpeech error:', error?.message);
      return {
        success: false,
        fallback_to_browser: true,
        text_only: false,
        reason: error?.response?.data?.reason || 'network_error'
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
      const response = await apiClient.get('/predictions', { params });
      return response.data;
    } catch (error) {
      return mockPredictions;
    }
  },

  async getPredictionById(id) {
    const found = mockPredictions.find(p => p.id === id);
    return found || mockPredictions[0];
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
    try {
      const response = await apiClient.get('/field');
      if (response.data) {
        localStorage.setItem('smartfarm_field_profile', JSON.stringify(response.data));
        return response.data;
      }
    } catch (e) {
      console.warn("Backend getFieldProfile failed, using local storage fallback:", e?.message);
    }
    try {
      const stored = localStorage.getItem('smartfarm_field_profile');
      if (stored) return JSON.parse(stored);
    } catch { }
    // Default demo profile for initial load
    return {
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
  },

  async updateFieldProfile(profileData) {
    try {
      const response = await apiClient.put('/field', profileData);
      if (response.data) {
        localStorage.setItem('smartfarm_field_profile', JSON.stringify(response.data));
        return response.data;
      }
    } catch (e) {
      console.warn("Backend updateFieldProfile failed, saving locally:", e?.message);
    }
    const current = await this.getFieldProfile();
    const updated = { ...current, ...profileData };
    localStorage.setItem('smartfarm_field_profile', JSON.stringify(updated));
    return updated;
  },

  async evaluateField(fieldData) {
    try {
      const response = await apiClient.post('/field/evaluate', fieldData);
      return response.data?.assessment;
    } catch (e) {
      console.warn("Backend evaluateField failed:", e?.message);
      return null;
    }
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
