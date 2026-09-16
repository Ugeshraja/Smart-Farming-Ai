// OpenWeather Real Weather Integration Service for SmartFarm AI
// Communicates with backend proxy at /api/weather/data to protect API credentials.

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/backend/api';

export const KNOWN_AGRICULTURAL_LOCATIONS = {
  "tiruchengode": { name: "Tiruchengode, Tamil Nadu", lat: 11.38, lon: 77.89 },
  "dharmapuri": { name: "Dharmapuri, Tamil Nadu", lat: 12.13, lon: 78.16 },
  "salem": { name: "Salem, Tamil Nadu", lat: 11.66, lon: 78.14 },
  "coimbatore": { name: "Coimbatore, Tamil Nadu", lat: 11.01, lon: 76.96 },
  "madurai": { name: "Madurai, Tamil Nadu", lat: 9.92, lon: 78.12 },
  "namakkal": { name: "Namakkal, Tamil Nadu", lat: 11.22, lon: 78.17 },
  "erode": { name: "Erode, Tamil Nadu", lat: 11.34, lon: 77.72 },
  "trichy": { name: "Tiruchirappalli, Tamil Nadu", lat: 10.79, lon: 78.70 },
  "chennai": { name: "Chennai, Tamil Nadu", lat: 13.08, lon: 80.27 }
};

export const WEATHER_LOCATION_STORAGE_KEY = 'smartfarm_weather_selected_location';

/**
 * Get the currently selected/saved weather location from localStorage.
 */
export function getSavedWeatherLocation() {
  try {
    const raw = localStorage.getItem(WEATHER_LOCATION_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.lat === 'number' && typeof parsed.lon === 'number') {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Error reading saved weather location:", e);
  }
  return null;
}

/**
 * Save selected weather location and dispatch a cross-component change event.
 */
export function setSavedWeatherLocation(loc) {
  if (!loc || typeof loc.lat !== 'number' || typeof loc.lon !== 'number') return null;
  const payload = {
    name: loc.name || "Custom Location",
    lat: Number(Number(loc.lat).toFixed(4)),
    lon: Number(Number(loc.lon).toFixed(4)),
    source: loc.source || 'manual',
    timestamp: Date.now()
  };
  try {
    localStorage.setItem(WEATHER_LOCATION_STORAGE_KEY, JSON.stringify(payload));
  } catch (e) {}

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('smartfarm_weather_location_changed', { detail: payload }));
  }
  return payload;
}

/**
 * Resolve effective weather location based on required hierarchy:
 * 1. Previously selected/saved weather location (from manual search / GPS)
 * 2. Farmer profile location (if saved in user profile)
 * 3. Default agricultural location (Tiruchengode, Tamil Nadu)
 */
export async function resolveWeatherLocation(user = null) {
  // 1. Check existing saved/manual selection
  const saved = getSavedWeatherLocation();
  if (saved) {
    return saved;
  }

  // 2. Check Farmer Profile Location
  const profileLoc = user?.farm_location || user?.location || user?.farm_details?.farm_location || null;
  if (profileLoc) {
    const geo = await geocodeLocation(profileLoc);
    return setSavedWeatherLocation({ ...geo, source: 'profile' });
  }

  // 3. Fallback default
  const defaultLoc = KNOWN_AGRICULTURAL_LOCATIONS.tiruchengode;
  return setSavedWeatherLocation({ ...defaultLoc, source: 'default' });
}

/**
 * Activate OpenWeather API key on the backend and persist to backend/.env safely.
 */
export async function saveOpenWeatherKey(apiKey) {
  const res = await fetch(`${API_BASE_URL}/weather/set-key`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ api_key: apiKey.trim() })
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || "Failed to activate API key.");
  }
  return await res.json();
}

/**
 * Geocode user text query to coordinates via backend proxy or agricultural registry.
 */
