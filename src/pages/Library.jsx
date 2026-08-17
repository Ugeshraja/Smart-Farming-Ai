import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  Search, 
  Sparkles, 
  CheckCircle2, 
  Droplets, 
  Sun, 
  Layers, 
  ShieldAlert, 
  Bug, 
  Sprout, 
  MessageSquare,
  ArrowRight
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { apiService } from '../services/apiService';

export default function Library() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [articles, setArticles] = useState([]);
  const [selectedCropCategory, setSelectedCropCategory] = useState('all');
  const [selectedTopicCategory, setSelectedTopicCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [loading, setLoading] = useState(true);

  const isTa = language === 'ta';

  useEffect(() => {
    async function loadLibraryData() {
      setLoading(true);
      const [cats, arts] = await Promise.all([
        apiService.getLibraryCategories(),
        apiService.getLibraryArticles(searchQuery, selectedCropCategory, selectedTopicCategory)
      ]);
      setCategories(cats);
      setArticles(arts);
      if (arts.length > 0) setSelectedArticle(arts[0]);
      setLoading(false);
    }
    loadLibraryData();
  }, [searchQuery, selectedCropCategory, selectedTopicCategory]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      
      {/* 1. Page Title Header & In-Page Search Bar ONLY */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight flex items-center space-x-2">
              <BookOpen className="w-6 h-6 text-agri-600" />
              <span>{t('libraryTitle')}</span>
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
              {t('librarySubtitle')}
            </p>
          </div>

          <div className="flex items-center space-x-2 bg-agri-50 px-3 py-1.5 rounded-xl border border-agri-200 text-xs font-semibold text-agri-800">
            <Sparkles className="w-4 h-4 text-agri-600" />
            <span>RAG Vector Knowledge Source</span>
          </div>
        </div>

        {/* Page-Specific Search Field ONLY */}
        <div className="relative pt-2 border-t border-gray-100">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-5" />
          <input
            type="text"
            placeholder={t('searchLibraryPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-agri-500 focus:bg-white transition-all font-medium"
          />
        </div>
      </div>

      {/* 2. Knowledge Category Cards */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider px-1">
          {t('libraryCategories')}
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-2">
          <button
            onClick={() => { setSelectedCropCategory('all'); setSelectedTopicCategory('all'); }}
            className={`p-2.5 rounded-xl border text-center space-y-1 transition-all ${
              selectedCropCategory === 'all' && selectedTopicCategory === 'all'
                ? 'bg-agri-600 text-white font-bold border-agri-600 shadow-xs'
                : 'bg-white text-gray-700 hover:bg-agri-50 border-gray-200'
            }`}
          >
            <div className="text-xl">📚</div>
            <span className="text-[11px] font-semibold block leading-tight truncate">All Topics</span>
          </button>

          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                if (['tomato', 'potato', 'brinjal'].includes(cat.id)) {
                  setSelectedCropCategory(cat.id);
                  setSelectedTopicCategory('all');
                } else {
                  setSelectedTopicCategory(cat.titleEn);
                }
              }}
              className={`p-2.5 rounded-xl border text-center space-y-1 transition-all ${
                selectedCropCategory === cat.id || selectedTopicCategory === cat.titleEn
                  ? 'bg-agri-600 text-white font-bold border-agri-600 shadow-xs scale-102'
                  : 'bg-white text-gray-700 hover:bg-agri-50 border-gray-200'
              }`}
            >
              <div className="text-xl">{cat.icon}</div>
              <span className="text-[11px] font-semibold block leading-tight truncate">
                {isTa ? cat.titleTa : cat.titleEn}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 3. Articles Grid & Article Detailed View */}
      {loading ? (
        <div className="p-8 bg-white rounded-2xl border border-gray-200 text-center text-xs text-gray-500">
          Loading agricultural library guides...
        </div>
      ) : articles.length === 0 ? (
        <div className="p-12 bg-white rounded-2xl border border-gray-200 text-center text-xs text-gray-400 space-y-2">
          <BookOpen className="w-8 h-8 text-gray-300 mx-auto" />
          <p>No agricultural articles found for "{searchQuery}". Try searching for Tomato, Late Blight, or Irrigation.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left Col: Articles List */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider px-1">
              Articles ({articles.length})
            </h3>

            <div className="space-y-2 max-h-[700px] overflow-y-auto pr-1">
              {articles.map((art) => (
                <div
                  key={art.id}
                  onClick={() => setSelectedArticle(art)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all space-y-2 ${
                    selectedArticle?.id === art.id
                      ? 'bg-agri-50/90 border-agri-500 shadow-xs'
                      : 'bg-white border-gray-200 hover:border-agri-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full bg-agri-100 text-agri-800 font-bold text-[10px] uppercase">
                      {art.category}
                    </span>
                    <span className="text-[10px] font-mono text-gray-400">{art.id}</span>
                  </div>

                  <h4 className="text-sm font-bold text-gray-900 leading-snug">
                    {isTa ? art.titleTa : art.titleEn}
                  </h4>

                  <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                    {isTa ? art.summaryTa : art.summaryEn}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Right 2 Cols: Detailed Article View with Sections */}
          {selectedArticle && (
            <div className="lg:col-span-2 bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-md space-y-6">
              
              {/* Article Header */}
              <div className="border-b border-gray-100 pb-4 space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="px-3 py-1 bg-agri-600 text-white font-bold text-xs rounded-full shadow-2xs">
                    {selectedArticle.category}
                  </span>
                  <span className="text-xs text-gray-400 uppercase font-mono font-bold">
                    Crop: {selectedArticle.cropId}
                  </span>
                </div>

                <h3 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                  {isTa ? selectedArticle.titleTa : selectedArticle.titleEn}
                </h3>

                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed font-medium">
                  {isTa ? selectedArticle.summaryTa : selectedArticle.summaryEn}
                </p>
              </div>

              {/* Sections Breakdown */}
              <div className="space-y-5 text-xs">
                
                {/* Overview */}
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-1">
                  <h4 className="font-bold text-gray-900 uppercase text-[11px] flex items-center space-x-1">
                    <BookOpen className="w-3.5 h-3.5 text-agri-600" />
                    <span>{t('cropOverview')}</span>
                  </h4>
                  <p className="text-gray-700 leading-relaxed">
                    {isTa ? selectedArticle.sections.overview.ta : selectedArticle.sections.overview.en}
                  </p>
                </div>

                {/* Growing Conditions */}
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-1">
                  <h4 className="font-bold text-gray-900 uppercase text-[11px] flex items-center space-x-1">
                    <Sun className="w-3.5 h-3.5 text-amber-500" />
                    <span>{t('growingConditions')}</span>
                  </h4>
                  <p className="text-gray-700 leading-relaxed">
                    {isTa ? selectedArticle.sections.growingConditions.ta : selectedArticle.sections.growingConditions.en}
                  </p>
                </div>

                {/* Grid of Common Diseases & Pests */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-red-50/60 p-4 rounded-xl border border-red-200 space-y-1">
                    <h4 className="font-bold text-red-900 uppercase text-[11px] flex items-center space-x-1">
                      <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
                      <span>{t('commonDiseases')}</span>
                    </h4>
                    <p className="text-red-950 leading-relaxed whitespace-pre-line">
                      {isTa ? selectedArticle.sections.commonDiseases.ta : selectedArticle.sections.commonDiseases.en}
                    </p>
                  </div>

                  <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200 space-y-1">
                    <h4 className="font-bold text-amber-900 uppercase text-[11px] flex items-center space-x-1">
                      <Bug className="w-3.5 h-3.5 text-amber-600" />
                      <span>{t('commonPests')}</span>
                    </h4>
                    <p className="text-amber-950 leading-relaxed">
                      {isTa ? selectedArticle.sections.commonPests.ta : selectedArticle.sections.commonPests.en}
                    </p>
                  </div>
                </div>

                {/* Grid of Irrigation & Soil */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-200 space-y-1">
                    <h4 className="font-bold text-blue-900 uppercase text-[11px] flex items-center space-x-1">
                      <Droplets className="w-3.5 h-3.5 text-blue-600" />
                      <span>{t('irrigationReq')}</span>
                    </h4>
                    <p className="text-blue-950 leading-relaxed">
                      {isTa ? selectedArticle.sections.irrigation.ta : selectedArticle.sections.irrigation.en}
                    </p>
                  </div>

                  <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-200 space-y-1">
                    <h4 className="font-bold text-emerald-900 uppercase text-[11px] flex items-center space-x-1">
                      <Sprout className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{t('soilReq')}</span>
                    </h4>
                    <p className="text-emerald-950 leading-relaxed">
                      {isTa ? selectedArticle.sections.soil.ta : selectedArticle.sections.soil.en}
                    </p>
                  </div>
                </div>

                {/* Crop Management & Harvest */}
                <div className="bg-agri-50 border border-agri-200 p-4 rounded-xl space-y-2">
                  <h4 className="font-bold text-agri-900 uppercase text-[11px] flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-agri-600" />
                    <span>{t('cropManagement')} & {t('harvestInfo')}</span>
                  </h4>
                  <p className="text-agri-950 leading-relaxed">
                    {isTa ? selectedArticle.sections.management.ta : selectedArticle.sections.management.en}
                  </p>
                  <p className="text-agri-950 leading-relaxed pt-2 border-t border-agri-200">
                    <strong>Harvesting:</strong> {isTa ? selectedArticle.sections.harvest.ta : selectedArticle.sections.harvest.en}
                  </p>
                </div>

              </div>

              {/* RAG-LLM Connect Button */}
              <div className="pt-4 border-t border-gray-100 flex justify-end">
                <button
                  onClick={() => navigate(`/assistant?query=${encodeURIComponent(isTa ? `${selectedArticle.titleTa} பற்றி கூடுதல் விவரங்களை விளக்குக.` : `Explain key practices for ${selectedArticle.titleEn}`)}`)}
                  className="px-5 py-2.5 bg-agri-600 hover:bg-agri-700 text-white rounded-xl font-bold text-xs shadow-xs transition-colors flex items-center space-x-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>{t('askAiAboutTopic')}</span>
                </button>
              </div>

            </div>
          )}

        </div>
      )}

    </div>
  );
}
