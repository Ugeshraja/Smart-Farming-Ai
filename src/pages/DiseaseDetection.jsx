import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload,
  Camera,
  Sparkles,
  CheckCircle2,
  FileText,
  Save,
  MessageSquare,
  RefreshCw,
  Layers,
  AlertTriangle,
  HelpCircle,
  WifiOff,
  Leaf
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { apiService, resolveBackendMediaUrl, isValidImageUrl } from '../services/apiService';

export default function DiseaseDetection() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const [selectedCrop, setSelectedCrop] = useState('Tomato');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);
  const [prediction, setPrediction] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  const [origImageError, setOrigImageError] = useState(false);
  const [segImageError, setSegImageError] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewImage(reader.result);
        setPrediction(null);
        setOrigImageError(false);
        setSegImageError(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const runAiPipeline = async () => {
    if (!previewImage) return;

    setIsProcessing(true);
    setPrediction(null);
    setOrigImageError(false);
    setSegImageError(false);
    setProcessingStep(1); // Detecting leaf...

    const formData = new FormData();
    formData.append('crop', selectedCrop);
    formData.append('explain', 'true');
    formData.append('advisory', 'true');
    formData.append('imagePreviewUrl', previewImage);

    if (selectedFile) {
      formData.append('image', selectedFile);
    } else if (previewImage) {
      try {
        const fetchRes = await fetch(previewImage);
        const blob = await fetchRes.blob();
        formData.append('image', blob, 'leaf.jpg');
      } catch (err) {
        console.error("Could not convert preview to blob:", err);
      }
    }

    const stepInterval = setInterval(() => {
      setProcessingStep(prev => (prev < 4 ? prev + 1 : prev));
    }, 1500);

    try {
      const result = await apiService.predictDisease(formData);
      clearInterval(stepInterval);
      setProcessingStep(4);
      setPrediction(result);
    } catch (err) {
      clearInterval(stepInterval);
      console.error("Disease prediction failed:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSave = () => {
    setToastMessage(language === 'ta' ? 'கணிப்பு சேமிக்கப்பட்டது!' : 'Prediction saved to history successfully!');
    setTimeout(() => setToastMessage(''), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-agri-700 text-white px-4 py-2.5 rounded-xl shadow-lg text-sm font-medium z-50 animate-bounce flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-agri-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Title Header */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-2">
        <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
          {t('detectionTitle')}
        </h2>
        <p className="text-xs sm:text-sm text-gray-600">
          {t('detectionSubtitle')}
        </p>
      </div>

      {/* Crop Selector Chips */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs space-y-2">
        <span className="text-xs font-semibold text-gray-500 block">
          {language === 'ta' ? 'பயிரைத் தேர்ந்தெடுக்கவும்:' : 'Select Crop Category:'}
        </span>
        <div className="flex flex-wrap gap-2">
          {['Tomato', 'Potato', 'Brinjal'].map(crop => (
            <button
              key={crop}
              onClick={() => setSelectedCrop(crop)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${selectedCrop === crop
                ? 'bg-agri-600 text-white shadow-xs scale-102'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              {crop === 'Tomato' ? '🍅 Tomato (தக்காளி)'
                : crop === 'Potato' ? '🥔 Potato (உருளை)'
                  : '🍆 Brinjal (கத்தரி)'}
            </button>
          ))}
        </div>
      </div>

      {/* Drag and Drop Upload Area (Full Width, No sample leaf cards) */}
      <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-2xs flex flex-col items-center justify-center min-h-[320px] border-dashed border-2 border-agri-300 hover:border-agri-600 transition-colors relative">

        {previewImage ? (
          <div className="w-full space-y-4 text-center max-w-lg mx-auto">
            <div className="max-h-72 h-72 w-full flex items-center justify-center bg-gray-50 rounded-xl overflow-hidden border border-gray-200 p-2">
              <img src={previewImage} alt="Uploaded Leaf" className="h-full object-contain" />
            </div>
            <div className="flex items-center justify-center space-x-3">
              <label className="cursor-pointer px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-xs font-semibold text-gray-700 transition-colors">
                {language === 'ta' ? 'படத்தை மாற்றவும்' : 'Change Image'}
                <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              </label>
              <button
                onClick={runAiPipeline}
                disabled={isProcessing}
                className="px-6 py-2.5 bg-agri-600 hover:bg-agri-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center space-x-2 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isProcessing ? (language === 'ta' ? 'ஆய்வு செய்யப்படுகிறது...' : 'Processing AI...') : t('analyzeCrop')}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center space-y-3 p-4">
            <div className="w-16 h-16 rounded-full bg-agri-50 text-agri-600 flex items-center justify-center mx-auto border border-agri-200">
              <Upload className="w-8 h-8" />
            </div>
            <div>
              <p className="text-base font-bold text-gray-800">
                {language === 'ta' ? 'பயிரின் இலை படத்தை இங்கு இழுத்து போடவும்' : 'Drag & Drop your leaf image here'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {language === 'ta' ? 'அல்லது கணினியிலிருந்து படத்தைத் தேர்ந்தெடுக்கவும்' : 'or Browse Image from your device'}
              </p>
            </div>

            <div className="flex items-center justify-center space-x-3 pt-2">
              <label className="cursor-pointer px-5 py-2.5 bg-agri-600 hover:bg-agri-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors">
                {language === 'ta' ? 'படத்தைத் தேர்ந்தெடு' : 'Browse Image'}
                <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              </label>
              <label className="cursor-pointer px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold transition-colors flex items-center space-x-1.5">
                <Camera className="w-4 h-4" />
                <span>{language === 'ta' ? 'கேமரா' : 'Use Camera'}</span>
                <input type="file" accept="image/*" capture="environment" onChange={handleFileChange} className="hidden" />
              </label>
            </div>
          </div>
        )}

      </div>

      {/* Realistic AI Processing Stages Animation */}
      {isProcessing && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4 animate-fadeIn">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-agri-100 text-agri-600 flex items-center justify-center animate-spin">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-900">
                {language === 'ta' ? 'பயிர் இலை ஆய்வு செய்யப்படுகிறது...' : 'Analyzing crop leaf image...'}
              </h4>
              <p className="text-xs text-gray-500">Executing deep learning segmentation and explainability pipeline</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div className={`p-3 rounded-xl border ${processingStep >= 1 ? 'bg-agri-50 border-agri-500 font-bold text-agri-800' : 'bg-gray-50 text-gray-400'}`}>
              {language === 'ta' ? 'இலை கண்டறியப்படுகிறது...' : 'Detecting leaf...'}
            </div>
            <div className={`p-3 rounded-xl border ${processingStep >= 2 ? 'bg-agri-50 border-agri-500 font-bold text-agri-800' : 'bg-gray-50 text-gray-400'}`}>
              {selectedCrop === 'Brinjal'
                ? (language === 'ta' ? 'நேரடி ResNet-50 ஆய்வு...' : 'Direct ResNet-50 analysis...')
                : (language === 'ta' ? 'இலை பிரிக்கப்படுகிறது...' : 'Segmenting leaf...')}
            </div>
            <div className={`p-3 rounded-xl border ${processingStep >= 3 ? 'bg-agri-50 border-agri-500 font-bold text-agri-800' : 'bg-gray-50 text-gray-400'}`}>
              {language === 'ta' ? 'நோய் வகைப்படுத்தப்படுகிறது...' : 'Classifying disease...'}
            </div>
            <div className={`p-3 rounded-xl border ${processingStep >= 4 ? 'bg-agri-50 border-agri-500 font-bold text-agri-800' : 'bg-gray-50 text-gray-400'}`}>
              {language === 'ta' ? 'விளக்கம் உருவாக்கப்படுகிறது...' : 'Generating explanation...'}
            </div>
          </div>
        </div>
      )}

      {/* 1. Invalid Image Display */}
      {prediction && !isProcessing && prediction.status === 'invalid_image' && (
        <div className="bg-white p-8 rounded-2xl border-2 border-red-300 shadow-sm space-y-5 animate-fadeIn text-center">
          <div className="w-16 h-16 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto border border-red-200">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-xl font-extrabold text-red-700 tracking-wide uppercase">
              {language === 'ta' ? 'செல்லுபடியாகாத படம்' : 'INVALID IMAGE'}
            </h3>
            <p className="text-sm font-medium text-gray-700 max-w-md mx-auto">
              {prediction.message || (language === 'ta'
                ? 'நோய் பகுப்பாய்விற்கு தெளிவான உருளைக்கிழங்கு, தக்காளி அல்லது கத்தரிக்காய் இலை படத்தை பதிவேற்றவும்.'
                : 'Please upload a clear Potato, Tomato, or Brinjal leaf image for disease analysis.')}
            </p>
          </div>
          <div className="pt-2">
            <label className="cursor-pointer inline-flex items-center space-x-2 px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold transition-colors">
              <span>{language === 'ta' ? 'படத்தை மாற்றவும்' : 'Change Image'}</span>
              <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            </label>
          </div>
        </div>
      )}

      {/* 2. Uncertain Prediction Display */}
      {prediction && !isProcessing && prediction.status === 'uncertain_prediction' && (
        <div className="bg-white p-8 rounded-2xl border-2 border-amber-300 shadow-sm space-y-5 animate-fadeIn text-center">
          <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
            <HelpCircle className="w-8 h-8" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-xl font-extrabold text-amber-700 tracking-wide uppercase">
              {language === 'ta' ? 'நிலையற்ற கணிப்பு' : 'UNCERTAIN PREDICTION'}
            </h3>
            <p className="text-sm font-medium text-gray-700 max-w-md mx-auto">
              {prediction.message || (language === 'ta'
                ? 'படம் ஆதரிக்கப்படும் பயிரைக் கொண்டுள்ளது போல் தெரிகிறது, ஆனால் நோய் கணிப்பு நிச்சயமற்றது. தயவுசெய்து தெளிவான இலை படத்தை பதிவேற்றவும்.'
                : 'The image appears to contain a supported crop, but the disease prediction is uncertain. Please upload a clearer leaf image.')}
            </p>
          </div>
          <div className="pt-2">
            <label className="cursor-pointer inline-flex items-center space-x-2 px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold transition-colors">
              <span>{language === 'ta' ? 'படத்தை மாற்றவும்' : 'Change Image'}</span>
              <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            </label>
          </div>
        </div>
      )}

      {/* 3. Backend Connection Error Display */}
      {prediction && !isProcessing && prediction.status === 'connection_error' && (
        <div className="bg-white p-8 rounded-2xl border-2 border-red-300 shadow-sm space-y-5 animate-fadeIn text-center">
          <div className="w-16 h-16 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto border border-red-200">
            <WifiOff className="w-8 h-8" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-xl font-extrabold text-red-800 tracking-wide uppercase">
              {language === 'ta' ? 'சர்வர் இணைப்புப் பிழை' : 'BACKEND CONNECTION ERROR'}
            </h3>
            <p className="text-sm font-medium text-gray-700 max-w-md mx-auto">
              {prediction.message || 'Could not connect to the SmartFarm AI backend server. Please verify the backend is running.'}
            </p>
          </div>
        </div>
      )}

      {/* 4. Valid Disease Result Display (ONLY when prediction is valid and has disease) */}
      {prediction && !isProcessing && prediction.status !== 'invalid_image' && prediction.status !== 'uncertain_prediction' && prediction.status !== 'connection_error' && prediction.disease && (
        <div className="space-y-6 animate-fadeIn">

          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-md space-y-6">

            {/* Header Status */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
              <div>
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
                  {t('predictionResult')}
                </span>
                <h3 className="text-2xl font-extrabold text-gray-900 flex items-center space-x-2">
                  <span>{prediction.disease}</span>
                  <span className={`text-xs px-3 py-1 rounded-full font-bold ${prediction.status === 'Healthy' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                    {prediction.status}
                  </span>
                </h3>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-xs text-gray-500 block">{t('confidenceLabel')}</span>
                <span className="text-2xl font-black text-agri-700">{prediction.confidence}%</span>
              </div>
            </div>

            {/* Confidence Progress Bar */}
            <div className="space-y-1">
              <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-agri-600 h-3 rounded-full transition-all duration-1000"
                  style={{ width: `${prediction.confidence}%` }}
                />
              </div>
            </div>

            {/* Top-3 Disease Diagnoses Breakdown (ResNet-50) */}
            {prediction.top3Predictions && prediction.top3Predictions.length > 0 && (
              <div className="bg-gray-50/90 p-4 rounded-2xl border border-gray-200/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-agri-600" />
                    <span>{language === 'ta' ? 'முதல் 3 சாத்தியமான நோய் கணிப்புகள்' : 'Top-3 Disease Diagnoses'}</span>
                  </span>
                  <span className="text-[11px] font-semibold text-gray-500">
                    {language === 'ta' ? 'நம்பகத்தன்மை வரிசை' : 'Ranked by Confidence'}
                  </span>
                </div>
                <div className="space-y-2">
                  {prediction.top3Predictions.map((pred, idx) => {
                    const cleanName = pred.disease_clean || (pred.disease.includes('___') ? pred.disease.split('___')[1].replace(/_/g, ' ') : pred.disease.replace(/_/g, ' '));
                    const confPct = pred.confidence_percent ?? (pred.confidence <= 1.0 ? Number((pred.confidence * 100).toFixed(1)) : pred.confidence);
                    const isTop = idx === 0;
                    return (
                      <div key={idx} className={`p-2.5 rounded-xl border text-xs transition-all ${isTop ? 'bg-emerald-50/70 border-emerald-300' : 'bg-white border-gray-200'}`}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-semibold text-gray-800 flex items-center space-x-2">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${isTop ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-700'}`}>
                              #{idx + 1}
                            </span>
                            <span>{pred.crop} — {cleanName}</span>
                          </span>
                          <span className="font-mono font-bold text-gray-800">{confPct}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-1.5 rounded-full transition-all duration-1000 ${isTop ? 'bg-emerald-500' : idx === 1 ? 'bg-agri-500' : 'bg-gray-400'}`}
                            style={{ width: `${confPct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Visual Leaf Analysis: Original Uploaded Photo & Crop-Aware Architecture Display */}
            {(() => {
              const isBrinjal = prediction.crop === 'Brinjal' || selectedCrop === 'Brinjal';

              // Priority 1: Persistent cloud image URL returned by the backend
              const persistentBackendUrl = [
                prediction.persistent_image_url,
                prediction.original_image?.image_url,
                prediction.imageUrl,
                prediction.rawBackend?.persistent_image_url,
                prediction.rawBackend?.original_image?.image_url,
                prediction.rawBackend?.image_url
              ].find(url => isValidImageUrl(url) && (url.startsWith('https://') || (url.startsWith('http://') && !url.includes('localhost'))));

              // Priority 2: Existing React uploaded-image preview state (previewImage)
              const resolvedOriginalImage = persistentBackendUrl || (isValidImageUrl(previewImage) ? previewImage : null) || (isValidImageUrl(prediction.imageUrl) ? prediction.imageUrl : null);

              // Tomato and Potato SAM segmentation check
              const rawSegUrl = prediction.segmentation?.image_url;
              const hasRealSamSegmentation = !isBrinjal &&
                Boolean(prediction.segmentation?.used !== false) &&
                Boolean(rawSegUrl) &&
                isValidImageUrl(rawSegUrl) &&
                rawSegUrl !== prediction.imageUrl &&
                rawSegUrl !== persistentBackendUrl;

              return (
                <div>
                  <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center space-x-1.5">
                    <Layers className="w-4 h-4 text-agri-600" />
                    <span>
                      {isBrinjal
                        ? (language === 'ta' ? 'இலை காட்சி ஆய்வு மற்றும் நேரடி வகைப்பாடு' : 'Leaf Visual Analysis & Direct Classification')
                        : (language === 'ta' ? 'இலை காட்சி ஆய்வு மற்றும் பிரித்தெடுத்தல்' : 'Leaf Visual Analysis & Segmentation')}
                    </span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* 1. Original Leaf Photo */}
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-center space-y-2">
                      <span className="text-xs font-semibold text-gray-600 block">
                        {t('originalLeafPhoto')}
                      </span>
                      <div className="h-60 flex items-center justify-center bg-white rounded-lg overflow-hidden border border-gray-200">
                        {origImageError || !resolvedOriginalImage ? (
                          <div className="h-full w-full flex flex-col items-center justify-center bg-gray-50 text-gray-400 p-4 text-center space-y-2">
                            <div className="w-12 h-12 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400">
                              <Leaf className="w-6 h-6 text-gray-400" />
                            </div>
                            <span className="text-xs font-semibold text-gray-600">
                              {t('imageUnavailable')}
                            </span>
                          </div>
                        ) : (
                          <img
                            src={resolvedOriginalImage}
                            alt="Original Leaf"
                            className="h-full object-contain"
                            onError={() => setOrigImageError(true)}
                          />
                        )}
                      </div>
                      <div className="text-[11px] text-gray-500 font-medium">
                        {language === 'ta' ? 'விவசாயி பதிவேற்றிய அசல் இலை புகைப்படம்' : 'Full image uploaded by farmer'}
                      </div>
                    </div>

                    {/* 2. Second Leaf Visual: Brinjal Direct ResNet-50 Informational Card or Tomato/Potato SAM Segmentation */}
                    {isBrinjal ? (
                      <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-center space-y-2">
                        <div className="flex items-center justify-between px-1">
                          <span className="text-xs font-semibold text-gray-600">
                            {language === 'ta' ? 'ஆய்வு செய்யப்பட்ட இலை' : 'Analyzed Leaf Region'}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            {t('directResnetBadge')}
                          </span>
                        </div>
                        <div className="h-60 flex flex-col items-center justify-center bg-white rounded-lg overflow-hidden border border-emerald-200/80 p-5 text-center space-y-3">
                          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-2xs">
                            <Layers className="w-6 h-6 text-emerald-600" />
                          </div>
                          <div className="space-y-1">
                            <h5 className="text-sm font-bold text-gray-900">
                              {t('directLeafClassification')}
                            </h5>
                            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100/90 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>{t('resnetActive')}</span>
                            </div>
                          </div>
                          <p className="text-[11px] text-gray-600 max-w-xs leading-relaxed">
                            {t('brinjalPipelineNote')}
                          </p>
                        </div>
                        <div className="text-[11px] text-gray-500 font-medium">
                          {t('directAnalysisFooter')}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-center space-y-2">
                        <div className="flex items-center justify-between px-1">
                          <span className="text-xs font-semibold text-gray-600">
                            {language === 'ta' ? 'பிரித்தெடுக்கப்பட்ட இலை' : 'Segmented Leaf Region'}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            {language === 'ta' ? 'செயலில்' : 'Active'}
                          </span>
                        </div>
                        <div className="h-60 flex items-center justify-center bg-white rounded-lg overflow-hidden border border-gray-200">
                          {hasRealSamSegmentation && !segImageError ? (
                            <img
                              src={rawSegUrl}
                              alt="Segmented Leaf"
                              className="h-full object-contain"
                              onError={() => setSegImageError(true)}
                            />
                          ) : (
                            <div className="h-full w-full flex flex-col items-center justify-center bg-gray-50 text-gray-400 p-4 text-center space-y-2">
                              <div className="w-12 h-12 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400">
                                <Leaf className="w-6 h-6 text-gray-400" />
                              </div>
                              <span className="text-xs font-semibold text-gray-600">
                                {language === 'ta' ? 'பிரித்தெடுக்கப்பட்ட இலை படம் கிடைக்கவில்லை' : 'Image unavailable'}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="text-[11px] text-gray-500 font-medium">
                          {prediction.segmentation?.score
                            ? `${language === 'ta' ? 'பிரித்தெடுத்தல் தரம்' : 'Segmentation Confidence'}: ${(prediction.segmentation.score * 100).toFixed(1)}%`
                            : (language === 'ta' ? 'துல்லிய இலை எல்லை பிரித்தெடுக்கப்பட்டது' : 'Precision leaf boundary isolated')}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* LIME Textual Explanation Card */}
            {prediction.limeExplanation && (
              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-4">
                <div className="flex items-center space-x-2 border-b border-gray-100 pb-3">
                  <Sparkles className="w-4 h-4 text-agri-600" />
                  <h4 className="text-sm font-bold text-gray-900">
                    {t('limeExplanationTitle')}
                  </h4>
                </div>

                {/* Prediction */}
                <div>
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
                    {t('limePredictionLabel')}
                  </span>
                  <p className="text-base font-bold text-gray-900 mt-0.5">
                    {prediction.crop} — {prediction.disease}
                  </p>
                </div>

                {/* Why the model predicted this */}
                <div className="space-y-1.5">
                  <h5 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    {t('limeWhyPredicted')}:
                  </h5>
                  <p className="text-xs sm:text-sm text-gray-700 leading-relaxed font-medium">
                    {language === 'ta'
                      ? (prediction.limeExplanation.summary_ta || "AI மாதிரி பதிவேற்றப்பட்ட இலையின் பாதிக்கப்பட்ட பகுதிகளில் முக்கியமாக கவனம் செலுத்தியது.")
                      : (prediction.limeExplanation.summary || "The AI model focused mainly on the affected regions of the uploaded leaf.")}
                  </p>
                  <ul className="space-y-1 text-xs sm:text-sm text-gray-700 list-disc list-inside pt-1">
                    {(language === 'ta' && prediction.limeExplanation.why_predicted_ta?.length
                      ? prediction.limeExplanation.why_predicted_ta
                      : prediction.limeExplanation.why_predicted
                    )?.map((point, idx) => (
                      <li key={idx} className="leading-relaxed">
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Important contributing regions */}
                <div className="space-y-2">
                  <h5 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    {t('limeContributingRegions')}:
                  </h5>
                  <div className="space-y-1.5">
                    {(prediction.limeExplanation.positive_regions || []).map((item, idx) => {
                      const regionLabel = language === 'ta' ? (item.region_ta || item.region) : item.region;
                      const weightSign = `+${item.weight}`;
                      const strengthText = language === 'ta'
                        ? (item.strength_ta || "நேர்மறை பங்களிப்பு")
                        : (item.strength || "Positive contribution");

                      return (
                        <div
                          key={idx}
                          className="flex flex-col sm:flex-row sm:items-center justify-between text-xs p-2.5 rounded-lg border border-gray-100 bg-emerald-50/40 gap-1.5"
                        >
                          <div className="flex items-center space-x-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span className="font-semibold text-gray-800">
                              • {language === 'ta' ? `பகுதி ${item.id || idx + 1}` : `Region ${item.id || idx + 1}`} — {strengthText} ({regionLabel})
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 pl-4 sm:pl-0">
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 font-mono">
                              {weightSign}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Less influential regions */}
                {(prediction.limeExplanation.negative_regions || []).length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                      {t('limeLessInfluential')}:
                    </h5>
                    <div className="space-y-1.5">
                      {prediction.limeExplanation.negative_regions.map((item, idx) => {
                        const regionLabel = language === 'ta' ? (item.region_ta || item.region) : item.region;
                        const weightSign = `${item.weight}`;
                        const strengthText = language === 'ta'
                          ? (item.strength_ta || "குறைந்த / எதிர்மறை பங்களிப்பு")
                          : (item.strength || "Lower / negative contribution");

                        return (
                          <div
                            key={idx}
                            className="flex flex-col sm:flex-row sm:items-center justify-between text-xs p-2.5 rounded-lg border border-gray-100 bg-gray-50 gap-1.5"
                          >
                            <div className="flex items-center space-x-2">
                              <span className="w-2 h-2 rounded-full bg-gray-400" />
                              <span className="font-semibold text-gray-700">
                                • {language === 'ta' ? `பகுதி ${item.id || idx + 1}` : `Region ${item.id || idx + 1}`} — {strengthText} ({regionLabel})
                              </span>
                            </div>
                            <div className="flex items-center space-x-2 pl-4 sm:pl-0">
                              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-gray-200 text-gray-700 font-mono">
                                {weightSign}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Model interpretation */}
                <div className="bg-agri-50/60 p-3.5 rounded-xl border border-agri-200/80 space-y-1">
                  <h5 className="text-xs font-bold text-agri-900 uppercase tracking-wider">
                    {t('limeModelInterpretation')}:
                  </h5>
                  <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                    {language === 'ta'
                      ? (prediction.limeExplanation.model_interpretation_ta || prediction.limeExplanation.model_interpretation)
                      : prediction.limeExplanation.model_interpretation}
                  </p>
                </div>
              </div>
            )}

            {/* Prediction Details Table (Clean User-Facing Details) */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">{t('predictionDetails')}</h4>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-gray-500 block">{t('cropLabel')}:</span>
                  <strong className="text-gray-800 font-semibold">{prediction.crop}</strong>
                </div>
                <div>
                  <span className="text-gray-500 block">{t('diseaseLabel')}:</span>
                  <strong className="text-gray-800 font-semibold">{prediction.disease}</strong>
                </div>
                <div>
                  <span className="text-gray-500 block">{t('confidenceLabel')}:</span>
                  <strong className="text-agri-700 font-mono">{prediction.confidence}%</strong>
                </div>
                <div>
                  <span className="text-gray-500 block">Processing Time:</span>
                  <strong className="text-gray-800 font-mono">{prediction.processingTime}</strong>
                </div>
              </div>
            </div>

            {/* RAG Agricultural Knowledge Base Context */}
            {prediction.rag?.context && (
              <div className="bg-emerald-50/50 p-5 rounded-2xl border border-emerald-200 space-y-2.5">
                <div className="flex items-center justify-between border-b border-emerald-200/60 pb-2">
                  <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center space-x-1.5">
                    <FileText className="w-3.5 h-3.5 text-emerald-700" />
                    <span>{language === 'ta' ? 'வேளாண் அறிவு ஆதாரம்' : 'Agricultural Knowledge Reference'}</span>
                  </h4>
                  <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                    {language === 'ta' ? 'சரிபார்க்கப்பட்ட தகவல்' : 'Verified Knowledge Base'}
                  </span>
                </div>
                {prediction.rag.sources && prediction.rag.sources.length > 0 && (
                  <div className="text-[11px] font-semibold text-emerald-800">
                    📚 {language === 'ta' ? 'ஆதாரம்' : 'Source'}: {prediction.rag.sources[0]}
                  </div>
                )}
                <div className="text-xs text-gray-700 leading-relaxed bg-white/80 p-3.5 rounded-xl border border-emerald-100 font-sans max-h-40 overflow-y-auto whitespace-pre-line">
                  {prediction.rag.context}
                </div>
              </div>
            )}

            {/* AI Agronomic Advisory (Gemini) */}
            {prediction.advisory && (
              <div className="bg-agri-50/70 p-5 rounded-xl border border-agri-200 space-y-2">
                <h4 className="text-xs font-bold text-agri-900 uppercase tracking-wider flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-agri-600" />
                  <span>{language === 'ta' ? 'AI விவசாய ஆலோசனை' : 'AI Agronomic Advisory'}</span>
                </h4>
                <div className="text-xs sm:text-sm text-gray-800 whitespace-pre-line leading-relaxed font-sans">
                  {typeof prediction.advisory === 'string'
                    ? prediction.advisory
                    : (prediction.advisory?.text || prediction.advisory?.en || prediction.advisory?.ta || '')}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => navigate(`/reports?id=${prediction.id}`)}
                className="px-5 py-2.5 bg-agri-600 hover:bg-agri-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center space-x-2"
              >
                <FileText className="w-4 h-4" />
                <span>{t('viewReport')}</span>
              </button>

              <button
                onClick={handleSave}
                className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold transition-colors flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>{t('savePrediction')}</span>
              </button>

              <button
                onClick={() => navigate(`/ai-assistant?query=${encodeURIComponent(language === 'ta' ? `${prediction.crop} பயிரில் ${prediction.disease} நோயை எப்படி கட்டுப்படுத்துவது?` : `How to treat ${prediction.disease} in ${prediction.crop}?`)}`)}
                className="px-5 py-2.5 bg-white border border-agri-300 hover:bg-agri-50 text-agri-700 rounded-xl text-xs font-bold transition-colors flex items-center space-x-2"
              >
                <MessageSquare className="w-4 h-4 text-agri-600" />
                <span>{t('askAssistant')}</span>
              </button>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
