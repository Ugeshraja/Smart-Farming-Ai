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
// SMART CROP & HARVEST PLANNER CONFIGS & DATA
// ==================================================

export const mockCropPlanningConfigs = {
  Tomato: {
    id: 'Tomato',
    nameEn: 'Tomato',
    nameTa: 'தக்காளி',
    icon: '🍅',
    variety: 'Hybrid (Arka Rakshak / PKM-1 / Sivam)',
    varietyTa: 'அர்கா ரக்ஷக் / பி.கே.எம்-1 / சிவம்',
    growthDurationDays: 100,
    growthDurationLabelEn: '90 – 110 Days',
    growthDurationLabelTa: '90 – 110 நாட்கள்',
    recommendedPlantingSeasonEn: 'June – July (Kharif) & Nov – Dec (Rabi)',
    recommendedPlantingSeasonTa: 'ஜூன் – ஜூலை (காரிப்) & நவம்பர் – டிசம்பர் (ரபி)',
    bestHarvestSeasonEn: 'September – November & February – April',
    bestHarvestSeasonTa: 'செப்டம்பர் – நவம்பர் & பிப்ரவரி – ஏப்ரல்',
    expectedYieldEn: '25 – 35 Tonnes / Acre',
    expectedYieldTa: '25 – 35 டன் / ஏக்கர்',
    harvestStartDayOffset: 75,
    bestHarvestStartDayOffset: 80,
    bestHarvestEndDayOffset: 95,
    harvestEndDayOffset: 105,
    harvestReadinessCriteria: {
      en: "Color transition from green to pink/breaker stage for transport, or deep red firm ripe for local markets. Calyx firmly attached with pleasant aroma.",
      ta: "தொலைதூர விற்பனைக்கு இளஞ்சிவப்பு நிறம்; உள்ளூர் சந்தைக்கு அடர் சிவப்பு நிறம். பளபளப்பான, கெட்டியான பழங்கள்."
    },
    maturityTips: [
      { en: "Pick in early morning or late afternoon to minimize field heat loss.", ta: "வெப்பத்தால் பழம் மென்மையாவதைத் தவிர்க்க அதிகாலை அல்லது மாலையில் அறுவடை செய்யவும்." },
      { en: "Harvest with smooth calyx attached to extend market shelf-life by 4-6 days.", ta: "காம்புடன் அறுவடை செய்வது பழத்தின் ஆயுளை 4-6 நாட்கள் வரை நீட்டிக்கும்." },
      { en: "Sort into plastic crates with newspaper liners; avoid piling more than 3 layers.", ta: "பிளாஸ்டிக் பெட்டிகளில் 3 அடுக்குகளுக்கு மேல் அடுக்காமல் நிழலில் வைக்கவும்." }
    ],
    stages: [
      { id: 1, nameEn: "Nursery & Transplanting", nameTa: "நாற்று நடுதல்", startDay: 1, endDay: 15, duration: "Day 1 - 15", practicesEn: "Raised nursery bed, seed treatment with Trichoderma, 25-day seedlings transplanting at 60x45cm spacing.", practicesTa: "மேட்டுப்பாத்தி அமைத்து டிரைக்கோடெர்மா விதை நேர்த்தி செய்து 25 நாள் நாற்றுகளை நடவும்." },
      { id: 2, nameEn: "Root Establishment", nameTa: "வேர் பிடித்தல் & வளர்ச்சி", startDay: 16, endDay: 30, duration: "Day 16 - 30", practicesEn: "Maintain uniform soil moisture. Gap filling within 7 days. First bio-fertilizer application (Azospirillum).", practicesTa: "மண் ஈரப்பதத்தை சீராக பராமரித்து, இடைவெளி நிரப்புதல் மற்றும் அசோஸ்பைரில்லம் இடவும்." },
      { id: 3, nameEn: "Vegetative Canopy & Staking", nameTa: "இலை வளர்ச்சி & முட்டுக் கட்டுதல்", startDay: 31, endDay: 48, duration: "Day 31 - 48", practicesEn: "Side shoot pruning, bamboo staking, NPK 19:19:19 fertigation, weed management.", practicesTa: "முட்டுக் கம்புகள் கட்டி செடிகளை தாங்கச் செய்தல், 19:19:19 உரம் மற்றும் களை மேலாண்மை." },
      { id: 4, nameEn: "Flowering & Fruit Setting", nameTa: "பூத்தல் & காய் பிடித்தல்", startDay: 49, endDay: 65, duration: "Day 49 - 65", practicesEn: "Foliar spray of Boron (1g/L) & Planofix for flower retention. Avoid moisture stress.", practicesTa: "பூ உதிர்வதைத் தடுக்க போரான் மற்றும் பிளனோபிக்ஸ் தெளிக்கவும். நீர் தட்டுப்பாடு தவிர்க்கவும்." },
      { id: 5, nameEn: "Fruit Development & Sizing", nameTa: "காய் பெருக்கம் & முதிர்ச்சி", startDay: 66, endDay: 74, duration: "Day 66 - 74", practicesEn: "Apply Calcium Nitrate against Blossom End Rot. High potassium fertigation (0:0:50).", practicesTa: "அடி அழுகல் நோயைத் தடுக்க கால்சியம் நைட்ரேட் மற்றும் பொட்டாஷ் உரம் அளிக்கவும்." },
      { id: 6, nameEn: "Disease & Pest Monitoring", nameTa: "நோய் & பூச்சி கண்காணிப்பு", startDay: 50, endDay: 85, duration: "Day 50 - 85", practicesEn: "Scout lower leaves for Early/Late Blight lesions. Install pheromone traps for fruit borer.", practicesTa: "பிளைட் இலைப்புள்ளிகளை ஆய்வு செய்து, பழத்துளைப்பானுக்கு இனக்கவர்ச்சி பொறிகளை அமைக்கவும்." },
      { id: 7, nameEn: "Expected Harvest Start", nameTa: "அறுவடை தொடக்கம்", startDay: 75, endDay: 79, duration: "Day 75 - 79", practicesEn: "First picking of breaker stage tomatoes. Handle gently in cushioned crates.", practicesTa: "முதல் கட்ட அறுவடை தொடக்கம். காயம் படாமல் பெட்டிகளில் சேகரிக்கவும்." },
      { id: 8, nameEn: "Peak Best Harvesting Period", nameTa: "உச்சக்கட்ட அறுவடை காலம்", startDay: 80, endDay: 95, duration: "Day 80 - 95", practicesEn: "Peak harvest rounds every 3-4 days. Uniform color grading, shade cooling.", practicesTa: "3-4 நாட்களுக்கு ஒருமுறை தொடர் அறுவடை. தரம் பிரித்து நிழலில் வைக்கவும்." },
      { id: 9, nameEn: "Final Harvest & Field Clearance", nameTa: "இறுதி அறுவடை & நிலம் தூய்மை", startDay: 96, endDay: 105, duration: "Day 96 - 105", practicesEn: "Final picking, residue clearing, soil solarization for next crop cycle.", practicesTa: "இறுதி அறுவடை முடித்து, நிலத்தை அடுத்த பயிருக்கு தயார் செய்யவும்." }
    ],
    activities: [
      {
        id: "ACT-TOM-01",
        nameEn: "Soil Preparation & Basal Organic Compost",
        nameTa: "நிலம் உழுதல் & அடி உரம் இடுதல்",
        category: "Fertilizer",
        dayOffset: 1,
        descriptionEn: "Apply 10 tonnes FYM compost + Neem cake 100kg + Trichoderma viride 2kg/acre during ploughing.",
        descriptionTa: "கடைசி உழவின் போது 10 டன் தொழு உரம், 100 கிலோ வேப்பம்பிண்ணாக்கு மற்றும் டிரைக்கோடெர்மா இடவும்.",
        weatherAwareAlert: "☀️ Ensure field is ploughed in dry soil conditions before heavy rains begin."
      },
      {
        id: "ACT-TOM-02",
        nameEn: "Automated Root-Zone Drip Irrigation",
        nameTa: "சொட்டுநீர்ப் பாசனம்",
        category: "Irrigation",
        dayOffset: 16,
        descriptionEn: "Run drip irrigation to maintain 60-65% soil moisture at root level. Avoid surface puddling.",
        descriptionTa: "வேர் பகுதியில் 60-65% மண் ஈரப்பதத்தை பராமரிக்க 45 நிமிடங்கள் சொட்டுநீர் பாசனம் செய்யவும்.",
        weatherAwareAlert: "💧 Check upcoming rain forecast — reduce irrigation cycle if rainfall exceeds 15mm."
      },
      {
        id: "ACT-TOM-03",
        nameEn: "Staking & Trellising Support",
        nameTa: "முட்டுக் கம்புகள் கட்டுதல்",
        category: "Crop Management",
        dayOffset: 35,
        descriptionEn: "Erect bamboo stakes and tie tomato branches using twine to prevent soil-borne pathogens.",
        descriptionTa: "தக்காளி கிளைகளை கம்புகளில் கட்டி தரையில் படர்வதைத் தவிர்க்கவும்."
      },
      {
        id: "ACT-TOM-04",
        nameEn: "Early/Late Blight Foliar Scouting",
        nameTa: "பிளைட் இலைப்புள்ளி ஆய்வு",
        category: "Disease",
        dayOffset: 52,
        descriptionEn: "Inspect lower foliage for water-soaked concentric lesions. Use AI Disease Scanner if spots appear.",
        descriptionTa: "இலைகளில் நீர் கோர்த்த கருமை புள்ளிகளை ஆய்வு செய்ய AI கேமராவைப் பயன்படுத்தவும்.",
        weatherAwareAlert: "🌧️ High ambient humidity accelerates Late Blight spores. Spray Mancozeb 2g/L preventively."
      },
      {
        id: "ACT-TOM-05",
        nameEn: "Fruit Borer Pheromone Trap Installation",
        nameTa: "காய் துளைப்பான் இனக்கவர்ச்சி பொறி",
        category: "Pest",
        dayOffset: 58,
        descriptionEn: "Install 12 Helicoverpa armigera pheromone traps per acre to monitor and trap moths.",
        descriptionTa: "ஏக்கருக்கு 12 மோகப் பொறிகளை அமைத்து ஆண் அந்துப்பூச்சிகளை அழிக்கவும்."
      },
      {
        id: "ACT-TOM-06",
        nameEn: "Soluble Potash (0:0:50) Fertigation",
        nameTa: "பொட்டாஷ் உரம் அளித்தல்",
        category: "Fertilizer",
        dayOffset: 70,
        descriptionEn: "Fertigate Potassium Sulphate (0:0:50) @ 5kg/acre to enhance fruit sugar, firmness, and uniform red color.",
        descriptionTa: "பழங்களின் நிறம் மற்றும் எடையை அதிகரிக்க 0:0:50 பொட்டாஷ் உரத்தை பாசன நீரில் கலக்கவும்."
      },
      {
        id: "ACT-TOM-07",
        nameEn: "First Harvest Picking (Breaker Stage)",
        nameTa: "முதல் கட்ட தக்காளி அறுவடை",
        category: "Harvesting",
        dayOffset: 75,
        descriptionEn: "Harvest mature green/pink breaker stage tomatoes with calyx attached in cushioned crates.",
        descriptionTa: "காம்புடன் கூடிய இளஞ்சிவப்பு தக்காளிகளை கவனமாக அறுவடை செய்யவும்.",
        weatherAwareAlert: "⚠️ Rain forecast during harvest can cause skin cracking. Harvest ahead of rain."
      },
      {
        id: "ACT-TOM-08",
        nameEn: "Peak Yield Picking & Market Grading",
        nameTa: "உச்சக்கட்ட அறுவடை & தரம் பிரித்தல்",
        category: "Harvesting",
        dayOffset: 85,
        descriptionEn: "Conduct 3rd round bulk picking. Grade by uniform size (Grade A 80-100g) and store at 15-20°C.",
        descriptionTa: "அனைத்து செடிகளிலிருந்தும் தரமான பழங்களை அறுவடை செய்து தரம் பிரிக்கவும்."
      }
    ]
  },
  Potato: {
    id: 'Potato',
    nameEn: 'Potato',
    nameTa: 'உருளைக்கிழங்கு',
    icon: '🥔',
    variety: 'Kufri Jyoti / Kufri Surya / Kufri Pukhraj',
    varietyTa: 'குப்ரி ஜோதி / குப்ரி சூர்யா / குப்ரி புக்ராஜ்',
    growthDurationDays: 95,
    growthDurationLabelEn: '85 – 100 Days',
    growthDurationLabelTa: '85 – 100 நாட்கள்',
    recommendedPlantingSeasonEn: 'October – November (Plains) & April – May (Hills)',
    recommendedPlantingSeasonTa: 'அக்டோபர் – நவம்பர் (சமவெளி) & ஏப்ரல் – மே (மலைப்பகுதி)',
    bestHarvestSeasonEn: 'January – February (Plains) & August – September (Hills)',
    bestHarvestSeasonTa: 'ஜனவரி – பிப்ரவரி (சமவெளி) & ஆகஸ்ட் – செப்டம்பர் (மலைப்பகுதி)',
    expectedYieldEn: '10 – 14 Tonnes / Acre',
    expectedYieldTa: '10 – 14 டன் / ஏக்கர்',
    harvestStartDayOffset: 80,
    bestHarvestStartDayOffset: 85,
    bestHarvestEndDayOffset: 92,
    harvestEndDayOffset: 98,
    harvestReadinessCriteria: {
      en: "Foliage turns completely yellow and senesces. Tuber skin should be firm and not peel under moderate thumb rubbing pressure.",
      ta: "இலைகள் மஞ்சள் நிறமாக மாறும். விரலால் அழுத்தும்போது கிழங்கின் தோல் உரிக்கப்படாமல் உறுதியாக இருக்க வேண்டும்."
    },
    maturityTips: [
      { en: "Cut and remove vine foliage (dehaulming) 8-10 days prior to digging to harden tuber skin.", ta: "தோல் கடினமாக மாற அறுவடைக்கு 8-10 நாட்களுக்கு முன்பு தண்டுப் பகுதியை வெட்டி அகற்றவும்." },
      { en: "Stop irrigation completely 10-12 days before harvesting to avoid tuber rotting in soil.", ta: "அழுகல் நோயைத் தடுக்க அறுவடைக்கு 10-12 நாட்களுக்கு முன்பே பாசனத்தை முழுமையாக நிறுத்தவும்." },
      { en: "Dig tubers on bright sunny days; cure under shade for 7-10 days before cold storage.", ta: "வெயில் உள்ள நாளில் அறுவடை செய்து 7-10 நாட்கள் நிழலில் உலர்த்தி சேமிக்கவும்." }
    ],
    stages: [
      { id: 1, nameEn: "Tuber Planting & Earthing Up", nameTa: "கிழங்கு நடுதல் & மண் அணைத்தல்", startDay: 1, endDay: 12, duration: "Day 1 - 12", practicesEn: "Plant disease-free sprouted seed tubers (40-50g) at 60x20cm spacing on ridges with Mancozeb seed dip.", practicesTa: "40-50 கிராம் எடையுள்ள முளைத்த கிழங்குகளை மேட்டுப்பாத்தியில் 60x20 செ.மீ இடைவெளியில் நடவும்." },
      { id: 2, nameEn: "Sprouting & Emergence", nameTa: "முளைத்தல் & தளிர் விடுதல்", startDay: 13, endDay: 25, duration: "Day 13 - 25", practicesEn: "Uniform emergence check. Light irrigation to prevent crust formation on soil ridges.", practicesTa: "முளைப்பை சரிபார்த்து, மண் இறுகாமல் இருக்க லேசான பாசனம் அளிக்கவும்." },
      { id: 3, nameEn: "Vegetative Canopy & Earthing", nameTa: "இலை வளர்ச்சி & இரண்டாம் மண் அணைப்பு", startDay: 26, endDay: 45, duration: "Day 26 - 45", practicesEn: "Heavy earthing up to prevent greening of tubers from sunlight exposure. Top dress Nitrogen.", practicesTa: "கிழங்கு சூரிய ஒளியில் பச்சையாவதைத் தடுக்க நன்றாக மண் அணைத்து தழை உரம் இடவும்." },
      { id: 4, nameEn: "Tuber Initiation & Bulking", nameTa: "கிழங்கு உருவாக்கம் & பருமனாதல்", startDay: 46, endDay: 70, duration: "Day 46 - 70", practicesEn: "Critical moisture stage. Maintain 65-70% soil moisture. Apply Potassium Sulphate fertigation.", practicesTa: "மிக முக்கியமான வளர்ச்சி நிலை. 65-70% மண் ஈரப்பதம் பராமரித்து பொட்டாஷ் உரம் அளிக்கவும்." },
      { id: 5, nameEn: "Dehaulming (Vine Cutting)", nameTa: "தண்டு அறுத்தல் (டிஹால்மிங்)", startDay: 71, endDay: 80, duration: "Day 71 - 80", practicesEn: "Cut upper foliage at ground level to stop growth and allow tuber skin curing in soil.", practicesTa: "கிழங்கு தோல் முதிர தரைமட்டத்தில் தண்டுப் பகுதியை வெட்டி அகற்றவும்." },
      { id: 6, nameEn: "Disease & Pest Monitoring", nameTa: "நோய் & பூச்சி கண்காணிப்பு", startDay: 35, endDay: 75, duration: "Day 35 - 75", practicesEn: "Scout for Early Blight concentric rings and Aphids vectoring leaf roll virus.", practicesTa: "ஏர்லி பிளைட் மற்றும் அசுவினி பூச்சிகளைத் தீவிரமாகக் கண்காணிக்கவும்." },
      { id: 7, nameEn: "Expected Harvest Start", nameTa: "அறுவடை தொடக்கம்", startDay: 80, endDay: 84, duration: "Day 80 - 84", practicesEn: "Trial digging to check tuber size and skin toughness.", practicesTa: "சோதனை தோண்டுதல் மூலம் கிழங்கு முதிர்ச்சியை சரிபார்க்கவும்." },
      { id: 8, nameEn: "Peak Best Harvesting Period", nameTa: "உச்சக்கட்ட அறுவடை காலம்", startDay: 85, endDay: 92, duration: "Day 85 - 92", practicesEn: "Main digging using tractor-drawn potato digger or manual spades. Dry tubers in shade.", practicesTa: "முழு அறுவடையை மேற்கொண்டு நிழலில் உலர்த்தி தரம் பிரிக்கவும்." },
      { id: 9, nameEn: "Curing & Storage Prep", nameTa: "நிழல் உலர்த்தல் & சேமிப்பு", startDay: 93, endDay: 98, duration: "Day 93 - 98", practicesEn: "Cure at 15°C with 85% RH for 10 days to heal digging abrasions before cold store dispatch.", practicesTa: "காயங்களை ஆற்ற 10 நாட்கள் நிழலில் உலர்த்தி குளிர்பதன கிடங்கிற்கு அனுப்பவும்." }
    ],
    activities: [
      {
        id: "ACT-POT-01",
        nameEn: "Seed Tuber Sprouting & Fungicide Treatment",
        nameTa: "விதைக்கிழங்கு நேர்த்தி",
        category: "Fertilizer",
        dayOffset: 1,
        descriptionEn: "Dip sprouted tubers in Mancozeb (2.5g/L) for 10 mins before planting on well-drained ridges.",
        descriptionTa: "முளைத்த கிழங்குகளை மேன்கோசெப் கரைசலில் 10 நிமிடங்கள் நனைத்து நடவும்.",
        weatherAwareAlert: "☀️ Plant in dry soil to prevent bacterial soft rot in seed tubers."
      },
      {
        id: "ACT-POT-02",
        nameEn: "Ridge Irrigation & Weed Scraping",
        nameTa: "பாசனம் & களை நீக்கம்",
        category: "Irrigation",
        dayOffset: 18,
        descriptionEn: "Furrow/drip irrigation between ridges. Avoid submerging the top of the ridge.",
        descriptionTa: "பாத்திகளின் இடையில் தண்ணீர் பாய்ச்சவும். மேட்டுப்பகுதி மூழ்காமல் பார்த்துக் கொள்ளவும்."
      },
      {
        id: "ACT-POT-03",
        nameEn: "Earthing Up & Potassium Top Dressing",
        nameTa: "மண் அணைத்தல் & பொட்டாஷ் இடல்",
        category: "Crop Management",
        dayOffset: 32,
        descriptionEn: "Mound loose soil around plant base (height 15cm) to prevent tuber greening (solanine).",
        descriptionTa: "கிழங்குகள் சூரிய ஒளியில் படாமல் இருக்க 15 செ.மீ உயரத்திற்கு மண் அணைக்கவும்."
      },
      {
        id: "ACT-POT-04",
        nameEn: "Early Blight Target-Spot Inspection",
        nameTa: "ஏர்லி பிளைட் இலை ஆய்வு",
        category: "Disease",
        dayOffset: 48,
        descriptionEn: "Inspect lower foliage for concentric target-board brown spots. Spray Chlorothalonil 2g/L.",
        descriptionTa: "இலைகளில் வளையப் புள்ளிகள் உள்ளதா எனப் பார்த்து மருந்து தெளிக்கவும்.",
        weatherAwareAlert: "🌧️ Intermittent rains and warm days trigger rapid Early Blight spread."
      },
      {
        id: "ACT-POT-05",
        nameEn: "Aphid & Whitefly Sticky Trap Installation",
        nameTa: "அசுவினி ஒட்டுப் பொறிகள்",
        category: "Pest",
        dayOffset: 55,
        descriptionEn: "Erect yellow sticky sheets @ 15/acre to catch vectoring aphids transmitting Potato Leafroll Virus.",
        descriptionTa: "மஞ்சள் ஒட்டுப் பொறிகளை அமைத்து வைரஸ் பரப்பும் அசுவினிகளை அழிக்கவும்."
      },
      {
        id: "ACT-POT-06",
        nameEn: "Foliage Dehaulming (Vine Removal)",
        nameTa: "தண்டு வெட்டுதல் (டிஹால்மிங்)",
        category: "Harvesting",
        dayOffset: 72,
        descriptionEn: "Chop above-ground vines with sickle 10 days before digging to cure tuber skin.",
        descriptionTa: "அறுவடைக்கு 10 நாட்களுக்கு முன் தண்டுப் பகுதியை வெட்டி அகற்றவும்."
      },
      {
        id: "ACT-POT-07",
        nameEn: "Main Tuber Digging & Field Grading",
        nameTa: "முதன்மை அறுவடை & தரம் பிரித்தல்",
        category: "Harvesting",
        dayOffset: 85,
        descriptionEn: "Carefully dig tubers without cutting skin. Separate small, medium, and seed tubers.",
        descriptionTa: "கிழங்கில் வெட்டுப் படாமல் தோண்டி எடுத்து தரம் பிரிக்கவும்.",
        weatherAwareAlert: "⚠️ Do not harvest in wet/muddy soil to avoid post-harvest fungal tuber rot."
      }
    ]
  },
  Brinjal: {
    id: 'Brinjal',
    nameEn: 'Brinjal (Eggplant)',
    nameTa: 'கத்தரிக்காய்',
    icon: '🍆',
    variety: 'Annamalai / CO-2 / PLR-1 / Arka Kusumakar',
    varietyTa: 'அண்ணாமலை / கோ-2 / பிஎல்ஆர்-1 / அர்கா குசுமாகர்',
    growthDurationDays: 130,
    growthDurationLabelEn: '120 – 140 Days',
    growthDurationLabelTa: '120 – 140 நாட்கள்',
    recommendedPlantingSeasonEn: 'June – July, Dec – Jan & April – May',
    recommendedPlantingSeasonTa: 'ஜூன் – ஜூலை, டிசம்பர் – ஜனவரி & ஏப்ரல் – மே',
    bestHarvestSeasonEn: 'August – November & March – June',
    bestHarvestSeasonTa: 'ஆகஸ்ட் – நவம்பர் & மார்ச் – ஜூன்',
    expectedYieldEn: '18 – 24 Tonnes / Acre',
    expectedYieldTa: '18 – 24 டன் / ஏக்கர்',
    harvestStartDayOffset: 75,
    bestHarvestStartDayOffset: 80,
    bestHarvestEndDayOffset: 120,
    harvestEndDayOffset: 135,
    harvestReadinessCriteria: {
      en: "Glossy, lustrous skin and tender flesh before internal seeds harden or turn brown. Firm calyx with vibrant purple/green tone.",
      ta: "பளபளப்பான தோல், விதைகள் கடினமாவதற்கு முன் இளஞ்சத்தான காய்கள். பசுமையான காம்பு."
    },
    maturityTips: [
      { en: "Pick tender medium fruits every 4-5 days; delay results in seed hardening and bitterness.", ta: "4-5 நாட்களுக்கு ஒருமுறை அறுவடை செய்யவும்; தாமதித்தால் விதைகள் முற்றி கசப்புத்தன்மை வரும்." },
      { en: "Clip fruits with 2cm attached stalk using clean pruning shears; do not pull by hand.", ta: "செடியில் இருந்து கையால் இழுக்காமல் கத்திரிக்கோல் கொண்டு 2 செ.மீ காம்புடன் நறுக்கவும்." },
      { en: "Shade picked fruits immediately; sprinkle light water mist if ambient heat is high.", ta: "அறுவடை செய்த காய்களை உடனே நிழலில் வைத்து லேசாக தண்ணீர் தெளிக்கவும்." }
    ],
    stages: [
      { id: 1, nameEn: "Nursery & Field Transplanting", nameTa: "நாற்று நடுதல் & நிலைநிறுத்துதல்", startDay: 1, endDay: 18, duration: "Day 1 - 18", practicesEn: "Transplant 30-35 day vigorous seedlings at 75x60cm spacing. Dip roots in Pseudomonas fluorescens.", practicesTa: "30-35 நாள் நாற்றுகளை 75x60 செ.மீ இடைவெளியில் சூடோமோனாஸ் வேர் நனைப்பு செய்து நடவும்." },
      { id: 2, nameEn: "Vegetative Growth & Tillering", nameTa: "வளர்ச்சி & கிளைத்தல் நிலை", startDay: 19, endDay: 38, duration: "Day 19 - 38", practicesEn: "Apply NPK basal split, maintain soil aeration, clip wilted shoot tips damaged by shoot borer.", practicesTa: "உரமிடுதல், மண் கிளறுதல் மற்றும் தண்டு துளைப்பான் தாக்கிய நுனிகளை வெட்டி அழிக்கவும்." },
      { id: 3, nameEn: "Flowering & Branch Initiation", nameTa: "பூத்தல் & கிளைகள் பெருக்கம்", startDay: 39, endDay: 58, duration: "Day 39 - 58", practicesEn: "Install pheromone traps for shoot & fruit borer. Foliar micronutrient spray (Zinc & Boron).", practicesTa: "மோகப் பொறிகளை அமைத்து நுண்ணூட்டச் சத்துக்களை தெளிக்கவும்." },
      { id: 4, nameEn: "Fruit Setting & Early Swelling", nameTa: "காய் பிடித்தல் & பெருக்கம்", startDay: 59, endDay: 74, duration: "Day 59 - 74", practicesEn: "Maintain uniform irrigation. Spray Neem oil (NSKE 5%) against whiteflies and leafhoppers.", practicesTa: "சீரான பாசனம் அளித்து, வேப்பங்கொட்டை கரைசல் தெளிக்கவும்." },
      { id: 5, nameEn: "First Commercial Harvest Start", nameTa: "முதல் கட்ட அறுவடை தொடக்கம்", startDay: 75, endDay: 79, duration: "Day 75 - 79", practicesEn: "Harvest first flush of glossy tender fruits with sharp shears.", practicesTa: "முதல் கட்ட பளபளப்பான இளம் காய்களை அறுவடை செய்யவும்." },
      { id: 6, nameEn: "Disease & Pest Monitoring", nameTa: "நோய் & பூச்சி கண்காணிப்பு", startDay: 40, endDay: 110, duration: "Day 40 - 110", practicesEn: "Scout weekly for Little Leaf Disease (Phytoplasma) and Cercospora leaf spots.", practicesTa: "சிறிய இலை நோய் மற்றும் சர்கோஸ்போரா புள்ளிகளைக் கண்காணிக்கவும்." },
      { id: 7, nameEn: "Peak Best Harvesting Period", nameTa: "உச்சக்கட்ட தொடர் அறுவடை காலம்", startDay: 80, endDay: 120, duration: "Day 80 - 120", practicesEn: "Multiple continuous pickings every 4-6 days. Periodic potassium top-dressing after pickings.", practicesTa: "4-6 நாட்களுக்கு ஒருமுறை தொடர் அறுவடை மற்றும் அவ்வப்போது உரமிடுதல்." },
      { id: 8, nameEn: "Late Season Picking & Wind Up", nameTa: "இறுதி அறுவடை & முடிவு", startDay: 121, endDay: 135, duration: "Day 121 - 135", practicesEn: "Final gleanings, decide on ratoon cropping or field clearance.", practicesTa: "இறுதி அறுவடை முடித்து நிலத்தை மறு உழவுக்கு தயார் செய்யவும்." }
    ],
    activities: [
      {
        id: "ACT-BRN-01",
        nameEn: "Root Dip & Field Transplanting",
        nameTa: "வேர் நனைப்பு & நடுதல்",
        category: "Fertilizer",
        dayOffset: 1,
        descriptionEn: "Dip roots in Pseudomonas fluorescens (5g/L) for 20 mins to prevent bacterial wilt before transplanting.",
        descriptionTa: "வாடல் நோயைத் தடுக்க சூடோமோனாஸ் கரைசலில் வேர்களை நனைத்து நடவும்."
      },
      {
        id: "ACT-BRN-02",
        nameEn: "Drip Schedule & Moisture Regulation",
        nameTa: "சொட்டுநீர்ப் பாசனம்",
        category: "Irrigation",
        dayOffset: 20,
        descriptionEn: "Regulate drip to avoid water stagnation which causes root rot and damping off.",
        descriptionTa: "வேரழுகல் ஏற்படாமல் இருக்க சீரான சொட்டுநீர் பாசனம் செய்யவும்."
      },
      {
        id: "ACT-BRN-03",
        nameEn: "Shoot & Fruit Borer Pheromone Traps",
        nameTa: "தண்டு காய் துளைப்பான் மோகப் பொறி",
        category: "Pest",
        dayOffset: 42,
        descriptionEn: "Install Lucinure pheromone traps @ 12 traps/acre. Inspect weekly and replace lures every 30 days.",
        descriptionTa: "ஏக்கருக்கு 12 மோகப் பொறிகளை அமைத்து வாரம் ஒருமுறை ஆய்வு செய்யவும்."
      },
      {
        id: "ACT-BRN-04",
        nameEn: "Little Leaf & Cercospora Inspection",
        nameTa: "சிறிய இலை நோய் & இலைப்புள்ளி ஆய்வு",
        category: "Disease",
        dayOffset: 55,
        descriptionEn: "Check for bushy stunted small leaves vector by leafhoppers. Roguing out affected plants immediately.",
        descriptionTa: "சிறிய இலை நோய் தாக்கிய செடிகளை உடனே பிடுங்கி எரிக்கவும்.",
        weatherAwareAlert: "🌧️ Humid overcast days favor fungal leaf spots. Spray Carbendazim 1g/L if spotting exceeds 5%."
      },
      {
        id: "ACT-BRN-05",
        nameEn: "Post-Harvest Flush Booster Fertigation",
        nameTa: "அறுவடைக்கு பின் உரம் அளித்தல்",
        category: "Fertilizer",
        dayOffset: 70,
        descriptionEn: "Apply water-soluble 13:0:45 @ 4kg/acre after each harvest flush to stimulate next flowering wave.",
        descriptionTa: "அடுத்த பூக்களுக்கு 13:0:45 பொட்டாஷ் உரத்தை பாசனத்தில் விடவும்."
      },
      {
        id: "ACT-BRN-06",
        nameEn: "First Flush Harvest Picking",
        nameTa: "முதல் கட்ட கத்தரி அறுவடை",
        category: "Harvesting",
        dayOffset: 75,
        descriptionEn: "Cut glossy tender fruits with 2cm calyx stalk. Grade by color and absence of borer holes.",
        descriptionTa: "பளபளப்பான இளம் காய்களை 2 செ.மீ காம்புடன் அறுவடை செய்யவும்."
      },
      {
        id: "ACT-BRN-07",
        nameEn: "Bulk Multiple Pickings Round",
        nameTa: "தொடர் அறுவடை சுழற்சி",
        category: "Harvesting",
        dayOffset: 90,
        descriptionEn: "Carry out routine harvest every 4 days. Keep in ventilated crates away from direct sunlight.",
        descriptionTa: "4 நாட்களுக்கு ஒருமுறை தொடர் அறுவடை செய்து நிழலில் பாதுகாக்கவும்.",
        weatherAwareAlert: "⚠️ Avoid harvesting wet fruits in rain to prevent surface mold during transport."
      }
    ]
  }
};

// Backward-compatible export for existing widgets
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
  Tomato: mockCropPlanningConfigs.Tomato.stages,
  Potato: mockCropPlanningConfigs.Potato.stages,
  Brinjal: mockCropPlanningConfigs.Brinjal.stages
};

export const mockFarmActivities = mockCropPlanningConfigs.Tomato.activities.map(a => ({
  ...a,
  status: a.dayOffset < 40 ? "Completed" : "Upcoming",
  date: "2026-09-02"
}));

export const mockMonthlyCalendarEvents = [
  { day: 1, title: "🌱 Planting", type: "planting" },
  { day: 5, title: "💧 Irrigation Monitoring", type: "irrigation" },
  { day: 12, title: "🔍 Disease Monitoring", type: "disease" },
  { day: 18, title: "🌿 Crop Monitoring", type: "crop" },
  { day: 25, title: "🌧️ Weather Check", type: "weather" }
];

