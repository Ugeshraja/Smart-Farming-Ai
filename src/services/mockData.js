// Comprehensive mock dataset for SmartFarm AI Platform
// Solanaceae crops: Tomato, Potato, Brinjal

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
    location: "Dharmapuri, Tamil Nadu",
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
    location: "Dharmapuri, Tamil Nadu",
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
  },
  {
    id: "PRED-1090",
    crop: "Brinjal",
    disease: "Cercospora Leaf Spot",
    confidence: 91.8,
    status: "Disease Detected",
    imageUrl: generateLeafSvg("Brinjal", "Cercospora Leaf Spot", false),
    limeImageUrl: generateLeafSvg("Brinjal", "Cercospora Leaf Spot", true),
    processingTime: "1.22 sec",
    createdAt: "2026-08-09 11:45 AM",
    farmerName: "UGESHRAJA S",
    location: "Dharmapuri, Tamil Nadu",
    iotSnapshot: {
      soilMoisture: "65%",
      temperature: "28.0°C",
      humidity: "82%",
      rainStatus: "Rain Detected"
    },
    advisory: {
      en: "Cercospora leaf spot creates circular necrotic brown spots. Spray Carbendazim (1g/L) or Neem seed kernel extract (5%) as an organic measure.",
      ta: "கத்தரியில் சர்கோஸ்போரா புள்ளி நோய். கார்பென்டாசிம் (1g/L) அல்லது வேப்பங்கொட்டை சாறு 5% தெளிக்கவும்."
    },
    preventiveMeasures: [
      "Destroy plant crop residues after harvest.",
      "Apply bio-control agent Trichoderma viride to soil.",
      "Maintain balanced NPK fertilization."
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

// Community Posts Dataset (No avatar URLs)
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
  },
  {
    id: "POST-102",
    farmerName: "Rajesh Sharma",
    createdAt: "4 hours ago",
    crop: "Tomato",
    topic: "Fungi Management",
    language: "en",
    content: "My tomato plant has brown spots on the leaves. What could be the reason? Looking for organic bio-fungicide recommendations.",
    imageUrl: null,
    likes: 22,
    comments: [
      {
        id: "C-2",
        author: "Dr. Anbarasan (Agri Expert)",
        time: "3 hours ago",
        text: "It looks like Early Blight (Alternaria solani). Apply Trichoderma viride or spray Mancozeb 75% WP @ 2g/L."
      }
    ]
  },
  {
    id: "POST-103",
    farmerName: "Kavitha R.",
    createdAt: "Yesterday",
    crop: "Brinjal",
    topic: "Pest Management",
    language: "ta",
    content: "என் கத்தரிப் பயிரில் இலைத் தட்டான் பூச்சிகள் அதிகம் உள்ளன. மஞ்சள் ஒட்டும் பொறிகள் அமைத்துள்ளேன். வேறு என்ன செய்யலாம்?",
    imageUrl: null,
    likes: 9,
    comments: []
  },
  {
    id: "POST-104",
    farmerName: "David Miller",
    createdAt: "2 days ago",
    crop: "Potato",
    topic: "Soil Moisture",
    language: "en",
    content: "My potato leaves are showing dark spots. Has anyone experienced this after heavy rain? How to maintain soil drainage?",
    imageUrl: null,
    likes: 18,
    comments: []
  }
];
