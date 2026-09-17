import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Send,
  Paperclip,
  Mic,
  Bot,
  User,
  Sparkles,
  Database,
  RefreshCw,
  X,
  FileText,
  Image as ImageIcon,
  AlertCircle,
  Volume2,
  VolumeX
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { apiService } from '../services/apiService';
import { speechService, stopSpeaking } from '../services/speechService';

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.pdf', '.txt'];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export default function FarmerAssistant() {
  const { t, language, setLanguage } = useLanguage();
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get('query');

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [speakingState, setSpeakingState] = useState({ id: null, status: 'idle' });
  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Stop speech synthesis when unmounting or changing language
  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, []);

  useEffect(() => {
    stopSpeaking();
    setSpeakingState({ id: null, status: 'idle' });
  }, [language]);

  const handleToggleSpeak = (msgId, text) => {
    if (speakingState.id === msgId && (speakingState.status === 'playing' || speakingState.status === 'loading')) {
      speechService.stop();
      setSpeakingState({ id: null, status: 'idle' });
      return;
    }

    speechService.stop();
    setSpeakingState({ id: msgId, status: 'loading' });

    speechService.speak(text, language, {
      onStart: () => setSpeakingState({ id: msgId, status: 'playing' }),
      onEnd: () => setSpeakingState({ id: null, status: 'idle' }),
      onError: () => {
        setSpeakingState({ id: msgId, status: 'error' });
        setTimeout(() => {
          setSpeakingState((prev) => (prev.id === msgId ? { id: null, status: 'idle' } : prev));
        }, 3000);
      }
    });
  };

  // Initialize welcoming message based on selected language
  useEffect(() => {
    setMessages([
      {
        id: 1,
        sender: 'ai',
        text: language === 'ta'
          ? 'வணக்கம்! நான் உங்கள் SmartFarm AI வேளாண் உதவியாளர். பயிர்கள், நோய்கள், பூச்சிகள், நீர்ப்பாசனம், மண், உரங்கள், வானிலை மற்றும் வேளாண் முறைகள் குறித்து என்னிடம் கேட்கலாம்.'
          : 'Hello! I am your SmartFarm AI Agricultural Assistant. Ask me about crops, diseases, pests, irrigation, soil, fertilizers, weather, and farming practices.',
        source: 'SmartFarm AI Advisor',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  }, [language]);

  useEffect(() => {
    if (initialQuery) {
      handleSend(initialQuery);
    }
  }, [initialQuery]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handlePaperclipClick = () => {
    setFileError('');
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    setFileError('');
    const files = e.target.files;
    if (!files || files.length === 0) {
      // User cancelled file picker -> preserve state, no fake attachment
      return;
    }

    const file = files[0];
    const fileName = file.name.toLowerCase();
    const isAllowed = ALLOWED_EXTENSIONS.some((ext) => fileName.endsWith(ext));

    if (!isAllowed) {
      setFileError(
        language === 'ta'
          ? 'ஆதரிக்கப்படாத கோப்பு வடிவம். JPG, PNG, WEBP, PDF அல்லது TXT கோப்புகளை மட்டும் இணைக்கவும்.'
          : 'Unsupported file type. Please select JPG, PNG, WEBP, PDF, or TXT files only.'
      );
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setFileError(
        language === 'ta'
          ? 'கோப்பு அளவு 10MB ஐ விட அதிகமாக உள்ளது. சிறிய கோப்பைத் தேர்ந்தெடுக்கவும்.'
          : 'File size exceeds 10 MB limit. Please select a smaller file.'
      );
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setSelectedFile(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFileError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSend = async (queryText = null) => {
    const textToSend = queryText !== null ? queryText : input;
    const fileToSend = queryText !== null ? null : selectedFile;

    if (!textToSend.trim() && !fileToSend) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: textToSend.trim(),
      attachment: fileToSend
        ? {
            name: fileToSend.name,
            size: fileToSend.size,
            type: fileToSend.type,
          }
        : null,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (queryText === null) {
      setInput('');
      setSelectedFile(null);
    }
    setFileError('');
    setIsTyping(true);

    try {
      const queryForBackend = textToSend.trim() || (
        language === 'ta'
          ? `[இணைக்கப்பட்ட கோப்பு: ${fileToSend.name}]`
          : `[Attached file: ${fileToSend.name}]`
      );
      const response = await apiService.sendChatMessage(queryForBackend, language, fileToSend);
      setMessages(prev => [...prev, response]);
    } catch (err) {
      console.error("Chat error:", err);
    } finally {
      setIsTyping(false);
    }
  };

  // Sample prompt questions tailored for English and Tamil (General Farming)
  const sampleQuestionsEn = [
    "What fertilizer should I use for rice?",
    "Why are my crop leaves turning yellow?",
    "How can I improve soil fertility?",
    "How often should I irrigate my crop?",
    "What should I do during heavy rainfall?",
    "How can I control common crop pests?"
  ];

  const sampleQuestionsTa = [
    "நெல் பயிருக்கு எந்த உரம் பயன்படுத்தலாம்?",
    "பயிர்களின் இலைகள் மஞ்சளாக மாறுவதற்கு என்ன காரணம்?",
    "மண்ணின் வளத்தை எவ்வாறு அதிகரிக்கலாம்?",
    "பயிர்களுக்கு எவ்வளவு அடிக்கடி நீர்ப்பாசனம் செய்ய வேண்டும்?",
    "அதிக மழை பெய்யும் போது பயிர்களை எவ்வாறு பாதுகாப்பது?"
  ];

  const activeSampleQuestions = language === 'ta' ? sampleQuestionsTa : sampleQuestionsEn;

  return (
    <div className="space-y-4 max-w-4xl mx-auto h-[calc(100vh-140px)] flex flex-col">

      {/* Title Header with Language Selector Toggle */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-gray-900 flex items-center space-x-2">
            <Bot className="w-5 h-5 text-agri-600" />
            <span>{t('chatTitle')}</span>
          </h2>
          <p className="text-xs text-gray-500">{t('chatSubtitle')}</p>
        </div>

        {/* Bilingual Language Selector */}
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-400 font-medium">Assistant Language:</span>
          <div className="flex items-center bg-gray-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setLanguage('en')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${language === 'en' ? 'bg-agri-600 text-white shadow-xs font-bold' : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              🇬🇧 English
            </button>
            <button
              onClick={() => setLanguage('ta')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${language === 'ta' ? 'bg-agri-600 text-white shadow-xs font-bold' : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              🇮🇳 தமிழ்
            </button>
          </div>
        </div>
      </div>

      {/* Quick Prompt Suggestions */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-gray-400 font-semibold shrink-0">
          {language === 'ta' ? 'கேள்விகள்:' : 'Try asking:'}
        </span>
        {activeSampleQuestions.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(q)}
            className="px-3 py-1.5 bg-white hover:bg-agri-50 border border-gray-200 hover:border-agri-300 text-gray-700 hover:text-agri-700 rounded-xl whitespace-nowrap transition-colors shadow-2xs font-medium"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Chat Messages Box */}
      <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-2xs p-4 overflow-y-auto space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start space-x-3 ${msg.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}
          >
            {/* Avatar */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${msg.sender === 'user' ? 'bg-gray-800 text-white' : 'bg-agri-600 text-white'
              }`}>
              {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            {/* Message Content */}
            <div className={`max-w-[80%] space-y-1.5 ${msg.sender === 'user' ? 'items-end' : ''}`}>
              <div className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${msg.sender === 'user'
                  ? 'bg-agri-600 text-white rounded-tr-none shadow-xs font-medium'
                  : 'bg-gray-50 border border-gray-200 text-gray-800 rounded-tl-none space-y-2'
                }`}>
                {msg.attachment && (
                  <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-black/15 text-[11px] font-medium border border-white/20 my-1">
                    {msg.attachment.type?.startsWith('image/') ? (
                      <ImageIcon className="w-3.5 h-3.5 text-white/90 shrink-0" />
                    ) : (
                      <FileText className="w-3.5 h-3.5 text-white/90 shrink-0" />
                    )}
                    <span className="truncate max-w-[200px]">{msg.attachment.name}</span>
                    <span className="text-white/70 font-mono text-[10px] shrink-0">
                      ({(msg.attachment.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                )}
                <p className="whitespace-pre-line">{msg.text}</p>

                {msg.sender === 'ai' && (
                  <div className="pt-2 border-t border-gray-200/60 flex items-center justify-between text-[10px] text-agri-700 font-semibold gap-2">
                    <div className="flex items-center space-x-1 truncate">
                      <Sparkles className="w-3 h-3 text-agri-600 shrink-0" />
                      <span className="truncate">{msg.source || 'SmartFarm AI Advisor'}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleSpeak(msg.id, msg.text)}
                      className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer shrink-0 shadow-2xs ${
                        speakingState.id === msg.id && speakingState.status === 'playing'
                          ? 'bg-red-100 text-red-700 hover:bg-red-200 border border-red-200'
                          : speakingState.id === msg.id && speakingState.status === 'loading'
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : speakingState.id === msg.id && speakingState.status === 'error'
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : 'bg-white hover:bg-agri-50 text-agri-800 border border-agri-200'
                      }`}
                      title={
                        speakingState.id === msg.id && speakingState.status === 'playing'
                          ? (language === 'ta' ? 'நிறுத்து' : 'Stop')
                          : (language === 'ta' ? 'பதிலை கேள் (ஆடியோ)' : 'Listen')
                      }
                    >
                      {speakingState.id === msg.id && speakingState.status === 'loading' ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                          <span>{language === 'ta' ? 'ஆடியோ உருவாக்கப்படுகிறது...' : 'Generating audio...'}</span>
                        </>
                      ) : speakingState.id === msg.id && speakingState.status === 'playing' ? (
                        <>
                          <VolumeX className="w-3.5 h-3.5 text-red-600" />
                          <span>{language === 'ta' ? 'நிறுத்து' : 'Stop'}</span>
                        </>
                      ) : speakingState.id === msg.id && speakingState.status === 'error' ? (
                        <>
                          <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                          <span>{language === 'ta' ? 'ஆடியோவை இயக்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்.' : 'Unable to play audio. Please try again.'}</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3.5 h-3.5 text-agri-600" />
                          <span>{language === 'ta' ? 'கேள்' : 'Listen'}</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              <span className="text-[10px] text-gray-400 block px-1">
                {msg.timestamp}
              </span>
            </div>
          </div>
        ))}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex items-center space-x-3 text-xs text-gray-500 bg-gray-50 p-3 rounded-2xl max-w-xs border border-gray-200">
            <RefreshCw className="w-4 h-4 text-agri-600 animate-spin" />
            <span>
              {language === 'ta' ? 'சிந்திக்கிறது (Thinking)...' : 'Thinking...'}
            </span>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        id="farmer-assistant-file-input"
        className="hidden"
        accept=".jpg,.jpeg,.png,.webp,.pdf,.txt,image/jpeg,image/png,image/webp,application/pdf,text/plain"
        onChange={handleFileChange}
      />

      {/* Chat Input Container */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden flex flex-col">
        {/* Selected Attachment Chip */}
        {selectedFile && (
          <div className="px-3.5 py-2 bg-agri-50 border-b border-agri-100 flex items-center justify-between text-xs animate-fadeIn">
            <div className="flex items-center space-x-2 truncate">
              {selectedFile.type.startsWith('image/') ? (
                <ImageIcon className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <FileText className="w-4 h-4 text-blue-600 shrink-0" />
              )}
              <span id="attached-file-name" className="font-semibold text-gray-800 truncate">{selectedFile.name}</span>
              <span className="text-gray-500 font-mono text-[11px] shrink-0">
                ({(selectedFile.size / 1024).toFixed(1)} KB)
              </span>
            </div>
            <button
              type="button"
              id="remove-attached-file-btn"
              onClick={handleRemoveFile}
              className="p-1 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors ml-2 cursor-pointer"
              title={language === 'ta' ? 'இணைப்பை நீக்கு' : 'Remove attachment'}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Validation Error Banner */}
        {fileError && (
          <div className="px-3.5 py-2 bg-red-50 border-b border-red-200 flex items-center justify-between text-xs text-red-700 animate-fadeIn">
            <div className="flex items-center space-x-1.5">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{fileError}</span>
            </div>
            <button
              type="button"
              onClick={() => setFileError('')}
              className="p-1 text-red-400 hover:text-red-700 rounded-lg cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Action Controls Bar */}
        <div className="p-2.5 flex items-center space-x-2">
          <button
            type="button"
            id="farmer-assistant-paperclip-btn"
            onClick={handlePaperclipClick}
            className={`p-2 rounded-xl transition-colors cursor-pointer ${
              selectedFile ? 'text-agri-600 bg-agri-50 hover:bg-agri-100' : 'text-gray-500 hover:text-agri-600 hover:bg-gray-100'
            }`}
            title={language === 'ta' ? 'கோப்பை இணைக்கவும் (JPG, PNG, PDF, TXT)' : 'Attach file (JPG, PNG, PDF, TXT)'}
          >
            <Paperclip className="w-5 h-5" />
          </button>

          <input
            type="text"
            id="farmer-assistant-text-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={language === 'ta' ? 'விவசாயக் கேள்விகளைக் கேளுங்கள்...' : 'Ask your farming question...'}
            className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-agri-500 focus:bg-white transition-all"
          />

          <button
            type="button"
            onClick={() => alert(language === 'ta' ? 'குரல் உள்ளீடு ஆன் செய்யப்பட்டுள்ளது.' : 'Voice input active.')}
            className="p-2 text-gray-500 hover:text-agri-600 hover:bg-agri-50 rounded-xl transition-colors cursor-pointer"
            title="Voice Input"
          >
            <Mic className="w-5 h-5" />
          </button>

          <button
            type="button"
            id="farmer-assistant-send-btn"
            onClick={() => handleSend()}
            disabled={!input.trim() && !selectedFile}
            className="px-4 py-2 bg-agri-600 hover:bg-agri-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors disabled:opacity-40 flex items-center space-x-1 cursor-pointer disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </div>
      </div>

    </div>
  );
}
