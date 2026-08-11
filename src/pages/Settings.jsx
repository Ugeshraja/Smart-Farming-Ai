import React, { useState } from 'react';
import { 
  User, 
  Globe, 
  Bell, 
  Sliders, 
  Cpu, 
  Sun, 
  Save, 
  CheckCircle2 
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

export default function Settings() {
  const { language, setLanguage, t } = useLanguage();
  const { user, setUser } = useAuth();

  const [farmerName, setFarmerName] = useState(user?.name || "UGESHRAJA S");
  const [email, setEmail] = useState(user?.email || "ugeshraja@example.com");
  const [location, setLocation] = useState(user?.location || "Dharmapuri, Tamil Nadu");

  const [notifications, setNotifications] = useState({
    diseaseAlerts: true,
    sensorAlerts: true,
    weatherAlerts: true,
    aiRecommendations: true
  });

  const [tempUnit, setTempUnit] = useState('celsius');
  const [refreshInterval, setRefreshInterval] = useState('10s');
  const [toastMessage, setToastMessage] = useState('');

  const handleSaveProfile = (e) => {
    e.preventDefault();
    setUser(prev => ({
      ...prev,
      name: farmerName,
      email,
      location
    }));
    setToastMessage(language === 'ta' ? 'அமைப்புகள் புதுப்பிக்கப்பட்டன!' : 'Settings updated successfully!');
    setTimeout(() => setToastMessage(''), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-agri-700 text-white px-4 py-2.5 rounded-xl shadow-lg text-sm font-medium z-50 animate-bounce flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-agri-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-2">
        <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
          {t('settings')}
        </h2>
        <p className="text-xs sm:text-sm text-gray-600">
          Manage system preferences, farmer profile, IoT refresh rates, and notification parameters.
        </p>
      </div>

      <form onSubmit={handleSaveProfile} className="space-y-6">

        {/* 1. Profile Section */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
          <h3 className="text-base font-bold text-gray-900 flex items-center space-x-2 border-b border-gray-100 pb-3">
            <User className="w-5 h-5 text-agri-600" />
            <span>{t('profile')}</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-semibold text-gray-700 block mb-1">Farmer Full Name</label>
              <input
                type="text"
                value={farmerName}
                onChange={(e) => setFarmerName(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-agri-500"
              />
            </div>

            <div>
              <label className="font-semibold text-gray-700 block mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-agri-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="font-semibold text-gray-700 block mb-1">Farm Location / Region</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-agri-500"
              />
            </div>
          </div>
        </div>

        {/* 2. Language & Localization */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
          <h3 className="text-base font-bold text-gray-900 flex items-center space-x-2 border-b border-gray-100 pb-3">
            <Globe className="w-5 h-5 text-agri-600" />
            <span>System Language (மொழி)</span>
          </h3>

          <div className="flex items-center space-x-4 text-xs">
            <label className="flex items-center space-x-2 cursor-pointer font-semibold">
              <input
                type="radio"
                name="lang"
                checked={language === 'en'}
                onChange={() => setLanguage('en')}
                className="text-agri-600 focus:ring-agri-500"
              />
              <span>🇬🇧 English</span>
            </label>

            <label className="flex items-center space-x-2 cursor-pointer font-semibold">
              <input
                type="radio"
                name="lang"
                checked={language === 'ta'}
                onChange={() => setLanguage('ta')}
                className="text-agri-600 focus:ring-agri-500"
              />
              <span>🇮🇳 தமிழ் (Tamil)</span>
            </label>
          </div>
        </div>

        {/* 3. Notification Preferences */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
          <h3 className="text-base font-bold text-gray-900 flex items-center space-x-2 border-b border-gray-100 pb-3">
            <Bell className="w-5 h-5 text-agri-600" />
            <span>{t('notifications')}</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {Object.keys(notifications).map((key) => (
              <label key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200 cursor-pointer">
                <span className="font-semibold text-gray-700 capitalize">
                  {key.replace(/([A-Z])/g, ' $1')}
                </span>
                <input
                  type="checkbox"
                  checked={notifications[key]}
                  onChange={(e) => setNotifications({ ...notifications, [key]: e.target.checked })}
                  className="rounded text-agri-600 focus:ring-agri-500 w-4 h-4"
                />
              </label>
            ))}
          </div>
        </div>

        {/* 4. Dashboard & IoT Config */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
          <h3 className="text-base font-bold text-gray-900 flex items-center space-x-2 border-b border-gray-100 pb-3">
            <Sliders className="w-5 h-5 text-agri-600" />
            <span>Dashboard & IoT Telemetry Config</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-semibold text-gray-700 block mb-1">Temperature Unit</label>
              <select
                value={tempUnit}
                onChange={(e) => setTempUnit(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800"
              >
                <option value="celsius">Celsius (°C)</option>
                <option value="fahrenheit">Fahrenheit (°F)</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-gray-700 block mb-1">ESP32 Telemetry Refresh Rate</label>
              <select
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800"
              >
                <option value="5s">Every 5 seconds</option>
                <option value="10s">Every 10 seconds (Recommended)</option>
                <option value="30s">Every 30 seconds</option>
              </select>
            </div>
          </div>
        </div>

        {/* 5. System Diagnostics & Appearance */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-3 text-xs">
            <h3 className="text-base font-bold text-gray-900 flex items-center space-x-2">
              <Cpu className="w-5 h-5 text-agri-600" />
              <span>{t('systemDiagnostics')}</span>
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between p-2 bg-gray-50 rounded-lg">
                <span className="text-gray-600">FastAPI API:</span>
                <span className="text-emerald-600 font-bold">200 OK</span>
              </div>
              <div className="flex justify-between p-2 bg-gray-50 rounded-lg">
                <span className="text-gray-600">ESP32 Hardware:</span>
                <span className="text-emerald-600 font-bold">Online</span>
              </div>
              <div className="flex justify-between p-2 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Deep Learning Model:</span>
                <span className="text-agri-700 font-mono font-bold">YOLO11+SAM+ResNet50</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-3 text-xs">
            <h3 className="text-base font-bold text-gray-900 flex items-center space-x-2">
              <Sun className="w-5 h-5 text-amber-500" />
              <span>Appearance Theme</span>
            </h3>
            <p className="text-gray-500">
              Clean Light Theme is enforced for high outdoor daylight visibility during field project reviews.
            </p>
            <div className="p-2.5 bg-agri-50 border border-agri-200 rounded-xl font-bold text-agri-800">
              ✓ Clean Professional Light Theme Active
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-6 py-2.5 bg-agri-600 hover:bg-agri-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>Save All Settings</span>
          </button>
        </div>

      </form>

    </div>
  );
}
