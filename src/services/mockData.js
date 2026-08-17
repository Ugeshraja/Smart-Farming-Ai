// Comprehensive mock dataset for SmartFarm AI Platform
// Target crops: Tomato, Potato, Brinjal

export const generateLeafSvg = (crop, disease, isLime = false) => {
  const isHealthy = disease.toLowerCase().includes('healthy');
  let baseColor = isHealthy ? '#4CAF50' : '#81C784';
  let spotColor = disease.toLowerCase().includes('late blight') ? '#3E2723' 
                : disease.toLowerCase().includes('early blight') ? '#5D4037'
                : disease.toLowerCase().includes('spot') ? '#BF360C'
                : disease.toLowerCase().includes('mold') ? '#7CB342'
                : '#795548';

  if (isLime) {
    return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
      <rect width="400" height="400" fill="%23f1f5f9"/>
      <path d="M 200 40 C 320 120 340 280 200 360 C 60 280 80 120 200 40 Z" fill="${baseColor}" stroke="%232E7D32" stroke-width="4"/>
      <path d="M 200 40 L 200 360" stroke="%231B5E20" stroke-width="3"/>
      ${!isHealthy ? `
        <circle cx="170" cy="180" r="35" fill="${spotColor}" opacity="0.85"/>
        <circle cx="230" cy="220" r="28" fill="${spotColor}" opacity="0.8"/>
      ` : ''}
      <rect width="400" height="400" fill="black" opacity="0.25"/>
      <circle cx="170" cy="180" r="55" fill="%23ff0000" opacity="0.65"/>
      <circle cx="170" cy="180" r="35" fill="%23ffff00" opacity="0.75"/>
      <circle cx="230" cy="220" r="45" fill="%23ff0000" opacity="0.6"/>
      <rect x="15" y="15" width="170" height="32" rx="6" fill="%231e293b" opacity="0.9"/>
      <text x="25" y="36" fill="%234ade80" font-family="sans-serif" font-size="14" font-weight="bold">LIME AI Heatmap</text>
    </svg>`;
  }

  return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
    <rect width="400" height="400" fill="%23f8faf8"/>
    <path d="M 200 40 C 320 120 340 280 200 360 C 60 280 80 120 200 40 Z" fill="${baseColor}" stroke="%232E7D32" stroke-width="4"/>
    <path d="M 200 40 L 200 360" stroke="%231B5E20" stroke-width="3"/>
    ${!isHealthy ? `
      <circle cx="170" cy="180" r="35" fill="${spotColor}" opacity="0.85"/>
      <circle cx="230" cy="220" r="28" fill="${spotColor}" opacity="0.8"/>
    ` : ''}
    <rect x="15" y="15" width="140" height="32" rx="6" fill="%232E7D32" opacity="0.9"/>
    <text x="25" y="36" fill="white" font-family="sans-serif" font-size="14" font-weight="bold">${crop} Leaf</text>
  </svg>`;
};

// Initial predictions history dataset
export const mockPredictions = [
  {
    id: "PRED-1092",
    crop: "Tomato",
    disease: "Late Blight",
    confidence: 96.4,
    status: "Disease Detected",
    imageUrl: generateLeafSvg("Tomato", "Late Blight", false),
    limeImageUrl: generateLeafSvg("Tomato", "Late Blight", true),
    processingTime: "1.18 sec",
    createdAt: "2026-08-11 09:30 AM",
    farmerName: "UGESHRAJA S",
    location: "Tiruchengode, Tamil Nadu",
    iotSnapshot: {
      soilMoisture: "62%",
      temperature: "29.5°C",
      humidity: "76%",
      rainStatus: "No Rain"
    },
    advisory: {
      en: "Late Blight caused by Phytophthora infestans. Remove and destroy infected leaves immediately. Apply Copper Oxychloride (3g/L) or Mancozeb fungicide spray early in the morning.",
      ta: "தக்காளியில் Late Blight நோய் அதிக ஈரப்பதம் மற்றும் குளிர்ச்சியான சூழ்நிலையில் வேகமாக பரவக்கூடும். பாதிக்கப்பட்ட இலைகளை கண்காணித்து, பரிந்துரைக்கப்பட்ட வேளாண் நோய் மேலாண்மை முறைகளைப் பின்பற்றவும்."
    },
    preventiveMeasures: [
      "Avoid overhead irrigation to keep foliage dry.",
      "Ensure proper plant spacing for ventilation.",
      "Spray systemic fungicide Mancozeb 75% WP @ 2g/litre."
    ]
  },
  {
    id: "PRED-1091",
    crop: "Potato",
    disease: "Early Blight",
    confidence: 94.1,
    status: "Disease Detected",
    imageUrl: generateLeafSvg("Potato", "Early Blight", false),
    limeImageUrl: generateLeafSvg("Potato", "Early Blight", true),
    processingTime: "1.05 sec",
    createdAt: "2026-08-10 04:15 PM",
    farmerName: "UGESHRAJA S",
    location: "Tiruchengode, Tamil Nadu",
    iotSnapshot: {
      soilMoisture: "58%",
      temperature: "31.0°C",
      humidity: "68%",
      rainStatus: "No Rain"
    },
    advisory: {
      en: "Early Blight (Alternaria solani) causes concentric rings on potato foliage. Spray Chlorothalonil (2g/L) or Azoxystrobin to protect crop yield.",
      ta: "உருளைக்கிழங்கு இலையில் வளையப் புள்ளிகளை ஏற்படுத்தும் ஏர்லி பிளைட் நோய். குளோரோதலோனில் (2g/L) தெளிக்கவும்."
    },
    preventiveMeasures: [
      "Rotate crops with non-solanaceous plants.",
      "Maintain adequate nitrogen fertilizer levels.",
      "Remove bottom old leaves showing early symptoms."
    ]
  }
];

// ESP32 real-time IoT sensor telemetry history (24 hours)
export const mockSensorHistory = [
  { time: "00:00", temperature: 24.2, humidity: 85, soilMoisture: 68, rain: false },
  { time: "03:00", temperature: 23.5, humidity: 88, soilMoisture: 67, rain: false },
  { time: "06:00", temperature: 25.0, humidity: 82, soilMoisture: 65, rain: false },
  { time: "09:00", temperature: 28.1, humidity: 74, soilMoisture: 64, rain: false },
  { time: "12:00", temperature: 31.4, humidity: 62, soilMoisture: 60, rain: false },
  { time: "15:00", temperature: 32.8, humidity: 58, soilMoisture: 57, rain: false },
  { time: "18:00", temperature: 29.5, humidity: 76, soilMoisture: 62, rain: false },
  { time: "21:00", temperature: 26.8, humidity: 80, soilMoisture: 64, rain: true },
];

export const mockLatestSensors = {
  soilMoisture: 62,
  temperature: 29.5,
  humidity: 76,
  rainDetected: false,
  timestamp: "Just now",
  status: "Optimal"
};

export const mockRecentSensorActivity = [
  { id: 1, type: "Moisture", message: "Soil moisture updated to 62% via ESP32 Node #1", time: "5 mins ago" },
  { id: 2, type: "Rain", message: "Rain sensor pin LOW (No Rain detected)", time: "12 mins ago" },
  { id: 3, type: "Temperature", message: "Canopy temp recorded 29.5°C", time: "25 mins ago" },
  { id: 4, type: "Sync", message: "ESP32 WiFi packet payload transmitted successfully", time: "40 mins ago" }
];

export const mockAiInsights = [
  {
    id: 1,
    type: "warning",
    title: { en: "High Humidity & Leaf Moisture Alert", ta: "அதிக ஈரப்பதம் மற்றும் இலை ஈரப்பதம் எச்சரிக்கை" },
    description: { 
      en: "Current ambient humidity is 76%. High humidity creates ideal conditions for Phytophthora infestans (Tomato & Potato Late Blight). Inspect crop foliage closely.",
      ta: "தற்போதைய காற்று ஈரப்பதம் 76% ஆக உள்ளது. அதிக ஈரப்பதம் தக்காளி மற்றும் உருளைக்கிழங்கு பயிர்களில் லேட் பிளைட் நோய் பரவுவதற்கு சாதகமானது." 
    },
    action: "Schedule preventive Copper spray"
  },
  {
    id: 2,
    type: "info",
    title: { en: "Optimal Irrigation Level", ta: "சரியான பாசன அளவு" },
    description: { 
      en: "Soil moisture is currently at 62%, which is within the target 60-70% root zone requirement for Solanaceae crops.",
      ta: "மண் ஈரப்பதம் தற்போது 62% ஆக உள்ளது. இது தக்காளி, உருளை, கத்தரி பயிர்களின் வேர் மண்டலத்திற்கு ஏற்றது."
    },
    action: "Keep automated drip off"
  }
];

export const mockCommunityPosts = [
  {
    id: "POST-101",
    farmerName: "Murugan K.",
    createdAt: "2 hours ago",
    crop: "Tomato",
    topic: "Leaf Spot",
    language: "ta",
    content: "என் தக்காளி செடியில் இலைகளில் பழுப்பு நிற புள்ளிகள் காணப்படுகின்றன. இதற்கு என்ன காரணம்? இயற்கை முறையில் இதை எப்படி கட்டுப்படுத்துவது?",
    imageUrl: null,
    likes: 14,
    comments: [
      {
        id: "C-1",
        author: "Senthil Kumar",
        time: "1 hour ago",
        text: "இது லேட் பிளைட் நோயாக இருக்கலாம். காப்பர் ஆக்ஸிகுளோரைடு அல்லது வேப்பங்கொட்டை சாறு தெளிக்கலாம்."
      }
    ]
  }
];

// WEATHER MOCK DATA
export const mockCurrentWeather = {
  location: "Tiruchengode, Tamil Nadu, India",
  temperature: 29,
  condition: "Partly Cloudy",
  conditionTa: "மேகமூட்டம்",
  humidity: 76,
  rainProbability: 30,
  windSpeed: 12,
  uvIndex: 6,
  highTemp: 31,
  lowTemp: 24,
  updatedAt: "Just now"
};

export const mock7DayForecast = [
  { day: "Today", dayTa: "இன்று", icon: "🌤️", condition: "Partly Cloudy", conditionTa: "மேகமூட்டம்", maxTemp: 31, minTemp: 24, rainProb: 30 },
  { day: "Tomorrow", dayTa: "நாளை", icon: "🌧️", condition: "Heavy Rain Expected", conditionTa: "கனமழை வாய்ப்பு", maxTemp: 28, minTemp: 23, rainProb: 75 },
  { day: "Wednesday", dayTa: "புதன்", icon: "🌦️", condition: "Light Showers", conditionTa: "லேசான தூறல்", maxTemp: 29, minTemp: 23, rainProb: 50 },
  { day: "Thursday", dayTa: "வியாழன்", icon: "⛅", condition: "Scattered Clouds", conditionTa: "சிதறிய மேகங்கள்", maxTemp: 30, minTemp: 24, rainProb: 20 },
  { day: "Friday", dayTa: "வெள்ளி", icon: "☀️", condition: "Sunny & Warm", conditionTa: "தெளிவான வானிலை", maxTemp: 33, minTemp: 25, rainProb: 10 },
  { day: "Saturday", dayTa: "சனி", icon: "☀️", condition: "High Temperature", conditionTa: "அதிக வெப்பநிலை", maxTemp: 34, minTemp: 25, rainProb: 5 },
  { day: "Sunday", dayTa: "ஞாயிறு", icon: "🌬️", condition: "Windy & Mild", conditionTa: "பலத்த காற்று", maxTemp: 31, minTemp: 24, rainProb: 15 },
];

export const mockHourlyForecast = [
  { time: "09:00 AM", temp: 27, icon: "🌤️", condition: "Partly Cloudy", rainProb: 10 },
  { time: "12:00 PM", temp: 31, icon: "☀️", condition: "Sunny", rainProb: 15 },
  { time: "03:00 PM", temp: 30, icon: "🌤️", condition: "Humid", rainProb: 30 },
  { time: "06:00 PM", temp: 28, icon: "🌦️", condition: "Light Rain", rainProb: 60 },
  { time: "09:00 PM", temp: 26, icon: "🌧️", condition: "Thunder Showers", rainProb: 75 },
  { time: "12:00 AM", temp: 24, icon: "🌧️", condition: "Rainy", rainProb: 70 },
  { time: "03:00 AM", temp: 23, icon: "☁️", condition: "Cloudy", rainProb: 40 },
  { time: "06:00 AM", temp: 24, icon: "🌅", condition: "Clear Morning", rainProb: 20 },
];

export const mockFarmerWeatherAlerts = [
  {
    id: "ALT-1",
    type: "Heavy Rain",
    typeTa: "கனமழை எச்சரிக்கை",
    severity: "HIGH",
    icon: "🌧️",
    title: { en: "Heavy Rain Forecast (75% Chance)", ta: "கனமழை வாய்ப்பு (75%)" },
    message: { 
      en: "High rainfall is expected tomorrow. Avoid unnecessary irrigation and monitor field drainage to prevent waterlogging in roots.",
      ta: "நாளை கனமழை பெய்யக்கூடும். தேவையற்ற பாசனத்தைத் தவிர்க்கவும் மற்றும் வடிகால் வசதியை சரிபார்க்கவும்."
    }
  },
  {
    id: "ALT-2",
    type: "High Humidity",
    typeTa: "அதிக ஈரப்பதம் எச்சரிக்கை",
    severity: "HIGH",
    icon: "💧",
    title: { en: "High Humidity Alert (76%)", ta: "அதிக ஈரப்பதம் (76%)" },
    message: { 
      en: "High humidity is expected. Monitor crop leaves regularly because humid conditions can favor fungal disease development (Late Blight).",
      ta: "அதிக ஈரப்பதம் இலைகளில் பூஞ்சை நோய்களை உருவாக்கலாம். பயிர் இலைகளை அடிக்கடி கண்காணிக்கவும்."
    }
  }
];

export const mockCropWeatherInsights = {
  Tomato: {
    title: { en: "Tomato Crop Weather Guidance", ta: "தக்காளி பயிர் வானிலை வழிகாட்டுதல்" },
    insight: {
      en: "Current weather conditions (High humidity 76% + rain probability 30%) may favor fungal disease development. Monitor tomato leaves regularly and avoid excessive overhead irrigation.",
      ta: "தற்போதைய வானிலை (76% ஈரப்பதம் + 30% மழை வாய்ப்பு) பூஞ்சை நோய் பரவ சாதகமானது. தக்காளி இலைகளை தவறாமல் கண்காணிக்கவும்."
    }
  },
  Potato: {
    title: { en: "Potato Crop Weather Guidance", ta: "உருளைக்கிழங்கு பயிர் வானிலை வழிகாட்டுதல்" },
    insight: {
      en: "Cool and wet weather conditions forecasted for tomorrow may increase the need for closer foliage monitoring to prevent tuber rot.",
      ta: "குளிர்ச்சியான மற்றும் ஈரமான வானிலை உருளைக்கிழங்கு கிழங்கு அழுகலைத் தடுக்க கூடுதல் கண்காணிப்பை கோருகிறது."
    }
  },
  Brinjal: {
    title: { en: "Brinjal Crop Weather Guidance", ta: "கத்தரி பயிர் வானிலை வழிகாட்டுதல்" },
    insight: {
      en: "High humidity and prolonged leaf wetness may increase crop leaf spot risks. Keep lower leaves pruned for adequate air movement.",
      ta: "அதிக ஈரப்பதம் மற்றும் இலைகளில் நீர் தேங்குதல் இலைப்புள்ளி நோயை அதிகரிக்கலாம். காற்றோட்டத்திற்காக கீழ் இலைகளை கவாத்து செய்யவும்."
    }
  }
};

export const mockFieldVsWeather = {
  externalWeather: {
    temperature: 30,
    humidity: 74,
    rainProb: 70,
    source: "External Weather API"
  },
  esp32Sensor: {
    temperature: 29.5,
    humidity: 76,
    soilMoisture: 62,
    source: "ESP32 Field Node #1"
  }
};

// ==================================================
// NEW MODULE: AGRICULTURE LIBRARY MOCK DATA
// ==================================================

export const mockLibraryCategories = [
  { id: "tomato", icon: "🍅", titleEn: "Tomato", titleTa: "தக்காளி", count: 8 },
  { id: "potato", icon: "🥔", titleEn: "Potato", titleTa: "உருளைக்கிழங்கு", count: 6 },
  { id: "brinjal", icon: "🍆", titleEn: "Brinjal", titleTa: "கத்தரிக்காய்", count: 7 },
  { id: "diseases", icon: "🦠", titleEn: "Crop Diseases", titleTa: "பயிர் நோய்கள்", count: 12 },
  { id: "pests", icon: "🐛", titleEn: "Pest Management", titleTa: "பூச்சி மேலாண்மை", count: 9 },
  { id: "soil", icon: "🌱", titleEn: "Soil Management", titleTa: "மண் மேலாண்மை", count: 5 },
  { id: "irrigation", icon: "💧", titleEn: "Irrigation", titleTa: "நீர்ப்பாசனம்", count: 6 },
  { id: "management", icon: "🌾", titleEn: "Crop Management", titleTa: "பயிர் மேலாண்மை", count: 10 },
  { id: "organic", icon: "🌿", titleEn: "Organic Farming", titleTa: "இயற்கை விவசாயம்", count: 7 },
  { id: "guidelines", icon: "📖", titleEn: "Agricultural Guidelines", titleTa: "வேளாண் வழிகாட்டுதல்கள்", count: 15 },
];

export const mockLibraryArticles = [
  {
    id: "LIB-101",
    cropId: "tomato",
    category: "Crop Diseases",
    titleEn: "Tomato Foliar Disease Management & Control",
    titleTa: "தக்காளி இலைக்கருகல் நோய் மேலாண்மை மற்றும் கட்டுப்பாடு",
    summaryEn: "Comprehensive guide to identifying Late Blight, Early Blight, Leaf Mold, and Bacterial Spot in Solanum lycopersicum.",
    summaryTa: "தக்காளி பயிரில் லேட் பிளைட், ஏர்லி பிளைட் மற்றும் இலைப்புள்ளி நோய்களைக் கண்டறிந்து கட்டுப்படுத்தும் முறை.",
    sections: {
      overview: {
        en: "Tomatoes are susceptible to foliage fungal pathogens under high ambient humidity (>70%) and moderate temperatures (20-30°C). Early detection prevents field yield loss up to 80%.",
        ta: "தக்காளி பயிர் 70% மேல் காற்று ஈரப்பதம் இருக்கும்போது பூஞ்சை நோய்களால் பாதிக்கப்படக்கூடியது."
      },
      growingConditions: {
        en: "Optimal canopy temp: 21–29°C. Requires well-drained loamy soil with pH 6.0–6.8 and 6-8 hours of direct sunlight daily.",
        ta: "வளர்ச்சி வெப்பநிலை: 21–29°C. நல்ல வடிகால் வசதியுள்ள செம்மண் ஏற்றது."
      },
      commonDiseases: {
        en: "1. Late Blight (Phytophthora infestans): Water-soaked lesions.\n2. Early Blight (Alternaria solani): Concentric target rings.\n3. Bacterial Spot: Small dark greasy specks.",
        ta: "1. லேட் பிளைட்: நீர் கோர்த்த கருமை புள்ளிகள்.\n2. ஏர்லி பிளைட்: வளைய வடிவ புள்ளிகள்."
      },
      commonPests: {
        en: "Fruit Borer (Helicoverpa armigera), Whiteflies (Bemisia tabaci), Leafminers.",
        ta: "காய் துளைப்பான், வெள்ளை ஈ, இலைச் சுரங்கப் பூச்சி."
      },
      irrigation: {
        en: "Maintain 60-70% root zone moisture. Prefer automated drip lines over overhead sprinklers to eliminate leaf canopy wetness.",
        ta: "மண் ஈரப்பதத்தை 60-70% அளவில் பராமரிக்கவும். சொட்டுநீர்ப் பாசனம் மிகவும் ஏற்றது."
      },
      soil: {
        en: "Requires rich organic matter content (>2%). Apply Trichoderma viride @ 2.5 kg/ha mixed with FYM at land preparation.",
        ta: "இயற்கை உரம் மற்றும் டிரைக்கோடெர்மா விரிடி பயன்படுத்தவும்."
      },
      management: {
        en: "Prune lower leaves touch soil surface. Apply yellow sticky traps @ 12 traps/acre. Spray Mancozeb 75% WP @ 2g/L early morning.",
        ta: "கீழ் இலைகளை கவாத்து செய்யவும். மஞ்சள் ஒட்டும் பொறிகளைப் பயன்படுத்தவும்."
      },
      harvest: {
        en: "Harvest at breaker stage for long-distance transport or mature red stage for immediate local market consumption.",
        ta: "சந்தைப் பயன்பாட்டிற்கு ஏற்ப சரியான முதிர்ச்சி நிலையில் அறுவடை செய்யவும்."
      }
    }
  },
  {
    id: "LIB-102",
    cropId: "potato",
    category: "Crop Management",
    titleEn: "Potato Tuber Production & Storage Guidelines",
    titleTa: "உருளைக்கிழங்கு பயிர் சாகுபடி மற்றும் சேமிப்பு முறைகள்",
    summaryEn: "Standard operating procedures for seed tuber treatment, earthing-up, and preventing Alternaria foliage blight.",
    summaryTa: "உருளைக்கிழங்கு விதை சிகிச்சை, மண் அணைத்தல் மற்றும் ஏர்லி பிளைட் நோய் மேலாண்மை வழிகாட்டுதல்கள்.",
    sections: {
      overview: {
        en: "Potatoes (Solanum tuberosum) require cool climate with cool night temperatures for optimum tuber initiation.",
        ta: "உருளைக்கிழங்கு குளிர்ந்த காலநிலை விரும்பும் பயிராகும்."
      },
      growingConditions: {
        en: "Temperature 15–20°C for tuber formation. High temperatures (>30°C) reduce tuberization drastically.",
        ta: "கிழங்கு உருவாக 15–20°C வெப்பநிலை சிறந்தது."
      },
      commonDiseases: {
        en: "Late Blight, Early Blight, Blackleg, Bacterial Wilt.",
        ta: "லேட் பிளைட், ஏர்லி பிளைட், பாக்டீரியா வாடல் நோய்."
      },
      commonPests: {
        en: "Potato Tuber Moth, Aphids, Cutworms.",
        ta: "கிழங்கு அந்துப்பூச்சி, அசுவினி."
      },
      irrigation: {
        en: "Critical watering stages: Stolonization and Tuber bulking. Stop watering 10 days prior to harvest.",
        ta: "கிழங்கு பெருக்கம் அடையும் போது போதுமான பாசனம் அவசியம்."
      },
      soil: {
        en: "Friable, loose, well-drained sandy loam soil rich in humus.",
        ta: "இகுவான நல்ல வடிகால் வசதியுள்ள மணல் சார்ந்த நிலம்."
      },
      management: {
        en: "Earthing up after 30-35 days to prevent tuber greening by direct sunlight. Apply balanced Nitrogen.",
        ta: "35 நாட்களுக்கு பின் கிழங்குகளுக்கு மண் அணைக்கவும்."
      },
      harvest: {
        en: "Cut haulms 10-15 days before harvest to harden tuber skin.",
        ta: "அறுவடைக்கு 10 நாட்களுக்கு முன் செடிகளை வெட்டி கிழங்கின் தோலை கடினமாக்கவும்."
      }
    }
  },
  {
    id: "LIB-103",
    cropId: "brinjal",
    category: "Pest Management",
    titleEn: "Brinjal Shoot & Fruit Borer Management",
    titleTa: "கத்தரி தண்டு மற்றும் காய் துளைப்பான் மேலாண்மை",
    summaryEn: "Integrated Pest Management (IPM) practices using pheromone traps, neem formulations, and bio-pesticides.",
    summaryTa: "மோகப் பொறிகள் மற்றும் வேப்பம்பருப்பு சாறு பயன்படுத்தி கத்தரி பூச்சி மேலாண்மை.",
    sections: {
      overview: {
        en: "Leucinodes orbonalis is the most destructive pest of eggplant causing drooping shoots and bored fruits.",
        ta: "கத்தரியில் தண்டு மற்றும் காய் துளைப்பான் பிரதான பூச்சியாகும்."
      },
      growingConditions: {
        en: "Warm season crop. Thrives in 25–35°C ambient temperatures.",
        ta: "வெப்பமான காலநிலை 25–35°C ஏற்றது."
      },
      commonDiseases: {
        en: "Little Leaf Disease (Phytoplasma), Cercospora Leaf Spot, Damping Off.",
        ta: "சிறிய இலை நோய், சர்கோஸ்போரா இலைப்புள்ளி நோய்."
      },
      commonPests: {
        en: "Shoot and Fruit Borer, Epilachna Beetle, Leafhoppers, Mites.",
        ta: "தண்டு காய் துளைப்பான், எபிலாச்னா வண்டு, இலைத் தட்டான்."
      },
      irrigation: {
        en: "Regular irrigation every 5-7 days depending on soil type. Avoid water stagnation.",
        ta: "5-7 நாட்களுக்கு ஒருமுறை பாசனம் செய்யவும்."
      },
      soil: {
        en: "Deep silt loam or clay loam soils with organic compost.",
        ta: "களிமண் சார்ந்த வளமான நிலம்."
      },
      management: {
        en: "Install Lucinure pheromone traps @ 12/acre. Clip wilted shoots displaying borer damage weekly. Spray NSKE 5%.",
        ta: "மோகப் பொறிகளை அமைத்து வாடிய தண்டுகளை பிடுங்கி அழிக்கவும்."
      },
      harvest: {
        en: "Harvest tender glossy fruits before seed hardening occurs.",
        ta: "விதை கடினமாவதற்கு முன் இளஞ்சத்தான காய்களை அறுவடை செய்யவும்."
      }
    }
  }
];

// ==================================================
// NEW MODULE: FARMING PLANNER MOCK DATA
// ==================================================

export const mockFarmPlan = {
  id: "PLAN-2026-01",
  crop: "Tomato",
  location: "Tiruchengode, Tamil Nadu",
  plantingDate: "2026-09-01",
  expectedHarvestDate: "2026-11-25",
  farmSize: "2.5 Acres",
  currentStage: "Vegetative Growth",
  stageProgress: 40 // %
};

export const mockCropTimelineStages = {
  Tomato: [
    { id: 1, nameEn: "Planting", nameTa: "விதைப்பு", duration: "Day 1 - 7" },
    { id: 2, nameEn: "Seedling", nameTa: "நாற்று நிலை", duration: "Day 8 - 20" },
    { id: 3, nameEn: "Vegetative Growth", nameTa: "வளர்ச்சி நிலை", duration: "Day 21 - 40", active: true },
    { id: 4, nameEn: "Flowering", nameTa: "பூக்கும் நிலை", duration: "Day 41 - 55" },
    { id: 5, nameEn: "Fruit Development", nameTa: "காய் வளர்ச்சி", duration: "Day 56 - 75" },
    { id: 6, nameEn: "Pest & Disease Control", nameTa: "நோய் தடுப்பு", duration: "Day 76 - 85" },
    { id: 7, nameEn: "Harvest", nameTa: "அறுவடை", duration: "Day 86 - 100" }
  ],
  Potato: [
    { id: 1, nameEn: "Tuber Planting", nameTa: "கிழங்கு நடுதல்", duration: "Day 1 - 10" },
    { id: 2, nameEn: "Sprouting", nameTa: "முளைத்தல்", duration: "Day 11 - 25" },
    { id: 3, nameEn: "Vegetative Canopy", nameTa: "இலை வளர்ச்சி", duration: "Day 26 - 45", active: true },
    { id: 4, nameEn: "Tuber Initiation", nameTa: "கிழங்கு தொடக்கம்", duration: "Day 46 - 65" },
    { id: 5, nameEn: "Tuber Bulking", nameTa: "கிழங்கு பெருக்கம்", duration: "Day 66 - 85" },
    { id: 6, nameEn: "Harvest", nameTa: "அறுவடை", duration: "Day 86 - 100" }
  ],
  Brinjal: [
    { id: 1, nameEn: "Nursery & Transplanting", nameTa: "நாற்று நடுதல்", duration: "Day 1 - 15" },
    { id: 2, nameEn: "Vegetative Growth", nameTa: "வளர்ச்சி நிலை", duration: "Day 16 - 35", active: true },
    { id: 3, nameEn: "Flowering & Branching", nameTa: "பூத்தல் & கிளைத்தல்", duration: "Day 36 - 55" },
    { id: 4, nameEn: "Fruit Setting", nameTa: "காய் பிடித்தல்", duration: "Day 56 - 80" },
    { id: 5, nameEn: "Multiple Picking", nameTa: "தொடர் அறுவடை", duration: "Day 81 - 120" }
  ]
};

export const mockFarmActivities = [
  {
    id: "ACT-101",
    nameEn: "Disease & Foliar Inspection",
    nameTa: "நோய் & இலை ஆய்வு",
    category: "Disease Monitoring",
    date: "2026-09-02",
    descriptionEn: "Inspect lower leaves for dark water-soaked spots (Late Blight). Use AI Crop Disease Scanner.",
    descriptionTa: "இலைகளில் நீர் கோர்த்த கருமை புள்ளிகளை ஆய்வு செய்ய AI கேமராவைப் பயன்படுத்தவும்.",
    status: "Upcoming", // Upcoming | In Progress | Completed | Skipped
    weatherAwareAlert: "🌧️ Rain probability 75% tomorrow — Heavy rain expected. Avoid foliage spray before rain."
  },
  {
    id: "ACT-102",
    nameEn: "Automated Drip Irrigation",
    nameTa: "சொட்டுநீர்ப் பாசனம்",
    category: "Irrigation",
    date: "2026-09-03",
    descriptionEn: "Maintain soil root moisture at 62-65%. Run drip for 45 mins.",
    descriptionTa: "மண் ஈரப்பதத்தை 62% அளவில் பராமரிக்க 45 நிமிடங்கள் சொட்டுநீர் பாசனம் செய்யவும்.",
    status: "Upcoming",
    weatherAwareAlert: "💧 Rain expected tomorrow. Review scheduled irrigation activity to avoid waterlogging."
  },
  {
    id: "ACT-103",
    nameEn: "Bio-Nutrient Top Dressing",
    nameTa: "இயற்கை உரம் இடுதல்",
    category: "Nutrient Management",
    date: "2026-09-07",
    descriptionEn: "Apply Neem cake & FYM organic compost at plant root base.",
    descriptionTa: "செடிகளின் வேர் பகுதியில் வேப்பம்பிண்ணாக்கு மற்றும் இயற்கை உரம் இடவும்.",
    status: "Upcoming",
    weatherAwareAlert: null
  },
  {
    id: "ACT-104",
    nameEn: "Staking & Trellising Support",
    nameTa: "முட்டுக் கம்புகள் கட்டுதல்",
    category: "Crop Management",
    date: "2026-08-28",
    descriptionEn: "Tie tomato branches to wooden stakes to keep heavy foliage off soil.",
    descriptionTa: "தக்காளி கிளைகளை கம்புகளில் கட்டி தரையில் படர்வதைத் தவிர்க்கவும்.",
    status: "Completed",
    weatherAwareAlert: null
  }
];

export const mockMonthlyCalendarEvents = [
  { day: 1, title: "🌱 Planting", type: "planting" },
  { day: 5, title: "💧 Irrigation Monitoring", type: "irrigation" },
  { day: 12, title: "🔍 Disease Monitoring", type: "disease" },
  { day: 18, title: "🌿 Crop Monitoring", type: "crop" },
  { day: 25, title: "🌧️ Weather Check", type: "weather" }
];