export async function geocodeLocation(query) {
  if (!query || typeof query !== 'string') {
    return KNOWN_AGRICULTURAL_LOCATIONS.tiruchengode;
  }

  const clean = query.trim().toLowerCase();
  for (const [key, loc] of Object.entries(KNOWN_AGRICULTURAL_LOCATIONS)) {
    if (clean.includes(key)) {
      return loc;
    }
  }

  try {
    const res = await fetch(`${API_BASE_URL}/weather/geocode?query=${encodeURIComponent(query.trim())}`);
    if (res.ok) {
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        const item = data.results[0];
        return {
          name: item.formatted_name || item.name,
          lat: Number(Number(item.lat).toFixed(4)),
          lon: Number(Number(item.lon).toFixed(4))
        };
      }
    }
  } catch (err) {
    console.warn("Backend geocoding request failed, using agricultural hub:", err);
  }

  return {
    name: query,
    lat: KNOWN_AGRICULTURAL_LOCATIONS.tiruchengode.lat,
    lon: KNOWN_AGRICULTURAL_LOCATIONS.tiruchengode.lon
  };
}

/**
 * Fetch live OpenWeather data securely from our backend API proxy.
 */
export async function fetchOpenWeatherData(lat, lon, forceRefresh = false) {
  const cacheKey = `smartfarm_ow_${Number(lat).toFixed(2)}_${Number(lon).toFixed(2)}`;

  // Check 10-minute cache if not explicitly refreshing
  if (!forceRefresh) {
    try {
      const cachedStr = sessionStorage.getItem(cacheKey);
      if (cachedStr) {
        const cached = JSON.parse(cachedStr);
        if (Date.now() - (cached.timestamp || 0) < 10 * 60 * 1000) {
          return cached.data;
        }
      }
    } catch (e) {}
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}/weather/data?lat=${lat}&lon=${lon}&units=metric`);
  } catch (netErr) {
    throw new Error(
      "Cannot connect to the backend weather proxy. Ensure the FastAPI backend is running on port 8000."
    );
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const detail = errorData.detail || errorData.message || "Failed to fetch OpenWeather data.";
    if (response.status === 401) {
      throw new Error("OpenWeather API authentication failed. Please verify OPENWEATHER_API_KEY in backend/.env.");
    }
    if (response.status === 400 && detail.includes("not configured")) {
      throw new Error("OpenWeather API key is not configured. Please set OPENWEATHER_API_KEY in backend/.env.");
    }
    throw new Error(detail);
  }

  const result = await response.json();

  // Attach Smart Farming Alerts and Agricultural Insights derived from real OpenWeather parameters
  const smartAlerts = generateSmartFarmingAlerts(result.current, result.daily);
  const agriInsights = generateAgriculturalInsights(result.current, result.daily);

  const fullData = {
    ...result,
    smart_alerts: smartAlerts,
    agri_insights: agriInsights
  };

  try {
    sessionStorage.setItem(cacheKey, JSON.stringify({
      timestamp: Date.now(),
      data: fullData
    }));
  } catch (e) {}

  return fullData;
}

/**
 * Generate Smart Farming Weather Alerts (Clearly marked as AI/Smart Farming Alert, NOT official).
 */
export function generateSmartFarmingAlerts(current, daily = []) {
  const alerts = [];

  const temp = typeof current.temperature === 'number' ? current.temperature : 28;
  const rain = typeof current.precipitation === 'number' ? current.precipitation : 0;
  const rainProb = typeof current.rainProbability === 'number' ? current.rainProbability : 0;
  const wind = typeof current.wind_speed === 'number' ? current.wind_speed : 0;
  const humidity = typeof current.humidity === 'number' ? current.humidity : 60;

  const maxDailyRain = daily.reduce((max, d) => Math.max(max, typeof d.rainfall_mm === 'number' ? d.rainfall_mm : 0), rain);
  const maxDailyTemp = daily.reduce((max, d) => Math.max(max, typeof d.max_temp === 'number' ? d.max_temp : 0), temp);
  const minDailyTemp = daily.reduce((min, d) => Math.min(min, typeof d.min_temp === 'number' ? d.min_temp : 99), temp);

  // 1. Heavy Rainfall Alert
  if (maxDailyRain >= 12 || rain >= 5) {
    alerts.push({
      id: "smart-heavy-rain",
      type: "AI/Smart Farming Alert",
      severity: "HIGH",
      icon: "🌧️",
      title: {
        en: "Heavy Rainfall Expected",
        ta: "கனமழை முன்னறிவிப்பு"
      },
      message: {
        en: `Expected precipitation up to ${maxDailyRain} mm. Inspect farm drainage channels to avoid root waterlogging.`,
        ta: `மழை அளவு ${maxDailyRain} மி.மீ வரை எதிர்பார்க்கப்படுகிறது. வேர் அழுகலைத் தடுக்க வயல் வடிகால் வசதியை சரிபார்க்கவும்.`
      }
    });
  }

  // 2. High Rain Probability (Spray Caution)
  if (rainProb >= 55 && !alerts.some(a => a.id === "smart-heavy-rain")) {
    alerts.push({
      id: "smart-rain-prob",
      type: "AI/Smart Farming Alert",
      severity: "MEDIUM",
      icon: "🌦️",
      title: {
        en: "High Rain Probability Today",
        ta: "இன்று அதிக மழை வாய்ப்பு"
      },
      message: {
        en: `Precipitation probability is ${rainProb}%. Postpone foliar pesticide sprays and chemical fertilizers to prevent wash-off.`,
        ta: `மழை வாய்ப்பு ${rainProb}% ஆக உள்ளது. மருந்து நீரில் அடித்துச் செல்வதைத் தவிர்க்க தெளிப்பை ஒத்திவைக்கவும்.`
      }
    });
  }

  // 3. Strong Wind Expected
  if (wind >= 25) {
    alerts.push({
      id: "smart-strong-wind",
      type: "AI/Smart Farming Alert",
      severity: wind >= 35 ? "HIGH" : "MEDIUM",
      icon: "💨",
      title: {
        en: "Strong Winds Expected",
        ta: "பலத்த காற்று எச்சரிக்கை"
      },
      message: {
        en: `Wind speed reaching ${wind} km/h. Stake tall tomato/brinjal vines, secure nursery shade nets, and delay drone spraying.`,
        ta: `காற்றின் வேகம் ${wind} கி.மீ/மணி வரை வீசுகிறது. தக்காளி/கத்தரி செடிகளுக்கு முட்டுக் கொடுத்து பாதுகாக்கவும்.`
      }
    });
  }

  // 4. Extreme Heat / High Temperature
  if (temp >= 37 || maxDailyTemp >= 38) {
    alerts.push({
      id: "smart-heat-stress",
      type: "AI/Smart Farming Alert",
      severity: "HIGH",
      icon: "🔥",
      title: {
        en: "Extreme Heat Conditions",
        ta: "அதிக வெப்பம் & தாவர தளர்ச்சி"
      },
      message: {
        en: `Peak temperature reaching ${Math.max(temp, maxDailyTemp)}°C. Irrigate during early morning or night; mulch soil to conserve root moisture.`,
        ta: `வெப்பநிலை ${Math.max(temp, maxDailyTemp)}°C வரை எட்டுகிறது. அதிகாலை அல்லது இரவில் பாசனம் செய்யவும்; தழைக்கூளம் இடவும்.`
      }
    });
  }

  // 5. Low Temperature / Cold Stress
  if (temp <= 15 || minDailyTemp <= 15) {
    alerts.push({
      id: "smart-cold-stress",
      type: "AI/Smart Farming Alert",
      severity: "MEDIUM",
      icon: "❄️",
      title: {
        en: "Low Temperature Alert",
        ta: "குறைந்த வெப்பநிலை எச்சரிக்கை"
      },
      message: {
        en: `Night temperatures dropping to ${Math.min(temp, minDailyTemp)}°C. Monitor crops for cold stress and slow nutrient uptake.`,
        ta: `இரவு வெப்பநிலை ${Math.min(temp, minDailyTemp)}°C வரை குறைகிறது. பயிர் வளர்ச்சியை கவனமாக கண்காணிக்கவும்.`
      }
    });
  }

  // 6. High Humidity Fungal Warning
  if (humidity >= 80 && temp >= 22) {
    alerts.push({
      id: "smart-humidity-fungus",
      type: "AI/Smart Farming Alert",
      severity: "LOW",
      icon: "🍄",
      title: {
        en: "High Humidity & Fungal Risk",
        ta: "அதிக ஈரப்பதம் - பூஞ்சை ஆபத்து"
      },
      message: {
        en: `Relative humidity is ${humidity}%. Prolonged damp foliage favors fungal pathogens like Early & Late Blight. Inspect lower leaves.`,
        ta: `காற்றின் ஈரப்பதம் (${humidity}%) அதிகமாக உள்ளது. இலைக்கருகல் நோய் பரவாமல் இருக்க இலைகளைக் கண்காணிக்கவும்.`
      }
    });
  }

  // 7. Favorable Agricultural Conditions
  if (alerts.length === 0) {
    alerts.push({
      id: "smart-favorable-weather",
      type: "AI/Smart Farming Alert",
      severity: "LOW",
      icon: "✅",
      title: {
        en: "Suitable Conditions for Field Activities",
        ta: "களப் பணிகளுக்கு சாதகமான வானிலை"
      },
      message: {
        en: `Moderate temperature (${temp}°C) and gentle winds (${wind} km/h). Ideal window for weeding, routine harvesting, and scheduled foliar sprays.`,
        ta: `மிதமான வெப்பநிலை (${temp}°C) மற்றும் அமைதியான காற்று. களப் பணிகள் மற்றும் உரம் தெளிக்க உகந்த நேரம்.`
      }
    });
  }

  return alerts;
}

/**
 * Generate Agricultural Weather Insights (General farming recommendations derived from OpenWeather).
 */
export function generateAgriculturalInsights(current, daily = [], crop = 'Tomato') {
  const temp = typeof current.temperature === 'number' ? current.temperature : 28;
  const rain = typeof current.precipitation === 'number' ? current.precipitation : 0;
  const rainProb = typeof current.rainProbability === 'number' ? current.rainProbability : 0;
  const wind = typeof current.wind_speed === 'number' ? current.wind_speed : 8;
  const humidity = typeof current.humidity === 'number' ? current.humidity : 65;

  // Rain condition
  let rainGuidance = {
    en: "No significant rainfall expected. Standard irrigation schedule can be maintained.",
    ta: "குறிப்பிடத்தக்க மழை வாய்ப்பு இல்லை. வழக்கமான பாசன அட்டவணையைத் தொடரலாம்."
  };
  if (rain >= 4 || rainProb >= 50) {
    rainGuidance = {
      en: `Rain is expected (${rain} mm, ${rainProb}% chance). Consider postponing irrigation and outdoor spraying.`,
      ta: `மழை எதிர்பார்க்கப்படுகிறது (${rain} மி.மீ, ${rainProb}%). பாசனம் மற்றும் வெளிப்புற தெளிப்பை ஒத்திவைக்கவும்.`
    };
  }

  // High temperature condition
  let tempGuidance = {
    en: `Temperature is within normal vegetative development range (${temp}°C).`,
    ta: `வெப்பநிலை பயிர் வளர்ச்சிக்கு உகந்த வரம்பில் உள்ளது (${temp}°C).`
  };
  if (temp >= 35) {
    tempGuidance = {
      en: `High temperature expected (${temp}°C). Monitor crop water requirements and heat stress.`,
      ta: `அதிக வெப்பநிலை எதிர்பார்க்கப்படுகிறது (${temp}°C). பயிர் நீர் தேவைகள் மற்றும் வெப்ப அழுத்தத்தை கண்காணிக்கவும்.`
    };
  } else if (temp <= 16) {
    tempGuidance = {
      en: `Low temperature expected (${temp}°C). Monitor crops for cold stress and slow growth.`,
      ta: `குறைந்த வெப்பநிலை எதிர்பார்க்கப்படுகிறது (${temp}°C). குளிர் அழுத்தம் குறித்து கண்காணிக்கவும்.`
    };
  }

  // Wind condition
  let windGuidance = {
    en: `Wind speed is calm (${wind} km/h), suitable for spraying and field operations.`,
    ta: `காற்றின் வேகம் அமைதியாக உள்ளது (${wind} கி.மீ/மணி). தெளிப்புக்கு ஏற்றது.`
  };
  if (wind >= 22) {
    windGuidance = {
      en: `Strong winds expected (${wind} km/h). Avoid spraying and secure vulnerable plants/support structures.`,
      ta: `பலத்த காற்று எதிர்பார்க்கப்படுகிறது (${wind} கி.மீ/மணி). தெளிப்பைத் தவிர்த்து செடிகளை முட்டுக் கொடுத்து பாதுகாக்கவும்.`
    };
  }

  // Normal conditions summary
  let generalActivity = {
    en: "Weather conditions appear suitable for normal field activities.",
    ta: "வானிலை நிலவரம் வழக்கமான களப்பணிகளுக்கு ஏற்றதாக உள்ளது."
  };
  if (rain >= 5 || wind >= 25) {
    generalActivity = {
      en: "Adverse weather forecast. Postpone non-urgent field activities until conditions improve.",
      ta: "பாதகமான வானிலை முன்னறிவிப்பு. நிலைமை சீரடையும் வரை அவசரமற்ற பணிகளை ஒத்திவைக்கவும்."
    };
  }

  // Crop-Specific General Recommendations (Tomato / Potato / Brinjal)
  const cropAdvisories = {
    Tomato: {
      rainManagement: rainProb >= 50
        ? "Rain caution: Wet leaves foster Early Blight. Ensure staking lifts fruits away from soil splashes."
        : "Moderate humidity allows normal staking, pruning, and fruit cluster monitoring.",
      irrigation: temp >= 34
        ? "High evapotranspiration: Apply drip irrigation early morning (6-8 AM) to prevent blossom-end rot."
        : "Maintain standard moisture levels (40-60% field capacity).",
      sprayCaution: rainProb >= 45 || wind >= 20
        ? "Avoid spraying: Rain or wind will reduce fungicide contact efficiency."
        : "Optimal spray window: Calm air allows uniform leaf coverage."
    },
    Potato: {
      rainManagement: rain >= 5 || humidity >= 80
        ? "Excess moisture caution: Saturated ridges risk tuber rot and Late Blight spread. Clean furrows."
        : "Moderate soil conditions are optimal for ongoing tuber bulking.",
      irrigation: rainProb >= 50
        ? "Postpone irrigation: Upcoming rain will satisfy root moisture needs."
        : "Maintain steady soil moisture in top 15-20 cm; avoid water stress during tuber initiation.",
      sprayCaution: humidity >= 78
        ? "High fungal pressure: Monitor underside of leaves closely for watery brown lesions."
        : "Weather allows scheduled preventative biostimulant or fertilizer application."
    },
    Brinjal: {
      rainManagement: rain >= 5
        ? "Clear standing puddle water immediately to prevent damping-off in young brinjal plants."
        : "Well-drained soil conditions support active root aeration.",
      irrigation: temp >= 33
        ? "Heat stress caution: Frequent light irrigations keep root zone cool and preserve flowering."
        : "Standard furrow or drip irrigation schedule recommended.",
      sprayCaution: wind >= 20
        ? "Spray timing caution: Wind drift will cause uneven chemical deposit. Postpone to early morning."
        : "Calm conditions are suitable for targeted shoot borer spray."
    }
  };

  const selectedCropCare = cropAdvisories[crop] || cropAdvisories.Tomato;

  return {
    rainGuidance,
    tempGuidance,
    windGuidance,
    generalActivity,
    cropCare: selectedCropCare
  };
}
