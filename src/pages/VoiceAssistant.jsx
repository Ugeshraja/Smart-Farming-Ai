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
import { speechService, stopSpeaking, pauseSpeaking, resumeSpeaking } from '../services/speechService';

export default function VoiceAssistant() {
  const { t, language, setLanguage } = useLanguage();

  // Voice Interaction State: idle | recording | processing | generating | speaking | paused
  const [voiceState, setVoiceState] = useState('idle');
  const [transcript, setTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [source, setSource] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  // References for MediaRecorder, SpeechRecognition, and timer
  const mediaRecorderRef = useRef(null);
  const speechRecognitionRef = useRef(null);
  const liveTranscriptRef = useRef('');
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  const timerIntervalRef = useRef(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAnyRecording();
      stopAnyAudio();
    };
  }, []);

  // When language changes, stop audio playback and clear errors
  useEffect(() => {
    stopAnyAudio();
    setErrorMessage('');
  }, [language]);

  const stopAnyAudio = () => {
    stopSpeaking();
    setVoiceState('idle');
  };

  const stopAnyRecording = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch (e) {}
      speechRecognitionRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        // Ignore stop error
      }
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  // Start microphone recording using browser SpeechRecognition + MediaRecorder fallback
  const startRecording = async () => {
    stopAnyAudio();
    setErrorMessage('');

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setErrorMessage(
        language === 'ta'
          ? 'உங்கள் உலாவி குரல் பதிவை ஆதரிக்கவில்லை. நவீன உலாவியைப் பயன்படுத்தவும்.'
          : 'Your browser does not support audio recording. Please use Chrome, Edge, or Firefox.'
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Start browser Speech Recognition if supported
      liveTranscriptRef.current = '';
      const SpeechRec = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
      if (SpeechRec) {
        try {
          const recognition = new SpeechRec();
          recognition.lang = language === 'ta' ? 'ta-IN' : 'en-IN';
          recognition.interimResults = true;
          recognition.continuous = true;

          recognition.onresult = (event) => {
            let currentTranscript = '';
            for (let i = 0; i < event.results.length; i++) {
              currentTranscript += event.results[i][0].transcript;
            }
            if (currentTranscript.trim()) {
              liveTranscriptRef.current = currentTranscript.trim();
              setTranscript(currentTranscript.trim());
            }
          };

          recognition.onerror = (e) => {
            console.warn('Browser SpeechRecognition warning:', e?.error);
          };

          recognition.start();
          speechRecognitionRef.current = recognition;
        } catch (e) {
          console.warn('Could not initialize SpeechRecognition:', e);
        }
      }

      let mimeType = 'audio/webm';
      if (!MediaRecorder.isTypeSupported('audio/webm')) {
        if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
          mimeType = 'audio/ogg';
        } else {
          mimeType = '';
        }
      }

      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: recorder.mimeType || 'audio/webm'
        });

        // Release hardware mic tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }

        const capturedText = liveTranscriptRef.current.trim();
        if (audioBlob.size < 100 && !capturedText) {
          setVoiceState('idle');
          setErrorMessage(
            language === 'ta'
              ? 'பேச்சு எதுவும் கண்டறியப்படவில்லை. மைக்ரோஃபோனில் பேசவும்.'
              : 'No speech detected. Please speak into the microphone.'
          );
          return;
        }

        // Process audio via existing STT / Voice endpoint
        await processRecordedAudio(audioBlob, capturedText);
      };

      recorder.start(250); // collect data in 250ms chunks
      setVoiceState('recording');
      setRecordingSeconds(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= 25) {
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      console.error('Microphone access error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMessage(t('micPermissionDenied'));
      } else {
        setErrorMessage(
          language === 'ta'
            ? 'மைக்ரோஃபோனை அணுக முடியவில்லை. சாதன அமைப்புகளைச் சரிபார்க்கவும்.'
            : `Could not access microphone: ${err.message || 'Unknown device error'}`
        );
      }
      setVoiceState('idle');
    }
  };

  const stopRecording = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch (e) {}
      speechRecognitionRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      setVoiceState('processing');
      mediaRecorderRef.current.stop();
    }
  };

  // Central trigger to speak response using browser SpeechSynthesis
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
        // Fail silently for voice: text remains completely visible and unaffected
        setVoiceState('idle');
        console.warn('Voice playback failed silently:', err);
      }
    });
  };

  // Process the recorded audio through Speech-to-Text then POST /api/chat (exact same pipeline as AI Farmer Assistant)
  const processRecordedAudio = async (audioBlob, capturedText = '') => {
    setVoiceState('processing');
    setErrorMessage('');

    let queryText = capturedText.trim();

    // If browser STT did not capture text, attempt backend STT fallback
    if (!queryText && audioBlob && audioBlob.size >= 100) {
      try {
        const transcribeRes = await apiService.transcribeAudio(audioBlob, language);
        if (transcribeRes && transcribeRes.success && transcribeRes.transcript) {
          queryText = transcribeRes.transcript.trim();
        }
      } catch (sttErr) {
        console.warn('Backend STT fallback failed:', sttErr);
      }
    }

    if (!queryText) {
      setVoiceState('idle');
      setErrorMessage(
        language === 'ta'
          ? 'குரலைப் புரிந்துகொள்ள முடியவில்லை. தயவுசெய்து தெளிவாகப் பேசவும்.'
          : "I couldn't understand your voice. Please try again."
      );
      return;
    }

    setTranscript(queryText);
    setAiResponse('');
    setSource('');

    try {
      // Send question to the exact same /api/chat endpoint used by AI Farmer Assistant
      const response = await apiService.sendChatMessage(queryText, language);

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
            ? 'சேவையகத்தை இணைக்க முடியவில்லை. இணைய இணைப்பைச் சரிபார்க்கவும்.'
            : 'Unable to connect to the AI service. Please try again.';
      } else if (serverDetail) {
        msg = serverDetail;
      } else if (status === 401) {
        msg =
          language === 'ta'
            ? 'AI சேவை அங்கீகரிப்பு தோல்வியடைந்தது. பின்தள அமைப்புகளைச் சரிபார்க்கவும்.'
            : 'AI service authentication failed. Please check the backend configuration.';
      } else if (status === 503) {
        msg =
          language === 'ta'
            ? 'விவசாய ஆலோசனையை உருவாக்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்.'
            : 'Failed to generate agricultural advice. Please try again.';
      } else {
        msg =
          language === 'ta'
            ? 'சேவையகத்தை இணைக்க முடியவில்லை. இணைய இணைப்பைச் சரிபார்க்கவும்.'
            : 'Unable to connect to the AI service. Please try again.';
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
    setVoiceState('processing');
    setErrorMessage('');
    setTranscript(promptText);
    setAiResponse('');
    setSource('');

    try {
      // Send sample prompt directly to the same /api/chat endpoint
      const response = await apiService.sendChatMessage(promptText, language);

      if (!response || !response.text) {
        throw new Error('No response from AI service');
      }

      setTranscript(promptText);
      setAiResponse(response.text);
      setSource(response.source || '');

      triggerSpeak(response.text);
    } catch (err) {
      console.error('Voice Assistant prompt error:', err);
      const serverDetail = err?.response?.data?.detail;
      const status = err?.response?.status;
      let msg = '';
      if (!err.response) {
        msg =
          language === 'ta'
            ? 'சேவையகத்தை இணைக்க முடியவில்லை. இணைய இணைப்பைச் சரிபார்க்கவும்.'
            : 'Unable to connect to the AI service. Please try again.';
      } else if (serverDetail) {
        msg = serverDetail;
      } else if (status === 401) {
        msg =
          language === 'ta'
            ? 'AI சேவை அங்கீகரிப்பு தோல்வியடைந்தது. பின்தள அமைப்புகளைச் சரிபார்க்கவும்.'
            : 'AI service authentication failed. Please check the backend configuration.';
      } else if (status === 503) {
        msg =
          language === 'ta'
            ? 'விவசாய ஆலோசனையை உருவாக்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்.'
            : 'Failed to generate agricultural advice. Please try again.';
      } else {
        msg =
          language === 'ta'
            ? 'சேவையகத்தை இணைக்க முடியவில்லை. இணைய இணைப்பைச் சரிபார்க்கவும்.'
            : 'Unable to connect to the AI service. Please try again.';
      }
      setErrorMessage(msg);
      setVoiceState('idle');
    }
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
