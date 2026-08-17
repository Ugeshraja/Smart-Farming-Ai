import React, { useState, useEffect } from 'react';
import { 
  CloudSun, 
  MapPin, 
  Search, 
  Navigation, 
  Thermometer, 
  Droplets, 
  CloudRain, 
  Wind, 
  Sun, 
  AlertTriangle, 
  ShieldAlert, 
  Activity, 
  RefreshCw, 
  CheckCircle2, 
  Info,
  Calendar,
  Clock
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { apiService } from '../services/apiService';

export default function Weather() {
  const { t, language } = useLanguage();

  const [location, setLocation] = useState("Tiruchengode, Tamil Nadu");
  const [locationSearch, setLocationSearch] = useState("");
  const [selectedCrop, setSelectedCrop] = useState("Tomato");

  const [currentWeather, setCurrentWeather] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [cropInsight, setCropInsight] = useState(null);
  const [fieldComparison, setFieldComparison] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const popularLocations = [
    "Tiruchengode, Tamil Nadu",
    "Dharmapuri, Tamil Nadu",
    "Salem, Tamil Nadu",
    "Coimbatore, Tamil Nadu",
    "Madurai, Tamil Nadu"
  ];

  const fetchWeatherData = async (loc = location) => {
    setLoading(true);
    setError(false);
    try {
      const [current, fc, altData, insight, compareData] = await Promise.all([
        apiService.getWeatherCurrent(loc),
        apiService.getWeatherForecast(loc),
        apiService.getWeatherAlerts(loc),
        apiService.getCropWeatherInsights(selectedCrop),
        apiService.getFieldVsWeather()
      ]);

      setCurrentWeather(current);
      setForecast(fc);
      setAlerts(altData);
      setCropInsight(insight);
      setFieldComparison(compareData);
    } catch (err) {
      console.error("Weather fetch error:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeatherData(location);
  }, [location, selectedCrop]);

  const handleLocationSearchSubmit = (e) => {
    e.preventDefault();
    if (locationSearch.trim()) {
      setLocation(locationSearch.trim());
      setLocationSearch("");
    }
  };

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude.toFixed(2);
          const lon = pos.coords.longitude.toFixed(2);
          setLocation(`Field Node (${lat}°, ${lon}°), Tamil Nadu`);
        },
        () => {
          alert("Geolocation unavailable or denied. Using default agricultural field location.");
          setLocation("Tiruchengode, Tamil Nadu");
          fetchWeatherData("Tiruchengode, Tamil Nadu");
        }
      );
    } else {
      alert("Geolocation not supported by browser.");
    }
  };

  const isTa = language === 'ta';

  if (error) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-2xs text-center space-y-4 max-w-lg mx-auto my-12">
        <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-base font-bold text-gray-900">{t('weatherError')}</h3>
          <p className="text-xs text-gray-500 mt-1">Please check your internet connection or try again.</p>
        </div>
        <button
          onClick={() => fetchWeatherData()}
          className="px-5 py-2 bg-agri-600 hover:bg-agri-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
        >
          {t('tryAgain')}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      
      {/* 1. Page Title Header & Location Bar */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight flex items-center space-x-2">
              <CloudSun className="w-6 h-6 text-agri-600" />
              <span>{t('weatherTitle')}</span>
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
              {t('weatherSubtitle')}
            </p>
          </div>

          {/* Location Badge */}
          <div className="flex items-center space-x-2 bg-agri-50 px-3.5 py-2 rounded-xl border border-agri-200 text-xs font-bold text-agri-800">
            <MapPin className="w-4 h-4 text-agri-600 shrink-0" />
            <span>📍 {location}</span>
          </div>
        </div>

        {/* Location Search Bar & Quick Picks */}
        <div className="pt-2 border-t border-gray-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
          
          <form onSubmit={handleLocationSearchSubmit} className="flex items-center space-x-2 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder={t('searchLocationPlaceholder')}
                value={locationSearch}
                onChange={(e) => setLocationSearch(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-agri-500"
              />
            </div>
            <button
              type="submit"
              className="px-3.5 py-2 bg-agri-600 hover:bg-agri-700 text-white font-bold rounded-xl shadow-2xs transition-colors shrink-0"
            >
              Search
            </button>
          </form>

          <div className="flex items-center space-x-2 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={handleUseCurrentLocation}
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors flex items-center space-x-1 shrink-0"
            >
              <Navigation className="w-3.5 h-3.5 text-agri-600" />
              <span>{t('useCurrentLocation')}</span>
            </button>

            {popularLocations.slice(0, 2).map((loc, idx) => (
              <button
                key={idx}
                onClick={() => setLocation(loc)}
                className="px-2.5 py-2 bg-white border border-gray-200 hover:bg-agri-50 text-gray-600 rounded-xl font-medium shrink-0"
              >
                {loc.split(',')[0]}
              </button>
            ))}
          </div>

        </div>
      </div>

      {loading ? (
        /* Loading Skeleton State */
        <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-2xs space-y-4 animate-pulse">
          <div className="h-6 bg-gray-200 rounded-md w-48"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="h-24 bg-gray-100 rounded-xl"></div>
            <div className="h-24 bg-gray-100 rounded-xl"></div>
            <div className="h-24 bg-gray-100 rounded-xl"></div>
            <div className="h-24 bg-gray-100 rounded-xl"></div>
          </div>
          <p className="text-xs text-gray-500 text-center font-medium">{t('fetchingWeather')}</p>
        </div>
      ) : (
        <>
          {/* 2. Large Current Weather Card */}
          <div className="bg-gradient-to-br from-agri-600 via-agri-700 to-emerald-800 text-white p-6 sm:p-8 rounded-2xl shadow-md space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <span className="text-xs font-semibold text-agri-200 uppercase tracking-wider block">{t('currentWeather')}</span>
                <h3 className="text-3xl sm:text-4xl font-black mt-1">
                  {currentWeather?.temperature}°C
                </h3>
                <p className="text-sm font-medium text-agri-100 mt-1">
                  {isTa ? currentWeather?.conditionTa : currentWeather?.condition}
                </p>
              </div>

              <div className="text-left sm:text-right">
                <div className="text-4xl mb-1">🌤️</div>
                <span className="text-xs text-agri-200 font-mono block">
                  High: {currentWeather?.highTemp}°C • Low: {currentWeather?.lowTemp}°C
                </span>
              </div>
            </div>

            {/* Current Weather Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
              <div className="bg-white/10 backdrop-blur-xs p-3 rounded-xl border border-white/15 space-y-1">
                <span className="text-agri-200 flex items-center space-x-1">
                  <Droplets className="w-3.5 h-3.5 text-blue-300" />
                  <span>{t('humidity')}</span>
                </span>
                <span className="text-lg font-bold block">{currentWeather?.humidity}%</span>
              </div>

              <div className="bg-white/10 backdrop-blur-xs p-3 rounded-xl border border-white/15 space-y-1">
                <span className="text-agri-200 flex items-center space-x-1">
                  <CloudRain className="w-3.5 h-3.5 text-cyan-300" />
                  <span>{t('rainProbability')}</span>
                </span>
                <span className="text-lg font-bold block">{currentWeather?.rainProbability}%</span>
              </div>

              <div className="bg-white/10 backdrop-blur-xs p-3 rounded-xl border border-white/15 space-y-1">
                <span className="text-agri-200 flex items-center space-x-1">
                  <Wind className="w-3.5 h-3.5 text-teal-200" />
                  <span>{t('windSpeed')}</span>
                </span>
                <span className="text-lg font-bold block">{currentWeather?.windSpeed} km/h</span>
              </div>

              <div className="bg-white/10 backdrop-blur-xs p-3 rounded-xl border border-white/15 space-y-1">
                <span className="text-agri-200 flex items-center space-x-1">
                  <Sun className="w-3.5 h-3.5 text-amber-300" />
                  <span>{t('uvIndex')}</span>
                </span>
                <span className="text-lg font-bold block">UV {currentWeather?.uvIndex}</span>
              </div>

              <div className="bg-white/10 backdrop-blur-xs p-3 rounded-xl border border-white/15 space-y-1 col-span-2 sm:col-span-1">
                <span className="text-agri-200 flex items-center space-x-1">
                  <Activity className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Field Status</span>
                </span>
                <span className="text-lg font-bold block text-emerald-300">Optimal</span>
              </div>
            </div>
          </div>

          {/* 3. Farmer Weather Alerts Section (High Importance) */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-gray-900 flex items-center space-x-2">
                  <ShieldAlert className="w-5 h-5 text-amber-600" />
                  <span>{t('farmerAlerts')}</span>
                </h3>
                <p className="text-xs text-gray-500">Agronomic weather warnings and risk mitigations</p>
              </div>
              <span className="text-xs bg-amber-100 text-amber-800 font-bold px-2.5 py-1 rounded-full">
                {alerts.length} Active Alerts
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {alerts.map((alt) => (
                <div 
                  key={alt.id}
                  className={`p-4 rounded-xl border space-y-2 text-xs transition-colors ${
                    alt.severity === 'HIGH' 
                      ? 'bg-red-50/70 border-red-200 text-red-950'
                      : alt.severity === 'MEDIUM'
                      ? 'bg-amber-50/70 border-amber-200 text-amber-950'
                      : 'bg-blue-50/70 border-blue-200 text-blue-950'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold">
                    <span className="flex items-center space-x-1.5 text-sm">
                      <span>{alt.icon}</span>
                      <span>{isTa ? alt.title.ta : alt.title.en}</span>
                    </span>
                    <span className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-bold ${
                      alt.severity === 'HIGH' ? 'bg-red-600 text-white' : alt.severity === 'MEDIUM' ? 'bg-amber-600 text-white' : 'bg-blue-600 text-white'
                    }`}>
                      {alt.severity === 'HIGH' ? t('severityHigh') : alt.severity === 'MEDIUM' ? t('severityMedium') : t('severityLow')}
                    </span>
                  </div>

                  <p className="leading-relaxed font-medium">
                    {isTa ? alt.message.ta : alt.message.en}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* 4. 7-Day Weather Forecast */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900 flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-agri-600" />
                <span>{t('sevenDayForecast')}</span>
              </h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              {forecast?.daily?.map((d, idx) => (
                <div key={idx} className="bg-gray-50 p-3.5 rounded-xl border border-gray-200 text-center space-y-2 hover:bg-agri-50/60 hover:border-agri-300 transition-all">
                  <span className="text-xs font-bold text-gray-800 block">
                    {isTa ? d.dayTa : d.day}
                  </span>
                  <div className="text-3xl my-1">{d.icon}</div>
                  <span className="text-[11px] font-semibold text-gray-600 block truncate">
                    {isTa ? d.conditionTa : d.condition}
                  </span>
                  <div className="text-xs font-bold text-gray-900 pt-1 border-t border-gray-200/60">
                    <span>{d.maxTemp}°</span>
                    <span className="text-gray-400 text-[10px] mx-1">/</span>
                    <span className="text-gray-500 font-normal">{d.minTemp}°</span>
                  </div>
                  <span className="text-[10px] text-blue-600 font-semibold block">
                    🌧️ {d.rainProb}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 5. Hourly Weather Forecast */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900 flex items-center space-x-2">
                <Clock className="w-5 h-5 text-agri-600" />
                <span>{t('hourlyForecast')}</span>
              </h3>
            </div>

            <div className="flex items-center space-x-3 overflow-x-auto pb-2 text-xs">
              {forecast?.hourly?.map((h, idx) => (
                <div key={idx} className="bg-gray-50 p-3 rounded-xl border border-gray-200 text-center space-y-1.5 min-w-[90px] shrink-0">
                  <span className="text-[11px] font-semibold text-gray-500 block">{h.time}</span>
                  <div className="text-2xl">{h.icon}</div>
                  <span className="font-bold text-gray-900 block">{h.temp}°C</span>
                  <span className="text-[10px] text-blue-600 font-semibold block">
                    {h.rainProb}% Rain
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 6. Crop-Specific Weather Insights & Field Comparison (Two Column) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Crop Weather Insights */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
              <div className="border-b border-gray-100 pb-3">
                <h3 className="text-base font-bold text-gray-900">{t('cropWeatherInsights')}</h3>
                <p className="text-xs text-gray-500">Advisory crop guidance based on forecasted weather microclimate</p>
              </div>

              {/* Crop Selector Chips */}
              <div className="flex space-x-2">
                {['Tomato', 'Potato', 'Brinjal'].map(c => (
                  <button
                    key={c}
                    onClick={() => setSelectedCrop(c)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      selectedCrop === c 
                        ? 'bg-agri-600 text-white shadow-2xs' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {c === 'Tomato' ? '🍅 Tomato' : c === 'Potato' ? '🥔 Potato' : '🍆 Brinjal'}
                  </button>
                ))}
              </div>

              {/* Insight Guidance Box */}
              <div className="bg-agri-50 border border-agri-200 p-4 rounded-xl space-y-2 text-xs text-agri-950 font-medium leading-relaxed">
                <h4 className="font-bold text-agri-900 flex items-center space-x-1.5">
                  <Info className="w-4 h-4 text-agri-600" />
                  <span>{isTa ? cropInsight?.title?.ta : cropInsight?.title?.en}</span>
                </h4>
                <p>{isTa ? cropInsight?.insight?.ta : cropInsight?.insight?.en}</p>
                <div className="text-[10px] text-agri-700 font-semibold pt-1 border-t border-agri-200">
                  ℹ️ Note: These are advisory microclimate insights, not AI disease predictions.
                </div>
              </div>
            </div>

            {/* Field vs Weather Comparison */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
              <div className="border-b border-gray-100 pb-3">
                <h3 className="text-base font-bold text-gray-900">{t('fieldVsWeather')}</h3>
                <p className="text-xs text-gray-500">Compare external weather forecast against local ESP32 field sensors</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                {/* External Weather */}
                <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2">
                  <span className="font-bold text-blue-900 block">{t('externalWeather')}</span>
                  <div className="space-y-1 text-blue-950">
                    <p>Temperature: <strong>{fieldComparison?.externalWeather?.temperature}°C</strong></p>
                    <p>Humidity: <strong>{fieldComparison?.externalWeather?.humidity}%</strong></p>
                    <p>Rain Prob: <strong>{fieldComparison?.externalWeather?.rainProb}%</strong></p>
                  </div>
                  <span className="text-[10px] text-blue-600 font-mono block pt-1">Source: Weather API</span>
                </div>

                {/* ESP32 Field Sensor */}
                <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2">
                  <span className="font-bold text-emerald-900 block">{t('esp32FieldSensor')}</span>
                  <div className="space-y-1 text-emerald-950">
                    <p>Temperature: <strong>{fieldComparison?.esp32Sensor?.temperature}°C</strong></p>
                    <p>Humidity: <strong>{fieldComparison?.esp32Sensor?.humidity}%</strong></p>
                    <p>Soil Moisture: <strong>{fieldComparison?.esp32Sensor?.soilMoisture}%</strong></p>
                  </div>
                  <span className="text-[10px] text-emerald-600 font-mono block pt-1">Source: ESP32 Hardware</span>
                </div>
              </div>

              <div className="text-[11px] text-gray-500 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                💡 Sensor readings reflect exact root zone conditions, while weather forecasts track macro canopy climate.
              </div>
            </div>

          </div>
        </>
      )}

    </div>
  );
}
