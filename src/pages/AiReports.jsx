import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Printer,
  Download,
  Leaf,
  CheckCircle2,
  RefreshCw,
  FileBarChart,
  ScanSearch,
  Sparkles,
  Volume2,
  VolumeX,
  AlertCircle
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/apiService';
import { speechService, stopSpeaking } from '../services/speechService';

/**
 * Safely extracts the preventive measures section from structured agricultural advisory or RAG text.
 * Prevents duplicating the entire advisory or capturing incidental uses of the word 'prevention'.
 */
function extractPreventionFromText(text) {
  if (!text || typeof text !== 'string') return null;

  // Regex looking for Prevention section heading (case-insensitive, multiline, supporting markdown headers/bolding)
  // Must start at beginning of line and end with colon or end of line (e.g. "Prevention:", "### 6. Preventive Measures")
  const headingRegex = /(?:^|\n)\s*(?:#{1,6}\s*|\*{1,3})?(?:\d+[\.\)]\s*)?(?:preventive\s+measures?|prevention(?:\s+measures?|\s+practices?)?|preventative\s+measures?|தடுப்பு\s+நடவடிக்கைகள்|தடுப்பு\s+முறைகள்|தடுப்பு\s+வழிமுறைகள்|வருமுன்\s+காக்கும்\s+மேலாண்மை)(?:\s*\([^)]*\))?\s*(?:\*{1,3})?\s*(?::|$)/im;

  const match = text.match(headingRegex);
  if (!match) return null;

  const startIndex = match.index + match[0].length;
  const remaining = text.slice(startIndex);

  // Look for next section heading that starts on a new line
  const nextHeadingRegex = /\n\s*(?:#{1,6}\s*|\*{1,3})?(?:\d+[\.\)]\s*)?(?:monitoring|important\s+note|recommended\s+actions?|symptoms?|favorable\s+conditions?|management|farmer\s+action|chemical\s+control|biological\s+control|cultural\s+practices|கண்காணிப்பு|முக்கிய\s+குறிப்பு|குறிப்பு|மேலாண்மை|பரிந்துரைகள்)(?:\s*\([^)]*\))?\s*(?:\*{1,3})?\s*(?::|$)/im;

  const nextMatch = remaining.match(nextHeadingRegex);
  const preventionBlock = nextMatch ? remaining.slice(0, nextMatch.index) : remaining;

  return preventionBlock.trim() || null;
}

/**
 * Normalizes string, array of strings, or array of objects into clean readable bullet points.
 */
function normalizeToBullets(raw, isTa = false) {
  if (!raw) return [];

  // If array of strings or objects
  if (Array.isArray(raw)) {
    return raw
      .map(item => {
        if (typeof item === 'string') return item.trim();
        if (item && typeof item === 'object') {
          if (isTa && item.ta) return item.ta.trim();
          if (item.en) return item.en.trim();
          if (item.text) return item.text.trim();
          if (item.action) return item.action.trim();
          if (item.description) return item.description.trim();
          const firstVal = Object.values(item).find(v => typeof v === 'string');
          return firstVal ? firstVal.trim() : '';
        }
        return String(item).trim();
      })
      .map(s => s.replace(/^[\s*•\-\u2022\u25E6\u2043\u2219]+/, '').replace(/^\d+[\.\)]\s*/, '').trim())
      .filter(s => s.length > 0);
  }

  // If object with language keys e.g. { en: [...], ta: [...] } or { en: "...", ta: "..." }
  if (typeof raw === 'object' && raw !== null) {
    if (isTa && raw.ta) return normalizeToBullets(raw.ta, true);
    if (raw.en) return normalizeToBullets(raw.en, false);
    if (raw.text) return normalizeToBullets(raw.text, isTa);
    const values = Object.values(raw).filter(v => typeof v === 'string' || Array.isArray(v));
    if (values.length > 0) return normalizeToBullets(values[0], isTa);
    return [];
  }

  if (typeof raw !== 'string') return [];

  const trimmed = raw.trim();
  if (!trimmed) return [];

  // Check if string has newlines or bullet markers
  const lines = trimmed
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0);

  const bullets = [];
  for (const line of lines) {
    // Strip leading bullet markers: "-", "*", "•", "1.", "1)", etc.
    const cleaned = line.replace(/^[\s*•\-\u2022\u25E6\u2043\u2219]+/, '').replace(/^\d+[\.\)]\s*/, '').trim();
    if (cleaned.length > 0) {
      bullets.push(cleaned);
    }
  }

  // If there was only 1 line without bullet markers, but multiple sentences:
  if (bullets.length === 1 && (bullets[0].includes('. ') || bullets[0].includes('. \n'))) {
    const sentences = bullets[0]
      .split(/(?<=\.)\s+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
    if (sentences.length > 1) {
      return sentences;
    }
  }

  return bullets;
}

