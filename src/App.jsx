import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
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
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { AuthProvider } from './context/AuthContext';

function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { t } = useLanguage();

  const getPageTitle = (pathname) => {
    switch (pathname) {
      case '/': return t('dashboard');
      case '/weather': return t('weatherTitle');
      case '/detection': return t('cropDetection');
      case '/assistant': return t('farmerAssistant');
      case '/community': return t('community');
      case '/library': return t('libraryTitle');
      case '/planner': return t('plannerTitle');
      case '/history': return t('predictionHistory');
      case '/reports': return t('aiReports');
      case '/voice': return t('voiceAssistant');
      case '/settings': return t('settings');
      default: return t('dashboard');
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
            <Route path="/" element={<Dashboard />} />
            <Route path="/weather" element={<Weather />} />
            <Route path="/detection" element={<DiseaseDetection />} />
            <Route path="/assistant" element={<FarmerAssistant />} />
            <Route path="/community" element={<Community />} />
            <Route path="/library" element={<Library />} />
            <Route path="/planner" element={<Planner />} />
            <Route path="/history" element={<PredictionHistory />} />
            <Route path="/reports" element={<AiReports />} />
            <Route path="/voice" element={<VoiceAssistant />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Dashboard />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="no-print bg-white border-t border-gray-200 py-3 px-6 text-center text-xs text-gray-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            🌱 <strong>SmartFarm AI Platform</strong> - Solanaceae Crop Health, IoT & Weather Ecosystem
          </div>
          <div className="font-mono text-[11px] text-gray-400">
            YOLO11 • SAM • ResNet-50 • LIME • RAG-LLM • ESP32 • Agriculture Library • Farming Planner
          </div>
        </footer>

      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <Router>
          <MainLayout />
        </Router>
      </LanguageProvider>
    </AuthProvider>
  );
}
