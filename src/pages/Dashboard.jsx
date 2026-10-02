import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  CloudSun,
  ArrowRight,
  CalendarDays,
  BookOpen,
  ShieldAlert,
  ShieldCheck,
  MapPin,
  RefreshCw,
  Scan,
  Clock,
  Leaf
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/apiService';
import { useWeather } from '../context/WeatherContext';

export default function Dashboard() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [metrics, setMetrics] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);
  const [recentPredictions, setRecentPredictions] = useState([]);
  const [insights, setInsights] = useState([]);
  const [plannerWidget, setPlannerWidget] = useState(null);
  const [libraryWidget, setLibraryWidget] = useState(null);
  const [loading, setLoading] = useState(true);

  // Centralized Weather State from WeatherContext
  const {
    weatherData,
    loading: weatherLoading,
    refreshing: weatherRefreshing,
    error: weatherError,
    refreshWeather,
    location: weatherLocation
  } = useWeather();

  useEffect(() => {
    async function loadDashboardData() {
      setLoading(true);
      try {
        const [summaryData, activities, farmActs, libArticles, preds] = await Promise.all([
          apiService.getSummaryMetrics(),
          apiService.getRecentActivities(),
          apiService.getFarmActivities(),
          apiService.getLibraryArticles(),
          apiService.getPredictions({ userId: user?.user_id || user?.id })
        ]);

        setMetrics(summaryData.metrics);
        setInsights(summaryData.insights);
        setRecentActivities(activities || []);
        setPlannerWidget(farmActs ? farmActs[0] : null);
        setLibraryWidget(libArticles ? libArticles[0] : null);
        setRecentPredictions((preds || []).slice(0, 3));
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-agri-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-medium text-gray-600">
            {language === 'ta' ? 'ஸ்மார்ட் விவசாய தளம் ஏற்றப்படுகிறது...' : 'Loading SmartFarm Dashboard...'}
          </p>
        </div>
      </div>
    );
  }

  const isTa = language === 'ta';

  // Helper to determine the top active weather alert
  const getActiveWeatherAlert = () => {
    if (!weatherData) return null;

    // 1. Official OpenWeather Alerts (Top Priority)
    if (weatherData.official_alerts && weatherData.official_alerts.length > 0) {
      const off = weatherData.official_alerts[0];
      return {
        isOfficial: true,
        severity: (off.severity || 'WARNING').toUpperCase(),
        title: off.event || (isTa ? 'அதிகாரப்பூர்வ வானிலை எச்சரிக்கை' : 'Official Weather Advisory'),
        details: off.end ? `${isTa ? 'செல்லுபடியாகும் நேரம்' : 'Valid until'}: ${off.end}` : (off.sender || 'National Meteorological Authority')
      };
    }

    // 2. High/Medium Severity Smart Farming Alerts derived from real OpenWeather parameters
    if (weatherData.smart_alerts && weatherData.smart_alerts.length > 0) {
      const activeFarmingAlert = weatherData.smart_alerts.find(
        a => a.severity === 'HIGH' || a.severity === 'MEDIUM'
      );
      if (activeFarmingAlert) {
        return {
          isOfficial: false,
          severity: activeFarmingAlert.severity,
          title: isTa ? activeFarmingAlert.title?.ta : activeFarmingAlert.title?.en,
          details: isTa ? activeFarmingAlert.message?.ta : activeFarmingAlert.message?.en
        };
      }
    }

    return null;
  };

  const topAlert = getActiveWeatherAlert();

  return (
    <div className="space-y-6">

      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-agri-600 to-agri-700 rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {t('greeting')}
          </h2>
          <p className="text-agri-100 text-sm mt-1 max-w-xl">
            {t('greetingSub')}
          </p>
        </div>
        <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/20">
          <Sparkles className="w-4 h-4 text-agri-300 animate-pulse" />
          <div className="text-xs">
            <span className="font-semibold text-white block">{isTa ? "AI தளம்" : "AI Diagnostics"}</span>
            <span className="text-agri-200">{isTa ? "செயலில் உள்ளது" : "System Active"}</span>
          </div>
        </div>
      </div>

      {/* 2. Summary Widgets Grid (Weather, Next Planner Activity, Weather Alert, Agriculture Topic) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Widget 1: Today's Weather */}
        <div
          onClick={() => navigate('/weather')}
          className="bg-gradient-to-br from-blue-600 to-indigo-700 p-4 rounded-2xl text-white shadow-2xs space-y-2 cursor-pointer hover:shadow-md transition-all relative group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-200">{t('todaysWeather')}</span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  refreshWeather();
                }}
                title={isTa ? "வானிலை புதுப்பிக்க" : "Refresh Weather"}
                className={`p-1 hover:bg-white/15 rounded-lg transition-all ${weatherRefreshing ? 'animate-spin' : ''}`}
              >
                <RefreshCw className="w-3.5 h-3.5 text-blue-200 hover:text-white" />
              </button>
              <CloudSun className="w-4 h-4 text-amber-300" />
            </div>
          </div>

          {weatherLoading && !weatherData ? (
            <div className="space-y-1.5 py-1">
              <div className="flex items-center space-x-2">
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs text-blue-100 font-medium">
                  {isTa ? 'வானிலை தரவு ஏற்றப்படுகிறது...' : 'Loading weather...'}
                </span>
              </div>
              <p className="text-[11px] text-blue-200/80">
                {isTa ? 'வானிலை தகவலைப் பெறுகிறது...' : 'Fetching current weather...'}
              </p>
            </div>
          ) : weatherError && !weatherData ? (
            <div className="space-y-1 py-0.5">
              <div className="text-xs font-semibold text-amber-200 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-300" />
                <span>{isTa ? 'வானிலை சேவை தற்காலிகமாக கிடைக்கவில்லை' : 'Weather temporarily unavailable'}</span>
              </div>
              <div className="flex justify-between items-center text-[11px] text-blue-200 pt-1 border-t border-white/15">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    refreshWeather();
                  }}
                  className="underline hover:text-white font-medium flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  {isTa ? 'மீண்டும் முயற்சிக்கவும்' : 'Retry'}
                </button>
                <span className="font-bold flex items-center hover:underline">
                  {t('viewForecast')} →
                </span>
              </div>
            </div>
          ) : weatherData && weatherData.current ? (
            <>
              <div className="text-[11px] text-blue-200 font-medium flex items-center gap-1 truncate">
                <MapPin className="w-3 h-3 text-blue-300 shrink-0" />
                <span className="truncate">{weatherData.location_name || weatherLocation?.name || "Tiruchengode, Tamil Nadu"}</span>
              </div>
              <div className="flex items-center justify-between pt-0.5">
                <div className="flex items-baseline space-x-2">
                  <span className="text-2xl font-black tracking-tight">{Math.round(weatherData.current.temperature)}°C</span>
                  <span className="text-xs text-blue-100 font-medium truncate max-w-[110px]">
                    {weatherData.current.description || weatherData.current.condition}
                  </span>
                </div>
                <span className="text-2xl select-none" title={weatherData.current.condition}>
                  {weatherData.current.icon || "⛅"}
                </span>
              </div>
              <div className="flex justify-between items-center text-[11px] text-blue-100 pt-1 border-t border-white/15">
                <span className="text-blue-200">
                  {isTa ? 'மழை' : 'Rain'}: {weatherData.current.rain_probability ?? 0}% • {weatherData.current.humidity}% {isTa ? 'ஈரப்பதம்' : 'hum'}
                </span>
                <span className="font-bold flex items-center hover:underline text-white">
                  {t('viewForecast')} →
                </span>
              </div>
            </>
          ) : null}
        </div>

        {/* Widget 2: Next Farming Activity */}
        <div
          onClick={() => navigate('/farming-planner')}
          className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs space-y-2 cursor-pointer hover:border-agri-400 hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">{t('nextActivity')}</span>
            <CalendarDays className="w-4 h-4 text-agri-600" />
          </div>
          <div className="text-sm font-bold text-gray-900 truncate">
            {plannerWidget ? (isTa ? plannerWidget?.nameTa : plannerWidget?.nameEn) : t('noDataAvailable')}
          </div>
          <div className="flex justify-between items-center text-[11px] pt-1 border-t border-gray-100">
            <span className="text-agri-600 font-medium">{plannerWidget?.date ? `Due: ${plannerWidget.date}` : t('noDataAvailable')}</span>
            <span className="font-bold text-gray-700 flex items-center">{t('viewPlanner')} →</span>
          </div>
        </div>

        {/* Widget 3: Weather Alert Widget */}
        <div
          onClick={() => navigate('/weather')}
          className={`p-4 rounded-2xl border shadow-2xs space-y-2 cursor-pointer transition-all ${
            topAlert
              ? topAlert.severity === 'HIGH'
                ? 'bg-rose-50/90 border-rose-200 hover:bg-rose-100/80'
                : 'bg-amber-50/90 border-amber-200 hover:bg-amber-100/80'
              : weatherError && !weatherData
              ? 'bg-rose-50/80 border-rose-200'
              : 'bg-emerald-50/70 border-emerald-200 hover:bg-emerald-100/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-xs font-bold uppercase tracking-wider ${
                topAlert
                  ? topAlert.severity === 'HIGH'
                    ? 'text-rose-900'
                    : 'text-amber-900'
                  : weatherError && !weatherData
                  ? 'text-rose-900'
                  : 'text-emerald-900'
              }`}
            >
              {t('weatherAlertWidget')}
            </span>
            {topAlert ? (
              <ShieldAlert className={`w-4 h-4 ${topAlert.severity === 'HIGH' ? 'text-rose-600' : 'text-amber-600'}`} />
            ) : weatherError && !weatherData ? (
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            ) : (
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            )}
          </div>

          {weatherLoading && !weatherData ? (
            <div className="space-y-1 py-1">
              <div className="flex items-center space-x-2">
                <div className="w-3.5 h-3.5 border-2 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs font-bold text-amber-950">
                  {isTa ? 'வானிலை எச்சரிக்கைகள் சோதிக்கப்படுகின்றன...' : 'Checking weather alerts...'}
                </span>
              </div>
              <p className="text-[10px] text-amber-800/80">
                {isTa ? 'நேரடி எச்சரிக்கை தகவல்' : 'Monitoring weather advisories'}
              </p>
            </div>
          ) : weatherError && !weatherData ? (
            <div className="space-y-1 py-0.5">
              <div className="text-xs font-bold text-rose-950">
                {isTa ? 'வானிலை எச்சரிக்கை தகவல் கிடைக்கவில்லை' : 'Weather data unavailable'}
              </div>
              <div className="text-[10px] text-rose-800 font-medium">
                {isTa ? 'வானிலை சேவை இணைக்கப்படவில்லை' : 'Weather service not connected'}
              </div>
            </div>
          ) : topAlert ? (
            <div>
              <div
                className={`text-xs font-bold truncate ${
                  topAlert.severity === 'HIGH' ? 'text-rose-950' : 'text-amber-950'
                }`}
              >
                {topAlert.title}
              </div>
              <div
                className={`text-[10px] font-medium truncate pt-0.5 ${
                  topAlert.severity === 'HIGH' ? 'text-rose-800' : 'text-amber-800'
                }`}
              >
                {topAlert.details}
              </div>
              <div className="flex justify-end pt-1">
                <span className="text-[11px] font-bold text-gray-700 hover:underline flex items-center">
                  {isTa ? 'வானிலை பார்க்க' : 'View Weather'} →
                </span>
              </div>
            </div>
          ) : (
            <div>
              <div className="text-xs font-bold text-emerald-950 truncate">
                {isTa ? 'வானிலை எச்சரிக்கைகள் இல்லை' : 'No active weather alerts'}
              </div>
              <div className="text-[10px] text-emerald-800 font-medium truncate pt-0.5">
                {isTa ? 'களப் பணிகளுக்கு உகந்த வானிலை' : 'Conditions normal for field operations'}
              </div>
              <div className="flex justify-end pt-1">
                <span className="text-[11px] font-bold text-emerald-800 hover:underline flex items-center">
                  {isTa ? 'வானிலை பார்க்க' : 'View Weather'} →
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Widget 4: Latest Agriculture Library Topic */}
        <div
          onClick={() => navigate('/library')}
          className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs space-y-2 cursor-pointer hover:border-agri-400 hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">{t('latestLibraryTopic')}</span>
            <BookOpen className="w-4 h-4 text-agri-600" />
          </div>
          <div className="text-xs font-bold text-gray-900 truncate">
            {isTa ? libraryWidget?.titleTa : libraryWidget?.titleEn}
          </div>
          <div className="flex justify-between items-center text-[11px] pt-1 border-t border-gray-100">
            <span className="text-agri-600 font-medium">RAG Guide</span>
            <span className="font-bold text-gray-700 flex items-center">{t('exploreLibrary')} →</span>
          </div>
        </div>

      </div>

      {/* 3. Core Software AI Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Card 1: Crop Health */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs space-y-2 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">{t('cropHealth')}</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">78%</div>
          <div className="flex items-center space-x-2 text-[11px] text-gray-500 font-medium">
            <span className="text-emerald-600">78% {t('healthy')}</span>
            <span>•</span>
            <span className="text-amber-500">16% {t('atRisk')}</span>
          </div>
        </div>

        {/* Card 2: AI Disease Diagnoses */}
        <div 
          onClick={() => navigate('/crop-disease')}
          className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs space-y-2 hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">{isTa ? "AI நோய் கணிப்புகள்" : "AI Diagnoses"}</span>
            <Scan className="w-4 h-4 text-agri-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {metrics?.diseaseDetections?.total || 142}
          </div>
          <div className="flex items-center space-x-2 text-[11px] text-gray-500 font-medium">
            <span className="text-agri-600 font-bold">{metrics?.diseaseDetections?.accuracy || 96.8}% {isTa ? "துல்லியம்" : "Accuracy"}</span>
            <span>•</span>
            <span className="text-gray-500">{metrics?.diseaseDetections?.thisWeek || 18} {isTa ? "இந்த வாரம்" : "this week"}</span>
          </div>
        </div>

        {/* Card 3: AI Recommendations */}
        <div 
          onClick={() => navigate('/ai-assistant')}
          className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs space-y-2 hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">{isTa ? "AI வழிகாட்டுதல்கள்" : "AI Recommendations"}</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {insights?.length || 2}
          </div>
          <div className="flex items-center space-x-2 text-[11px] text-emerald-600 font-medium">
            <span>{isTa ? "செயலில் உள்ள ஆலோசனைகள்" : "Active RAG Advisories"}</span>
          </div>
        </div>

        {/* Card 4: Seasonal Farming Planner */}
        <div 
          onClick={() => navigate('/farming-planner')}
          className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs space-y-2 hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">{isTa ? "பயிர் திட்டமிடல்" : "Farming Planner"}</span>
            <CalendarDays className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-lg font-bold text-gray-900 truncate">
            {plannerWidget ? (isTa ? plannerWidget?.nameTa : plannerWidget?.nameEn) : (isTa ? "திட்டம் செயலில் உள்ளது" : "Plan on Track")}
          </div>
          <div className="flex items-center space-x-2 text-[11px] text-blue-600 font-medium">
            <span>{isTa ? "பருவம்: காரிஃப் 2026" : "Season: Kharif 2026"}</span>
          </div>
        </div>

      </div>

      {/* 4. Two Column Layout: Recent Activities & Diagnoses | AI Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left 2 Cols: Recent Disease Predictions & Platform Activities */}
        <div className="lg:col-span-2 space-y-6">

          {/* Recent Disease Diagnoses Card */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-gray-900 flex items-center space-x-2">
                  <Scan className="w-4 h-4 text-agri-600" />
                  <span>{isTa ? "சமீபத்திய பயிர் நோய் கணிப்புகள்" : "Recent Disease Diagnoses"}</span>
                </h3>
                <p className="text-xs text-gray-500">
                  {isTa ? "YOLO11, SAM மற்றும் ResNet-50 AI மாதிரிகளின் மூலம் கண்டறியப்பட்டவை" : "Verified via YOLO11, SAM & ResNet-50 Deep Learning Pipeline"}
                </p>
              </div>
              <button
                onClick={() => navigate('/crop-disease')}
                className="text-xs font-bold text-agri-700 hover:text-agri-800 flex items-center gap-1"
              >
                <span>{isTa ? "புதிய ஸ்கேன்" : "New Scan"}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {recentPredictions && recentPredictions.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {recentPredictions.map((pred) => (
                  <div
                    key={pred.id}
                    onClick={() => navigate(`/reports?id=${pred.id}`)}
                    className="p-3 bg-gray-50 hover:bg-agri-50/50 rounded-xl border border-gray-100 hover:border-agri-200 transition-all cursor-pointer space-y-2"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-agri-800 bg-agri-100/70 px-2 py-0.5 rounded">
                        {pred.crop}
                      </span>
                      <span className="font-mono text-gray-400 text-[10px]">
                        {pred.confidence ? `${Math.round(pred.confidence)}%` : '95%'}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-gray-900 truncate">
                      {pred.disease || pred.predicted_disease || "Healthy"}
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-gray-400 pt-1 border-t border-gray-200/50">
                      <span>{pred.createdAt || "Recent"}</span>
                      <span className="text-agri-600 font-semibold">{isTa ? "அறிக்கை" : "Report"} →</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center space-x-2">
                  <Leaf className="w-4 h-4 text-agri-600" />
                  <span>{isTa ? "சமீபத்திய நோய் பதிவுகள் எதுவும் இல்லை. புதிய இலை படத்தை ஸ்கேன் செய்யவும்." : "No recent disease scans. Upload a crop leaf image to diagnose."}</span>
                </div>
                <button
                  onClick={() => navigate('/crop-disease')}
                  className="font-bold text-agri-700 hover:underline shrink-0"
                >
                  {isTa ? "ஸ்கேன் செய்" : "Diagnose Now"} →
                </button>
              </div>
            )}
          </div>

          {/* Platform & Farming Activities Card */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-gray-900 flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-agri-600" />
                  <span>{t('recentActivity')}</span>
                </h3>
                <p className="text-xs text-gray-500">
                  {isTa ? "தள AI மற்றும் விவசாயப் பதிவுகள்" : "Platform AI & farming activity logs"}
                </p>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              {recentActivities.map((act) => (
                <div key={act.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></div>
                    <span className="font-semibold text-gray-800">{act.message}</span>
                  </div>
                  <span className="text-gray-400 font-mono text-[11px] shrink-0 ml-2">{act.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: AI Insights */}
        <div className="space-y-6">

          {/* AI Insights Card */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-3">
            <h3 className="text-base font-bold text-gray-900 flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <span>{t('aiInsights')}</span>
            </h3>

            <div className="space-y-3">
              {insights.map(item => (
                <div key={item.id} className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1 text-xs">
                  <div className="font-bold text-amber-900 flex items-center justify-between">
                    <span>{isTa ? item.title.ta : item.title.en}</span>
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  </div>
                  <p className="text-amber-800 leading-relaxed">
                    {isTa ? item.description.ta : item.description.en}
                  </p>
                  {item.action && (
                    <div className="pt-1 text-[11px] font-semibold text-agri-700">
                      💡 {item.action}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
