import React, { useState, useMemo } from 'react';
import {
  Landmark,
  Search,
  Filter,
  ShieldCheck,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ChevronDown,
  Info,
  FileText,
  Building2,
  Sprout,
  MapPin,
  X,
  Sparkles,
  Award,
  ArrowUpRight,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { VERIFIED_GOVERNMENT_SCHEMES, evaluateSchemeEligibility } from '../services/schemesData';

export default function GovernmentSchemes() {
  const { fieldProfile } = useAuth();
  const { language } = useLanguage();
  const isTa = language === 'ta';

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategoryPill, setActiveCategoryPill] = useState('All');
  const [selectedState, setSelectedState] = useState('All');
  const [selectedCrop, setSelectedCrop] = useState('All');
  const [selectedLandSize, setSelectedLandSize] = useState('All');
  const [selectedEligibilityTab, setSelectedEligibilityTab] = useState('all'); // all | eligible | check

  // Modal State for Scheme Details
  const [activeModalScheme, setActiveModalScheme] = useState(null);

  // Safe external URL handler to prevent relative routing or localhost prefixing
  const handleOpenExternalUrl = (url) => {
    if (!url || typeof url !== 'string' || !url.startsWith('https://')) {
      console.warn("Invalid external official URL:", url);
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  };

  // Category Single-Select Filter Pills
  const categoryPills = [
    { id: 'All', labelEn: 'All', labelTa: 'அனைத்தும்' },
    { id: 'Income', labelEn: 'Income', labelTa: 'வருமான ஆதரவு' },
    { id: 'Irrigation', labelEn: 'Irrigation', labelTa: 'நீர்ப்பாசனம்' },
    { id: 'Insurance', labelEn: 'Insurance', labelTa: 'பயிர் காப்பீடு' },
    { id: 'Soil', labelEn: 'Soil', labelTa: 'மண் வளம்' },
    { id: 'Equipment', labelEn: 'Equipment', labelTa: 'இயந்திரங்கள்' }
  ];

  // States list
  const stateOptions = [
    { value: 'All', labelEn: 'All States / All India', labelTa: 'அனைத்து மாநிலங்கள் / அகில இந்தியா' },
    { value: 'Tamil Nadu', labelEn: 'Tamil Nadu', labelTa: 'தமிழ்நாடு' },
    { value: 'Andhra Pradesh', labelEn: 'Andhra Pradesh', labelTa: 'ஆந்திரப் பிரதேசம்' },
    { value: 'Karnataka', labelEn: 'Karnataka', labelTa: 'கர்நாடகா' },
    { value: 'Maharashtra', labelEn: 'Maharashtra', labelTa: 'மகாராஷ்டிரா' },
    { value: 'Uttar Pradesh', labelEn: 'Uttar Pradesh', labelTa: 'உத்தரப் பிரதேசம்' }
  ];

  // Crops list
  const cropOptions = [
    { value: 'All', labelEn: 'All Crops', labelTa: 'அனைத்துப் பயிர்கள்' },
    { value: 'Brinjal', labelEn: 'Brinjal (Eggplant)', labelTa: 'கத்தரிக்காய்' },
    { value: 'Tomato', labelEn: 'Tomato', labelTa: 'தக்காளி' },
    { value: 'Potato', labelEn: 'Potato', labelTa: 'உருளைக்கிழங்கு' },
    { value: 'Horticulture', labelEn: 'Horticulture / Vegetables', labelTa: 'தோட்டக்கலைப் பயிர்கள்' },
    { value: 'Paddy', labelEn: 'Paddy / Rice', labelTa: 'நெல்' },
    { value: 'Wheat', labelEn: 'Wheat', labelTa: 'கோதுமை' }
  ];

  // Land size options
  const landSizeOptions = [
    { value: 'All', labelEn: 'All Land Sizes', labelTa: 'அனைத்து நில அளவுகள்' },
    { value: 'marginal', labelEn: '< 1.0 Acre (Marginal)', labelTa: '< 1.0 ஏக்கர் (குறு விவசாயி)' },
    { value: 'small', labelEn: '1.0 - 2.5 Acres (Small)', labelTa: '1.0 - 2.5 ஏக்கர் (சிறு விவசாயி)' },
    { value: 'medium', labelEn: '2.5 - 5.0 Acres (Semi-Medium)', labelTa: '2.5 - 5.0 ஏக்கர் (நடுத்தர விவசாயி)' },
    { value: 'large', labelEn: '> 5.0 Acres (Large)', labelTa: '> 5.0 ஏக்கர் (பெரிய விவசாயி)' }
  ];

  // Deterministically evaluate all schemes against the active fieldProfile
  const evaluatedSchemes = useMemo(() => {
    return VERIFIED_GOVERNMENT_SCHEMES.map(scheme => {
      const evalResult = evaluateSchemeEligibility(scheme, fieldProfile);
      return {
        ...scheme,
        evaluation: evalResult
      };
    });
  }, [fieldProfile]);

  // Eligibility summary counts
  const summaryCounts = useMemo(() => {
    let eligible = 0;
    let check = 0;
    let notEligible = 0;

    evaluatedSchemes.forEach(s => {
      if (s.evaluation.status === 'likely_eligible') eligible++;
      else if (s.evaluation.status === 'check_required') check++;
      else notEligible++;
    });

    return { eligible, check, notEligible, total: evaluatedSchemes.length };
  }, [evaluatedSchemes]);

  // Filter schemes
  const filteredSchemes = useMemo(() => {
    return evaluatedSchemes.filter(scheme => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesText =
          scheme.name.toLowerCase().includes(q) ||
          (scheme.nameTa && scheme.nameTa.toLowerCase().includes(q)) ||
          scheme.agency.toLowerCase().includes(q) ||
          scheme.description.toLowerCase().includes(q) ||
          scheme.benefits.toLowerCase().includes(q) ||
          scheme.category.toLowerCase().includes(q);
        if (!matchesText) return false;
      }

      // 2. Category Pill Filter (Single select)
      if (activeCategoryPill !== 'All') {
        const cat = scheme.category.toLowerCase();
        if (activeCategoryPill === 'Income') {
          if (!cat.includes('income') && !cat.includes('credit') && !cat.includes('support')) return false;
        } else if (activeCategoryPill === 'Irrigation') {
          if (!cat.includes('irrigation') && !cat.includes('water')) return false;
        } else if (activeCategoryPill === 'Insurance') {
          if (!cat.includes('insurance') && !cat.includes('risk')) return false;
        } else if (activeCategoryPill === 'Soil') {
          if (!cat.includes('soil') && !cat.includes('organic') && !cat.includes('nutrient')) return false;
        } else if (activeCategoryPill === 'Equipment') {
          if (!cat.includes('machinery') && !cat.includes('mechanization') && !cat.includes('infrastructure')) return false;
        }
      }

      // 3. State Filter
      if (selectedState !== 'All') {
        const supported = (scheme.rules?.supportedStates || ['All India']).map(s => s.toLowerCase());
        const st = selectedState.toLowerCase();
        const stateMatch = supported.includes('all india') || supported.some(s => s.includes(st) || st.includes(s));
        if (!stateMatch) return false;
      }

      // 4. Crop Filter
      if (selectedCrop !== 'All') {
        const supported = (scheme.rules?.supportedCrops || ['All']).map(c => c.toLowerCase());
        const cp = selectedCrop.toLowerCase();
        const cropMatch = supported.includes('all') || supported.some(c => c.includes(cp) || cp.includes(c));
        if (!cropMatch) return false;
      }

      // 5. Land Size Filter
      if (selectedLandSize !== 'All') {
        const minL = scheme.rules?.minLandSize ?? 0;
        const maxL = scheme.rules?.maxLandSize ?? 999999;
        if (selectedLandSize === 'marginal' && minL > 1.0) return false;
        if (selectedLandSize === 'small' && (minL > 2.5 || maxL < 1.0)) return false;
        if (selectedLandSize === 'medium' && (minL > 5.0 || maxL < 2.5)) return false;
        if (selectedLandSize === 'large' && maxL < 5.0) return false;
      }

      // 6. Eligibility Tab Filter
      if (selectedEligibilityTab === 'eligible' && scheme.evaluation.status !== 'likely_eligible') return false;
      if (selectedEligibilityTab === 'check' && scheme.evaluation.status !== 'check_required') return false;
      if (selectedEligibilityTab === 'not_eligible' && scheme.evaluation.status !== 'not_eligible') return false;

      return true;
    });
  }, [
    evaluatedSchemes,
    searchQuery,
    activeCategoryPill,
    selectedState,
    selectedCrop,
    selectedLandSize,
    selectedEligibilityTab
  ]);

  const resetFilters = () => {
    setSearchQuery('');
    setActiveCategoryPill('All');
    setSelectedState('All');
    setSelectedCrop('All');
    setSelectedLandSize('All');
    setSelectedEligibilityTab('all');
  };

  const getStatusBadge = (evaluation) => {
    if (evaluation.status === 'likely_eligible') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          {isTa ? "✓ பெரும்பாலும் தகுதியுடையது" : "Likely Eligible"}
        </span>
      );
    } else if (evaluation.status === 'check_required') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
          {isTa ? "? கூடுதல் தகவல் தேவை" : "Check Required"}
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600 border border-gray-200 shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-gray-400"></span>
          {isTa ? "✕ தற்போது தகுதியற்றது" : "Not Eligible"}
        </span>
      );
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header (Clean White / Light Theme) */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center shadow-xs shrink-0">
              <Landmark className="w-6 h-6 sm:w-8 sm:h-8" />
            </div>
            <div>
              <div className="flex items-center space-x-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
                  {isTa ? "அரசு விவசாய நலத்திட்டங்கள்" : "GOVERNMENT AGRICULTURE SCHEMES"}
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  GOV.IN VERIFIED
                </span>
              </div>
              <p className="text-xs sm:text-sm text-gray-600 mt-1 max-w-2xl">
                {isTa
                  ? "விவசாயிகளுக்கான மத்திய மற்றும் மாநில அரசுகளின் உதவித்தொகை, நீர்ப்பாசன மானியம், பயிர் காப்பீடு மற்றும் கடன் திட்டங்கள்."
                  : "Find government schemes, subsidies and financial support relevant to your farm."}
              </p>
            </div>
          </div>

          {/* Active Profile Match Pill */}
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 text-right shrink-0">
            <div className="text-[11px] text-gray-500 font-medium">
              {isTa ? "உங்கள் தற்போதைய பண்ணை விவரம்" : "Active Farm Profile"}
            </div>
            <div className="text-sm font-bold text-emerald-900 flex items-center gap-1 justify-end">
              <Sprout className="w-4 h-4 text-emerald-600" />
              {fieldProfile?.crop_type || "Brinjal"} • {fieldProfile?.field_size || 2.0} {fieldProfile?.field_size_unit || "Acre"}
            </div>
            <div className="text-[11px] text-gray-600 flex items-center gap-1 justify-end mt-0.5">
              <MapPin className="w-3 h-3 text-gray-400" />
              {fieldProfile?.field_location || "Tamil Nadu"}
            </div>
          </div>
        </div>
      </div>

      {/* Profile Eligibility Banner */}
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 dark:from-slate-800 dark:via-slate-800/90 dark:to-slate-800 border border-emerald-200 dark:border-slate-700 rounded-2xl p-5 shadow-2xs text-gray-900 dark:text-slate-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span className="font-bold text-sm sm:text-base text-gray-900 dark:text-white">
                {isTa
                  ? `உங்கள் பண்ணைக்காக ${summaryCounts.eligible} திட்டங்கள் பரிந்துரைக்கப்பட்டுள்ளன`
                  : `${summaryCounts.eligible} of ${summaryCounts.total} schemes matched your field profile`}
              </span>
            </div>
            <p className="text-xs text-gray-600 dark:text-slate-300 max-w-3xl">
              {isTa
                ? "இந்தத் தகுதி பரிந்துரை உங்கள் பயிர், நிலப்பரப்பு மற்றும் மாநிலத்தின் அடிப்படையில் தானியங்கி விதிகளால் கணக்கிடப்படுகிறது. இறுதி அனுமதி சம்பந்தப்பட்ட அரசுத் துறையினரால் மட்டுமே வழங்கப்படும்."
                : "Deterministic rule-based evaluation based on crop type, land size, and state location. Final eligibility is verified by respective government portal officials."}
            </p>
          </div>

          {/* Quick Eligibility Filter Tabs */}
          <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-emerald-200 dark:border-slate-700 p-1 rounded-xl shadow-2xs shrink-0">
            <button
              onClick={() => setSelectedEligibilityTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedEligibilityTab === 'all'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-gray-600 dark:text-slate-300 hover:text-emerald-800 dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-slate-800'
              }`}
            >
              {isTa ? "அனைத்தும்" : "All"} ({summaryCounts.total})
            </button>
            <button
              onClick={() => setSelectedEligibilityTab('eligible')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                selectedEligibilityTab === 'eligible'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 hover:bg-emerald-50 dark:hover:bg-slate-800'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              {isTa ? "தகுதியுடையவை" : "Likely Eligible"} ({summaryCounts.eligible})
            </button>
            <button
              onClick={() => setSelectedEligibilityTab('check')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                selectedEligibilityTab === 'check'
                  ? 'bg-amber-500 text-white shadow-2xs'
                  : 'text-amber-700 dark:text-amber-400 hover:text-amber-900 hover:bg-amber-50 dark:hover:bg-slate-800'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              {isTa ? "சரிபார்ப்பு தேவை" : "Check Req."} ({summaryCounts.check})
            </button>
          </div>
        </div>
      </div>

      {/* Search & Category Filter Section (Clean Light Theme) */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-2xs space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-5 h-5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              isTa
                ? "திட்டத்தின் பெயர், பயிர், மானிய வகை அல்லது துறையைத் தேடுக (எ.கா: PM-KISAN, சொட்டுநீர், காப்பீடு)..."
                : "Search schemes by title, crop, subsidy type, or department (e.g., PM-KISAN, Drip Irrigation, Insurance)..."
            }
            className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all placeholder-gray-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Section 7 Category Single-Select Filter Pills */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block">
            {isTa ? "திட்ட வகைகள் (வடிகட்டி)" : "Categories"}
          </span>
          <div className="flex items-center gap-2 flex-wrap">
            {categoryPills.map(pill => {
              const isSelected = activeCategoryPill === pill.id;
              return (
                <button
                  key={pill.id}
                  onClick={() => setActiveCategoryPill(pill.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-600 text-white shadow-2xs border border-emerald-600'
                      : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-200'
                  }`}
                >
                  {isTa ? pill.labelTa : pill.labelEn}
                </button>
              );
            })}
          </div>
        </div>

        {/* Multi-Filter Dropdowns (State, Crop, Land Size) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-gray-100">
          {/* State Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              {isTa ? "மாநிலம் / பகுதி" : "State / Coverage"}
            </label>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            >
              {stateOptions.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {isTa ? opt.labelTa : opt.labelEn}
                </option>
              ))}
            </select>
          </div>

          {/* Crop Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              {isTa ? "பயிர் வகை" : "Crop Filter"}
            </label>
            <select
              value={selectedCrop}
              onChange={(e) => setSelectedCrop(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            >
              {cropOptions.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {isTa ? opt.labelTa : opt.labelEn}
                </option>
              ))}
            </select>
          </div>

          {/* Land Size Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              {isTa ? "நில அளவு வகைப்பாடு" : "Land Size Category"}
            </label>
            <select
              value={selectedLandSize}
              onChange={(e) => setSelectedLandSize(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            >
              {landSizeOptions.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {isTa ? opt.labelTa : opt.labelEn}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Active Filter Chips & Reset */}
        {(selectedState !== 'All' || selectedCrop !== 'All' || selectedLandSize !== 'All' || activeCategoryPill !== 'All' || searchQuery) && (
          <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs">
            <span className="text-gray-500">
              {isTa ? `${filteredSchemes.length} திட்டங்கள் காணப்படுகின்றன` : `Found ${filteredSchemes.length} matching schemes`}
            </span>
            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-medium cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              {isTa ? "வடிகட்டிகளை மீட்டமை" : "Reset Filters"}
            </button>
          </div>
        )}
      </div>

      {/* Schemes Grid (Clean Light Cards) */}
      {filteredSchemes.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center shadow-2xs">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto text-gray-400 mb-4">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-gray-900 mb-1">
            {isTa ? "பொருந்தக்கூடிய திட்டங்கள் எதுவும் இல்லை" : "No Matching Schemes Found"}
          </h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto mb-4">
            {isTa
              ? "உங்கள் தேடல் அளவுகோலுக்கு ஏற்ற திட்டங்கள் இல்லை. வேறு மாநிலம் அல்லது பயிர் வகையைத் தேர்ந்தெடுக்கவும்."
              : "No government schemes match your active search and filter combinations. Try resetting filters or choosing 'All States'."}
          </p>
          <button
            onClick={resetFilters}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            {isTa ? "அனைத்து திட்டங்களையும் காண்பி" : "Clear All Filters"}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredSchemes.map((scheme) => (
            <div
              key={scheme.id}
              className="bg-white border border-gray-200 rounded-2xl p-6 shadow-2xs hover:shadow-md hover:border-emerald-300 transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Header: Badges, Title, Agency */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        ✓ GOV.IN VERIFIED
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-gray-100 text-gray-700">
                        <Building2 className="w-3 h-3 text-emerald-600" />
                        {scheme.category}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-teal-50 text-teal-800 border border-teal-200">
                        <MapPin className="w-2.5 h-2.5 text-teal-600" />
                        {scheme.state}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-gray-900 leading-snug group-hover:text-emerald-700 transition-colors">
                      {isTa && scheme.nameTa ? scheme.nameTa : scheme.name}
                    </h3>

                    {/* Bilingual English subtitle if Tamil active */}
                    {isTa && scheme.nameTa && (
                      <p className="text-xs text-gray-500 font-medium">
                        {scheme.name}
                      </p>
                    )}

                    <p className="text-xs text-gray-500 mt-1">
                      {isTa && scheme.agencyTa ? scheme.agencyTa : scheme.agency}
                    </p>
                  </div>

                  {/* Status Badge */}
                  <div className="shrink-0">
                    {getStatusBadge(scheme.evaluation)}
                  </div>
                </div>

                {/* Eligibility evaluation reason pill */}
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 mb-4 text-xs">
                  <div className="flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-gray-800">
                        {isTa ? "விதி சரிபார்ப்பு: " : "Rule Match: "}
                      </span>
                      <span className="text-gray-600">
                        {scheme.evaluation.message}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Scheme Benefits */}
                <div className="mb-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700 mb-1.5 flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5" />
                    {isTa ? "முக்கிய பலன்கள்" : "Key Benefits"}
                  </h4>
                  <p className="text-sm text-gray-800 leading-relaxed bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
                    {isTa && scheme.benefitsTa ? scheme.benefitsTa : scheme.benefits}
                  </p>
                </div>

                {/* Eligibility Summary */}
                <div className="mb-4">
                  <h4 className="text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-gray-400" />
                    {isTa ? "தகுதி அளவுகோல்" : "Eligibility Summary"}
                  </h4>
                  <p className="text-xs text-gray-600 line-clamp-2">
                    {isTa && scheme.eligibilitySummaryTa ? scheme.eligibilitySummaryTa : scheme.eligibilitySummary}
                  </p>
                </div>

                {/* Required Documents Checklist Preview */}
                <div className="mb-4">
                  <h4 className="text-xs font-semibold text-gray-600 mb-1.5 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-gray-400" />
                    {isTa ? "தேவையான ஆவணங்கள்" : "Required Documents"}
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {scheme.requiredDocuments.slice(0, 3).map((doc, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center px-2 py-0.5 rounded text-[11px] bg-gray-100 text-gray-700"
                      >
                        • {doc}
                      </span>
                    ))}
                    {scheme.requiredDocuments.length > 3 && (
                      <span className="text-[11px] text-gray-400 self-center">
                        +{scheme.requiredDocuments.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons & Official Portal Link */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveModalScheme(scheme)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-200 transition-colors cursor-pointer"
                  >
                    <Info className="w-3.5 h-3.5 text-gray-500" />
                    {isTa ? "முழு விவரம்" : "View Details"}
                  </button>

                  {scheme.officialWebsite && (
                    <a
                      href={scheme.officialWebsite}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => {
                        e.preventDefault();
                        handleOpenExternalUrl(scheme.officialWebsite);
                      }}
                      className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-medium text-gray-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                      title={`Visit ${scheme.officialWebsite}`}
                    >
                      <span>{isTa ? "இணையதளம்" : "Official Website"}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                {scheme.applicationUrl ? (
                  <a
                    href={scheme.applicationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => {
                      e.preventDefault();
                      handleOpenExternalUrl(scheme.applicationUrl);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all shadow-xs cursor-pointer"
                    title={`Apply on official website: ${scheme.applicationUrl}`}
                  >
                    <span>{isTa ? "விண்ணப்பிக்கவும்" : "Apply Officially"}</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                ) : (
                  <span className="text-xs text-gray-400 italic bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                    {isTa ? "நேரடி விண்ணப்ப தளம் கிடைக்கவில்லை" : "Official portal unavailable"}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Official Government Disclaimer Box (Light Theme) */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 text-xs text-amber-900 shadow-2xs">
        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold">
            {isTa ? "அரசு அதிகாரப்பூர்வ மறுப்பு அறிவிப்பு (Legal Disclaimer):" : "Official Government Guidelines Disclaimer:"}
          </p>
          <p className="leading-relaxed text-amber-800">
            {isTa
              ? "SmartFarm AI தளம் விவசாயிகளுக்கு வழிகாட்டுதல் நோக்கத்திற்காக மட்டுமே விதிகள் சார்ந்த தகுதி பரிந்துரைகளை வழங்குகிறது. அனைத்து திட்ட விண்ணப்பங்களும், ஆவண சரிபார்ப்புகளும் மற்றும் மானிய நிதி ஒதுக்கீடுகளும் அந்தந்த இந்திய அரசு மற்றும் தமிழ்நாடு அரசு அதிகாரப்பூர்வ இணையதளங்கள் (.gov.in / .nic.in) மற்றும் வேளாண்மைத் துறை அலுவலகங்கள் மூலமாகவே மேற்கொள்ளப்படும்."
              : "SmartFarm AI provides deterministic recommendations for informational purposes based on public government guidelines. Scheme rules, eligibility criteria, and fund allocations are determined solely by the respective Central/State Ministries. Farmers must verify guidelines and submit applications exclusively through official .gov.in / .nic.in portals or local Agricultural Extension Offices."}
          </p>
        </div>
      </div>

      {/* Scheme Detailed Modal (Clean Light Theme) */}
      {activeModalScheme && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div
            className="bg-white border border-gray-200 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setActiveModalScheme(null)}
              className="absolute top-5 right-5 p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Content */}
            <div className="space-y-5">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Landmark className="w-6 h-6" />
                </div>
                <div className="flex-1 pr-8">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {activeModalScheme.category}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
                      {activeModalScheme.state}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {isTa && activeModalScheme.nameTa ? activeModalScheme.nameTa : activeModalScheme.name}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {isTa && activeModalScheme.agencyTa ? activeModalScheme.agencyTa : activeModalScheme.agency}
                  </p>
                </div>
              </div>

              {/* Status Banner */}
              <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between">
                <div>
                  <span className="text-xs text-gray-500 block mb-0.5">
                    {isTa ? "பண்ணை விவரத்துடன் பொருத்தம்" : "Profile Eligibility Status"}
                  </span>
                  <div className="text-xs font-medium text-gray-800">
                    {activeModalScheme.evaluation.message}
                  </div>
                </div>
                <div>{getStatusBadge(activeModalScheme.evaluation)}</div>
              </div>

              {/* Description */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                  {isTa ? "திட்டத்தின் நோக்கம்" : "Scheme Description"}
                </h4>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {isTa && activeModalScheme.descriptionTa ? activeModalScheme.descriptionTa : activeModalScheme.description}
                </p>
              </div>

              {/* Benefits */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700 mb-1.5 flex items-center gap-1">
                  <Award className="w-3.5 h-3.5" />
                  {isTa ? "நிதி உதவி & சலுகைகள்" : "Financial Assistance & Benefits"}
                </h4>
                <div className="bg-emerald-50 p-3.5 rounded-xl border border-emerald-200 text-sm text-emerald-950 font-medium">
                  {isTa && activeModalScheme.benefitsTa ? activeModalScheme.benefitsTa : activeModalScheme.benefits}
                </div>
              </div>

              {/* Full Eligibility */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  {isTa ? "முழு தகுதி விவரங்கள்" : "Detailed Eligibility Conditions"}
                </h4>
                <p className="text-sm text-gray-700">
                  {isTa && activeModalScheme.eligibilitySummaryTa ? activeModalScheme.eligibilitySummaryTa : activeModalScheme.eligibilitySummary}
                </p>
              </div>

              {/* Required Documents */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-teal-600" />
                  {isTa ? "சமர்ப்பிக்க வேண்டிய ஆவணங்கள்" : "Checklist of Required Documents"}
                </h4>
                <ul className="space-y-1.5 text-xs text-gray-700 bg-gray-50 border border-gray-200 p-3.5 rounded-xl">
                  {activeModalScheme.requiredDocuments.map((doc, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-emerald-600 font-bold">•</span>
                      <span>{doc}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Rules Specs */}
              <div className="text-xs text-gray-500 grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
                <div>
                  <span className="font-semibold text-gray-700">Supported Crops: </span>
                  {activeModalScheme.rules?.supportedCrops?.join(", ") || "All"}
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Land Limit: </span>
                  {activeModalScheme.rules?.minLandSize ? `${activeModalScheme.rules.minLandSize} - ` : "Min: none, "}
                  {activeModalScheme.rules?.maxLandSize ? `${activeModalScheme.rules.maxLandSize} Acres` : "No Upper Limit"}
                </div>
              </div>

              {/* Verified Official Portal Notice */}
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 text-xs space-y-1.5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="font-semibold text-gray-800 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    {isTa ? "அரசு அதிகாரப்பூர்வ இணைய முகவரி:" : "Official Government Portal Domain:"}
                  </span>
                  <span className="font-mono text-emerald-800 font-bold bg-white px-2.5 py-0.5 rounded-md border border-emerald-200 shadow-2xs">
                    {activeModalScheme.officialDomain || (activeModalScheme.officialWebsite ? activeModalScheme.officialWebsite.replace('https://', '') : '')}
                  </span>
                </div>
                {activeModalScheme.applicationUrl ? (
                  <div className="text-gray-600 pt-0.5">
                    <span className="font-medium text-emerald-800">Direct Application Portal: </span>
                    <span className="font-mono text-[11px] text-gray-700 break-all">{activeModalScheme.applicationUrl}</span>
                  </div>
                ) : (
                  <div className="text-gray-500 italic pt-0.5">
                    {isTa
                      ? "*இத்திட்டத்திற்கான நேரடி இணைய விண்ணப்ப தளம் கிடைக்கவில்லை. விண்ணப்பங்கள் மாவட்ட வேளாண்மை/தோட்டக்கலை அலுவலகத்தில் மேற்கொள்ளப்படுகின்றன."
                      : "*Direct online application portal is unavailable for this scheme. Applications are processed offline via District Agriculture Offices."}
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-between gap-3 flex-wrap">
                <button
                  onClick={() => setActiveModalScheme(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer"
                >
                  {isTa ? "மூடுக" : "Close"}
                </button>

                <div className="flex items-center gap-2 flex-wrap">
                  {activeModalScheme.officialWebsite && (
                    <a
                      href={activeModalScheme.officialWebsite}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => {
                        e.preventDefault();
                        handleOpenExternalUrl(activeModalScheme.officialWebsite);
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-200 transition-colors cursor-pointer"
                      title={activeModalScheme.officialWebsite}
                    >
                      <span>{isTa ? "அரசு இணையதளம்" : "Official Website"}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}

                  {activeModalScheme.applicationUrl ? (
                    <a
                      href={activeModalScheme.applicationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => {
                        e.preventDefault();
                        handleOpenExternalUrl(activeModalScheme.applicationUrl);
                      }}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all shadow-md cursor-pointer"
                      title={`Apply on official website: ${activeModalScheme.applicationUrl}`}
                    >
                      <span>{isTa ? "அதிகாரப்பூர்வ தளத்தில் விண்ணப்பிக்கவும்" : "Apply on Official Website"}</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </a>
                  ) : (
                    <span className="text-xs text-gray-500 italic bg-gray-100 px-3.5 py-2 rounded-xl">
                      {isTa ? "நேரடி விண்ணப்ப தளம் கிடைக்கவில்லை" : "Official application portal unavailable"}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