/**
 * Safely inspects the report object and retrieves existing preventive measures.
 * Checks all possible structured fields, raw backend responses, and embedded advisory/RAG sections.
 */
function getPreventiveMeasures(report, isTa = false) {
  if (!report || typeof report !== 'object') return [];

  // 1. If Tamil requested, check direct Tamil fields first
  if (isTa) {
    const tamilCandidates = [
      report.preventiveMeasures_ta,
      report.preventive_measures_ta,
      report.preventiveMeasures?.ta,
      report.preventive_measures?.ta,
      report.rawBackend?.preventive_measures_ta,
      report.rawBackend?.preventiveMeasures_ta,
      report.rawBackend?.preventive_measures?.ta,
      report.rawBackend?.advisory?.preventive_measures_ta
    ];
    for (const cand of tamilCandidates) {
      if (cand !== null && cand !== undefined) {
        const normalized = normalizeToBullets(cand, true);
        if (normalized.length > 0) return normalized;
      }
    }

    // Try extracting Tamil from advisory text
    const tamilTexts = [
      report.advisory?.ta,
      report.rawBackend?.advisory?.ta
    ];
    for (const text of tamilTexts) {
      if (text && typeof text === 'string') {
        const extracted = extractPreventionFromText(text);
        if (extracted) {
          const normalized = normalizeToBullets(extracted, true);
          if (normalized.length > 0) return normalized;
        }
      }
    }
  }

  // 2. Direct structured fields on report
  const directCandidates = [
    report.preventiveMeasures,
    report.preventive_measures,
    report.prevention,
    report.prevention_measures,
    report.recommendations,
    report.advisory?.preventive_measures,
    report.advisory?.preventiveMeasures,
    report.advisory?.prevention,
    report.rag?.preventive_measures,
    report.rag?.prevention,
    // rawBackend candidates
    report.rawBackend?.preventiveMeasures,
    report.rawBackend?.preventive_measures,
    report.rawBackend?.prevention,
    report.rawBackend?.prevention_measures,
    report.rawBackend?.recommendations,
    report.rawBackend?.advisory?.preventive_measures,
    report.rawBackend?.rag?.preventive_measures
  ];

  for (const cand of directCandidates) {
    if (cand !== null && cand !== undefined) {
      const normalized = normalizeToBullets(cand, isTa);
      if (normalized.length > 0) return normalized;
    }
  }

  // 3. Extract from structured advisory text (Gemini or RAG)
  const advisoryTexts = [
    report.advisory?.en,
    report.advisory?.text,
    typeof report.advisory === 'string' ? report.advisory : null,
    report.rawBackend?.advisory?.text,
    report.rag?.context,
    report.rawBackend?.rag?.context
  ];

  for (const text of advisoryTexts) {
    if (text && typeof text === 'string') {
      const extracted = extractPreventionFromText(text);
      if (extracted) {
        const normalized = normalizeToBullets(extracted, isTa);
        if (normalized.length > 0) return normalized;
      }
    }
  }

  return [];
}

