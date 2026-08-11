import React, { useState } from 'react';
import { Bell, User } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';

export default function Header({ pageTitle, onMenuToggle }) {
  const { language, setLanguage, t } = useLanguage();
  const { user } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);

  const mockNotifications = [
    { id: 1, text: "High humidity alert (76%) - Risk of Late Blight.", time: "10 mins ago", type: "warning" },
    { id: 2, text: "ESP32 telemetry re-synced successfully.", time: "1 hour ago", type: "info" },
    { id: 3, text: "Community post received 5 new replies.", time: "2 hours ago", type: "success" }
  ];

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-20 px-4 sm:px-6 py-3 shadow-2xs">
      <div className="flex items-center justify-between gap-4">

        {/* Left section: Mobile Menu Hamburger + Page Title */}
        <div className="flex items-center space-x-3">
          <button 
            onClick={onMenuToggle}
            className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 focus:outline-none"
            aria-label="Toggle navigation menu"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
              {pageTitle || t('dashboard')}
            </h1>
          </div>
        </div>

        {/* Right Controls: Notification Icon, Language Selector, User Info */}
        <div className="flex items-center space-x-3 sm:space-x-4">

          {/* Language Switcher */}
          <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl p-1 text-xs font-medium">
            <button
              onClick={() => setLanguage('en')}
              className={`px-3 py-1 rounded-lg transition-colors ${
                language === 'en' 
                  ? 'bg-agri-600 text-white shadow-2xs font-bold' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              English
            </button>
            <button
              onClick={() => setLanguage('ta')}
              className={`px-3 py-1 rounded-lg transition-colors ${
                language === 'ta' 
                  ? 'bg-agri-600 text-white shadow-2xs font-bold' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              தமிழ்
            </button>
          </div>

          {/* Notification Bell */}
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors relative"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
            </button>

            {/* Notifications Menu */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-50 p-3 animate-fadeIn">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-2">
                  <span className="font-semibold text-sm text-gray-800">Notifications</span>
                  <span className="text-xs bg-agri-100 text-agri-700 px-2 py-0.5 rounded-full font-medium">3 New</span>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {mockNotifications.map(n => (
                    <div key={n.id} className="p-2 hover:bg-gray-50 rounded-lg text-xs space-y-1">
                      <div className="flex items-center justify-between font-medium text-gray-800">
                        <span>{n.type === 'warning' ? '⚠️ Alert' : 'ℹ️ System'}</span>
                        <span className="text-gray-400 text-[10px]">{n.time}</span>
                      </div>
                      <p className="text-gray-600">{n.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* User Text Info (No Profile Picture/Avatar) */}
          <div className="flex items-center space-x-2 pl-2 border-l border-gray-200">
            <div className="w-8 h-8 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-600">
              <User className="w-4 h-4" />
            </div>
            <div className="hidden lg:block text-left min-w-0">
              <div className="text-xs font-bold text-gray-900 leading-tight">{user?.name || "UGESHRAJA S"}</div>
              <div className="text-[11px] text-gray-500 leading-tight truncate">{user?.email || "ugeshraja@example.com"}</div>
            </div>
          </div>

        </div>

      </div>
    </header>
  );
}
