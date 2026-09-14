import React, { useState, useEffect } from 'react';
import {
  Sprout,
  Edit3,
  Layers,
  Droplets,
  Calendar,
  MapPin,
  X,
  Check,
  PlusCircle,
  FlaskConical,
  Compass,
  Gauge,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  HelpCircle,
  RefreshCw,
  Activity,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { apiService } from '../../services/apiService';

export default function MyFieldCard() {
  const { fieldProfile, fieldAssessment, updateFieldProfile, refreshFieldProfile } = useAuth();
  const { language } = useLanguage();
  const isTa = language === 'ta';

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [previewAssessment, setPreviewAssessment] = useState(null);
  const [validationError, setValidationError] = useState(null);

  const [formData, setFormData] = useState({
    crop_type: fieldProfile?.crop_type || "Brinjal",
    soil_type: fieldProfile?.soil_type || "Loamy",
    soil_ph: fieldProfile?.soil_ph ?? 6.4,
    water_capacity: fieldProfile?.water_capacity || "72%",
    field_size: fieldProfile?.field_size ?? 2.0,
    field_size_unit: fieldProfile?.field_size_unit || "Acre",
    npk_nitrogen: fieldProfile?.npk_nitrogen ?? 80,
    npk_phosphorus: fieldProfile?.npk_phosphorus ?? 40,
    npk_potassium: fieldProfile?.npk_potassium ?? 40,
    sowing_date: fieldProfile?.sowing_date || "2026-06-15",
    irrigation_method: fieldProfile?.irrigation_method || "Drip",
    field_location: fieldProfile?.field_location || "Tamil Nadu",
    season: fieldProfile?.season || "Kharif"
  });

  // Ensure fresh assessment exists on mount
  useEffect(() => {
    if (!fieldAssessment && fieldProfile?.crop_type) {
      refreshFieldProfile?.();
    }
  }, [fieldAssessment, fieldProfile, refreshFieldProfile]);

  const handleOpenEdit = () => {
    setFormData({
      crop_type: fieldProfile?.crop_type || "Brinjal",
      soil_type: fieldProfile?.soil_type || "Loamy",
      soil_ph: fieldProfile?.soil_ph ?? 6.4,
      water_capacity: fieldProfile?.water_capacity || "72%",
      field_size: fieldProfile?.field_size ?? 2.0,
      field_size_unit: fieldProfile?.field_size_unit || "Acre",
      npk_nitrogen: fieldProfile?.npk_nitrogen ?? 80,
      npk_phosphorus: fieldProfile?.npk_phosphorus ?? 40,
      npk_potassium: fieldProfile?.npk_potassium ?? 40,
      sowing_date: fieldProfile?.sowing_date || "2026-06-15",
      irrigation_method: fieldProfile?.irrigation_method || "Drip",
      field_location: fieldProfile?.field_location || "Tamil Nadu",
      season: fieldProfile?.season || "Kharif"
    });
    setPreviewAssessment(null);
    setValidationError(null);
    setIsEditing(true);
  };

  // Live on-the-fly evaluation in modal
  const handleCheckSuitability = async () => {
    setEvaluating(true);
    setValidationError(null);
    try {
      const cleanData = {
        ...formData,
        soil_ph: parseFloat(formData.soil_ph),
        field_size: parseFloat(formData.field_size) || 1.0,
        npk_nitrogen: parseInt(formData.npk_nitrogen) || 0,
        npk_phosphorus: parseInt(formData.npk_phosphorus) || 0,
        npk_potassium: parseInt(formData.npk_potassium) || 0
      };
      const assessment = await apiService.evaluateField(cleanData);
      if (assessment) {
        setPreviewAssessment(assessment);
      }
    } catch (err) {
      console.error("Live suitability check error:", err);
    } finally {
      setEvaluating(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setValidationError(null);
    try {
      const cleanData = {
        ...formData,
        soil_ph: parseFloat(formData.soil_ph),
        field_size: parseFloat(formData.field_size) || 2.0,
        npk_nitrogen: parseInt(formData.npk_nitrogen) || 0,
        npk_phosphorus: parseInt(formData.npk_phosphorus) || 0,
        npk_potassium: parseInt(formData.npk_potassium) || 0
      };

      await updateFieldProfile(cleanData);
      setIsEditing(false);
      setPreviewAssessment(null);
    } catch (err) {
      console.error("Failed to save field profile:", err);
      setValidationError(err?.message || "Failed to save field profile.");
    } finally {
      setSaving(false);
    }
  };

  const hasProfile = Boolean(fieldProfile && fieldProfile.crop_type);
  const activeAssessment = fieldAssessment;

  // Status styling helpers
  const getOverallStatusBadge = (assessment) => {
    if (!assessment) return null;
    const level = assessment.status_level;

    if (level === 'good') {
      return {
        containerClass: "bg-emerald-50/90 border-emerald-200 text-emerald-950",
        badgeClass: "bg-emerald-600 text-white",
        icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />,
        label: isTa ? "நடவு செய்ய உகந்தது" : "SUITABLE FOR PLANTING",
        sublabel: isTa ? "அனைத்து முக்கிய நில அளவீடுகளும் உகந்த வரம்பில் உள்ளன" : "All critical parameters meet verified agronomic standards"
      };
    } else if (level === 'borderline') {
      return {
        containerClass: "bg-amber-50/90 border-amber-200 text-amber-950",
        badgeClass: "bg-amber-500 text-white",
        icon: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />,
        label: isTa ? "மேம்பாடுகளுடன் பயிரிடலாம்" : "SUITABLE WITH IMPROVEMENTS",
        sublabel: isTa ? "சில அளவீடுகளில் கவனம் செலுத்த பரிந்துரைக்கப்படுகிறது" : "Minor improvements recommended to reach peak yield"
      };
    } else if (level === 'poor') {
      return {
        containerClass: "bg-rose-50/90 border-rose-200 text-rose-950",
        badgeClass: "bg-rose-600 text-white",
        icon: <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />,
        label: isTa ? "நடவு செய்ய ஏற்றதல்ல" : "NOT SUITABLE FOR PLANTING",
        sublabel: isTa ? "பயிரிடுவதற்கு முன் குறைபாடுகளை சரிசெய்யவும்" : "Address critical parameter failures before planting"
      };
    } else if (level === 'unavailable') {
      return {
        containerClass: "bg-gray-50 border-gray-200 text-gray-900",
        badgeClass: "bg-gray-600 text-white",
        icon: <HelpCircle className="w-5 h-5 text-gray-500 shrink-0" />,
        label: isTa ? "மதிப்பீடு கிடைக்கவில்லை" : "ASSESSMENT UNAVAILABLE",
        sublabel: isTa ? "சரிபார்க்கப்பட்ட அறிவியல் விதிகள் இல்லை" : "Verified agronomic rules are not loaded for this crop"
      };
    } else {
      return {
        containerClass: "bg-orange-50 border-orange-200 text-orange-950",
        badgeClass: "bg-orange-600 text-white",
        icon: <AlertTriangle className="w-5 h-5 text-orange-600 shrink-0" />,
        label: isTa ? "உள்ளீட்டு பிழை" : "INPUT VALIDATION ERROR",
        sublabel: isTa ? "சரியான அளவீடுகளை உள்ளிடவும்" : "Please provide valid agronomic measurements"
      };
    }
  };

  const statusBadgeInfo = getOverallStatusBadge(activeAssessment);

  return (
    <>
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-5 hover:shadow-md transition-shadow relative">
        {/* Card Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-3.5">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-agri-100 text-agri-700 flex items-center justify-center font-bold">
              <Sprout className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 tracking-tight flex items-center gap-2">
                <span>{isTa ? "என் நிலம்" : "MY FIELD"}</span>
                {hasProfile && (
                  <span className="px-2 py-0.5 rounded-full bg-agri-50 border border-agri-200 text-agri-800 text-[10px] font-semibold">
                    {fieldProfile.season || "Kharif"}
                  </span>
                )}
              </h3>
              <p className="text-xs text-gray-500">
                {isTa ? "பண்ணை விவரம் & விவசாய பொருத்த மதிப்பீடு" : "Farm profile & agronomic suitability assessment"}
              </p>
            </div>
          </div>

          <button
            onClick={handleOpenEdit}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-agri-700 bg-agri-50 hover:bg-agri-100 border border-agri-200 transition-colors shadow-2xs cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{hasProfile ? (isTa ? "நில விவரம் திருத்து" : "Edit Field") : (isTa ? "நில விவரம் சேர்" : "Add Field")}</span>
          </button>
        </div>

        {/* Content Body */}
        {!hasProfile ? (
          <div className="py-8 text-center space-y-3">
            <p className="text-xs text-gray-400">
              {isTa ? "நில விவரங்கள் இன்னும் சேர்க்கப்படவில்லை." : "No field information added yet."}
            </p>
            <button
              onClick={handleOpenEdit}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-agri-600 hover:bg-agri-700 text-white text-xs font-bold transition-colors shadow-xs cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{isTa ? "நில விவரம் சேர்க்க" : "Add Field Profile"}</span>
            </button>
          </div>
        ) : (
          <>
            {/* 1. Existing 8-metric Summary Grid (Preserved) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              {/* Crop */}
              <div className="p-2.5 bg-gray-50/80 rounded-xl border border-gray-100 space-y-0.5">
                <span className="text-[11px] text-gray-500 font-medium block">
                  {isTa ? "பயிர் வகை" : "Crop"}
                </span>
                <span className="font-bold text-gray-900 text-sm block truncate">
                  {fieldProfile.crop_type || "Brinjal"}
                </span>
              </div>

              {/* Soil Type */}
              <div className="p-2.5 bg-gray-50/80 rounded-xl border border-gray-100 space-y-0.5">
                <span className="text-[11px] text-gray-500 font-medium block">
                  {isTa ? "மண் வகை" : "Soil Type"}
                </span>
                <span className="font-bold text-gray-900 text-sm block truncate">
                  {fieldProfile.soil_type || "Loamy"}
                </span>
              </div>

              {/* Soil pH */}
              <div className="p-2.5 bg-gray-50/80 rounded-xl border border-gray-100 space-y-0.5">
                <span className="text-[11px] text-gray-500 font-medium block">
                  {isTa ? "மண் pH" : "Soil pH"}
                </span>
                <span className="font-bold text-gray-900 text-sm block">
                  {fieldProfile.soil_ph ?? "6.4"}
                </span>
              </div>

              {/* Water Capacity */}
              <div className="p-2.5 bg-gray-50/80 rounded-xl border border-gray-100 space-y-0.5">
                <span className="text-[11px] text-gray-500 font-medium block">
                  {isTa ? "நீர் கொள்ளளவு" : "Water Capacity"}
                </span>
                <span className="font-bold text-gray-900 text-sm block">
                  {fieldProfile.water_capacity || "72%"}
                </span>
              </div>

              {/* Field Size */}
              <div className="p-2.5 bg-gray-50/80 rounded-xl border border-gray-100 space-y-0.5">
                <span className="text-[11px] text-gray-500 font-medium block">
                  {isTa ? "நில அளவு" : "Field Size"}
                </span>
                <span className="font-bold text-gray-900 text-sm block">
                  {fieldProfile.field_size} {fieldProfile.field_size_unit || "Acres"}
                </span>
              </div>

              {/* N-P-K */}
              <div className="p-2.5 bg-gray-50/80 rounded-xl border border-gray-100 space-y-0.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-gray-500 font-medium">
                    {isTa ? "N-P-K விகிதம்" : "N-P-K"}
                  </span>
                  <span className="text-[9px] text-gray-400 font-semibold">(kg/ha)</span>
                </div>
                <span className="font-bold text-emerald-700 text-sm block font-mono">
                  {fieldProfile.npk_nitrogen ?? 80} - {fieldProfile.npk_phosphorus ?? 40} - {fieldProfile.npk_potassium ?? 40}
                </span>
              </div>

              {/* Irrigation */}
              <div className="p-2.5 bg-gray-50/80 rounded-xl border border-gray-100 space-y-0.5">
                <span className="text-[11px] text-gray-500 font-medium block">
                  {isTa ? "பாசன முறை" : "Irrigation"}
                </span>
                <span className="font-bold text-gray-900 text-sm block truncate">
                  {fieldProfile.irrigation_method || "Drip"}
                </span>
              </div>

              {/* Location */}
              <div className="p-2.5 bg-gray-50/80 rounded-xl border border-gray-100 space-y-0.5">
                <span className="text-[11px] text-gray-500 font-medium block">
                  {isTa ? "அமைவிடம்" : "Location"}
                </span>
                <span className="font-bold text-gray-900 text-sm block truncate">
                  {fieldProfile.field_location || "Tamil Nadu"}
                </span>
              </div>
            </div>

            {/* 2. FIELD SUITABILITY ASSESSMENT PANEL */}
            <div className="pt-2 border-t border-gray-100 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-agri-600" />
                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                    {isTa ? "நில விவசாய பொருத்த மதிப்பீடு" : "FIELD SUITABILITY ASSESSMENT"}
                  </h4>
                </div>
                <span className="text-[11px] text-gray-500">
                  {isTa ? "பயிர்:" : "Target Crop:"} <strong className="text-gray-900">{fieldProfile.crop_type || "Brinjal"}</strong>
                </span>
              </div>

              {/* Overall Decision Banner */}
              {statusBadgeInfo && (
                <div className={`p-4 rounded-xl border ${statusBadgeInfo.containerClass} space-y-1.5 transition-all shadow-2xs`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      {statusBadgeInfo.icon}
                      <div>
                        <div className="text-sm font-extrabold tracking-tight">
                          {statusBadgeInfo.label}
                        </div>
                        <div className="text-[11px] opacity-80">
                          {statusBadgeInfo.sublabel}
                        </div>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase ${statusBadgeInfo.badgeClass}`}>
                      {activeAssessment.status_level === 'good' ? (isTa ? 'உகந்தது' : 'Optimal') : activeAssessment.status_level === 'borderline' ? (isTa ? 'கவனம்' : 'Attention') : (isTa ? 'தடை' : 'Alert')}
                    </span>
                  </div>
                  <p className="text-xs pt-1 border-t border-black/5 leading-relaxed font-medium">
                    {isTa ? activeAssessment.message_ta : activeAssessment.message}
                  </p>
                </div>
              )}

              {/* Parameter Checks Breakdown */}
              {activeAssessment?.checks && activeAssessment.checks.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[11px] font-bold text-gray-700 uppercase tracking-wider flex items-center justify-between">
                    <span>{isTa ? "காரணி வாரியான ஆய்வுகள்" : "Parameter-by-Parameter Breakdown"}</span>
                    <span className="text-[10px] text-gray-400 font-normal">
                      {isTa ? "அனைத்து அளவுகளும் kg/ha & % அடிப்படையிலானது" : "Standard units: kg/ha & %"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {activeAssessment.checks.map((check, idx) => {
                      const isGood = check.status === 'good';
                      const isBorderline = check.status === 'borderline';
                      const isPoor = check.status === 'poor';

                      return (
                        <div
                          key={idx}
                          className={`p-2.5 rounded-xl border transition-all ${
                            isGood
                              ? 'bg-emerald-50/40 border-emerald-100 text-gray-800'
                              : isBorderline
                              ? 'bg-amber-50/60 border-amber-200 text-amber-950'
                              : 'bg-rose-50/60 border-rose-200 text-rose-950'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-gray-900 flex items-center gap-1.5">
                              {isGood && <span className="text-emerald-600 font-bold text-xs">✓</span>}
                              {isBorderline && <span className="text-amber-600 font-bold text-xs">⚠</span>}
                              {isPoor && <span className="text-rose-600 font-bold text-xs">✗</span>}
                              <span>{check.parameter}</span>
                            </span>
                            <div className="flex items-center space-x-1.5">
                              <span className="font-mono font-bold text-gray-900 text-[11px]">
                                {check.value}
                              </span>
                              <span
                                className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                                  isGood
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : isBorderline
                                    ? 'bg-amber-200 text-amber-900'
                                    : 'bg-rose-200 text-rose-900'
                                }`}
                              >
                                {isGood ? (isTa ? 'உகந்தது' : 'Good') : isBorderline ? (isTa ? 'கவனம்' : 'Borderline') : (isTa ? 'பொருத்தமற்றது' : 'Unsuitable')}
                              </span>
                            </div>
                          </div>
                          <p className="text-[11px] text-gray-600 leading-snug">
                            {isTa ? check.message_ta : check.message}
                          </p>
                          {check.recommended_range && (
                            <div className="text-[10px] text-gray-400 mt-1">
                              {isTa ? "பரிந்துரை:" : "Recommended:"} <span className="font-medium text-gray-600">{check.recommended_range}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* What Needs Improvement Section */}
              {activeAssessment?.improvements && activeAssessment.improvements.length > 0 && (
                <div className="p-3.5 rounded-xl bg-amber-50/50 border border-amber-200 space-y-2 text-xs">
                  <div className="font-bold text-amber-900 flex items-center space-x-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    <span>{isTa ? "கவனிக்க வேண்டிய குறைபாடுகள் & தீர்வுகள்" : "What Needs Improvement"}</span>
                  </div>
                  <ul className="space-y-1.5 text-[11px] text-gray-700">
                    {activeAssessment.improvements.map((imp, idx) => (
                      <li key={idx} className="flex items-start space-x-2">
                        <span className="text-amber-600 font-bold">•</span>
                        <div>
                          <strong className="text-gray-900">{imp.parameter}:</strong>{" "}
                          <span>{isTa ? imp.issue_ta : imp.issue}</span>
                          <div className="text-agri-700 font-medium mt-0.5">
                            ↳ {isTa ? imp.action_ta : imp.action}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Actionable Recommendations */}
              {activeAssessment?.recommendations && activeAssessment.recommendations.length > 0 && (
                <div className="p-3 bg-agri-50/60 rounded-xl border border-agri-200 space-y-1 text-xs">
                  <div className="font-bold text-agri-900 flex items-center space-x-1.5 text-[11px]">
                    <CheckCircle className="w-3.5 h-3.5 text-agri-600" />
                    <span>{isTa ? "விவசாய ஆலோசனை & பரிந்துரை" : "Agronomic Recommendation"}</span>
                  </div>
                  <ul className="space-y-1 text-[11px] text-gray-700">
                    {(isTa ? activeAssessment.recommendations_ta : activeAssessment.recommendations).map((rec, idx) => (
                      <li key={idx} className="leading-relaxed">
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Edit Field Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-gray-200 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/70">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-agri-600 text-white flex items-center justify-center">
                  <Sprout className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900">
                    {isTa ? "விவசாய நில விவரம் திருத்து & மதிப்பீடு" : "Edit Field Profile & Suitability"}
                  </h4>
                  <p className="text-[11px] text-gray-500">
                    {isTa ? "பயிர் பொருத்தத்தை சரிபார்த்து நில விவரங்களைச் சேமிக்கவும்" : "Evaluate agronomic crop suitability before saving"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsEditing(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form Content */}
            <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-4 text-xs">
              {validationError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{validationError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Crop Type */}
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    {isTa ? "பயிர் வகை (Crop Type)" : "Crop Type"}
                  </label>
                  <select
                    value={formData.crop_type}
                    onChange={(e) => setFormData({ ...formData, crop_type: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:bg-white focus:ring-2 focus:ring-agri-500 focus:outline-none"
                  >
                    <option value="Brinjal">Brinjal (கத்தரிக்காய்)</option>
                    <option value="Tomato">Tomato (தக்காளி)</option>
                    <option value="Potato">Potato (உருளைக்கிழங்கு)</option>
                    <option value="Chilli">Chilli (மிளகாய்)</option>
                    <option value="Paddy">Paddy (நெல்)</option>
                    <option value="Maize">Maize (மக்காச்சோளம்)</option>
                    <option value="Cotton">Cotton (பருத்தி)</option>
                    <option value="Other Vegetables">Other Vegetables (பிற காய்கறிகள்)</option>
                  </select>
                </div>

                {/* Soil Type */}
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    {isTa ? "மண் வகை (Soil Type)" : "Soil Type"}
                  </label>
                  <select
                    value={formData.soil_type}
                    onChange={(e) => setFormData({ ...formData, soil_type: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:bg-white focus:ring-2 focus:ring-agri-500 focus:outline-none"
                  >
                    <option value="Loamy">Loamy (வண்டல் மண்)</option>
                    <option value="Red Loamy">Red Loamy (செம்மண் வண்டல்)</option>
                    <option value="Clay">Clay (களிமண்)</option>
                    <option value="Sandy Loam">Sandy Loam (மணல் கலந்த செம்மண்)</option>
                    <option value="Black Cotton">Black Soil (கரிசல் மண்)</option>
                    <option value="Alluvial">Alluvial (வண்டல் மண்)</option>
                  </select>
                </div>

                {/* Soil pH */}
                <div>
                  <label className="block font-semibold text-gray-700 mb-1 flex justify-between">
                    <span>{isTa ? "மண் pH (Soil pH)" : "Soil pH"}</span>
                    <span className="font-bold text-agri-600">{formData.soil_ph}</span>
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="range"
                      min="4.0"
                      max="9.0"
                      step="0.1"
                      value={formData.soil_ph}
                      onChange={(e) => setFormData({ ...formData, soil_ph: parseFloat(e.target.value) })}
                      className="w-full accent-agri-600 cursor-pointer"
                    />
                    <input
                      type="number"
                      step="0.1"
                      min="3.0"
                      max="11.0"
                      value={formData.soil_ph}
                      onChange={(e) => setFormData({ ...formData, soil_ph: parseFloat(e.target.value) || 6.4 })}
                      className="w-16 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-center font-bold text-xs"
                    />
                  </div>
                </div>

                {/* Water Capacity */}
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    {isTa ? "நீர் கொள்ளளவு (Water Capacity %)" : "Water Capacity / Moisture (%)"}
                  </label>
                  <input
                    type="text"
                    value={formData.water_capacity}
                    onChange={(e) => setFormData({ ...formData, water_capacity: e.target.value })}
                    placeholder="e.g. 72%"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:bg-white focus:ring-2 focus:ring-agri-500 focus:outline-none"
                  />
                </div>

                {/* Field Size & Unit */}
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    {isTa ? "நில அளவு (Field Size)" : "Field Size"}
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={formData.field_size}
                      onChange={(e) => setFormData({ ...formData, field_size: parseFloat(e.target.value) || 1.0 })}
                      className="w-2/3 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:bg-white focus:ring-2 focus:ring-agri-500 focus:outline-none"
                    />
                    <select
                      value={formData.field_size_unit}
                      onChange={(e) => setFormData({ ...formData, field_size_unit: e.target.value })}
                      className="w-1/3 bg-gray-50 border border-gray-200 rounded-xl px-2 py-2 text-xs text-gray-900 focus:bg-white focus:ring-2 focus:ring-agri-500 focus:outline-none"
                    >
                      <option value="Acre">Acre</option>
                      <option value="Hectare">Hectare</option>
                    </select>
                  </div>
                </div>

                {/* Irrigation Method */}
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    {isTa ? "பாசன முறை (Irrigation Method)" : "Irrigation Method"}
                  </label>
                  <select
                    value={formData.irrigation_method}
                    onChange={(e) => setFormData({ ...formData, irrigation_method: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:bg-white focus:ring-2 focus:ring-agri-500 focus:outline-none"
                  >
                    <option value="Drip">Drip Irrigation (சொட்டுநீர்)</option>
                    <option value="Sprinkler">Sprinkler (தெளிப்பு நீர்)</option>
                    <option value="Flood">Flood / Furrow (வாய்க்கால்)</option>
                    <option value="Rain-fed">Rain-fed (மானாவாரி)</option>
                    <option value="Other">Other (பிற)</option>
                  </select>
                </div>

                {/* Location */}
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    {isTa ? "பண்ணை அமைவிடம் (Field Location)" : "Farm Location"}
                  </label>
                  <input
                    type="text"
                    value={formData.field_location}
                    onChange={(e) => setFormData({ ...formData, field_location: e.target.value })}
                    placeholder="e.g. Tamil Nadu, Dharmapuri"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:bg-white focus:ring-2 focus:ring-agri-500 focus:outline-none"
                  />
                </div>

                {/* Season */}
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    {isTa ? "பருவம் (Season)" : "Season"}
                  </label>
                  <select
                    value={formData.season}
                    onChange={(e) => setFormData({ ...formData, season: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:bg-white focus:ring-2 focus:ring-agri-500 focus:outline-none"
                  >
                    <option value="Kharif">Kharif (Monsoon / ஆடிப் பட்டம்)</option>
                    <option value="Rabi">Rabi (Winter / கார்த்திகைப் பட்டம்)</option>
                    <option value="Zaid / Summer">Zaid (Summer / கோடைப் பட்டம்)</option>
                  </select>
                </div>
              </div>

              {/* Sowing Date */}
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  {isTa ? "விதைத்த / நட்ட தேதி (Sowing Date)" : "Sowing Date"}
                </label>
                <input
                  type="date"
                  value={formData.sowing_date}
                  onChange={(e) => setFormData({ ...formData, sowing_date: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:bg-white focus:ring-2 focus:ring-agri-500 focus:outline-none"
                />
              </div>

              {/* N-P-K Rating with explicit kg/ha units */}
              <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-emerald-900">
                    {isTa ? "மண் ஊட்டச்சத்து N-P-K அளவீடுகள்" : "Soil Nutrient N-P-K Rating"}
                  </label>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                    {isTa ? "அலகு: kg/ha" : "Unit: kg/ha"}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <span className="text-[10px] font-semibold text-emerald-800 block">
                      Nitrogen (N) <span className="text-[9px] font-normal">[kg/ha]</span>
                    </span>
                    <input
                      type="number"
                      min="0"
                      value={formData.npk_nitrogen}
                      onChange={(e) => setFormData({ ...formData, npk_nitrogen: parseInt(e.target.value) || 0 })}
                      className="w-full bg-white border border-emerald-300 rounded-lg px-2.5 py-1.5 text-xs text-emerald-950 font-bold"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-emerald-800 block">
                      Phosphorus (P) <span className="text-[9px] font-normal">[kg/ha]</span>
                    </span>
                    <input
                      type="number"
                      min="0"
                      value={formData.npk_phosphorus}
                      onChange={(e) => setFormData({ ...formData, npk_phosphorus: parseInt(e.target.value) || 0 })}
                      className="w-full bg-white border border-emerald-300 rounded-lg px-2.5 py-1.5 text-xs text-emerald-950 font-bold"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-emerald-800 block">
                      Potassium (K) <span className="text-[9px] font-normal">[kg/ha]</span>
                    </span>
                    <input
                      type="number"
                      min="0"
                      value={formData.npk_potassium}
                      onChange={(e) => setFormData({ ...formData, npk_potassium: parseInt(e.target.value) || 0 })}
                      className="w-full bg-white border border-emerald-300 rounded-lg px-2.5 py-1.5 text-xs text-emerald-950 font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Live Preview Assessment in Modal (if evaluated) */}
              {previewAssessment && (
                <div className={`p-3 rounded-xl border text-xs space-y-2 ${
                  previewAssessment.status_level === 'good'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : previewAssessment.status_level === 'borderline'
                    ? 'bg-amber-50 border-amber-200 text-amber-900'
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}>
                  <div className="flex items-center justify-between font-bold">
                    <span>{isTa ? "பொருத்த முன்னோட்டம்:" : "Live Suitability Preview:"}</span>
                    <span className="uppercase tracking-wider font-extrabold">
                      {isTa ? previewAssessment.overall_status_ta : previewAssessment.overall_status}
                    </span>
                  </div>
                  <p className="text-[11px] leading-snug">
                    {isTa ? previewAssessment.message_ta : previewAssessment.message}
                  </p>
                </div>
              )}

              {/* Modal Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleCheckSuitability}
                  disabled={evaluating}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-agri-800 bg-agri-50 hover:bg-agri-100 border border-agri-200 transition-colors cursor-pointer flex items-center space-x-1.5 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${evaluating ? 'animate-spin' : ''}`} />
                  <span>{isTa ? "பொருத்தம் சோதிக்க" : "Check Suitability"}</span>
                </button>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    {isTa ? "ரத்து" : "Cancel"}
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 rounded-xl bg-agri-600 hover:bg-agri-700 text-white text-xs font-bold transition-colors shadow-xs flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {saving ? (
                      <span>{isTa ? "சேமிக்கிறது..." : "Saving..."}</span>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>{isTa ? "நில விவரம் சேமிக்க" : "Save Field Profile"}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
