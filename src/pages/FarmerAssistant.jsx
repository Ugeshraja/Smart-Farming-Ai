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
  RefreshCw 
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { apiService } from '../services/apiService';

export default function FarmerAssistant() {
  const { t, language, setLanguage } = useLanguage();
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get('query');

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  // Initialize welcoming message based on selected language
  useEffect(() => {
    setMessages([
      {
        id: 1,
        sender: 'ai',
        text: language === 'ta' 
          ? 'வணக்கம்! நான் உங்கள் AI விவசாய உதவியாளர். தக்காளி, உருளைக்கிழங்கு, கத்தரி பயிர்களின் நோய்கள் மற்றும் மேலாண்மை பற்றிய கேள்விகளைக் கேட்கலாம்.'
          : 'Hello! I am your AI Farmer Assistant powered by RAG and LLM. Ask any questions regarding crop disease treatments, fungicides, or farm practices.',
        source: 'Based on retrieved agricultural knowledge (RAG + LLM)',
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

  const handleSend = async (queryText = null) => {
    const textToSend = queryText || input;
    if (!textToSend.trim()) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!queryText) setInput('');
    setIsTyping(true);

    try {
      const response = await apiService.sendChatMessage(textToSend, language);
      setMessages(prev => [...prev, response]);
    } catch (err) {
      console.error("Chat error:", err);
    } finally {
      setIsTyping(false);
    }
  };

  // Sample prompt questions tailored for English and Tamil
  const sampleQuestionsEn = [
    "What is the treatment for tomato late blight?",
    "What should I do if my tomato leaves have brown spots?",
    "How can I control potato early blight?",
    "What organic fungicide can I use for brinjal leaf spot?"
  ];

  const sampleQuestionsTa = [
    "தக்காளியில் Late Blight நோயை எப்படி கட்டுப்படுத்துவது?",
    "என் தக்காளி இலைகளில் பழுப்பு நிற புள்ளிகள் உள்ளன. நான் என்ன செய்ய வேண்டும்?",
    "உருளைக்கிழங்கு புள்ளிகளை எவ்வாறு கட்டுப்படுத்துவது?",
    "கத்தரி இலை புள்ளி நோய்க்கு என்ன மருந்து தெளிக்க வேண்டும்?"
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
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                language === 'en' ? 'bg-agri-600 text-white shadow-xs font-bold' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              🇬🇧 English
            </button>
            <button
              onClick={() => setLanguage('ta')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                language === 'ta' ? 'bg-agri-600 text-white shadow-xs font-bold' : 'text-gray-600 hover:text-gray-900'
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
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
              msg.sender === 'user' ? 'bg-gray-800 text-white' : 'bg-agri-600 text-white'
            }`}>
              {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            {/* Message Content */}
            <div className={`max-w-[80%] space-y-1.5 ${msg.sender === 'user' ? 'items-end' : ''}`}>
              <div className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-agri-600 text-white rounded-tr-none shadow-xs font-medium'
                  : 'bg-gray-50 border border-gray-200 text-gray-800 rounded-tl-none space-y-2'
              }`}>
                <p className="whitespace-pre-line">{msg.text}</p>
                
                {msg.source && (
                  <div className="pt-2 border-t border-gray-200/60 flex items-center space-x-1 text-[10px] text-agri-700 font-semibold">
                    <Sparkles className="w-3 h-3 text-agri-600" />
                    <span>{msg.source}</span>
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
              {language === 'ta' ? 'RAG + LLM பதில் உருவாக்குகிறது...' : 'Retrieving agricultural vectors & LLM synthesis...'}
            </span>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Chat Input Bar */}
      <div className="bg-white p-3 rounded-2xl border border-gray-200 shadow-2xs flex items-center space-x-2">
        <button 
          onClick={() => alert(language === 'ta' ? 'பயிர் படம் சேர்க்கப்பட்டது.' : 'Image attached.')}
          className="p-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
          title="Attach Image"
        >
          <Paperclip className="w-5 h-5" />
        </button>

        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder={t('askQuestion')}
          className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-agri-500 focus:bg-white transition-all"
        />

        <button
          onClick={() => alert(language === 'ta' ? 'குரல் உள்ளீடு ஆன் செய்யப்பட்டுள்ளது.' : 'Voice input active.')}
          className="p-2.5 text-gray-500 hover:text-agri-600 hover:bg-agri-50 rounded-xl transition-colors"
          title="Voice Input"
        >
          <Mic className="w-5 h-5" />
        </button>

        <button
          onClick={() => handleSend()}
          disabled={!input.trim()}
          className="px-4 py-2.5 bg-agri-600 hover:bg-agri-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors disabled:opacity-40 flex items-center space-x-1"
        >
          <Send className="w-4 h-4" />
          <span className="hidden sm:inline">Send</span>
        </button>
      </div>

    </div>
  );
}
