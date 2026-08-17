import axios from 'axios';
import { 
  mockPredictions, 
  mockLatestSensors, 
  mockSensorHistory, 
  mockRecentSensorActivity,
  generateLeafSvg,
  mockAiInsights,
  mockCommunityPosts,
  mockCurrentWeather,
  mock7DayForecast,
  mockHourlyForecast,
  mockFarmerWeatherAlerts,
  mockCropWeatherInsights,
  mockFieldVsWeather,
  mockLibraryCategories,
  mockLibraryArticles,
  mockFarmPlan,
  mockCropTimelineStages,
  mockFarmActivities,
  mockMonthlyCalendarEvents
} from './mockData';

const API_BASE_URL = 'http://localhost:8000/api';
const WEATHER_API_KEY = import.meta.env.VITE_WEATHER_API_KEY || 'mock_key';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 5000,
});

export const apiService = {
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

  // 2. Farming Planner Endpoints
  async getFarmPlan() {
    return mockFarmPlan;
  },

  async getCropTimeline(crop = 'Tomato') {
    return mockCropTimelineStages[crop] || mockCropTimelineStages.Tomato;
  },

  async getFarmActivities() {
    return mockFarmActivities;
  },

  async toggleActivityStatus(id) {
    const act = mockFarmActivities.find(a => a.id === id);
    if (act) {
      act.status = act.status === 'Completed' ? 'Upcoming' : 'Completed';
    }
    return act;
  },

  async getCalendarEvents() {
    return mockMonthlyCalendarEvents;
  },

  // 3. Weather API Service Endpoints
  async getWeatherCurrent(location = "Tiruchengode, Tamil Nadu") {
    try {
      const response = await apiClient.get('/weather/current', {
        params: { location, apiKey: WEATHER_API_KEY }
      });
      return response.data;
    } catch (error) {
      await new Promise(res => setTimeout(res, 500));
      return {
        ...mockCurrentWeather,
        location: location || mockCurrentWeather.location
      };
    }
  },

  async getWeatherForecast(location = "Tiruchengode, Tamil Nadu") {
    try {
      const response = await apiClient.get('/weather/forecast', {
        params: { location, apiKey: WEATHER_API_KEY }
      });
      return response.data;
    } catch (error) {
      await new Promise(res => setTimeout(res, 600));
      return {
        daily: mock7DayForecast,
        hourly: mockHourlyForecast
      };
    }
  },

  async getWeatherAlerts(location = "Tiruchengode, Tamil Nadu") {
    try {
      const response = await apiClient.get('/weather/alerts', {
        params: { location, apiKey: WEATHER_API_KEY }
      });
      return response.data;
    } catch (error) {
      return mockFarmerWeatherAlerts;
    }
  },

  async getCropWeatherInsights(crop = 'Tomato') {
    return mockCropWeatherInsights[crop] || mockCropWeatherInsights.Tomato;
  },

  async getFieldVsWeather() {
    return mockFieldVsWeather;
  },

  // 4. Predict Crop Disease (YOLO11 -> SAM -> ResNet-50 -> LIME)
  async predictDisease(formData) {
    try {
      const response = await apiClient.post('/predict', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    } catch (error) {
      await new Promise(res => setTimeout(res, 1400));
      
      const crop = formData.get('crop') || 'Tomato';
      const sampleDisease = crop === 'Tomato' ? 'Late Blight'
                          : crop === 'Potato' ? 'Early Blight'
                          : 'Cercospora Leaf Spot';
      
      const newId = `PRED-${Math.floor(1000 + Math.random() * 9000)}`;
      const newPrediction = {
        id: newId,
        crop,
        disease: sampleDisease,
        confidence: Number((92 + Math.random() * 7).toFixed(1)),
        status: "Disease Detected",
        imageUrl: formData.get('imagePreviewUrl') || generateLeafSvg(crop, sampleDisease, false),
        limeImageUrl: generateLeafSvg(crop, sampleDisease, true),
        processingTime: "1.18 sec",
        createdAt: new Date().toLocaleString(),
        farmerName: "UGESHRAJA S",
        location: "Tiruchengode, Tamil Nadu",
        iotSnapshot: { ...mockLatestSensors },
        advisory: {
          en: `${sampleDisease} detected in ${crop}. Spray recommended systemic fungicide (Mancozeb 2g/L) and improve soil ventilation.`,
          ta: `${crop} பயிரில் ${sampleDisease} கண்டறியப்பட்டுள்ளது. பரிந்துரைக்கப்பட்ட பூஞ்சைக் கொல்லியைத் தெளிக்கவும்.`
        },
        preventiveMeasures: [
          "Avoid overhead watering during humid evening hours.",
          "Ensure proper spacing between crops for air circulation.",
          "Apply recommended protective fungicide spray within 24 hours."
        ]
      };
      
      mockPredictions.unshift(newPrediction);
      return newPrediction;
    }
  },

  // 5. Chat with RAG-LLM Farmer Assistant
  async sendChatMessage(message, language = 'en') {
    try {
      const response = await apiClient.post('/chat', { message, language });
      return response.data;
    } catch (error) {
      await new Promise(res => setTimeout(res, 800));

      const lower = message.toLowerCase();
      let replyText = "";

      if (language === 'ta') {
        if (lower.includes("late blight") || lower.includes("கட்டுப்படுத்துவது") || lower.includes("தக்காளி") || lower.includes("புள்ளிகள்")) {
          replyText = "வேளாண்மை நூலகத் தரவுகளின்படி (RAG + LLM):\nதக்காளியில் Late Blight நோய் அதிக ஈரப்பதம் மற்றும் குளிர்ச்சியான சூழ்நிலையில் வேகமாக பரவக்கூடும். பாதிக்கப்பட்ட இலைகளை கண்காணித்து, பரிந்துரைக்கப்பட்ட வேளாண் நோய் மேலாண்மை முறைகளைப் பின்பற்றவும்.";
        } else if (lower.includes("உருளை") || lower.includes("potato")) {
          replyText = "உருளைக்கிழங்கில் ஏர்லி பிளைட் நோய் வளையப் புள்ளிகளை ஏற்படுத்துகிறது. குளோரோதலோனில் பூஞ்சைக் கொல்லியைத் தெளிக்கவும்.";
        } else {
          replyText = `உங்கள் கேள்விக்கு நன்றி: "${message}". எமது வேளாண்மை நூலகத்தின் அறிவுக் களஞ்சியம் மூலம் தக்காளி, உருளைக்கிழங்கு, கத்தரிக்காய் பயிர்களுக்கான மேலாண்மை ஆலோசனைகள் வழங்கப்படுகின்றன.`;
        }
      } else {
        if (lower.includes("late blight") || lower.includes("tomato") || lower.includes("treatment") || lower.includes("brown spot")) {
          replyText = "Based on our Agriculture Library Knowledge Base (RAG + LLM):\nTomato late blight is commonly associated with cool and humid conditions. Monitor affected leaves regularly and follow recommended agricultural disease-management practices.";
        } else if (lower.includes("potato")) {
          replyText = "Potato Early Blight causes characteristic target-board concentric rings. Apply Chlorothalonil 75% WP @ 2g/litre and maintain balanced nitrogen.";
        } else {
          replyText = `Based on Agriculture Library knowledge for "${message}": Keep soil moisture at 60-70%, avoid overhead sprinkler watering during high ambient humidity, and inspect foliage daily.`;
        }
      }

      return {
        id: Date.now(),
        sender: "ai",
        text: replyText,
        source: "Based on Agriculture Library Vector Knowledge (RAG + LLM)",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
    }
  },

  // 6. Voice Assistant Process
  async processVoiceInput(audioBlobOrText, language = 'en') {
    try {
      const response = await apiClient.post('/voice', { audio: audioBlobOrText, language });
      return response.data;
    } catch (error) {
      await new Promise(res => setTimeout(res, 800));
      
      if (language === 'ta') {
        return {
          transcript: "தக்காளியில் Late Blight நோயை எப்படி கட்டுப்படுத்துவது?",
          aiResponse: "தக்காளியில் Late Blight நோய் அதிக ஈரப்பதம் மற்றும் குளிர்ச்சியான சூழ்நிலையில் வேகமாக பரவக்கூடும். பாதிக்கப்பட்ட இலைகளை கண்காணித்து, பரிந்துரைக்கப்பட்ட வேளாண் நோய் மேலாண்மை முறைகளைப் பின்பற்றவும்.",
          audioUrl: null
        };
      } else {
        return {
          transcript: "What is the treatment for tomato late blight?",
          aiResponse: "Tomato late blight is commonly associated with cool and humid conditions. Monitor affected leaves and follow recommended agricultural disease-management practices.",
          audioUrl: null
        };
      }
    }
  },

  // 7. Community Posts API
  async getCommunityPosts() {
    try {
      const response = await apiClient.get('/community');
      return response.data;
    } catch (error) {
      return mockCommunityPosts;
    }
  },

  async createCommunityPost(postData) {
    try {
      const response = await apiClient.post('/community', postData);
      return response.data;
    } catch (error) {
      const newPost = {
        id: `POST-${Math.floor(100 + Math.random() * 900)}`,
        farmerName: "UGESHRAJA S",
        createdAt: "Just now",
        crop: postData.crop || "Tomato",
        topic: postData.topic || "General Discussion",
        language: postData.language || "en",
        content: postData.content,
        likes: 0,
        comments: []
      };
      mockCommunityPosts.unshift(newPost);
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
  }
};
