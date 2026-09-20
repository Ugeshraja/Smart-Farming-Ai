import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  X,
  Pause,
  Play
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { apiService } from '../services/apiService';
import {
  speechService,
  stopSpeaking,
  pauseSpeaking,
  resumeSpeaking,
  logVoiceDiagnostics
} from '../services/speechService';

export default function VoiceAssistant() {
  const { t, language, setLanguage } = useLanguage();

  // Voice Interaction State: idle | recording | processing | generating | speaking | paused
  const [voiceState, setVoiceState] = useState('idle');
  const [transcript, setTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [source, setSource] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  // References for SpeechRecognition, listening guard, timer, and processing guard
  const speechRecognitionRef = useRef(null);
  const isListeningRef = useRef(false);
  const liveTranscriptRef = useRef('');
  const timerIntervalRef = useRef(null);
  const hasProcessedRef = useRef(false);

  // Run development-safe voice diagnostics on mount
  useEffect(() => {
    logVoiceDiagnostics();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAnyRecording();
      stopAnyAudio();
      speechService.clear();
    };
  }, []);

  // When language changes, stop audio playback, active recognition, clear old audio state and errors
  useEffect(() => {
    stopAnyRecording();
    stopAnyAudio();
    speechService.clear();
    setErrorMessage('');
    logVoiceDiagnostics();
  }, [language]);

  const stopAnyAudio = () => {
    stopSpeaking();
    setVoiceState('idle');
  };

  const stopTimer = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  };

  const stopAnyRecording = () => {
    stopTimer();
    isListeningRef.current = false;
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.abort ? speechRecognitionRef.current.abort() : speechRecognitionRef.current.stop();
      } catch (e) {}
      speechRecognitionRef.current = null;
    }
  };

  // Start microphone recording using native browser SpeechRecognition (without getUserMedia contention)
  const startRecording = () => {
    stopAnyAudio();
    setErrorMessage('');
    hasProcessedRef.current = false;

    // Prevent double-start (InvalidStateError)
    if (isListeningRef.current) {
      stopAnyRecording();
      setVoiceState('idle');
      return;
    }

    const SpeechRec = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
    if (!SpeechRec) {
      setErrorMessage(
        language === 'ta'
          ? 'உங்கள் உலாவியில் குரல் உள்ளீடு வசதி ஆதரிக்கப்படவில்லை. நவீன உலாவியைப் பயன்படுத்தவும்.'
          : 'Speech recognition is not supported in this browser. Please use Google Chrome.'
      );
      return;
    }

    try {
      const recognition = new SpeechRec();
      // Configure language before start: ta-IN for Tamil, en-IN for English
      recognition.lang = language === 'ta' ? 'ta-IN' : 'en-IN';
      recognition.continuous = false;
      recognition.interimResults = true;

      liveTranscriptRef.current = '';

      recognition.onstart = () => {
        isListeningRef.current = true;
        setVoiceState('recording');
        setRecordingSeconds(0);

        stopTimer();
        timerIntervalRef.current = setInterval(() => {
          setRecordingSeconds((prev) => {
            if (prev >= 25) {
              stopRecording();
              return prev;
            }
            return prev + 1;
          });
        }, 1000);
      };

      recognition.onresult = (event) => {
        let currentTranscript = '';
        let hasFinal = false;

        for (let i = 0; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            hasFinal = true;
          }
        }

        const trimmed = currentTranscript.trim();
        if (trimmed) {
          liveTranscriptRef.current = trimmed;
          setTranscript(trimmed);
        }

        // Process final result once, avoiding duplicate requests
        if (hasFinal && trimmed && !hasProcessedRef.current) {
          hasProcessedRef.current = true;
          stopTimer();
          isListeningRef.current = false;
          try {
            recognition.stop();
          } catch (e) {}
          processQuestion(trimmed);
        }
      };

      recognition.onerror = (event) => {
        console.warn('SpeechRecognition error:', event?.error);
        isListeningRef.current = false;
        stopTimer();

        const err = event?.error;
        if (err === 'not-allowed' || err === 'service-not-allowed') {
          setErrorMessage(
            language === 'ta'
              ? 'மைக்ரோஃபோன் அனுமதி தேவை.'
              : 'Microphone permission is required.'
          );
          setVoiceState('idle');
        } else if (err === 'no-speech') {
          setErrorMessage(
            language === 'ta'
              ? 'குரல் கேட்கவில்லை. தயவுசெய்து மீண்டும் பேசவும்.'
              : 'No speech detected. Please speak again.'
          );
          setVoiceState('idle');
        } else if (err === 'network') {
          setErrorMessage(
            language === 'ta'
              ? 'குரல் அறிதல் சேவையில் இணைப்பு சிக்கல் ஏற்பட்டது.'
              : 'Network error occurred during speech recognition.'
          );
          setVoiceState('idle');
        } else if (err === 'audio-capture') {
          setErrorMessage(
            language === 'ta'
              ? 'மைக்ரோஃபோன் சாதனம் கிடைக்கவில்லை அல்லது பயன்பாட்டில் உள்ளது.'
              : 'Microphone is unavailable or in use by another application.'
          );
          setVoiceState('idle');
        } else if (err !== 'aborted') {
          setErrorMessage(
            language === 'ta'
              ? 'குரல் உள்ளீட்டில் பிழை ஏற்பட்டது. மீண்டும் முயற்சிக்கவும்.'
              : 'Speech recognition error. Please try again.'
          );
          setVoiceState('idle');
        }
      };

      recognition.onend = () => {
        isListeningRef.current = false;
        stopTimer();
        const candidate = liveTranscriptRef.current.trim();
        if (candidate && !hasProcessedRef.current) {
          hasProcessedRef.current = true;
          processQuestion(candidate);
        } else if (!hasProcessedRef.current) {
          setVoiceState((prev) => (prev === 'recording' ? 'idle' : prev));
        }
      };

      speechRecognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.error('Failed to start speech recognition:', e);
      isListeningRef.current = false;
      stopTimer();
      setVoiceState('idle');
      if (e.name === 'InvalidStateError') {
        // Recognition was already active; safely reset
        return;
      }
      setErrorMessage(
        language === 'ta'
          ? 'மைக்ரோஃபோனைத் தொடங்க முடியவில்லை. பக்கத்தை புதுப்பித்து மீண்டும் முயற்சிக்கவும்.'
          : 'Could not start microphone. Please refresh and try again.'
      );
    }
  };

  const stopRecording = () => {
    stopTimer();
    isListeningRef.current = false;
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch (e) {}
    }
  };

  // Central trigger to speak response using Google Cloud Text-to-Speech
  const triggerSpeak = (text) => {
    if (!text) return;
    stopAnyAudio();
    speechService.speak(text, language, {
      onStart: () => {
        setVoiceState('speaking');
      },
      onEnd: () => {
        setVoiceState('idle');
      },
      onError: (err) => {
        setVoiceState('idle');
        const failMsg =
          language === 'ta'
            ? 'தமிழ் குரல் சேவை தற்போது கிடைக்கவில்லை. தயவுசெய்து மீண்டும் முயற்சிக்கவும்.'
            : 'Voice service is currently unavailable. Please try again.';
        setErrorMessage(failMsg);
        console.warn('Google TTS playback failed:', err);
      }
    });
  };

  // Process question via POST /api/chat (exact same pipeline as AI Farmer Assistant)
  const processQuestion = async (queryText) => {
    if (!queryText || !queryText.trim()) {
      setVoiceState('idle');
      setErrorMessage(
        language === 'ta'
          ? 'குரல் கேட்கவில்லை. தயவுசெய்து மீண்டும் பேசவும்.'
          : 'No speech detected. Please speak again.'
      );
      return;
    }

    const cleanQuery = queryText.trim();
    setVoiceState('processing');
    setErrorMessage('');
    setTranscript(cleanQuery);
    setAiResponse('');
    setSource('');

    try {
      // Send question to the exact same /api/chat endpoint used by AI Farmer Assistant
      const response = await apiService.sendChatMessage(cleanQuery, language);

      if (!response || !response.text) {
        throw new Error('No response from AI service');
      }

      setAiResponse(response.text);
      setSource(response.source || '');

      // Speak response using browser SpeechSynthesis
      triggerSpeak(response.text);
    } catch (err) {
      console.error('Voice Assistant /api/chat error:', err);
      const serverDetail = err?.response?.data?.detail;
      const status = err?.response?.status;

      let msg = '';
      if (!err.response) {
        msg =
          language === 'ta'
            ? 'AI சேவையுடன் தற்போது இணைக்க முடியவில்லை. தயவுசெய்து சிறிது நேரம் கழித்து மீண்டும் முயற்சிக்கவும்.'
            : 'Unable to connect to the AI service. Please try again later.';
      } else if (serverDetail) {
        msg = serverDetail;
      } else if (status === 401) {
        msg =
          language === 'ta'
            ? 'AI சேவை அங்கீகரிப்பு தோல்வியடைந்தது. பின்தள அமைப்புகளைச் சரிபார்க்கவும்.'
            : 'AI service authentication failed. Please check the backend configuration.';
      } else {
        msg =
          language === 'ta'
            ? 'AI சேவையுடன் தற்போது இணைக்க முடியவில்லை. தயவுசெய்து சிறிது நேரம் கழித்து மீண்டும் முயற்சிக்கவும்.'
            : 'Unable to connect to the AI service. Please try again later.';
      }

      setErrorMessage(msg);
      setVoiceState('idle');
    }
  };

  // Handle main central button click
  const handleMicButtonClick = () => {
    if (voiceState === 'recording') {
      stopRecording();
    } else if (voiceState === 'speaking' || voiceState === 'paused') {
      stopAnyAudio();
      setVoiceState('idle');
    } else if (voiceState === 'idle') {
      startRecording();
    }
  };

  // Handle direct click on a sample prompt to ask and speak response via POST /api/chat
  const handleSamplePromptClick = async (promptText) => {
    stopAnyAudio();
    processQuestion(promptText);
  };

  // Prompt suggestions for farmer
  const samplePrompts =
    language === 'ta'
      ? [
        'என் தக்காளி செடிகளின் இலைகள் மஞ்சளாக மாறுகின்றன. என்ன செய்ய வேண்டும்?',
        'கத்தரிக்காய் செடியில் பூக்கள் உதிர்வதை எப்படி குறைக்கலாம்?',
        'உருளைக்கிழங்கில் இலை சுருட்டை நோயை எப்படி கட்டுப்படுத்துவது?'
      ]
      : [
        'My tomato leaves are turning yellow. What should I do?',
        'What should I check before applying fertilizer to brinjal?',
        'How can I protect potato crops from late blight fungus?'
      ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header Banner: Clean top section with title, subtitle, and bilingual switcher only */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-agri-50 border border-agri-200 flex items-center justify-center text-agri-600 shadow-2xs">
                <Mic className="w-5 h-5" />
              </div>
              <span>{t('voiceTitle')}</span>
            </h2>
            <p className="text-xs sm:text-sm text-gray-600">
              {t('voiceSubtitle')}
            </p>
          </div>

          {/* Bilingual Language Switcher */}
          <div className="flex items-center space-x-1.5 bg-gray-100 p-1.5 rounded-xl text-xs font-semibold shadow-inner self-start sm:self-auto">
            <button
              onClick={() => setLanguage('en')}
              className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                language === 'en'
                  ? 'bg-white text-agri-700 shadow-xs font-bold'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              English
            </button>
            <button
              onClick={() => setLanguage('ta')}
              className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                language === 'ta'
                  ? 'bg-agri-600 text-white shadow-xs font-bold'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              தமிழ்
            </button>
          </div>
        </div>
      </div>

      {/* Error Alert Banner (User-friendly inline message for microphone/STT/server errors) */}
      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start justify-between space-x-3 text-red-800 animate-fadeIn">
          <div className="flex items-start space-x-2.5">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm font-medium leading-relaxed">
              {errorMessage}
            </div>
          </div>
          <button
            onClick={() => setErrorMessage('')}
            className="p-1 text-red-500 hover:text-red-800 rounded-lg hover:bg-red-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Microphone Interaction Interface */}
      <div className="bg-white p-8 sm:p-12 rounded-2xl border border-gray-200 shadow-2xs flex flex-col items-center justify-center text-center space-y-6 relative overflow-hidden">
        {/* Animated Background Ring when Active */}
        <div className="relative flex items-center justify-center">
          {voiceState === 'recording' && (
            <>
              <div className="absolute w-52 h-52 rounded-full bg-red-400/20 animate-ping"></div>
              <div className="absolute w-44 h-44 rounded-full bg-red-500/20 animate-pulse"></div>
            </>
          )}

          {voiceState === 'speaking' && (
            <div className="absolute w-48 h-48 rounded-full bg-emerald-400/25 animate-pulse"></div>
          )}

          {(voiceState === 'processing' || voiceState === 'generating') && (
            <div className="absolute w-48 h-48 rounded-full bg-amber-400/25 animate-spin"></div>
          )}

          {/* Central Interactive Mic Button */}
          <button
            onClick={handleMicButtonClick}
            disabled={voiceState === 'processing' || voiceState === 'generating'}
            className={`
              w-36 h-36 sm:w-40 sm:h-40 rounded-full flex flex-col items-center justify-center space-y-2 shadow-xl transition-all duration-300 relative z-10 select-none cursor-pointer
              ${
                voiceState === 'recording'
                  ? 'bg-red-600 text-white scale-105 ring-8 ring-red-100 shadow-red-500/40'
                  : voiceState === 'processing' || voiceState === 'generating'
                    ? 'bg-amber-500 text-white scale-100 cursor-wait'
                    : voiceState === 'speaking' || voiceState === 'paused'
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white ring-8 ring-emerald-100 shadow-emerald-600/40 hover:scale-105'
                      : 'bg-agri-600 hover:bg-agri-700 text-white hover:scale-105 shadow-agri-600/30'
              }
            `}
          >
            {voiceState === 'recording' ? (
              <MicOff className="w-12 h-12 animate-pulse" />
            ) : voiceState === 'speaking' ? (
              <Volume2 className="w-12 h-12 animate-bounce" />
            ) : voiceState === 'paused' ? (
              <Play className="w-12 h-12" />
            ) : (
              <Mic className="w-12 h-12" />
            )}

            <span className="text-xs font-bold uppercase tracking-wider px-2 text-center leading-tight">
              {voiceState === 'recording'
                ? `${t('listening')} (${recordingSeconds}s)`
                : voiceState === 'processing'
                  ? t('processingVoice')
                  : voiceState === 'generating'
                    ? t('generatingAdvice')
                    : voiceState === 'speaking'
                      ? t('speaking')
                      : voiceState === 'paused'
                        ? (language === 'ta' ? 'இடைநிறுத்தப்பட்டது' : 'Paused')
                        : t('tapToSpeak')}
            </span>
          </button>
        </div>

        {/* Status Help Text & Timer */}
        <div className="space-y-1">
          {voiceState === 'recording' ? (
            <div className="flex flex-col items-center space-y-1">
              <span className="inline-flex items-center text-xs font-bold text-red-600 bg-red-50 px-3 py-1 rounded-full border border-red-200 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-red-600 mr-2"></span>
                {language === 'ta' ? 'பேசுகிறீர்கள்... நிறுத்த தட்டவும்' : 'Recording audio... Tap button when finished'}
              </span>
              <p className="text-[11px] text-gray-500">
                {language === 'ta' ? 'அதிகபட்சம் 25 வினாடிகள்' : 'Maximum 25 seconds recording window'}
              </p>
            </div>
          ) : voiceState === 'speaking' ? (
            <div className="flex items-center justify-center space-x-2">
              <button
                type="button"
                onClick={stopAnyAudio}
                className="text-xs font-bold text-red-600 hover:text-red-800 underline cursor-pointer"
              >
                {language === 'ta' ? 'நிறுத்து (Stop)' : 'Stop'}
              </button>
            </div>
          ) : voiceState === 'processing' || voiceState === 'generating' ? (
            <div className="text-xs font-medium text-amber-700 animate-pulse">
              {voiceState === 'processing' ? t('processingVoice') : t('generatingAdvice')}
            </div>
          ) : (
            <div className="text-xs text-gray-500 font-medium">
              {language === 'ta'
                ? 'மைக்ரோஃபோனை தட்டி உங்கள் விவசாய கேள்வியை பேசுங்கள்'
                : 'Tap microphone and speak your farming query'}
            </div>
          )}
        </div>

        {/* Example Questions Chips */}
        {voiceState === 'idle' && !transcript && (
          <div className="pt-4 border-t border-gray-100 w-full max-w-xl space-y-2.5">
            <div className="flex items-center justify-center space-x-1.5 text-xs font-bold text-gray-400 uppercase tracking-wider">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>{language === 'ta' ? 'மாதிரி கேள்விகள்' : 'Try Asking'}</span>
            </div>
            <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-2">
              {samplePrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  id={`sample-prompt-${idx}`}
                  type="button"
                  onClick={() => handleSamplePromptClick(prompt)}
                  className="px-3.5 py-2 rounded-xl bg-gray-50 hover:bg-agri-50 hover:border-agri-300 border border-gray-200 text-gray-700 hover:text-agri-800 text-xs text-center transition-all cursor-pointer shadow-2xs hover:shadow-xs active:scale-95"
                >
                  "{prompt}"
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Real Transcribed Question & Verified Agricultural Response Display */}
      {(transcript || aiResponse) && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-2xs space-y-5 animate-fadeIn">
          {/* User Spoken Question */}
          {transcript && (
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-1.5">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center space-x-1.5">
                <Mic className="w-3.5 h-3.5 text-agri-600" />
                <span>{t('yourQuestion')}</span>
              </span>
              <p className="text-sm sm:text-base font-semibold text-gray-900">
                "{transcript}"
              </p>
            </div>
          )}

          {/* AI Agronomic Response */}
          {aiResponse && (
            <div className="p-5 sm:p-6 bg-agri-50 border border-agri-200 rounded-xl space-y-4">
              {/* Header with Source Badge */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-agri-200/70 pb-3">
                <span className="text-xs font-bold text-agri-800 uppercase tracking-wider flex items-center space-x-1.5">
                  <Sparkles className="w-4 h-4 text-agri-600" />
                  <span>{t('aiVoiceResponse')}</span>
                </span>

                {source && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-white text-agri-800 border border-agri-300 shadow-2xs">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 mr-1.5 shrink-0" />
                    <span className="truncate max-w-[280px] sm:max-w-md">{source}</span>
                  </span>
                )}
              </div>

              {/* Response Text formatted - Always visible! */}
              <div className="text-xs sm:text-sm text-agri-950 leading-relaxed font-normal whitespace-pre-wrap space-y-2">
                {aiResponse}
              </div>

              {/* Spoken Action Controls (Speak / Pause / Resume / Stop / Speak Again) */}
              <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-agri-200/70">
                {voiceState === 'speaking' ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        pauseSpeaking();
                        setVoiceState('paused');
                      }}
                      className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-2 shadow-2xs cursor-pointer"
                    >
                      <Pause className="w-4 h-4" />
                      <span>{language === 'ta' ? 'இடைநிறுத்து (Pause)' : 'Pause'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={stopAnyAudio}
                      className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-2 shadow-2xs cursor-pointer"
                    >
                      <VolumeX className="w-4 h-4" />
                      <span>{language === 'ta' ? 'நிறுத்து (Stop)' : 'Stop'}</span>
                    </button>
                  </>
                ) : voiceState === 'paused' ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        resumeSpeaking();
                        setVoiceState('speaking');
                      }}
                      className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-2 shadow-2xs cursor-pointer"
                    >
                      <Play className="w-4 h-4" />
                      <span>{language === 'ta' ? 'தொடர் (Resume)' : 'Resume'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={stopAnyAudio}
                      className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-2 shadow-2xs cursor-pointer"
                    >
                      <VolumeX className="w-4 h-4" />
                      <span>{language === 'ta' ? 'நிறுத்து (Stop)' : 'Stop'}</span>
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => triggerSpeak(aiResponse)}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-2 shadow-2xs cursor-pointer"
                  >
                    <Volume2 className="w-4 h-4" />
                    <span>{language === 'ta' ? 'பதிலை வாசி (Speak / Replay)' : 'Speak / Replay'}</span>
                  </button>
                )}

                <button
                  onClick={startRecording}
                  disabled={voiceState === 'recording'}
                  className="px-4 py-2.5 bg-white border border-agri-300 hover:bg-agri-100 text-agri-800 rounded-xl text-xs font-bold transition-colors flex items-center space-x-1.5 shadow-2xs cursor-pointer disabled:opacity-50"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-agri-600" />
                  <span>{t('speakAgain')}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
