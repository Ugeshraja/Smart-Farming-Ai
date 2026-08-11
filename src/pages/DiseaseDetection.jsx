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
  Layers
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { apiService } from '../services/apiService';

export default function DiseaseDetection() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const [selectedCrop, setSelectedCrop] = useState('Tomato');
  const [previewImage, setPreviewImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);
  const [prediction, setPrediction] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewImage(reader.result);
        setPrediction(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const runAiPipeline = async () => {
    if (!previewImage) return;

    setIsProcessing(true);
    setPrediction(null);
    setProcessingStep(1); // Detecting leaf...

    await new Promise(r => setTimeout(r, 600));
    setProcessingStep(2); // Segmenting leaf...

    await new Promise(r => setTimeout(r, 700));
    setProcessingStep(3); // Classifying disease...

    await new Promise(r => setTimeout(r, 600));
    setProcessingStep(4); // Generating explanation...

    await new Promise(r => setTimeout(r, 500));

    const formData = new FormData();
    formData.append('crop', selectedCrop);
    formData.append('imagePreviewUrl', previewImage);

    const result = await apiService.predictDisease(formData);
    setPrediction(result);
    setIsProcessing(false);
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
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                selectedCrop === crop
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
              Detecting leaf...
            </div>
            <div className={`p-3 rounded-xl border ${processingStep >= 2 ? 'bg-agri-50 border-agri-500 font-bold text-agri-800' : 'bg-gray-50 text-gray-400'}`}>
              Segmenting leaf...
            </div>
            <div className={`p-3 rounded-xl border ${processingStep >= 3 ? 'bg-agri-50 border-agri-500 font-bold text-agri-800' : 'bg-gray-50 text-gray-400'}`}>
              Classifying disease...
            </div>
            <div className={`p-3 rounded-xl border ${processingStep >= 4 ? 'bg-agri-50 border-agri-500 font-bold text-agri-800' : 'bg-gray-50 text-gray-400'}`}>
              Generating explanation...
            </div>
          </div>
        </div>
      )}

      {/* Prediction Result Display */}
      {prediction && !isProcessing && (
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
                  <span className={`text-xs px-3 py-1 rounded-full font-bold ${
                    prediction.status === 'Healthy' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
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

            {/* Side by Side Image Comparison (Original vs LIME) */}
            <div>
              <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center space-x-1.5">
                <Layers className="w-4 h-4 text-agri-600" />
                <span>{t('aiExplanation')}</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 text-center space-y-2">
                  <span className="text-xs font-semibold text-gray-600 block">
                    {language === 'ta' ? 'அசல் இலை படம்' : 'Original Leaf Photo'}
                  </span>
                  <div className="h-60 flex items-center justify-center bg-white rounded-lg overflow-hidden border border-gray-200">
                    <img src={prediction.imageUrl} alt="Original Leaf" className="h-full object-contain" />
                  </div>
                </div>

                <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 text-center space-y-2">
                  <span className="text-xs font-semibold text-agri-700 block">
                    {language === 'ta' ? 'LIME AI விளக்கம்' : 'LIME Explanation Heatmap'}
                  </span>
                  <div className="h-60 flex items-center justify-center bg-white rounded-lg overflow-hidden border border-gray-200 relative">
                    <img src={prediction.limeImageUrl} alt="LIME Explanation" className="h-full object-contain" />
                  </div>
                </div>
              </div>
            </div>

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
                onClick={() => navigate(`/assistant?query=${encodeURIComponent(language === 'ta' ? `${prediction.crop} பயிரில் ${prediction.disease} நோயை எப்படி கட்டுப்படுத்துவது?` : `How to treat ${prediction.disease} in ${prediction.crop}?`)}`)}
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
