import React, { useState } from 'react';
import {
  User,
  Globe,
  Bell,
  Sliders,
  Sun,
  Moon,
  Save,
  CheckCircle2
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Settings() {
  const { language, setLanguage, t } = useLanguage();
  const { user, setUser, updateProfile } = useAuth();
  const { theme, setTheme } = useTheme();

  const [farmerName, setFarmerName] = useState(user?.name || "UGESHRAJA S");
  const [email, setEmail] = useState(user?.email || "ugeshraja@example.com");
  const [location, setLocation] = useState(user?.location || user?.farm_location || "Dharmapuri, Tamil Nadu");

  React.useEffect(() => {
    if (user) {
      setFarmerName(user.name || '');
      setEmail(user.email || '');
      setLocation(user.farm_location || user.location || '');
    }
  }, [user]);

  const [notifications, setNotifications] = useState({
    diseaseAlerts: true,
    sensorAlerts: true,
    weatherAlerts: true,
    aiRecommendations: true
  });

  const [tempUnit, setTempUnit] = useState('celsius');
  const [refreshInterval, setRefreshInterval] = useState('10s');
  const [toastMessage, setToastMessage] = useState('');

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      if (updateProfile) {
        await updateProfile({
          name: farmerName,
          farm_location: location,
          preferred_language: language
        });
      }
      setToastMessage(language === 'ta' ? 'அமைப்புகள் சேமிக்கப்பட்டன!' : 'Settings saved successfully!');
    } catch (err) {
      setToastMessage(language === 'ta' ? 'அமைப்புகள் புதுப்பிக்கப்பட்டன (உள்ளூர்)!' : 'Settings updated locally!');
    }
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
              <label className="font-semibold text-gray-700 block mb-1">
                {language === 'ta' ? 'சென்சார் தரவு புதுப்பிப்பு வீதம்' : 'Sensor Telemetry Refresh Rate'}
              </label>
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

        {/* 5. Appearance Theme */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4 text-xs">
          <div className="border-b border-gray-100 pb-3">
            <h3 className="text-base font-bold text-gray-900 flex items-center space-x-2">
              <Sun className="w-5 h-5 text-amber-500" />
              <span>{language === 'ta' ? 'தோற்றம் (Appearance)' : 'Appearance'}</span>
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              {language === 'ta'
                ? 'SmartFarm AI வலைத்தளத்தின் காட்சி தீமைத் தேர்வு செய்யவும்.'
                : 'Choose how SmartFarm AI looks.'}
            </p>
          </div>

          <div className="space-y-3">
            <label className="font-semibold text-gray-700 block text-xs">
              {language === 'ta' ? 'தீம் தேர்வு (Theme)' : 'Theme'}
            </label>

            {/* Light / Dark Mode Toggle Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md">
              {/* Light Theme Option */}
              <button
                type="button"
                onClick={() => setTheme('light')}
                aria-label="Select Light Theme"
                className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                  theme === 'light'
                    ? 'border-agri-600 bg-agri-50/50 shadow-xs ring-2 ring-agri-600/20 font-bold'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
                    <Sun className="w-5 h-5" />
                  </div>
                  <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    theme === 'light' ? 'border-agri-600' : 'border-gray-300'
                  }`}>
                    {theme === 'light' && <span className="w-2 h-2 rounded-full bg-agri-600" />}
                  </span>
                </div>
                <div>
                  <div className="font-bold text-xs text-gray-900">
                    {language === 'ta' ? 'லைட் (Light)' : 'Light'}
                  </div>
                  <div className="text-[11px] text-gray-500 mt-0.5">
                    {language === 'ta' ? 'பகலில் தெளிவான பார்வைக்கு ஏற்றது' : 'Optimized for daylight & field visibility'}
                  </div>
                </div>
              </button>

              {/* Dark Theme Option */}
              <button
                type="button"
                onClick={() => setTheme('dark')}
                aria-label="Select Dark Theme"
                className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                  theme === 'dark'
                    ? 'border-agri-600 bg-agri-50/50 shadow-xs ring-2 ring-agri-600/20 font-bold'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-indigo-400">
                    <Moon className="w-5 h-5" />
                  </div>
                  <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    theme === 'dark' ? 'border-agri-600' : 'border-gray-300'
                  }`}>
                    {theme === 'dark' && <span className="w-2 h-2 rounded-full bg-agri-600" />}
                  </span>
                </div>
                <div>
                  <div className="font-bold text-xs text-gray-900">
                    {language === 'ta' ? 'டார்க் (Dark)' : 'Dark'}
                  </div>
                  <div className="text-[11px] text-gray-500 mt-0.5">
                    {language === 'ta' ? 'இரவு மற்றும் குறைந்த வெளிச்சத்திற்கு ஏற்றது' : 'Optimized for night & low-light usage'}
                  </div>
                </div>
              </button>
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