export default function AiReports() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const reportId = searchParams.get('id');

  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [speakingStatus, setSpeakingStatus] = useState('idle');

  const isTa = language === 'ta';

  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, []);

  useEffect(() => {
    stopSpeaking();
    setSpeakingStatus('idle');
  }, [language]);

  const handleToggleSpeak = () => {
    if (speakingStatus === 'playing' || speakingStatus === 'loading') {
      speechService.stop();
      setSpeakingStatus('idle');
      return;
    }

    const advisoryText = isTa ? prediction?.advisory?.ta : prediction?.advisory?.en;
    if (!advisoryText || typeof advisoryText !== 'string' || !advisoryText.trim()) return;

    speechService.stop();
    setSpeakingStatus('loading');

    speechService.speak(advisoryText, isTa ? 'ta' : 'en', {
      onStart: () => setSpeakingStatus('playing'),
      onEnd: () => setSpeakingStatus('idle'),
      onError: () => {
        setSpeakingStatus('error');
        setTimeout(() => setSpeakingStatus('idle'), 3000);
      }
    });
  };

  useEffect(() => {
    setImageError(false);
  }, [prediction?.id, prediction?.imageUrl]);

  useEffect(() => {
    async function loadReport() {
      setLoading(true);

      // 1. Read the same prediction history source: localStorage key "smartfarm_predictions"
      const stored = localStorage.getItem('smartfarm_predictions');

      // 2. If localStorage key exists:
      if (stored !== null) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            // If key exists and contains [] -> treat as having zero reports (do NOT restore mock data)
            if (parsed.length === 0) {
              setPrediction(null);
              setLoading(false);
              return;
            }
            // If records exist and reportId requested
            if (reportId) {
              const match = parsed.find(p => p.id === reportId);
              setPrediction(match || null);
            } else {
              setPrediction(parsed[0] || null);
            }
            setLoading(false);
            return;
          }
        } catch (e) {
          console.warn("Error reading stored predictions:", e);
        }
      }

      // 3. If localStorage key does not exist: preserve application's existing behavior
      if (reportId) {
        const item = await apiService.getPredictionById(reportId);
        setPrediction(item || null);
      } else {
        const list = await apiService.getPredictions();
        setPrediction(list && list.length > 0 ? list[0] : null);
      }
      setLoading(false);
    }
    loadReport();
  }, [reportId]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    alert("Downloading official PDF diagnostic report (SmartFarm_AI_Report.pdf)...");
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <RefreshCw className="w-8 h-8 text-agri-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">

      {/* Top Action Header */}
      <div className="no-print bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">
            {isTa ? 'AI அறிக்கைகள்' : t('aiReports')}
          </h2>
          <p className="text-xs text-gray-500">
            {isTa
              ? 'பயிர் நோய்க்கான அதிகாரப்பூர்வ தாவர நோய் மற்றும் வேளாண் சிகிச்சை அறிக்கை'
              : 'Official Solanaceae Phytopathology & Agronomic Treatment Report'}
          </p>
        </div>

        {prediction && (
          <div className="flex items-center space-x-3">
            <button
              onClick={handleDownloadPdf}
              className="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-bold transition-colors flex items-center space-x-2 shadow-2xs"
            >
              <Download className="w-4 h-4 text-agri-600" />
              <span>{t('downloadPdf')}</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-agri-600 hover:bg-agri-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center space-x-2"
            >
              <Printer className="w-4 h-4" />
              <span>{t('printReport')}</span>
            </button>
          </div>
        )}
      </div>

      {!prediction ? (
        /* Empty State Card when Zero Prediction Records Exist */
        <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-8 sm:p-12 text-center space-y-8">
          {/* Centered Icon & Heading */}
          <div className="max-w-md mx-auto space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-agri-50 border border-agri-200 flex items-center justify-center text-agri-600 mx-auto shadow-2xs">
              <FileBarChart className="w-8 h-8" />
            </div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
              {isTa ? 'AI அறிக்கைகள் எதுவும் இல்லை' : 'No AI reports available yet'}
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              {isTa
                ? 'சேமிக்கப்பட்ட பயிர் நோய் கணிப்புகளிலிருந்து AI அறிக்கைகள் உருவாக்கப்படுகின்றன. விரிவான AI அறிக்கையை உருவாக்க ஒரு பயிரை ஆய்வு செய்யவும்.'
                : 'AI reports are generated from your saved crop disease predictions. Analyze a crop to generate a detailed AI-powered report.'}
            </p>
          </div>

          {/* Primary Action Button */}
          <div className="space-y-2">
            <button
              onClick={() => navigate('/crop-disease')}
              className="inline-flex items-center space-x-2 px-6 py-3 bg-agri-600 hover:bg-agri-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-all hover:scale-102 cursor-pointer"
            >
              <ScanSearch className="w-4 h-4" />
              <span>{isTa ? 'புதிய பயிரை ஆய்வு செய்யவும்' : 'Analyze New Crop'}</span>
            </button>
            <p className="text-[11px] text-gray-400 font-medium">
              {isTa
                ? 'ஆய்வுக்குப் பிறகு உங்கள் அறிக்கைகள் இங்கே தோன்றும்.'
                : 'Your reports will appear here after analysis.'}
            </p>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-100 max-w-lg mx-auto" />

          {/* Secondary Information Section */}
          <div className="max-w-lg mx-auto text-left space-y-4 bg-gray-50/70 border border-gray-200 rounded-2xl p-6">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-agri-600" />
              <h4 className="text-xs sm:text-sm font-extrabold text-gray-900 uppercase tracking-wide">
                {isTa ? 'உங்கள் AI அறிக்கையில் உள்ளவை' : 'What your AI Report will contain'}
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-gray-700 font-medium">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-agri-600 shrink-0" />
                <span>{isTa ? 'நோய் அடையாளம்' : 'Disease identification'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-agri-600 shrink-0" />
                <span>{isTa ? 'நம்பிக்கை மதிப்பெண்' : 'Confidence score'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-agri-600 shrink-0" />
                <span>{isTa ? 'இலை ஆய்வு மற்றும் விளக்கம்' : 'Leaf analysis & explanation'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-agri-600 shrink-0" />
                <span>{isTa ? 'LIME விளக்கத்திறன்' : 'LIME explainability'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-agri-600 shrink-0" />
                <span>{isTa ? 'RAG அடிப்படையிலான விவசாய வழிகாட்டுதல்' : 'RAG-based agricultural guidance'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-agri-600 shrink-0" />
                <span>{isTa ? 'Gemini விவசாயி ஆலோசனை' : 'Gemini farmer advisory'}</span>
              </div>
              <div className="flex items-center space-x-2 sm:col-span-2">
                <CheckCircle2 className="w-4 h-4 text-agri-600 shrink-0" />
                <span>{isTa ? 'பரிந்துரைக்கப்பட்ட மேலாண்மை நடைமுறைகள்' : 'Recommended management practices'}</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Printable Report Container */
        <div id="printable-report" className="bg-white rounded-2xl border border-gray-200 shadow-md p-8 space-y-8 text-gray-800">

        {/* Document Header */}
        <div className="flex items-start justify-between border-b-2 border-agri-600 pb-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-agri-600 text-white flex items-center justify-center shadow-xs">
              <Leaf className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">
                SmartFarm <span className="text-agri-600">AI</span> Diagnostics
              </h1>
              <p className="text-xs text-gray-500 font-medium">
                {isTa ? 'ஸ்மார்ட் விவசாய தளம் - பயிர் பாதுகாப்பு அறிக்கை' : 'Unified Smart Farming Platform - Solanaceae Crop Division'}
              </p>
            </div>
          </div>

          <div className="text-right space-y-1 text-xs">
            <div className="bg-agri-50 text-agri-800 font-mono px-3 py-1 rounded-lg border border-agri-200 font-bold inline-block">
              {prediction.id}
            </div>
            <p className="text-gray-400">{prediction.createdAt}</p>
          </div>
        </div>

        {/* 1. Farmer Info */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200 text-xs">
          <div>
            <span className="text-gray-400 font-semibold uppercase text-[10px] block">
              {isTa ? 'விவசாயி பெயர்' : 'Farmer Name'}
            </span>
            <strong className="text-gray-900 font-bold text-sm">{user?.name || "UGESHRAJA S"}</strong>
          </div>
          <div>
            <span className="text-gray-400 font-semibold uppercase text-[10px] block">
              {isTa ? 'மின்னஞ்சல்' : 'Email'}
            </span>
            <strong className="text-gray-800">{user?.email || "ugeshraja@example.com"}</strong>
          </div>
          <div>
            <span className="text-gray-400 font-semibold uppercase text-[10px] block">
              {isTa ? 'பயிர்' : 'Crop'}
            </span>
            <strong className="text-agri-700 font-bold text-sm">{prediction.crop}</strong>
          </div>
          <div>
            <span className="text-gray-400 font-semibold uppercase text-[10px] block">
              {isTa ? 'நாள்' : 'Date'}
            </span>
            <strong className="text-gray-800 font-mono text-[11px]">{prediction.createdAt}</strong>
          </div>
        </div>

        {/* 2. Disease Pathology & Confidence */}
        <div className="border border-gray-200 rounded-xl p-5 bg-gradient-to-r from-agri-50/50 to-emerald-50/30 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-xs font-bold text-agri-700 uppercase tracking-wider">
                {isTa ? 'கண்டறியப்பட்ட நோய்' : 'Disease Pathology Finding'}
              </span>
              <h3 className="text-2xl font-black text-gray-900">{prediction.disease}</h3>
            </div>
            <div className="text-left sm:text-right">
              <span className="text-xs text-gray-500 block">{isTa ? 'நம்பகத்தன்மை' : 'Confidence Score'}</span>
              <span className="text-2xl font-black text-agri-700">{prediction.confidence}%</span>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
            <div className="bg-agri-600 h-2.5 rounded-full" style={{ width: `${prediction.confidence}%` }}></div>
          </div>
        </div>

        {/* 3. AI Explanation */}
        {/* 3. AI Explanation (LIME) */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-gray-900 uppercase border-b border-gray-100 pb-2">
            {isTa ? '3. AI காட்சி விளக்கம்' : '3. AI Visual Explanation'}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-gray-200 rounded-xl p-3 text-center space-y-2">
              <span className="text-xs font-semibold text-gray-600 block">
                {isTa ? 'அசல் இலை படம்' : 'Original Field Leaf Sample'}
              </span>
              <div className="h-56 flex items-center justify-center bg-gray-50 rounded-lg overflow-hidden border border-gray-100">
                {(!prediction.imageUrl || imageError || prediction.imageUrl.includes('localhost') || prediction.imageUrl.includes('127.0.0.1')) ? (
                  <div className="h-full w-full flex flex-col items-center justify-center bg-gray-50 text-gray-400 p-4 text-center space-y-2">
                    <div className="w-12 h-12 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400">
                      <Leaf className="w-6 h-6 text-gray-400" />
                    </div>
                    <span className="text-xs font-semibold text-gray-600">
                      {isTa ? 'அசல் இலை படம் கிடைக்கவில்லை' : 'Image unavailable'}
                    </span>
                    <span className="text-[10px] text-gray-400 max-w-xs">
                      {isTa ? 'பழைய பதிவுகளில் படம் சேமிக்கப்படவில்லை அல்லது கிடைக்கவில்லை' : 'Original leaf sample not stored for this historical record'}
                    </span>
                  </div>
                ) : (
                  <img
                    src={prediction.imageUrl}
                    alt="Original Leaf"
                    className="h-full object-contain"
                    onError={() => setImageError(true)}
                  />
                )}
              </div>
            </div>

            {/* LIME Text Explanation */}
            <div className="border border-gray-200 rounded-xl p-4 bg-gray-50/70 space-y-3 text-left">
              <div>
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                  {isTa ? 'கணிப்பு' : 'Prediction'}
                </span>
                <strong className="text-sm text-gray-900">{prediction.crop} — {prediction.disease}</strong>
              </div>

              {prediction.limeExplanation && (
                <div className="space-y-2 text-xs text-gray-700">
                  <div>
                    <span className="font-bold text-gray-800 block">
                      {isTa ? 'மாதிரி இதை ஏன் கணித்தது:' : 'Why the model predicted this:'}
                    </span>
                    <p className="mt-0.5 text-gray-600 leading-relaxed">
                      {isTa
                        ? (prediction.limeExplanation.summary_ta || "AI மாதிரி பதிவேற்றப்பட்ட இலையின் பாதிக்கப்பட்ட பகுதிகளில் முக்கியமாக கவனம் செலுத்தியது.")
                        : (prediction.limeExplanation.summary || "The AI model focused mainly on the affected regions of the uploaded leaf.")}
                    </p>
                  </div>

                  <div>
                    <span className="font-bold text-gray-800 block">
                      {isTa ? 'முக்கிய பங்களிப்பு பகுதிகள்:' : 'Important contributing regions:'}
                    </span>
                    <ul className="list-disc list-inside space-y-0.5 text-gray-600 pt-0.5">
                      {(prediction.limeExplanation.positive_regions || []).map((r, i) => (
                        <li key={i}>
                          {isTa ? `பகுதி ${r.id} — ${r.strength_ta || 'நேர்மறை பங்களிப்பு'} (${r.region_ta || r.region}: +${r.weight})` : `Region ${r.id} — ${r.strength || 'Positive contribution'} (${r.region}: +${r.weight})`}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <span className="font-bold text-gray-800 block">
                      {isTa ? 'மாதிரி விளக்கம்:' : 'Model interpretation:'}
                    </span>
                    <p className="mt-0.5 text-gray-600 leading-relaxed">
                      {isTa ? (prediction.limeExplanation.model_interpretation_ta || prediction.limeExplanation.model_interpretation) : prediction.limeExplanation.model_interpretation}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 4. Environmental Conditions */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-gray-900 uppercase border-b border-gray-100 pb-2">
            {isTa ? '4. சுற்றுச்சூழல் நிலை (கள சென்சார் அளவீடு)' : '4. Environmental Conditions (Field Sensor Snapshot)'}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-center">
              <span className="text-gray-400 block">{isTa ? 'மண் ஈரப்பதம்' : 'Soil Moisture'}</span>
              <strong className="text-sm text-gray-800">{prediction.iotSnapshot?.soilMoisture || '62%'}</strong>
            </div>
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-center">
              <span className="text-gray-400 block">{isTa ? 'வெப்பநிலை' : 'Temperature'}</span>
              <strong className="text-sm text-gray-800">{prediction.iotSnapshot?.temperature || '29.5°C'}</strong>
            </div>
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-center">
              <span className="text-gray-400 block">{isTa ? 'ஈரப்பதம்' : 'Humidity'}</span>
              <strong className="text-sm text-gray-800">{prediction.iotSnapshot?.humidity || '76%'}</strong>
            </div>
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-center">
              <span className="text-gray-400 block">{isTa ? 'மழை நிலை' : 'Rain Status'}</span>
              <strong className="text-sm text-gray-800">{prediction.iotSnapshot?.rainStatus || 'No Rain'}</strong>
            </div>
          </div>
        </div>

        {/* 5. Agricultural Advisory */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <h3 className="text-sm font-bold text-gray-900 uppercase">
              {isTa ? '5. மேலாண்மை ஆலோசனை' : '5. Agricultural Advisory'}
            </h3>
            {(prediction.advisory?.en || prediction.advisory?.ta) && (
              <button
                type="button"
                onClick={handleToggleSpeak}
                className={`no-print inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                  speakingStatus === 'playing'
                    ? 'bg-red-100 text-red-700 hover:bg-red-200 border border-red-200'
                    : speakingStatus === 'loading'
                    ? 'bg-amber-50 text-amber-800 border border-amber-200'
                    : speakingStatus === 'error'
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : 'bg-white hover:bg-agri-50 text-agri-800 border border-agri-200'
                }`}
                title={speakingStatus === 'playing' ? (isTa ? 'நிறுத்து' : 'Stop') : (isTa ? 'பதிலை கேள் (ஆடியோ)' : 'Listen')}
              >
                {speakingStatus === 'loading' ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                    <span>{isTa ? 'ஆடியோ உருவாக்கப்படுகிறது...' : 'Generating audio...'}</span>
                  </>
                ) : speakingStatus === 'playing' ? (
                  <>
                    <VolumeX className="w-3.5 h-3.5 text-red-600" />
                    <span>{isTa ? 'நிறுத்து' : 'Stop'}</span>
                  </>
                ) : speakingStatus === 'error' ? (
                  <>
                    <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                    <span>{isTa ? 'ஆடியோவை இயக்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்.' : 'Unable to play audio. Please try again.'}</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-agri-600" />
                    <span>{isTa ? 'கேள்' : 'Listen'}</span>
                  </>
                )}
              </button>
            )}
          </div>
          <div className="bg-agri-50 border border-agri-200 p-4 rounded-xl space-y-2 text-xs text-agri-900 font-medium leading-relaxed">
            <p>{isTa ? (prediction.advisory?.ta || prediction.advisory?.text || prediction.advisory?.en) : (prediction.advisory?.en || prediction.advisory?.text || prediction.advisory?.ta)}</p>
          </div>
        </div>

        {/* 6. Preventive Measures */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-gray-900 uppercase border-b border-gray-100 pb-2">
            {isTa ? '6. தடுப்பு நடவடிக்கைகள்' : '6. Preventive Measures'}
          </h3>
          {(() => {
            const preventiveList = getPreventiveMeasures(prediction, isTa);
            if (preventiveList && preventiveList.length > 0) {
              return (
                <ul className="space-y-2 text-xs text-gray-700">
                  {preventiveList.map((m, idx) => (
                    <li key={idx} className="flex items-start space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-agri-600 shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{m}</span>
                    </li>
                  ))}
                </ul>
              );
            }
            return (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-3.5 flex items-center space-x-2.5 text-xs text-gray-500">
                <AlertCircle className="w-4 h-4 text-gray-400 shrink-0" />
                <span>
                  {isTa
                    ? 'இந்த அறிக்கைக்கு தடுப்பு நடவடிக்கைகள் கிடைக்கவில்லை.'
                    : (t('preventiveMeasuresNotAvailable') || 'Preventive measures are not available for this report.')}
                </span>
              </div>
            );
          })()}
        </div>

        {/* Footer Signature */}
        <div className="pt-8 border-t border-gray-200 flex items-center justify-between text-xs text-gray-400">
          <div>
            <p className="font-semibold text-gray-600">SmartFarm AI Agricultural Platform</p>
            <p>Final-Year ECE Project System</p>
          </div>
          <div className="text-right">
            <div className="w-32 border-b border-gray-400 mb-1"></div>
            <p className="font-mono text-[10px]">Verified Digital Signature</p>
          </div>
        </div>

      </div>
      )}

    </div>
  );
}
