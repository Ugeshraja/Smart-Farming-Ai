import React, { useState, useEffect } from 'react';
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
  MessageSquare,
  Plus,
  Check,
  ChevronRight,
  Filter
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { apiService } from '../services/apiService';

export default function Planner() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const [farmPlan, setFarmPlan] = useState({
    crop: 'Tomato',
    location: 'Tiruchengode, Tamil Nadu',
    plantingDate: '2026-09-01',
    expectedHarvestDate: '2026-11-25',
    farmSize: '2.5 Acres'
  });

  const [timelineStages, setTimelineStages] = useState([]);
  const [activities, setActivities] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [activeTab, setActiveTab] = useState('timeline'); // timeline | activities | calendar
  const [loading, setLoading] = useState(true);

  const isTa = language === 'ta';

  useEffect(() => {
    async function loadPlannerData() {
      setLoading(true);
      const [plan, timeline, acts, events] = await Promise.all([
        apiService.getFarmPlan(),
        apiService.getCropTimeline(farmPlan.crop),
        apiService.getFarmActivities(),
        apiService.getCalendarEvents()
      ]);
      setFarmPlan(prev => ({ ...prev, ...plan }));
      setTimelineStages(timeline);
      setActivities(acts);
      setCalendarEvents(events);
      setLoading(false);
    }
    loadPlannerData();
  }, [farmPlan.crop]);

  const handleToggleActivity = async (id) => {
    const updated = await apiService.toggleActivityStatus(id);
    setActivities(prev => prev.map(a => a.id === id ? { ...a, status: updated.status } : a));
  };

  const handleCreatePlan = (e) => {
    e.preventDefault();
    alert(`New Farm Plan initialized for ${farmPlan.crop} in ${farmPlan.location}! Timeline recalculated.`);
  };

  const completedCount = activities.filter(a => a.status === 'Completed').length;
  const upcomingCount = activities.filter(a => a.status === 'Upcoming').length;
  const nextActivity = activities.find(a => a.status === 'Upcoming') || activities[0];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      
      {/* 1. Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight flex items-center space-x-2">
              <CalendarDays className="w-6 h-6 text-agri-600" />
              <span>{t('plannerTitle')}</span>
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
              {t('plannerSubtitle')}
            </p>
          </div>

          <button
            onClick={() => navigate(`/assistant?query=${encodeURIComponent(isTa ? `எனது ${farmPlan.crop} பயிர் திட்டத்தை பற்றி விளக்குக.` : `Explain my ${farmPlan.crop} farming schedule and best management practices.`)}`)}
            className="px-4 py-2.5 bg-agri-600 hover:bg-agri-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center space-x-2 shrink-0"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>{t('askAiAboutPlan')}</span>
          </button>
        </div>
      </div>

      {/* 2. Planner Dashboard Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 text-xs">
        
        {/* Next Activity */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs space-y-1">
          <span className="text-gray-400 font-semibold uppercase text-[10px] block">{t('nextActivity')}</span>
          <strong className="text-sm font-bold text-gray-900 block truncate">
            {isTa ? nextActivity?.nameTa : nextActivity?.nameEn}
          </strong>
          <span className="text-[11px] text-agri-600 font-medium block">Due: {nextActivity?.date}</span>
        </div>

        {/* Upcoming Activities Count */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs space-y-1">
          <span className="text-gray-400 font-semibold uppercase text-[10px] block">{t('upcomingActivities')}</span>
          <strong className="text-2xl font-black text-amber-600">{upcomingCount}</strong>
          <span className="text-[11px] text-gray-500 block">Tasks pending</span>
        </div>

        {/* Completed Activities */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs space-y-1">
          <span className="text-gray-400 font-semibold uppercase text-[10px] block">{t('completedActivities')}</span>
          <strong className="text-2xl font-black text-emerald-600">{completedCount}</strong>
          <span className="text-[11px] text-gray-500 block">Tasks finished</span>
        </div>

        {/* Weather Alert Widget */}
        <div className="bg-blue-50/70 p-4 rounded-2xl border border-blue-200 space-y-1">
          <span className="text-blue-900 font-bold uppercase text-[10px] flex items-center space-x-1">
            <CloudRain className="w-3.5 h-3.5 text-blue-600" />
            <span>{t('weatherAlertWidget')}</span>
          </span>
          <strong className="text-xs font-bold text-blue-950 block">🌧️ Rain Prob 75%</strong>
          <span className="text-[10px] text-blue-800 font-medium block">Tomorrow forecast</span>
        </div>

        {/* Current Crop Stage */}
        <div className="bg-agri-50/80 p-4 rounded-2xl border border-agri-200 space-y-1">
          <span className="text-agri-800 font-bold uppercase text-[10px] block">Current Crop Stage</span>
          <strong className="text-sm font-bold text-agri-950 block">Vegetative Growth</strong>
          <span className="text-[10px] text-agri-700 block font-mono">Day 21 - 40</span>
        </div>

      </div>

      {/* 3. Create / Configure Farm Plan Form */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
        <h3 className="text-base font-bold text-gray-900 flex items-center space-x-2 border-b border-gray-100 pb-3">
          <Sprout className="w-5 h-5 text-agri-600" />
          <span>{t('createPlan')}</span>
        </h3>

        <form onSubmit={handleCreatePlan} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 text-xs">
          
          {/* Crop Selector */}
          <div>
            <label className="font-semibold text-gray-700 block mb-1">{t('selectCrop')}</label>
            <select
              value={farmPlan.crop}
              onChange={(e) => setFarmPlan(prev => ({ ...prev, crop: e.target.value }))}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-900 focus:ring-2 focus:ring-agri-500"
            >
              <option value="Tomato">🍅 Tomato (தக்காளி)</option>
              <option value="Potato">🥔 Potato (உருளை)</option>
              <option value="Brinjal">🍆 Brinjal (கத்தரி)</option>
            </select>
          </div>

          {/* Location */}
          <div>
            <label className="font-semibold text-gray-700 block mb-1">{t('locationCity')}</label>
            <input
              type="text"
              value={farmPlan.location}
              onChange={(e) => setFarmPlan(prev => ({ ...prev, location: e.target.value }))}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium text-gray-900"
            />
          </div>

          {/* Planting Date */}
          <div>
            <label className="font-semibold text-gray-700 block mb-1">{t('plantingDate')}</label>
            <input
              type="date"
              value={farmPlan.plantingDate}
              onChange={(e) => setFarmPlan(prev => ({ ...prev, plantingDate: e.target.value }))}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900"
            />
          </div>

          {/* Harvest Date */}
          <div>
            <label className="font-semibold text-gray-700 block mb-1">{t('expectedHarvest')}</label>
            <input
              type="date"
              value={farmPlan.expectedHarvestDate}
              onChange={(e) => setFarmPlan(prev => ({ ...prev, expectedHarvestDate: e.target.value }))}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900"
            />
          </div>

          {/* Farm Size */}
          <div>
            <label className="font-semibold text-gray-700 block mb-1">{t('farmSize')}</label>
            <input
              type="text"
              value={farmPlan.farmSize}
              onChange={(e) => setFarmPlan(prev => ({ ...prev, farmSize: e.target.value }))}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900"
            />
          </div>

        </form>
      </div>

      {/* 4. Visual Growth Stage Timeline */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
        <div className="border-b border-gray-100 pb-3">
          <h3 className="text-base font-bold text-gray-900">{t('cropTimeline')} ({farmPlan.crop})</h3>
          <p className="text-xs text-gray-500">Configurable stage progression for {farmPlan.crop}</p>
        </div>

        {/* Dynamic Timeline Pipeline */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 text-xs">
          {timelineStages.map((stage) => (
            <div 
              key={stage.id} 
              className={`p-3.5 rounded-xl border text-center space-y-1.5 transition-all ${
                stage.active 
                  ? 'bg-agri-600 text-white font-bold border-agri-600 shadow-xs ring-2 ring-agri-300' 
                  : 'bg-gray-50 text-gray-700 border-gray-200'
              }`}
            >
              <div className="w-6 h-6 rounded-full bg-white/20 text-xs flex items-center justify-center font-bold mx-auto">
                {stage.id}
              </div>
              <span className="font-bold text-xs block leading-tight">
                {isTa ? stage.nameTa : stage.nameEn}
              </span>
              <span className={`text-[10px] font-mono block ${stage.active ? 'text-agri-100' : 'text-gray-400'}`}>
                {stage.duration}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Farm Activities & Weather-Aware Reminders */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-gray-900">{t('farmActivities')}</h3>
            <p className="text-xs text-gray-500">Actionable farming tasks integrated with live weather alerts</p>
          </div>
        </div>

        <div className="space-y-3">
          {activities.map((act) => (
            <div 
              key={act.id} 
              className={`p-4 rounded-xl border space-y-2 text-xs transition-all ${
                act.status === 'Completed' ? 'bg-gray-50/80 border-gray-200 opacity-75' : 'bg-white border-gray-200 shadow-2xs'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => handleToggleActivity(act.id)}
                    className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-colors ${
                      act.status === 'Completed' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white border-gray-300 text-transparent hover:border-agri-500'
                    }`}
                  >
                    <Check className="w-4 h-4" />
                  </button>

                  <div>
                    <h4 className={`text-sm font-bold ${act.status === 'Completed' ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                      {isTa ? act.nameTa : act.nameEn}
                    </h4>
                    <span className="text-[11px] text-gray-400 font-mono">Date: {act.date} • {act.category}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    act.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {act.status}
                  </span>
                </div>
              </div>

              <p className="text-gray-700 leading-relaxed font-medium pl-9">
                {isTa ? act.descriptionTa : act.descriptionEn}
              </p>

              {/* Weather-Aware Reminder Box if available */}
              {act.weatherAwareAlert && (
                <div className="ml-9 p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1 text-amber-950 font-medium">
                  <div className="font-bold text-amber-900 flex items-center space-x-1 text-[11px]">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    <span>{t('weatherReminder')}</span>
                  </div>
                  <p className="text-[11px]">{act.weatherAwareAlert}</p>
                </div>
              )}

            </div>
          ))}
        </div>
      </div>

      {/* 6. Monthly Calendar Card */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
        <div className="border-b border-gray-100 pb-3 flex items-center justify-between">
          <h3 className="text-base font-bold text-gray-900">{t('monthlyCalendar')} (SEPTEMBER 2026)</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs">
          {calendarEvents.map((evt, idx) => (
            <div key={idx} className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
              <span className="text-[10px] font-bold text-agri-700 font-mono block">SEP 0{evt.day}</span>
              <strong className="text-xs text-gray-900 block font-bold">{evt.title}</strong>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
