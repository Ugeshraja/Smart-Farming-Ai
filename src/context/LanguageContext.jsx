import React, { createContext, useContext, useState } from 'react';

const LanguageContext = createContext();

export const translations = {
  en: {
    appTitle: "SmartFarm AI",
    subTitle: "AI-Driven Unified Smart Farming Platform",
    dashboard: "Dashboard",
    weather: "Weather",
    cropDetection: "Crop Disease Detection",
    farmerAssistant: "AI Farmer Assistant",
    community: "Community",
    library: "Agriculture Library",
    planner: "Farming Planner",
    predictionHistory: "Prediction History",
    aiReports: "AI Reports",
    voiceAssistant: "Voice Assistant",
    settings: "Settings",
    
    // Header
    greeting: "Good Morning, Farmer 👋",
    greetingSub: "Monitor your crops and get AI-powered insights.",
    language: "Language",
    
    // Dashboard Cards & Widgets
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
    esp32SensorMonitoring: "ESP32 Sensor Telemetry",
    liveSensorFeed: "Real-time IoT environmental data directly from ESP32 micro-controller",
    aiInsights: "AI Insights",
    systemStatus: "System Status",
    recentActivity: "Recent Sensor Activity",
    weatherForecast: "Local Field Weather",
    todaysWeather: "Today's Weather",
    viewForecast: "View Forecast",
    nextActivity: "Next Farming Activity",
    weatherAlertWidget: "Weather Alert",
    latestLibraryTopic: "Latest Agriculture Topic",
    viewPlanner: "Open Planner",
    exploreLibrary: "Explore Library",

    // Weather Page
    weatherTitle: "Weather Forecast & Alerts",
    weatherSubtitle: "Monitor weather conditions and receive farming-related weather alerts.",
    currentLocation: "Selected Location",
    searchLocationPlaceholder: "Search city or district...",
    useCurrentLocation: "Use Current Location",
    currentWeather: "Current Weather",
    sevenDayForecast: "7-Day Forecast",
    hourlyForecast: "Hourly Forecast",
    farmerAlerts: "Farmer Weather Alerts",
    cropWeatherInsights: "Crop Weather Insights",
    fieldVsWeather: "Field vs Weather Comparison",
    externalWeather: "External Weather Forecast",
    esp32FieldSensor: "ESP32 Field Sensor",
    rainProbability: "Rain Probability",
    windSpeed: "Wind Speed",
    uvIndex: "UV Index",

    // Agriculture Library Page
    libraryTitle: "Agriculture Library",
    librarySubtitle: "Explore trusted agricultural knowledge for better crop management.",
    searchLibraryPlaceholder: "Search agricultural information...",
    libraryCategories: "Knowledge Categories",
    cropOverview: "Crop Overview",
    growingConditions: "Growing Conditions",
    commonDiseases: "Common Diseases",
    commonPests: "Common Pests",
    irrigationReq: "Irrigation",
    soilReq: "Soil Requirements",
    cropManagement: "Crop Management",
    harvestInfo: "Harvest Information",
    askAiAboutTopic: "Ask AI Assistant About This Topic",

    // Farming Planner Page
    plannerTitle: "Farming Planner",
    plannerSubtitle: "Plan and monitor your crop activities from planting to harvest.",
    createPlan: "Create Farm Plan",
    selectCrop: "Select Crop",
    locationCity: "Location / District",
    plantingDate: "Planting Date",
    expectedHarvest: "Expected Harvest Date",
    farmSize: "Farm Size (Acres)",
    cropTimeline: "Crop Growth Stage Timeline",
    farmActivities: "Farm Activities & Schedule",
    weatherReminder: "Weather-Aware Reminder",
    askAiAboutPlan: "Ask AI About This Plan",
    monthlyCalendar: "Monthly Calendar",
    upcomingActivities: "Upcoming Activities",
    completedActivities: "Completed Activities",
    markCompleted: "Mark Completed",
    statusUpcoming: "Upcoming",
    statusInProgress: "In Progress",
    statusCompleted: "Completed",

    // Actions
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
    predictionResult: "Prediction Result",
    aiExplanation: "AI Explanation (LIME Heatmap)",
    predictionDetails: "Prediction Details",

    // Chatbot & Voice
    chatTitle: "AI Farmer Assistant",
    chatSubtitle: "Ask questions about crop diseases, crop management, and farming practices.",
    voiceTitle: "Voice Assistant",
    voiceSubtitle: "Speak in English or Tamil to receive spoken AI agronomic advice.",

    // History & Reports
    historyTitle: "Prediction History",
    historySubtitle: "Review previous Solanaceae crop leaf scans and diagnostic advisories.",
    reportTitle: "AI Report",

    // Settings
    profile: "Farmer Profile",
    notifications: "Notification Preferences",
    systemDiagnostics: "System Diagnostics",
  },
  ta: {
    appTitle: "ஸ்மார்ட்ஃபார்ம் AI",
    subTitle: "செயற்கை நுண்ணறிவு அடிப்படையிலான நவீன விவசாய தளம்",
    dashboard: "டாஷ்போர்டு",
    weather: "வானிலை",
    cropDetection: "பயிர் நோய் கண்டறிதல்",
    farmerAssistant: "AI விவசாய உதவியாளர்",
    community: "சமூகம்",
    library: "வேளாண்மை நூலகம்",
    planner: "விவசாய திட்டமிடுதல்",
    predictionHistory: "கணிப்பு வரலாறு",
    aiReports: "AI அறிக்கைகள்",
    voiceAssistant: "குரல் உதவியாளர்",
    settings: "அமைப்புகள்",
    
    // Header
    greeting: "காலை வணக்கம், விவசாயி 👋",
    greetingSub: "உங்கள் பயிர்களைக் கண்காணித்து AI பரிந்துரைகளைப் பெறுங்கள்.",
    language: "மொழி",
    
    // Dashboard Cards & Widgets
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
    esp32SensorMonitoring: "சென்சார் கண்காணிப்பு",
    liveSensorFeed: "ESP32 சாதனத்திலிருந்து நேரடி சுற்றுச்சூழல் அளவீடுகள்",
    aiInsights: "AI நுண்ணறிவுகள்",
    systemStatus: "கணினி நிலை",
    recentActivity: "சமீபத்திய சென்சார் செயல்பாடுகள்",
    weatherForecast: "உள்ளூர் வானிலை",
    todaysWeather: "இன்றைய வானிலை",
    viewForecast: "முன்னறிவிப்பைப் பார்",
    nextActivity: "அடுத்த விவசாய செயல்பாடு",
    weatherAlertWidget: "வானிலை எச்சரிக்கை",
    latestLibraryTopic: "சமீபத்திய வேளாண் செய்தி",
    viewPlanner: "திட்டமிடுபவரைத் திறக்கவும்",
    exploreLibrary: "நூலகத்தை ஆராயுங்கள்",

    // Weather Page
    weatherTitle: "வானிலை முன்னறிவிப்பு மற்றும் எச்சரிக்கைகள்",
    weatherSubtitle: "வானிலை நிலைகளைக் கண்காணித்து விவசாய எச்சரிக்கைகளைப் பெறுங்கள்.",
    currentLocation: "தேர்ந்தெடுக்கப்பட்ட இடம்",
    searchLocationPlaceholder: "நகரம் அல்லது மாவட்டத்தைத் தேடுங்கள்...",
    useCurrentLocation: "தற்போதைய இடத்தைப் பயன்படுத்து",
    currentWeather: "தற்போதைய வானிலை",
    sevenDayForecast: "7 நாள் வானிலை முன்னறிவிப்பு",
    hourlyForecast: "மணிநேர வானிலை",
    farmerAlerts: "விவசாயி வானிலை எச்சரிக்கைகள்",
    cropWeatherInsights: "பயிர் வானிலை தகவல்கள்",
    fieldVsWeather: "நிலப்பரப்பு vs வானிலை ஒப்பீடு",
    externalWeather: "வெளிப்புற வானிலை முன்னறிவிப்பு",
    esp32FieldSensor: "ESP32 நிலப்பரப்பு சென்சார்",
    rainProbability: "மழை வாய்ப்பு",
    windSpeed: "காற்றின் வேகம்",
    uvIndex: "UV குறியீடு",

    // Agriculture Library Page
    libraryTitle: "வேளாண்மை நூலகம்",
    librarySubtitle: "சிறந்த பயிர் மேலாண்மைக்கு நம்பகமான வேளாண் அறிவை ஆராயுங்கள்.",
    searchLibraryPlaceholder: "விவசாய தகவல்களைத் தேடுங்கள்...",
    libraryCategories: "அறிவுப் பிரிவுகள்",
    cropOverview: "பயிர் மேலோட்டம்",
    growingConditions: "வளரும் சூழ்நிலைகள்",
    commonDiseases: "பொதுவான நோய்கள்",
    commonPests: "பொதுவான பூச்சிகள்",
    irrigationReq: "நீர்ப்பாசனம்",
    soilReq: "மண் தேவைகள்",
    cropManagement: "பயிர் மேலாண்மை",
    harvestInfo: "அறுவடைத் தகவல்கள்",
    askAiAboutTopic: "இந்த தலைப்பைப் பற்றி AI இடம் கேள்",

    // Farming Planner Page
    plannerTitle: "விவசாய திட்டமிடுதல்",
    plannerSubtitle: "விதைப்பு முதல் அறுவடை வரை உங்கள் பயிர் செயல்பாடுகளை திட்டமிட்டு கண்காணிக்கவும்.",
    createPlan: "பண்ணைத் திட்டம் உருவாக்கு",
    selectCrop: "பயிரைத் தேர்ந்தெடு",
    locationCity: "இடம் / மாவட்டம்",
    plantingDate: "விதைப்பு தேதி",
    expectedHarvest: "எதிர்பார்க்கப்படும் அறுவடை தேதி",
    farmSize: "பண்ணை அளவு (ஏக்கர்)",
    cropTimeline: "பயிர் வளர்ச்சி நிலை காலவரிசை",
    farmActivities: "விவசாய செயல்பாடுகள் & அட்டவணை",
    weatherReminder: "வானிலை விழிப்புணர்வு நினைவூட்டல்",
    askAiAboutPlan: "இந்த திட்டத்தைப் பற்றி AI இடம் கேள்",
    monthlyCalendar: "மாதாந்திர நாட்காட்டி",
    upcomingActivities: "வரவிருக்கும் செயல்பாடுகள்",
    completedActivities: "முடிவடைந்த செயல்பாடுகள்",
    markCompleted: "முடிந்தது என குறிக்கவும்",
    statusUpcoming: "வரவிருப்பது",
    statusInProgress: "செயல்பாட்டில் உள்ளது",
    statusCompleted: "முடிவடைந்தது",

    // Actions
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
    predictionResult: "கணிப்பு முடிவு",
    aiExplanation: "AI விளக்கம் (LIME Heatmap)",
    predictionDetails: "கணிப்பு விவரங்கள்",

    // Chatbot & Voice
    chatTitle: "AI விவசாய உதவியாளர்",
    chatSubtitle: "பயிர் நோய்கள், பயிர் மேலாண்மை மற்றும் விவசாய சந்தேகங்களைக் கேட்கலாம்.",
    voiceTitle: "குரல் உதவியாளர்",
    voiceSubtitle: "தமிழ் அல்லது ஆங்கிலத்தில் பேசி AI விவசாய ஆலோசனைகளைப் பெறுங்கள்.",

    // History & Reports
    historyTitle: "கணிப்பு வரலாறு",
    historySubtitle: "முந்தைய இலை சோதனைகள் மற்றும் AI பரிந்துரைகளை மதிப்பாய்வு செய்யவும்.",
    reportTitle: "AI அறிக்கை",

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
