import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CalendarDays, 
  MapPin, 
  Sprout, 
  CheckCircle2, 
  Clock, 
  CloudRain, 
  AlertTriangle, 
  Sparkles, 
  Check, 
  ChevronRight, 
  Filter, 
  Volume2, 
  VolumeX, 
  ExternalLink, 
  Calendar as CalendarIcon, 
  Droplets, 
  ShieldAlert, 
  Activity, 
  Sun, 
  Thermometer, 
  Wind, 
  Info, 
  RotateCcw,
  CheckCircle,
  HelpCircle,
  TrendingUp,
  Tag
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { apiService } from '../services/apiService';
import { mockCropPlanningConfigs } from '../services/mockData';

// Helper Date Utilities
function parseIsoDate(isoStr) {
  if (!isoStr) return new Date();
  const [y, m, d] = isoStr.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

function addDaysToDate(baseDateStr, days) {
  const d = parseIsoDate(baseDateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function formatDisplayDate(isoStr, isTa = false) {
  if (!isoStr) return '';
  const d = parseIsoDate(isoStr);
  const options = { day: 'numeric', month: 'short', year: 'numeric' };
  return d.toLocaleDateString(isTa ? 'ta-IN' : 'en-US', options);
}

function formatMonthYear(isoStr, isTa = false) {
  if (!isoStr) return '';
  const d = parseIsoDate(isoStr);
  return d.toLocaleDateString(isTa ? 'ta-IN' : 'en-US', { month: 'long', year: 'numeric' });
}

function getDaysDifference(targetIsoStr) {
  const target = parseIsoDate(targetIsoStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  const diffTime = target.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export default function Planner() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const isTa = language === 'ta';

  // 1. Planning State
  const [selectedCropKey, setSelectedCropKey] = useState('Tomato'); // 'Tomato' | 'Potato' | 'Brinjal'
  const [selectedState, setSelectedState] = useState('Tamil Nadu');
  const [selectedDistrict, setSelectedDistrict] = useState('Tiruchengode / Namakkal');
  const [customLocation, setCustomLocation] = useState('');
  const [plantingDate, setPlantingDate] = useState(() => {
    const d = new Date();
    // Default to a 5-day ahead planting date
    d.setDate(d.getDate() + 5);
    return d.toISOString().split('T')[0];
  });
  const [farmSize, setFarmSize] = useState('2.5');

  // 2. Data & Activities State
  const [activities, setActivities] = useState([]);
  const [activityCategoryFilter, setActivityCategoryFilter] = useState('All');
  const [selectedStageDetail, setSelectedStageDetail] = useState(null);

  // 3. Live Weather & Alerts State
  const [currentWeather, setCurrentWeather] = useState(null);
  const [weatherAlerts, setWeatherAlerts] = useState([]);
  const [weatherLoading, setWeatherLoading] = useState(false);

  // 4. LLM Agronomic Advisory State
  const [aiAdvisory, setAiAdvisory] = useState(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Location Presets
  const stateOptions = [
    'Tamil Nadu',
    'Karnataka',
    'Andhra Pradesh',
    'Maharashtra',
    'Kerala'
  ];

  const districtOptions = {
    'Tamil Nadu': [
      'Tiruchengode / Namakkal',
      'Salem',
      'Dharmapuri',
      'Coimbatore',
      'Dindigul',
      'Krishnagiri',
      'Theni',
      'Madurai',
      'Erode'
    ],
    'Karnataka': ['Kolar', 'Chikkaballapur', 'Bengaluru Rural', 'Belagavi', 'Hassan'],
    'Andhra Pradesh': ['Chittoor', 'Anantapur', 'Guntur', 'Kurnool'],
    'Maharashtra': ['Nashik', 'Pune', 'Ahmednagar', 'Satara'],
    'Kerala': ['Palakkad', 'Wayanad', 'Idukki']
  };

  // Quick Month Presets (6 upcoming months)
  const quickMonths = useMemo(() => {
    const months = [];
    const now = new Date();
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const iso = d.toISOString().split('T')[0];
      const labelEn = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      const labelTa = d.toLocaleDateString('ta-IN', { month: 'short', year: 'numeric' });
      months.push({ iso, labelEn, labelTa });
    }
    return months;
  }, []);

  const activeLocation = customLocation.trim() || `${selectedDistrict}, ${selectedState}`;
  const cropConfig = mockCropPlanningConfigs[selectedCropKey] || mockCropPlanningConfigs.Tomato;

  // Compute Dynamic Harvest Timeline Calculations
  const calculations = useMemo(() => {
    const baseDate = plantingDate;
    const harvestStartIso = addDaysToDate(baseDate, cropConfig.harvestStartDayOffset);
    const bestHarvestStartIso = addDaysToDate(baseDate, cropConfig.bestHarvestStartDayOffset);
    const bestHarvestEndIso = addDaysToDate(baseDate, cropConfig.bestHarvestEndDayOffset);
    const harvestEndIso = addDaysToDate(baseDate, cropConfig.harvestEndDayOffset);

    // Days difference relative to today
    const daysToPlanting = getDaysDifference(baseDate);
    const daysToHarvestStart = getDaysDifference(harvestStartIso);

    // Dynamic calculated stages with exact dates
    const computedStages = cropConfig.stages.map((stg) => {
      const stageStartIso = addDaysToDate(baseDate, stg.startDay - 1);
      const stageEndIso = addDaysToDate(baseDate, stg.endDay);
      
      const startDiff = getDaysDifference(stageStartIso);
      const endDiff = getDaysDifference(stageEndIso);

      let status = 'upcoming'; // 'passed' | 'active' | 'upcoming'
      if (endDiff < 0) {
        status = 'passed';
      } else if (startDiff <= 0 && endDiff >= 0) {
        status = 'active';
      }

      return {
        ...stg,
        startDateIso: stageStartIso,
        endDateIso: stageEndIso,
        startDateFormatted: formatDisplayDate(stageStartIso, isTa),
        endDateFormatted: formatDisplayDate(stageEndIso, isTa),
        status
      };
    });

    const activeStage = computedStages.find(s => s.status === 'active') || 
      (daysToPlanting > 0 ? { nameEn: 'Pre-Planting Planning', nameTa: 'விதைப்புக்கு முந்தைய திட்டமிடல்', duration: `Planting in ${daysToPlanting} days` } : computedStages[0]);

    return {
      harvestStartIso,
      harvestStartFormatted: formatDisplayDate(harvestStartIso, isTa),
      bestHarvestStartIso,
      bestHarvestEndIso,
      bestHarvestPeriodFormatted: `${formatDisplayDate(bestHarvestStartIso, isTa)} – ${formatDisplayDate(bestHarvestEndIso, isTa)}`,
      harvestEndIso,
      harvestEndFormatted: formatDisplayDate(harvestEndIso, isTa),
      daysToPlanting,
      daysToHarvestStart,
      computedStages,
      activeStage
    };
  }, [selectedCropKey, plantingDate, cropConfig, isTa]);

  // Load activities whenever crop changes
  useEffect(() => {
    const rawActivities = cropConfig.activities.map(act => ({
      ...act,
      computedDateIso: addDaysToDate(plantingDate, act.dayOffset),
      computedDateFormatted: formatDisplayDate(addDaysToDate(plantingDate, act.dayOffset), isTa),
      status: act.dayOffset < (getDaysDifference(plantingDate) < 0 ? Math.abs(getDaysDifference(plantingDate)) : 0) ? 'Completed' : 'Upcoming'
    }));
    setActivities(rawActivities);
    setSelectedStageDetail(null);
  }, [selectedCropKey, plantingDate, isTa]);

  // Fetch Live Weather from existing weather service
  useEffect(() => {
    let isMounted = true;
    async function fetchWeather() {
      setWeatherLoading(true);
      try {
        const [curr, alerts] = await Promise.all([
          apiService.getWeatherCurrent(activeLocation),
          apiService.getWeatherAlerts(activeLocation)
        ]);
        if (isMounted) {
          setCurrentWeather(curr);
          setWeatherAlerts(alerts || []);
        }
      } catch (err) {
        console.error("Failed to load weather:", err);
      } finally {
        if (isMounted) setWeatherLoading(false);
      }
    }
    fetchWeather();
    return () => { isMounted = false; };
  }, [activeLocation]);

  // Activity checkbox toggle
  const handleToggleActivity = async (id) => {
    setActivities(prev => prev.map(a => {
      if (a.id === id) {
        const newStatus = a.status === 'Completed' ? 'Upcoming' : 'Completed';
        return { ...a, status: newStatus };
      }
      return a;
    }));
    await apiService.toggleActivityStatus(id);
  };

  // Generate RAG-LLM Agronomic Advisory
  const handleGenerateAiAdvisory = async () => {
    setIsGeneratingAi(true);
    try {
      const weatherSummary = currentWeather ? `${currentWeather.temp}°C, Humidity ${currentWeather.humidity}%, Rain Prob ${currentWeather.rainProbability}%` : 'Moderate temperatures';
      const prompt = isTa 
        ? `${selectedState} - ${selectedDistrict} பகுதியில் ${farmSize} ஏக்கரில் ${cropConfig.nameTa} பயிர் முன்-திட்டமிடல் (விதைப்பு தேதி: ${plantingDate}, எதிர்பார்க்கப்படும் அறுவடை: ${calculations.bestHarvestPeriodFormatted}, தற்போதைய வானிலை: ${weatherSummary}). பயிர் வளர்ச்சி நிலைகள் மற்றும் அறுவடைக்கான சிறந்த ஆலோசனையை வழங்கவும்.`
        : `Agronomic Pre-Planning for ${farmSize} Acres of ${cropConfig.nameEn} in ${activeLocation}. Planting Date: ${plantingDate}, Expected Best Harvest Window: ${calculations.bestHarvestPeriodFormatted}, Current Weather: ${weatherSummary}. Provide personalized crop stage management and harvesting advisory.`;

      const res = await apiService.sendChatMessage(prompt, language);
      setAiAdvisory(res);
    } catch (err) {
      console.error("AI Advisory generation error:", err);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // Text-To-Speech Speech Synthesis for Accessibility
  const handleToggleAudio = () => {
    if (!('speechSynthesis' in window)) {
      alert("Text-to-speech is not supported by your browser.");
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const textToSpeak = aiAdvisory?.text || (isTa 
      ? `${cropConfig.nameTa} பயிர் திட்டம்: விதைப்பு தேதி ${formatDisplayDate(plantingDate, true)}. எதிர்பார்க்கப்படும் அறுவடை காலம் ${calculations.bestHarvestPeriodFormatted}.`
      : `${cropConfig.nameEn} Farm Plan: Planting on ${formatDisplayDate(plantingDate, false)}. Expected best harvesting window is ${calculations.bestHarvestPeriodFormatted}.`);

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = isTa ? 'ta-IN' : 'en-US';
    utterance.rate = 0.95;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  // Stop speech when unmounting
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Filter activities
  const filteredActivities = useMemo(() => {
    if (activityCategoryFilter === 'All') return activities;
    return activities.filter(a => a.category.toLowerCase().includes(activityCategoryFilter.toLowerCase()));
  }, [activities, activityCategoryFilter]);

  const completedActivitiesCount = activities.filter(a => a.status === 'Completed').length;
  const totalActivitiesCount = activities.length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      
      {/* 1. Header Banner with Pre-Planning Title & AI Quick Action */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-200 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2.5">
              <div className="w-10 h-10 rounded-xl bg-agri-50 border border-agri-200 flex items-center justify-center text-agri-600">
                <CalendarDays className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
                  <span>{t('plannerTitle')}</span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-agri-100 text-agri-800 border border-agri-300">
                    Pre-Planning Mode
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-gray-600">
                  {t('plannerSubtitle')}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2.5 shrink-0">
            <button
              onClick={() => navigate(`/assistant?query=${encodeURIComponent(isTa ? `எனது ${cropConfig.nameTa} பயிர் திட்டத்தை (${calculations.bestHarvestPeriodFormatted}) பற்றி விளக்குக.` : `Explain my ${cropConfig.nameEn} pre-planning schedule with harvest period ${calculations.bestHarvestPeriodFormatted}.`)}`)}
              className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs rounded-xl transition-colors flex items-center space-x-1.5 border border-gray-200"
            >
              <ExternalLink className="w-3.5 h-3.5 text-gray-600" />
              <span>{t('openInAssistant')}</span>
            </button>

            <button
              onClick={handleGenerateAiAdvisory}
              disabled={isGeneratingAi}
              className="px-4 py-2 bg-agri-600 hover:bg-agri-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center space-x-2"
            >
              <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
              <span>{isGeneratingAi ? t('generatingAi') : t('generateAiAdvisory')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Supported Crop Selection Cards (Tomato 🍅, Potato 🥔, Brinjal 🌱) */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700 flex items-center space-x-1.5">
            <Sprout className="w-4 h-4 text-agri-600" />
            <span>{t('selectCrop')} — Solanaceae Family</span>
          </h2>
          <span className="text-xs text-gray-500 font-medium">
            {isTa ? "பயிரை கிளிக் செய்து திட்டத்தை உருவாக்கவும்" : "Select crop to load pre-planting intelligence"}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { key: 'Tomato', emoji: '🍅', border: 'hover:border-red-400', activeBg: 'bg-red-50/70 border-red-500 text-red-950 ring-2 ring-red-400/30' },
            { key: 'Potato', emoji: '🥔', border: 'hover:border-amber-400', activeBg: 'bg-amber-50/70 border-amber-500 text-amber-950 ring-2 ring-amber-400/30' },
            { key: 'Brinjal', emoji: '🌱', subEmoji: '🍆', border: 'hover:border-purple-400', activeBg: 'bg-purple-50/70 border-purple-500 text-purple-950 ring-2 ring-purple-400/30' }
          ].map((item) => {
            const cfg = mockCropPlanningConfigs[item.key];
            const isSelected = selectedCropKey === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setSelectedCropKey(item.key)}
                className={`p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                  isSelected 
                    ? item.activeBg + ' shadow-sm' 
                    : 'bg-white border-gray-200 hover:shadow-2xs text-gray-800 ' + item.border
                }`}
              >
                <div className="flex items-start justify-between w-full mb-2">
                  <div className="flex items-center space-x-2.5">
                    <span className="text-3xl filter drop-shadow-xs">{item.emoji}</span>
                    <div>
                      <h3 className="font-extrabold text-base leading-tight">
                        {isTa ? cfg.nameTa : cfg.nameEn}
                      </h3>
                      <span className="text-[11px] text-gray-500 font-medium block">
                        {isTa ? cfg.varietyTa : cfg.variety}
                      </span>
                    </div>
                  </div>

                  {isSelected && (
                    <span className="w-6 h-6 rounded-full bg-agri-600 text-white flex items-center justify-center text-xs shadow-xs">
                      <Check className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] mt-2 pt-2 border-t border-gray-100 w-full">
                  <div>
                    <span className="text-gray-400 font-semibold block text-[10px] uppercase">{t('growthDuration')}</span>
                    <strong className="text-gray-900 font-bold">{isTa ? cfg.growthDurationLabelTa : cfg.growthDurationLabelEn}</strong>
                  </div>
                  <div>
                    <span className="text-gray-400 font-semibold block text-[10px] uppercase">Est. Yield</span>
                    <strong className="text-gray-900 font-bold">{isTa ? cfg.expectedYieldTa : cfg.expectedYieldEn}</strong>
                  </div>
                </div>

                <div className="mt-2 text-[10px] text-agri-800 font-medium bg-agri-50/80 px-2.5 py-1 rounded-lg">
                  🗓️ {isTa ? cfg.recommendedPlantingSeasonTa : cfg.recommendedPlantingSeasonEn}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Pre-Planning Configuration: Location, Planting Date & Quick Month Presets */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-gray-900 flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-agri-600" />
              <span>{t('cropPlanningTitle')}</span>
            </h3>
            <p className="text-xs text-gray-500">
              {t('cropPlanningSubtitle')}
            </p>
          </div>

          <div className="flex items-center space-x-2 text-xs font-semibold text-gray-600 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200">
            <span>📍 {activeLocation}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          
          {/* State Selector */}
          <div>
            <label className="font-bold text-gray-700 block mb-1.5">{t('stateLabel')}</label>
            <select
              value={selectedState}
              onChange={(e) => {
                setSelectedState(e.target.value);
                const firstDistrict = districtOptions[e.target.value]?.[0] || 'Default District';
                setSelectedDistrict(firstDistrict);
              }}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 font-semibold text-gray-900 focus:ring-2 focus:ring-agri-500 focus:bg-white transition-all"
            >
              {stateOptions.map(st => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>

          {/* District Selector */}
          <div>
            <label className="font-bold text-gray-700 block mb-1.5">{t('districtLabel')}</label>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 font-semibold text-gray-900 focus:ring-2 focus:ring-agri-500 focus:bg-white transition-all"
            >
              {(districtOptions[selectedState] || []).map(dist => (
                <option key={dist} value={dist}>{dist}</option>
              ))}
            </select>
          </div>

          {/* Planting Date Picker */}
          <div>
            <label className="font-bold text-gray-700 block mb-1.5 flex items-center justify-between">
              <span>{t('plantingDate')}</span>
              <span className="text-[10px] text-agri-600 font-medium font-mono">📅 Required</span>
            </label>
            <input
              type="date"
              value={plantingDate}
              onChange={(e) => setPlantingDate(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-900 focus:ring-2 focus:ring-agri-500 focus:bg-white transition-all"
            />
          </div>

          {/* Farm Size */}
          <div>
            <label className="font-bold text-gray-700 block mb-1.5">{t('farmSize')}</label>
            <div className="relative">
              <input
                type="number"
                step="0.5"
                min="0.5"
                max="50"
                value={farmSize}
                onChange={(e) => setFarmSize(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-900 focus:ring-2 focus:ring-agri-500 focus:bg-white transition-all"
                placeholder="2.5"
              />
              <span className="absolute right-3 top-2 text-gray-400 font-medium text-xs">Acres</span>
            </div>
          </div>

        </div>

        {/* Quick Month Shortcuts */}
        <div className="pt-2 border-t border-gray-100 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-gray-500 font-bold text-[11px] flex items-center space-x-1">
            <Clock className="w-3.5 h-3.5 text-agri-600" />
            <span>{t('quickMonthPreset')}:</span>
          </span>
          {quickMonths.map((qm) => {
            const isMatching = plantingDate.startsWith(qm.iso.substring(0, 7));
            return (
              <button
                key={qm.iso}
                type="button"
                onClick={() => setPlantingDate(qm.iso)}
                className={`px-2.5 py-1 rounded-lg font-medium text-xs transition-colors ${
                  isMatching 
                    ? 'bg-agri-600 text-white font-bold shadow-2xs' 
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                {isTa ? qm.labelTa : qm.labelEn}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. PROMINENT HERO: EXPECTED HARVESTING PERIOD & COUNTDOWN */}
      <div className="bg-gradient-to-br from-emerald-900 via-agri-900 to-emerald-950 text-white p-6 sm:p-7 rounded-3xl shadow-md space-y-6 relative overflow-hidden">
        {/* Background decorative glow */}
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10 border-b border-emerald-800/80 pb-5">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">{cropConfig.icon}</span>
              <span className="text-xs uppercase tracking-widest text-emerald-300 font-bold">
                {isTa ? `${cropConfig.nameTa} பயிர் அறுவடை திட்டம்` : `${cropConfig.nameEn} Pre-Harvest Intelligence`}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              {t('expectedHarvestHeading')}
            </h2>
            <p className="text-xs sm:text-sm text-emerald-200/90 font-medium">
              {isTa 
                ? `தேர்ந்தெடுக்கப்பட்ட விதைப்பு தேதி: ${formatDisplayDate(plantingDate, true)} • இடம்: ${activeLocation}`
                : `Configured Planting Date: ${formatDisplayDate(plantingDate, false)} • Location: ${activeLocation}`}
            </p>
          </div>

          {/* Visual Countdown Badge */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 px-4 py-3 rounded-2xl flex items-center space-x-3 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-gray-900 flex items-center justify-center font-black text-sm shadow-xs">
              ⏳
            </div>
            <div>
              <span className="text-[10px] text-emerald-200 font-bold uppercase tracking-wider block">
                {t('harvestCountdown')}
              </span>
              <strong className="text-sm sm:text-base font-extrabold text-amber-300 block">
                {calculations.daysToHarvestStart > 0 
                  ? `${calculations.daysToHarvestStart} ${t('daysRemaining')}` 
                  : (calculations.daysToPlanting > 0 
                    ? `Planting in ${calculations.daysToPlanting} days` 
                    : t('todayStatus'))}
              </strong>
            </div>
          </div>
        </div>

        {/* 3 Calculated Milestone Boxes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
          
          {/* Harvest Start */}
          <div className="bg-white/10 backdrop-blur-sm border border-white/15 p-4 rounded-2xl space-y-1 hover:bg-white/15 transition-all">
            <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider block">
              🏁 {t('harvestStart')}
            </span>
            <strong className="text-lg sm:text-xl font-black text-white block">
              {calculations.harvestStartFormatted}
            </strong>
            <span className="text-[11px] text-emerald-200/80 font-mono block">
              Day +{cropConfig.harvestStartDayOffset} after planting
            </span>
          </div>

          {/* Best Harvesting Period (Peak Window) */}
          <div className="bg-amber-400/20 backdrop-blur-sm border border-amber-300/40 p-4 rounded-2xl space-y-1 ring-2 ring-amber-400/30">
            <span className="text-[11px] font-black text-amber-300 uppercase tracking-wider block flex items-center space-x-1">
              <span>⭐ {t('bestHarvestPeriod')}</span>
              <span className="text-[9px] bg-amber-400 text-gray-950 px-1.5 py-0.2 rounded font-black">PEAK YIELD</span>
            </span>
            <strong className="text-base sm:text-lg font-black text-white block">
              {calculations.bestHarvestPeriodFormatted}
            </strong>
            <span className="text-[11px] text-amber-200 font-mono block">
              Day {cropConfig.bestHarvestStartDayOffset} – {cropConfig.bestHarvestEndDayOffset} (Optimal Market Grade)
            </span>
          </div>

          {/* Harvest End */}
          <div className="bg-white/10 backdrop-blur-sm border border-white/15 p-4 rounded-2xl space-y-1 hover:bg-white/15 transition-all">
            <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider block">
              🛑 {t('harvestEnd')}
            </span>
            <strong className="text-lg sm:text-xl font-black text-white block">
              {calculations.harvestEndFormatted}
            </strong>
            <span className="text-[11px] text-emerald-200/80 font-mono block">
              Day +{cropConfig.harvestEndDayOffset} (Field Cycle Clearance)
            </span>
          </div>

        </div>

        {/* Harvest Readiness & Maturity Info */}
        <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-4 border border-white/10 text-xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-emerald-100">
          <div className="flex items-start space-x-2.5">
            <Info className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white font-bold block mb-0.5">
                {t('harvestReadiness')}:
              </strong>
              <p className="text-emerald-100/90 leading-relaxed text-[11px]">
                {isTa ? cropConfig.harvestReadinessCriteria.ta : cropConfig.harvestReadinessCriteria.en}
              </p>
            </div>
          </div>

          <div className="shrink-0 text-[10px] text-emerald-300 font-mono bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-emerald-700/50">
            {isTa ? `பருவம்: ${cropConfig.bestHarvestSeasonTa}` : `Best Window: ${cropConfig.bestHarvestSeasonEn}`}
          </div>
        </div>

      </div>

      {/* 5. DYNAMIC CROP GROWTH STAGE TIMELINE & CALENDAR */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-gray-900 flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-agri-600" />
              <span>{t('cropCalendarHeading')}</span>
            </h3>
            <p className="text-xs text-gray-500">
              {isTa 
                ? `${cropConfig.nameTa} பயிருக்கான கணக்கிடப்பட்ட காலவரிசை மற்றும் மேலாண்மை நிலைகள்`
                : `Calculated stage-by-stage progression for ${cropConfig.nameEn} based on planting date.`}
            </p>
          </div>

          <span className="text-xs font-semibold px-3 py-1 bg-gray-100 rounded-full text-gray-700">
            {cropConfig.stages.length} {isTa ? "வளர்ச்சி நிலைகள்" : "Growth Stages"}
          </span>
        </div>

        {/* Dynamic Pipeline Progression Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
          {calculations.computedStages.map((stage) => {
            const isSelected = selectedStageDetail?.id === stage.id;
            return (
              <div 
                key={stage.id} 
                onClick={() => setSelectedStageDetail(stage)}
                className={`p-4 rounded-2xl border text-left space-y-2 transition-all cursor-pointer relative ${
                  stage.status === 'active'
                    ? 'bg-agri-50 border-agri-600 ring-2 ring-agri-400/40 shadow-xs'
                    : stage.status === 'passed'
                    ? 'bg-gray-50/70 border-gray-200 opacity-80'
                    : 'bg-white border-gray-200 hover:border-agri-400 hover:shadow-2xs'
                } ${isSelected ? 'ring-2 ring-amber-500 bg-amber-50/50' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <span className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center ${
                    stage.status === 'active'
                      ? 'bg-agri-600 text-white'
                      : stage.status === 'passed'
                      ? 'bg-gray-200 text-gray-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {stage.id}
                  </span>

                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    stage.status === 'active'
                      ? 'bg-emerald-100 text-emerald-800'
                      : stage.status === 'passed'
                      ? 'bg-gray-100 text-gray-600'
                      : 'bg-blue-50 text-blue-700'
                  }`}>
                    {stage.status === 'active' ? 'Active Stage' : stage.status === 'passed' ? 'Completed' : 'Upcoming'}
                  </span>
                </div>

                <div>
                  <h4 className="font-extrabold text-gray-900 text-xs leading-snug">
                    {isTa ? stage.nameTa : stage.nameEn}
                  </h4>
                  <span className="text-[10px] text-gray-500 font-mono block">
                    {stage.duration}
                  </span>
                </div>

                <div className="pt-1.5 border-t border-gray-100 text-[11px] font-semibold text-agri-700">
                  📅 {stage.startDateFormatted} – {stage.endDateFormatted}
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Stage Detail Drawer / Info Card */}
        {selectedStageDetail && (
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-900 flex items-center space-x-1.5">
                <Info className="w-4 h-4 text-amber-600" />
                <span>Stage {selectedStageDetail.id}: {isTa ? selectedStageDetail.nameTa : selectedStageDetail.nameEn}</span>
              </span>
              <button 
                onClick={() => setSelectedStageDetail(null)}
                className="text-amber-800 hover:text-amber-950 font-bold text-xs"
              >
                ✕ Close
              </button>
            </div>
            <p className="text-gray-800 font-medium leading-relaxed">
              <strong>{t('stageActivities')}:</strong> {isTa ? selectedStageDetail.practicesTa : selectedStageDetail.practicesEn}
            </p>
            <div className="text-[11px] text-amber-900 font-mono">
              Dates: {selectedStageDetail.startDateFormatted} to {selectedStageDetail.endDateFormatted}
            </div>
          </div>
        )}
      </div>

      {/* 6. LIVE WEATHER INTEGRATION & WEATHER-AWARE RECOMMENDATIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Weather-Aware Smart Recommendations */}
        <div className="lg:col-span-2 bg-white p-5 sm:p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-gray-900 flex items-center space-x-2">
                <ShieldAlert className="w-5 h-5 text-agri-600" />
                <span>{t('weatherRiskAlert')}</span>
              </h3>
              <p className="text-xs text-gray-500">
                {isTa ? "தற்போதைய வானிலை முன்னறிவிப்புடன் இணைக்கப்பட்ட விவசாய ஆலோசனைகள்" : "Farming schedule adjustments synchronized with local meteorological forecasts."}
              </p>
            </div>

            {weatherLoading && (
              <span className="text-xs text-gray-400 animate-pulse font-mono">Fetching weather...</span>
            )}
          </div>

          <div className="space-y-3 text-xs">
            
            {/* Real-time alert 1: Rain & Irrigation warning */}
            <div className="p-3.5 rounded-xl bg-blue-50/80 border border-blue-200 text-blue-950 space-y-1">
              <div className="flex items-center justify-between">
                <strong className="font-bold flex items-center space-x-1.5 text-blue-900">
                  <CloudRain className="w-4 h-4 text-blue-600" />
                  <span>Rain Probability & Irrigation Advisory</span>
                </strong>
                <span className="text-[10px] font-mono font-bold bg-blue-200/80 text-blue-900 px-2 py-0.5 rounded-full">
                  Rain: {currentWeather?.rainProbability || 25}%
                </span>
              </div>
              <p className="text-blue-900/90 leading-relaxed font-medium">
                {isTa 
                  ? `திட்டமிடப்பட்ட நீர்ப்பாசன சுழற்சியை வானிலைக்கேற்ப மாற்றவும். மழை வாய்ப்பு உள்ளதால் சொட்டுநீர் நேரத்தைக் குறைத்து வேரழுகலைத் தவிர்க்கவும்.`
                  : `Rain forecast indicates moderate precipitation in ${activeLocation}. If rainfall exceeds 15mm, postpone automated drip fertigation to prevent nutrient leaching.`}
              </p>
            </div>

            {/* Real-time alert 2: Harvesting Weather Protection */}
            <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-950 space-y-1">
              <div className="flex items-center justify-between">
                <strong className="font-bold flex items-center space-x-1.5 text-amber-900">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Harvesting Weather Advisory ({selectedCropKey})</span>
                </strong>
                <span className="text-[10px] font-mono font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full">
                  Window: {calculations.bestHarvestPeriodFormatted}
                </span>
              </div>
              <p className="text-amber-900/90 leading-relaxed font-medium">
                {isTa 
                  ? `அறுவடை காலத்தில் ஈரப்பதம் அதிகமாக இருந்தால் தக்காளி மற்றும் கத்தரி பழங்களில் விரிசல் ஏற்படலாம். வெயில் உள்ள காலை நேரங்களில் அறுவடை செய்யவும்.`
                  : `Ensure dry conditions during planned harvest window (${calculations.bestHarvestPeriodFormatted}). In case of sudden showers, pick at breaker stage to prevent skin splitting.`}
              </p>
            </div>

            {/* Real-time alert 3: Pest & Disease risk window */}
            <div className="p-3.5 rounded-xl bg-purple-50/80 border border-purple-200 text-purple-950 space-y-1">
              <strong className="font-bold flex items-center space-x-1.5 text-purple-900">
                <Activity className="w-4 h-4 text-purple-600" />
                <span>Disease & Pest Environmental Risk</span>
              </strong>
              <p className="text-purple-900/90 leading-relaxed font-medium">
                {isTa 
                  ? `இரவு நேர வெப்பநிலை மற்றும் 80%க்கும் அதிகமான ஈரப்பதம் பிளைட் மற்றும் பூஞ்சை நோய்களைத் தூண்டும். AI கேமரா மூலம் இலைகளை ஆய்வு செய்யவும்.`
                  : `High relative humidity (${currentWeather?.humidity || 68}%) favors foliar fungal blight spores in ${selectedCropKey}. Inspect lower canopy leaves every 48 hours.`}
              </p>
            </div>

          </div>
        </div>

        {/* Right 1 Col: Live Weather Snapshot Card */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h4 className="font-bold text-gray-900 text-xs sm:text-sm flex items-center space-x-1.5">
                <Sun className="w-4 h-4 text-amber-500" />
                <span>Field Weather ({selectedDistrict})</span>
              </h4>
              <span className="text-[10px] text-gray-400 font-mono">Live Sync</span>
            </div>

            {currentWeather ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-3xl font-black text-gray-900">{currentWeather.temp}°C</span>
                    <span className="text-xs text-gray-500 block font-medium">{currentWeather.condition}</span>
                  </div>
                  <span className="text-4xl">{currentWeather.icon || '⛅'}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-gray-100">
                  <div className="p-2 bg-gray-50 rounded-xl">
                    <span className="text-gray-400 text-[10px] font-bold block">HUMIDITY</span>
                    <strong className="text-gray-900 font-bold">{currentWeather.humidity}%</strong>
                  </div>
                  <div className="p-2 bg-gray-50 rounded-xl">
                    <span className="text-gray-400 text-[10px] font-bold block">RAIN PROB</span>
                    <strong className="text-blue-600 font-bold">{currentWeather.rainProbability}%</strong>
                  </div>
                  <div className="p-2 bg-gray-50 rounded-xl">
                    <span className="text-gray-400 text-[10px] font-bold block">WIND SPEED</span>
                    <strong className="text-gray-900 font-bold">{currentWeather.windSpeed} km/h</strong>
                  </div>
                  <div className="p-2 bg-gray-50 rounded-xl">
                    <span className="text-gray-400 text-[10px] font-bold block">UV INDEX</span>
                    <strong className="text-amber-700 font-bold">{currentWeather.uvIndex || '6 (Mod)'}</strong>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-gray-400 text-xs">
                Loading live field weather...
              </div>
            )}
          </div>

          <button
            onClick={() => navigate('/weather')}
            className="w-full py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold text-xs rounded-xl border border-gray-200 transition-colors flex items-center justify-center space-x-1"
          >
            <span>View Full 7-Day Forecast</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

      {/* 7. FARMING ACTIVITIES CHECKLIST & WEATHER-AWARE REMINDERS */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-bold text-gray-900">{t('farmActivities')}</h3>
              <span className="text-xs bg-agri-100 text-agri-800 font-bold px-2 py-0.5 rounded-full">
                {completedActivitiesCount} / {totalActivitiesCount} {t('statusCompleted')}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              {isTa ? "பயிர் வளர்ச்சி மற்றும் வானிலை எச்சரிக்கைகளுடன் இணைக்கப்பட்ட பணிகள்" : "Categorized schedule with weather-aware triggers for irrigation, fertilizers, pests & harvesting."}
            </p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            {['All', 'Fertilizer', 'Irrigation', 'Disease', 'Pest', 'Harvesting'].map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setActivityCategoryFilter(cat)}
                className={`px-3 py-1 rounded-xl font-bold transition-all text-xs ${
                  activityCategoryFilter === cat
                    ? 'bg-agri-600 text-white shadow-2xs'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                }`}
              >
                {cat === 'All' ? t('filterAll')
                  : cat === 'Fertilizer' ? t('filterFertilizer')
                  : cat === 'Irrigation' ? t('filterIrrigation')
                  : cat === 'Disease' ? t('filterDisease')
                  : cat === 'Pest' ? t('filterPest')
                  : t('filterHarvest')}
              </button>
            ))}
          </div>
        </div>

        {/* Activities List */}
        <div className="space-y-3">
          {filteredActivities.map((act) => (
            <div 
              key={act.id} 
              className={`p-4 rounded-2xl border space-y-2.5 text-xs transition-all ${
                act.status === 'Completed' ? 'bg-gray-50/70 border-gray-200 opacity-75' : 'bg-white border-gray-200 shadow-2xs hover:border-gray-300'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-start space-x-3">
                  <button
                    onClick={() => handleToggleActivity(act.id)}
                    className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all mt-0.5 shrink-0 ${
                      act.status === 'Completed' ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs' : 'bg-white border-gray-300 text-transparent hover:border-agri-500'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>

                  <div>
                    <h4 className={`text-sm font-extrabold ${act.status === 'Completed' ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                      {isTa ? act.nameTa : act.nameEn}
                    </h4>
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-400 font-mono mt-0.5">
                      <span>📅 Scheduled: {act.computedDateFormatted} (Day +{act.dayOffset})</span>
                      <span>•</span>
                      <span className="font-semibold text-agri-700 bg-agri-50 px-2 py-0.5 rounded-md">{act.category}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 self-end sm:self-center">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    act.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {act.status === 'Completed' ? t('statusCompleted') : t('statusUpcoming')}
                  </span>
                </div>
              </div>

              <p className="text-gray-700 leading-relaxed font-medium pl-9 text-xs">
                {isTa ? act.descriptionTa : act.descriptionEn}
              </p>

              {/* Embedded Weather-Aware Alert */}
              {act.weatherAwareAlert && (
                <div className="ml-9 p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1 text-amber-950 font-medium">
                  <div className="font-bold text-amber-900 flex items-center space-x-1.5 text-[11px]">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>{t('weatherReminder')}</span>
                  </div>
                  <p className="text-[11px] leading-snug">{act.weatherAwareAlert}</p>
                </div>
              )}

            </div>
          ))}
        </div>
      </div>

      {/* 8. RAG-LLM AGRONOMIC ADVISORY & VOICE SYNTHESIS PANEL */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-gray-900 flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-agri-600" />
              <span>{t('aiAdvisoryHeading')}</span>
            </h3>
            <p className="text-xs text-gray-500">
              {t('aiAdvisorySub')}
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleToggleAudio}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center space-x-1.5 transition-colors ${
                isSpeaking ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200'
              }`}
            >
              {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              <span>{isSpeaking ? t('stopAudio') : t('listenAudio')}</span>
            </button>

            <button
              onClick={handleGenerateAiAdvisory}
              disabled={isGeneratingAi}
              className="px-3.5 py-1.5 bg-agri-600 hover:bg-agri-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center space-x-1.5"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isGeneratingAi ? 'animate-spin' : ''}`} />
              <span>{isGeneratingAi ? t('generatingAi') : (aiAdvisory ? 'Refresh Advisory' : t('generateAiAdvisory'))}</span>
            </button>
          </div>
        </div>

        {/* AI Advisory Content Box */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-agri-50/70 to-emerald-50/60 border border-agri-200 space-y-3 text-xs">
          {aiAdvisory ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] text-agri-800 font-bold">
                <span className="flex items-center space-x-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>RAG Knowledge + Live Weather Advisory ({selectedCropKey} • {activeLocation})</span>
                </span>
                <span className="font-mono text-gray-400">{aiAdvisory.timestamp || 'Generated Just Now'}</span>
              </div>
              <p className="text-gray-900 whitespace-pre-line leading-relaxed font-medium text-xs sm:text-sm">
                {aiAdvisory.text}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-agri-800 font-bold text-xs">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Default Pre-Planning Guidance ({selectedCropKey})</span>
              </div>
              <p className="text-gray-800 leading-relaxed font-medium">
                {isTa
                  ? `திட்டமிடப்பட்ட பயிர்: ${cropConfig.nameTa} (${farmSize} ஏக்கர்) • இடம்: ${activeLocation} • விதைப்பு தேதி: ${formatDisplayDate(plantingDate, true)}. எதிர்பார்க்கப்படும் அறுவடை காலம்: ${calculations.bestHarvestPeriodFormatted}. உடனடி விரிவான ஆலோசனையைப் பெற "AI விவசாய ஆலோசனையைப் பெறுங்கள்" பொத்தானை அழுத்தவும்.`
                  : `Configured Plan: ${cropConfig.nameEn} (${farmSize} Acres) in ${activeLocation}. Planting on ${formatDisplayDate(plantingDate, false)} will yield an optimal harvest window of ${calculations.bestHarvestPeriodFormatted}. Click "Generate AI Farming Advice" for personalized RAG-LLM advisory.`}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 9. DATA SAFETY & AGRONOMIC DISCLAIMER */}
      <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 text-center text-xs text-gray-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center space-x-2 text-[11px]">
          <Info className="w-4 h-4 text-gray-400 shrink-0" />
          <span>{t('planningEstimateNote')}</span>
        </div>
        <div className="font-mono text-[10px] text-gray-400">
          Solanaceae Crop Planning Engine • TNAU & Agronomic Guidelines
        </div>
      </div>

    </div>
  );
}
