import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Public Front Website
import Landing from './pages/Landing';

// Public Auth Pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';

// Protected Farmer Module Pages
import Dashboard from './pages/Dashboard';
import Weather from './pages/Weather';
import DiseaseDetection from './pages/DiseaseDetection';
import FarmerAssistant from './pages/FarmerAssistant';
import Community from './pages/Community';
import Library from './pages/Library';
import Planner from './pages/Planner';
import PredictionHistory from './pages/PredictionHistory';
import AiReports from './pages/AiReports';
import VoiceAssistant from './pages/VoiceAssistant';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import GovernmentSchemes from './pages/GovernmentSchemes';
import MyField from './pages/MyField';

import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { AuthProvider } from './context/AuthContext';
import { WeatherProvider } from './context/WeatherContext';
import { ThemeProvider } from './context/ThemeContext';

function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { t, language } = useLanguage();

  const getPageTitle = (pathname) => {
    switch (pathname) {
      case '/':
      case '/dashboard':
        return t('dashboard');
      case '/my-field':
      case '/field':
        return language === 'ta' ? 'என் விவசாய நிலம்' : 'My Field';
      case '/crop-disease':
      case '/detection':
        return t('cropDetection');
      case '/ai-assistant':
      case '/assistant':
        return t('farmerAssistant');
      case '/weather':
        return t('weatherTitle');
      case '/library':
        return t('libraryTitle');
      case '/government-schemes':
      case '/schemes':
        return language === 'ta' ? 'அரசு விவசாய நலத்திட்டங்கள்' : 'Government Agriculture Schemes';
      case '/farming-planner':
      case '/planner':
        return t('plannerTitle');
      case '/history':
        return t('predictionHistory');
      case '/reports':
        return t('aiReports');
      case '/voice-assistant':
      case '/voice':
        return t('voiceAssistant');
      case '/community':
        return t('community');
      case '/settings':
        return t('settings');
      case '/profile':
        return language === 'ta' ? 'விவசாயி சுயவிவரம்' : 'Farmer Profile';
      default:
        return t('dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAF8] flex">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content Workspace Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">

        {/* Top Fixed Header */}
        <Header
          pageTitle={getPageTitle(location.pathname)}
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        {/* Page Content Container */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />

            {/* Canonical My Field Route + Alias */}
            <Route path="/my-field" element={<MyField />} />
            <Route path="/field" element={<Navigate to="/my-field" replace />} />

            {/* Canonical Crop Disease Route + Alias */}
            <Route path="/crop-disease" element={<DiseaseDetection />} />
            <Route path="/disease-detection" element={<Navigate to="/crop-disease" replace />} />
            <Route path="/detection" element={<Navigate to="/crop-disease" replace />} />

            {/* Canonical AI Assistant Route + Alias */}
            <Route path="/ai-assistant" element={<FarmerAssistant />} />
            <Route path="/assistant" element={<Navigate to="/ai-assistant" replace />} />

            <Route path="/weather" element={<Weather />} />
            <Route path="/library" element={<Library />} />
            <Route path="/agriculture-library" element={<Navigate to="/library" replace />} />

            {/* Canonical Government Schemes Route + Alias */}
            <Route path="/government-schemes" element={<GovernmentSchemes />} />
            <Route path="/schemes" element={<Navigate to="/government-schemes" replace />} />

            {/* Canonical Farming Planner Route + Alias */}
            <Route path="/farming-planner" element={<Planner />} />
            <Route path="/planner" element={<Navigate to="/farming-planner" replace />} />

            <Route path="/history" element={<PredictionHistory />} />
            <Route path="/prediction-history" element={<Navigate to="/history" replace />} />

            <Route path="/reports" element={<AiReports />} />
            <Route path="/ai-reports" element={<Navigate to="/reports" replace />} />

            {/* Canonical Voice Assistant Route + Alias */}
            <Route path="/voice-assistant" element={<VoiceAssistant />} />
            <Route path="/voice" element={<Navigate to="/voice-assistant" replace />} />

            <Route path="/community" element={<Community />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/profile" element={<Profile />} />

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="no-print bg-white border-t border-gray-200 py-3 px-6 text-center text-xs text-gray-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            🌱 <strong>SmartFarm AI Platform</strong> - Solanaceae Crop Health, IoT & Weather Ecosystem
          </div>
          <div>
            © {new Date().getFullYear()} SmartFarm AI. All rights reserved.
          </div>
        </footer>

      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <WeatherProvider>
            <Router>
              <Routes>
                {/* Public Front Landing Website */}
                <Route path="/" element={<Landing />} />

                {/* Public Authentication Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />

                {/* Protected Farmer Account Routes */}
                <Route
                  path="/*"
                  element={
                    <ProtectedRoute>
                      <MainLayout />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </Router>
          </WeatherProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
