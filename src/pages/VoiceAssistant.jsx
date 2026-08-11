import React, { useState, useEffect } from 'react';
import { 
  Mic, 
  Volume2, 
  Sparkles, 
  RotateCcw
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { apiService } from '../services/apiService';

export default function VoiceAssistant() {
  const { t, language, setLanguage } = useLanguage();

  const [voiceState, setVoiceState] = useState('idle'); // idle | listening | processing | generating | speaking
  const [transcript, setTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState('');

  useEffect(() => {
    if (language === 'ta') {
      setTranscript("தக்காளியில் Late Blight நோயை எப்படி கட்டுப்படுத்துவது?");
      setAiResponse("தக்காளியில் Late Blight நோய் அதிக ஈரப்பதம் மற்றும் குளிர்ச்சியான சூழ்நிலையில் வேகமாக பரவக்கூடும். பாதிக்கப்பட்ட இலைகளை கண்காணித்து, பரிந்துரைக்கப்பட்ட வேளாண் நோய் மேலாண்மை முறைகளைப் பின்பற்றவும்.");
    } else {
      setTranscript("What is the treatment for tomato late blight?");
      setAiResponse("Tomato late blight is commonly associated with cool and humid conditions. Monitor affected leaves and follow recommended agricultural disease-management practices.");
    }
  }, [language]);

  const handleStartVoiceInteraction = async () => {
    setVoiceState('listening');
    setTranscript('');
    setAiResponse('');

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.lang = language === 'ta' ? 'ta-IN' : 'en-US';
        recognition.interimResults = false;

        recognition.onresult = async (event) => {
          const spokenText = event.results[0][0].transcript;
          setTranscript(spokenText);
          await processQuery(spokenText);
        };

        recognition.onerror = async () => {
          fallbackSimulation();
        };

        recognition.start();
        return;
      } catch (err) {
        fallbackSimulation();
      }
    } else {
      fallbackSimulation();
    }
  };

  const fallbackSimulation = async () => {
    // Stage 1: 🎙️ Listening
    await new Promise(r => setTimeout(r, 1600));
    const query = language === 'ta' 
      ? "தக்காளியில் Late Blight நோயை எப்படி கட்டுப்படுத்துவது?"
      : "What is the treatment for tomato late blight?";
    setTranscript(query);

    // Stage 2: ⏳ Processing
    setVoiceState('processing');
    await new Promise(r => setTimeout(r, 1200));

    // Stage 3: 🤖 Generating Response
    setVoiceState('generating');
    await new Promise(r => setTimeout(r, 1000));

    // Stage 4: 🔊 Speaking Output
    const result = await apiService.processVoiceInput(query, language);
    setAiResponse(result.aiResponse);
    setVoiceState('speaking');

    speakText(result.aiResponse);
  };

  const processQuery = async (queryText) => {
    setVoiceState('processing');
    await new Promise(r => setTimeout(r, 800));

    setVoiceState('generating');
    const result = await apiService.processVoiceInput(queryText, language);
    setAiResponse(result.aiResponse);

    setVoiceState('speaking');
    speakText(result.aiResponse);
  };

  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language === 'ta' ? 'ta-IN' : 'en-US';
      utterance.onend = () => setVoiceState('idle');
      utterance.onerror = () => setVoiceState('idle');
      window.speechSynthesis.speak(utterance);
    } else {
      setTimeout(() => setVoiceState('idle'), 3000);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* Title Header with Language Switcher */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight flex items-center space-x-2">
            <Mic className="w-6 h-6 text-agri-600" />
            <span>{t('voiceTitle')}</span>
          </h2>

          {/* Bilingual Language Selector */}
          <div className="flex items-center space-x-2 bg-gray-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setLanguage('en')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${language === 'en' ? 'bg-agri-600 text-white shadow-xs font-bold' : 'text-gray-600'}`}
            >
              🇬🇧 English
            </button>
            <button
              onClick={() => setLanguage('ta')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${language === 'ta' ? 'bg-agri-600 text-white shadow-xs font-bold' : 'text-gray-600'}`}
            >
              🇮🇳 தமிழ்
            </button>
          </div>
        </div>
        <p className="text-xs sm:text-sm text-gray-600">
          {language === 'ta' ? 'உங்கள் விவசாய கேள்விகளை குரல் மூலம் கேட்கலாம்.' : 'Ask your farming questions using your voice.'}
        </p>
      </div>

      {/* Main Microphone Interaction Interface */}
      <div className="bg-white p-10 rounded-2xl border border-gray-200 shadow-2xs flex flex-col items-center justify-center text-center space-y-6">
        
        <div className="relative flex items-center justify-center">
          {voiceState !== 'idle' && (
            <div className="absolute w-44 h-44 rounded-full bg-agri-400/30 animate-ping"></div>
          )}
          
          <button
            onClick={handleStartVoiceInteraction}
            disabled={voiceState !== 'idle'}
            className={`
              w-36 h-36 rounded-full flex flex-col items-center justify-center space-y-2 shadow-lg transition-all duration-300 relative z-10
              ${voiceState === 'listening' ? 'bg-red-500 text-white scale-105 ring-8 ring-red-100'
                : voiceState === 'processing' || voiceState === 'generating' ? 'bg-amber-500 text-white scale-105'
                : voiceState === 'speaking' ? 'bg-emerald-600 text-white ring-8 ring-emerald-100'
                : 'bg-agri-600 hover:bg-agri-700 text-white hover:scale-105'
              }
            `}
          >
            <Mic className="w-12 h-12" />
            <span className="text-xs font-bold uppercase tracking-wider">
              {voiceState === 'listening' ? `🎙️ ${t('listening')}...`
                : voiceState === 'processing' ? `⏳ ${t('processing')}...`
                : voiceState === 'generating' ? `🤖 ${t('generating')}...`
                : voiceState === 'speaking' ? `🔊 ${t('speaking')}...`
                : `🎙️ ${t('tapToSpeak')}`
              }
            </span>
          </button>
        </div>

        <div className="text-xs text-gray-500 font-medium">
          {voiceState === 'idle' && (language === 'ta' ? 'பேச மைக்ரோஃபோனை தட்டவும்' : 'Tap to Speak')}
        </div>
      </div>

      {/* Speech Query & Response Display */}
      {(transcript || aiResponse) && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4 animate-fadeIn">
          
          {/* User Question */}
          {transcript && (
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
                {language === 'ta' ? 'உங்கள் கேள்வி' : 'Your Question'}
              </span>
              <p className="text-sm font-semibold text-gray-800">“{transcript}”</p>
            </div>
          )}

          {/* AI Response */}
          {aiResponse && (
            <div className="p-4 bg-agri-50 border border-agri-200 rounded-xl space-y-3">
              <span className="text-xs font-bold text-agri-800 uppercase tracking-wider flex items-center space-x-1">
                <Sparkles className="w-3.5 h-3.5 text-agri-600" />
                <span>{language === 'ta' ? 'AI பதில்' : 'AI Response'}</span>
              </span>

              <p className="text-sm text-agri-900 leading-relaxed font-medium">
                {aiResponse}
              </p>

              {/* Action Buttons */}
              <div className="flex items-center space-x-3 pt-2">
                <button
                  onClick={handleStartVoiceInteraction}
                  className="px-4 py-2 bg-agri-600 hover:bg-agri-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center space-x-1.5 shadow-2xs"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{language === 'ta' ? 'மீண்டும் பேசவும்' : 'Speak Again'}</span>
                </button>

                <button
                  onClick={() => speakText(aiResponse)}
                  className="px-4 py-2 bg-white border border-agri-300 hover:bg-agri-50 text-agri-700 rounded-xl text-xs font-bold transition-colors flex items-center space-x-1.5"
                >
                  <Volume2 className="w-3.5 h-3.5 text-agri-600" />
                  <span>{language === 'ta' ? 'பதிலை இயக்கவும்' : 'Play Response'}</span>
                </button>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
