import React from 'react';
import { Sprout, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import MyFieldCard from '../components/dashboard/MyFieldCard';

export default function MyField() {
  const { language } = useLanguage();
  const { fieldProfile } = useAuth();
  const isTa = language === 'ta';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Title & Intro Banner */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-agri-500 to-agri-700 text-white flex items-center justify-center shadow-xs shrink-0">
              <Sprout className="w-6 h-6 sm:w-8 sm:h-8" />
            </div>
            <div>
              <div className="flex items-center space-x-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
                  {isTa ? "என் விவசாய நிலம்" : "MY FIELD"}
                </h1>
                {fieldProfile?.crop_type && (
                  <span className="px-2.5 py-0.5 rounded-full bg-agri-50 border border-agri-200 text-agri-800 text-xs font-bold">
                    {fieldProfile.crop_type} ({fieldProfile.season || "Kharif"})
                  </span>
                )}
                <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-agri-50 border border-agri-200 text-agri-800 text-xs font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5 text-agri-600" />
                  <span>{isTa ? "ICAR / TNAU தரநிலைகள்" : "ICAR / TNAU Agronomic Rules"}</span>
                </span>
              </div>
              <p className="text-xs sm:text-sm text-gray-600 mt-1 max-w-2xl">
                {isTa
                  ? "உங்கள் பண்ணை விவரங்களை நிர்வகித்து, தற்போதைய நில அமைப்புகள் தேர்வு செய்யப்பட்ட பயிரை நடவு செய்ய போதுமானதா மற்றும் உகந்ததா என்பதை அறிவியல் அடிப்படையில் சரிபார்க்கவும்."
                  : "Manage your farm profile and check whether your current field conditions are suitable for planting the selected crop."}
              </p>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-right shrink-0">
            <div className="text-[11px] text-gray-500 font-medium">
              {isTa ? "பயிர் & பரப்பளவு" : "Active Farm Profile"}
            </div>
            <div className="text-sm font-bold text-gray-900">
              {fieldProfile?.crop_type || "Brinjal"} • {fieldProfile?.field_size ?? 2.0} {fieldProfile?.field_size_unit || "Acre"}
            </div>
            <div className="text-[11px] text-agri-700 font-semibold">
              {fieldProfile?.field_location || "Tamil Nadu"}
            </div>
          </div>
        </div>
      </div>

      {/* Main Interactive Field Component */}
      <div className="w-full">
        <MyFieldCard />
      </div>
    </div>
  );
}
