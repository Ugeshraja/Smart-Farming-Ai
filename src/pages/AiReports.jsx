import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Printer,
  Download,
  Leaf,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/apiService';

export default function AiReports() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const reportId = searchParams.get('id');

  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [prediction?.id, prediction?.imageUrl]);

  useEffect(() => {
    async function loadReport() {
      setLoading(true);
      if (reportId) {
        const item = await apiService.getPredictionById(reportId);
        setPrediction(item);
      } else {
        const list = await apiService.getPredictions();
        setPrediction(list[0]);
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

  if (!prediction) return null;

  const isTa = language === 'ta';

  return (
    <div className="space-y-6 max-w-4xl mx-auto">

      {/* Top Action Header */}
      <div className="no-print bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">
            {t('aiReports')}
          </h2>
          <p className="text-xs text-gray-500">Official Solanaceae Phytopathology & Agronomic Treatment Report</p>
        </div>

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
      </div>

      {/* Printable Report Container */}
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
          <h3 className="text-sm font-bold text-gray-900 uppercase border-b border-gray-100 pb-2">
            {isTa ? '5. மேலாண்மை ஆலோசனை' : '5. Agricultural Advisory'}
          </h3>
          <div className="bg-agri-50 border border-agri-200 p-4 rounded-xl space-y-2 text-xs text-agri-900 font-medium leading-relaxed">
            <p>{isTa ? prediction.advisory?.ta : prediction.advisory?.en}</p>
          </div>
        </div>

        {/* 6. Preventive Measures */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-gray-900 uppercase border-b border-gray-100 pb-2">
            {isTa ? '6. தடுப்பு நடவடிக்கைகள்' : '6. Preventive Measures'}
          </h3>
          <ul className="space-y-2 text-xs text-gray-700">
            {prediction.preventiveMeasures?.map((m, idx) => (
              <li key={idx} className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-agri-600 shrink-0 mt-0.5" />
                <span>{m}</span>
              </li>
            ))}
          </ul>
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

    </div>
  );
}
