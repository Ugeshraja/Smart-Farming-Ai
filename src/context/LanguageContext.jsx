import React, { createContext, useContext, useState } from 'react';

const LanguageContext = createContext();

export const translations = {
  en: {
    appTitle: "SmartFarm AI",
    subTitle: "AI-Driven Unified Smart Farming Platform",
    dashboard: "Dashboard",
    cropDetection: "Crop Disease Detection",
    farmerAssistant: "AI Farmer Assistant",
    community: "Community",
    predictionHistory: "Prediction History",
    aiReports: "AI Reports",
    voiceAssistant: "Voice Assistant",
    settings: "Settings",
    
    // Header
    greeting: "Good Morning, Farmer 👋",
    greetingSub: "Monitor your crops and get AI-powered insights.",
    language: "Language",
    
    // Dashboard Cards & Labels
    cropHealth: "Crop Health",
    healthy: "Healthy",
    atRisk: "At Risk",
    critical: "Critical",
    soilMoisture: "Soil Moisture",
    temperature: "Temperature",
    humidity: "Humidity",
    rainStatus: "Rain Status",
    noRain: "No Rain",
    rainDetected: "Rain Detected",
    
    // IoT & Dashboard Sections
    esp32SensorMonitoring: "ESP32 Sensor Telemetry",
    liveSensorFeed: "Real-time IoT environmental data directly from ESP32 micro-controller",
    aiInsights: "AI Insights",
    systemStatus: "System Status",
    recentActivity: "Recent Sensor Activity",
    weatherForecast: "Local Field Weather",

    // Action buttons
    viewReport: "View Report",
    analyzeCrop: "Analyze Crop",
    downloadPdf: "Download PDF",
    printReport: "Print Report",
    generateReport: "Generate AI Report",
    askAssistant: "Ask AI Assistant",
    savePrediction: "Save Prediction",
    createPost: "Create Post",
    reply: "Reply",
    like: "Like",
    
    // Disease Detection
    detectionTitle: "AI Crop Disease Detection",
    detectionSubtitle: "Upload a leaf image to detect diseases in Tomato, Potato, and Brinjal.",
    supportedCrops: "Supported crops: Tomato, Potato, Brinjal",
    uploadLeafPrompt: "Upload a crop leaf image",
    dragDrop: "Drag and drop leaf image here, or click to browse",
    selectSample: "Or select a sample leaf to test:",
    predictionResult: "Prediction Result",
    aiExplanation: "AI Explanation (LIME Heatmap)",
    predictionDetails: "Prediction Details",
    cropLabel: "Crop",
    diseaseLabel: "Disease",
    confidenceLabel: "Confidence",
    statusLabel: "Status",

    // Chatbot Assistant
    chatTitle: "AI Farmer Assistant",
    chatSubtitle: "Ask questions about crop diseases, crop management, and farming practices.",
    askQuestion: "Ask your farming question...",
    sourceIndicator: "Based on retrieved agricultural knowledge (RAG + LLM)",
    
    // Voice Assistant
    voiceTitle: "Voice Assistant",
    voiceSubtitle: "Speak in English or Tamil to receive spoken AI agronomic advice.",
    tapToSpeak: "Tap to Speak",
    listening: "Listening",
    processing: "Processing",
    generating: "Generating response",
    speaking: "Speaking",
    
    // Community
    communityTitle: "Farmer Community",
    communitySubtitle: "Connect with farmers, share experiences, and learn from the community.",
    allCrops: "All Crops",
    tomato: "Tomato",
    potato: "Potato",
    brinjal: "Brinjal",
    allLanguages: "All Languages",
    filterByCrop: "Filter by Crop",
    filterByLang: "Language Filter",
    postModalTitle: "Share with Farmer Community",

    // History
    historyTitle: "Prediction History",
    historySubtitle: "Review previous Solanaceae crop leaf scans and diagnostic advisories.",
    viewDetails: "View Details",
    dateLabel: "Date",

    // Reports
    reportTitle: "AI Report",
    farmerInfo: "Farmer Information",
    envConditions: "Environmental Conditions",
    advisoryLabel: "Agricultural Advisory",
    preventiveMeasures: "Preventive Measures",

    // Settings
    profile: "Farmer Profile",
    notifications: "Notification Preferences",
    systemDiagnostics: "System Diagnostics",
  },
  ta: {
    appTitle: "ஸ்மார்ட்ஃபார்ம் AI",
    subTitle: "செயற்கை நுண்ணறிவு அடிப்படையிலான நவீன விவசாய தளம்",
    dashboard: "டாஷ்போர்டு",
    cropDetection: "பயிர் நோய் கண்டறிதல்",
    farmerAssistant: "AI விவசாய உதவியாளர்",
    community: "சமூகம்",
    predictionHistory: "கணிப்பு வரலாறு",
    aiReports: "AI அறிக்கைகள்",
    voiceAssistant: "குரல் உதவியாளர்",
    settings: "அமைப்புகள்",
    
    // Header
    greeting: "காலை வணக்கம், விவசாயி 👋",
    greetingSub: "உங்கள் பயிர்களைக் கண்காணித்து AI பரிந்துரைகளைப் பெறுங்கள்.",
    language: "மொழி",
    
    // Dashboard Cards & Labels
    cropHealth: "பயிர் ஆரோக்கியம்",
    healthy: "ஆரோக்கியமானது",
    atRisk: "அபாய நிலை",
    critical: "கடுமையான நிலை",
    soilMoisture: "மண் ஈரப்பதம்",
    temperature: "வெப்பநிலை",
    humidity: "ஈரப்பதம்",
    rainStatus: "மழை நிலை",
    noRain: "மழை இல்லை",
    rainDetected: "மழை பெய்கிறது",

    // IoT & Dashboard Sections
    esp32SensorMonitoring: "சென்சார் கண்காணிப்பு",
    liveSensorFeed: "ESP32 சாதனத்திலிருந்து நேரடி சுற்றுச்சூழல் அளவீடுகள்",
    aiInsights: "AI நுண்ணறிவுகள்",
    systemStatus: "கணினி நிலை",
    recentActivity: "சமீபத்திய சென்சார் செயல்பாடுகள்",
    weatherForecast: "உள்ளூர் வானிலை",

    // Action buttons
    viewReport: "அறிக்கையைப் பார்",
    analyzeCrop: "பயிரை ஆய்வு செய்",
    downloadPdf: "PDF பதிவிறக்கு",
    printReport: "அச்சிடு",
    generateReport: "AI அறிக்கை உருவாக்கு",
    askAssistant: "AI இடம் கேள்",
    savePrediction: "சேமிக்கவும்",
    createPost: "பதிவு உருவாக்கு",
    reply: "பதிலளி",
    like: "விருப்பம்",

    // Disease Detection
    detectionTitle: "AI பயிர் நோய் கண்டறிதல்",
    detectionSubtitle: "தக்காளி, உருளைக்கிழங்கு மற்றும் கத்தரி இலைகளைப் பதிவேற்றி நோய்களைக் கண்டறியவும்.",
    supportedCrops: "ஆதரிக்கப்படும் பயிர்கள்: தக்காளி, உருளைக்கிழங்கு, கத்தரிக்காய்",
    uploadLeafPrompt: "பயிரின் இலை படத்தை பதிவேற்றவும்",
    dragDrop: "இலை படத்தைப் பதிவேற்ற இங்கு இழுத்து விடவும் அல்லது கிளிக் செய்யவும்",
    selectSample: "அல்லது மாதிரி இலையைத் தேர்ந்தெடுக்கவும்:",
    predictionResult: "கணிப்பு முடிவு",
    aiExplanation: "AI விளக்கம் (LIME Heatmap)",
    predictionDetails: "கணிப்பு விவரங்கள்",
    cropLabel: "பயிர்",
    diseaseLabel: "நோய்",
    confidenceLabel: "நம்பகத்தன்மை",
    statusLabel: "நிலை",

    // Chatbot Assistant
    chatTitle: "AI விவசாய உதவியாளர்",
    chatSubtitle: "பயிர் நோய்கள், பயிர் மேலாண்மை மற்றும் விவசாய சந்தேகங்களைக் கேட்கலாம்.",
    askQuestion: "உங்கள் விவசாய கேள்வியை கேளுங்கள்...",
    sourceIndicator: "மீட்டெடுக்கப்பட்ட விவசாய அறிவுத் தளத்தின்படி (RAG + LLM)",

    // Voice Assistant
    voiceTitle: "குரல் உதவியாளர்",
    voiceSubtitle: "தமிழ் அல்லது ஆங்கிலத்தில் பேசி AI விவசாய ஆலோசனைகளைப் பெறுங்கள்.",
    tapToSpeak: "பேச தட்டவும்",
    listening: "கேட்கிறது",
    processing: "ஆய்வு செய்கிறது",
    generating: "பதில் உருவாக்குகிறது",
    speaking: "பேசுகிறது",

    // Community
    communityTitle: "விவசாயி சமூகம்",
    communitySubtitle: "விவசாயிகளுடன் இணையுங்கள், அனுபவங்களைப் பகிர்ந்து கொள்ளுங்கள், சமூகத்திலிருந்து கற்றுக்கொள்ளுங்கள்.",
    allCrops: "எல்லா பயிர்களும்",
    tomato: "தக்காளி",
    potato: "உருளைக்கிழங்கு",
    brinjal: "கத்தரிக்காய்",
    allLanguages: "எல்லா மொழிகளும்",
    filterByCrop: "பயிர் மூலம் வடிகட்டு",
    filterByLang: "மொழி வடிகட்டி",
    postModalTitle: "விவசாயி சமூகத்தில் பகிரவும்",

    // History
    historyTitle: "கணிப்பு வரலாறு",
    historySubtitle: "முந்தைய இலை சோதனைகள் மற்றும் AI பரிந்துரைகளை மதிப்பாய்வு செய்யவும்.",
    viewDetails: "விவரங்களைப் பார்க்க",
    dateLabel: "தேதி",

    // Reports
    reportTitle: "AI அறிக்கை",
    farmerInfo: "விவசாயி தகவல்",
    envConditions: "சுற்றுச்சூழல் நிலை",
    advisoryLabel: "ஆலோசனை",
    preventiveMeasures: "தடுப்பு நடவடிக்கைகள்",

    // Settings
    profile: "விவசாயி சுயவிவரம்",
    notifications: "அறிவிப்பு விருப்பங்கள்",
    systemDiagnostics: "கணினி பரிசோதனை",
  }
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('en');

  const toggleLanguage = (lang) => {
    setLanguage(lang || (language === 'en' ? 'ta' : 'en'));
  };

  const t = (key) => {
    return translations[language][key] || translations['en'][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
