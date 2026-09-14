import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Leaf,
  Scan,
  Bot,
  CloudSun,
  CalendarDays,
  BookOpen,
  History,
  FileText,
  Mic,
  Users,
  ArrowRight,
  CheckCircle2,
  Menu,
  X,
  Globe,
  Sparkles,
  ShieldCheck,
  Layers,
  Activity,
  Droplets,
  SunMedium,
  ChevronRight,
  HelpCircle,
  Mail,
  MapPin,
  Phone,
  Sprout,
  Landmark,
  User,
  ChevronDown,
  LogOut,
  LayoutDashboard,
  Sun,
  Moon
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Landing() {
  const { language, setLanguage } = useLanguage();
  const { isAuthenticated, user, logout } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const isTa = language === 'ta';

  const toggleLang = () => {
    setLanguage(isTa ? 'en' : 'ta');
  };

  const scrollToSection = (id) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Facility navigation with authentication gate
  const handleExploreFacility = (route) => {
    if (!isAuthenticated) {
      navigate(`/login?redirect=${encodeURIComponent(route)}`);
    } else {
      navigate(route);
    }
  };

  const handleLogout = async () => {
    setProfileDropdownOpen(false);
    setMobileMenuOpen(false);
    await logout();
    navigate('/', { replace: true });
  };

  // 10 Core Farmer Features in Exact Specified Order
  const features = [
    {
      id: "my-field",
      icon: Sprout,
      route: "/my-field",
      titleEn: "My Field",
      titleTa: "என் நிலம் (My Field)",
      descEn: "Manage your farm profile and check whether your field conditions are suitable for planting.",
      descTa: "உங்கள் பண்ணை விவரங்களை நிர்வகித்து, நில அமைப்புகள் பயிரிட உகந்ததா என சரிபார்க்கவும்."
    },
    {
      id: "crop-disease",
      icon: Scan,
      route: "/crop-disease",
      titleEn: "Crop Disease Detection",
      titleTa: "பயிர் நோய் கண்டறிதல்",
      descEn: "Detect possible diseases in Tomato, Potato and Brinjal using AI-powered image analysis.",
      descTa: "AI படப் பகுப்பாய்வு மூலம் தக்காளி, உருளைக்கிழங்கு மற்றும் கத்தரிக்காயில் ஏற்படும் நோய்களைக் கண்டறியுங்கள்."
    },
    {
      id: "ai-assistant",
      icon: Bot,
      route: "/ai-assistant",
      titleEn: "AI Farmer Assistant",
      titleTa: "AI உழவர் உதவியாளர்",
      descEn: "Ask farming questions and receive intelligent agricultural guidance.",
      descTa: "விவசாயக் கேள்விகளைக் கேட்டு நுண்ணறிவுமிக்க வேளாண் ஆலோசனைகளைப் பெறுங்கள்."
    },
    {
      id: "weather",
      icon: CloudSun,
      route: "/weather",
      titleEn: "Weather Forecast & Alerts",
      titleTa: "வானிலை முன்னறிவிப்பு & எச்சரிக்கைகள்",
      descEn: "Monitor current weather, forecasts and important weather conditions for farming.",
      descTa: "நிகழ்நேர வானிலை, முன்னறிவிப்புகள் மற்றும் விவசாயத்திற்கான முக்கிய எச்சரிக்கைகளைக் கண்காணியுங்கள்."
    },
    {
      id: "government-schemes",
      icon: Landmark,
      route: "/government-schemes",
      titleEn: "Government Agriculture Schemes",
      titleTa: "அரசு விவசாய நலத்திட்டங்கள்",
      descEn: "Explore government schemes, subsidies and financial support available for farmers.",
      descTa: "விவசாயிகளுக்கான அரசு திட்டங்கள், மானியங்கள் மற்றும் நிதி உதவிகளை அறிந்துகொள்ளுங்கள்."
    },
    {
      id: "planner",
      icon: CalendarDays,
      route: "/farming-planner",
      titleEn: "Smart Crop & Harvest Planner",
      titleTa: "ஸ்மார்ட் பயிர் & அறுவடை திட்டமிடுபவர்",
      descEn: "Plan planting, crop growth stages and expected harvesting periods.",
      descTa: "பயிர் நடுதல், வளர்ச்சி நிலைகள் மற்றும் உகந்த அறுவடை காலங்களைத் திட்டமிடுங்கள்."
    },
    {
      id: "library",
      icon: BookOpen,
      route: "/library",
      titleEn: "Agriculture Library",
      titleTa: "விவசாய களஞ்சியம் (Library)",
      descEn: "Access useful information about crops, diseases, irrigation, fertilizer and farming practices.",
      descTa: "பயிர்கள், நோய்கள், பாசனம், உரங்கள் மற்றும் சிறந்த நடைமுறைகள் பற்றிய தகவல்களைப் பெறுங்கள்."
    },
    {
      id: "history",
      icon: History,
      route: "/history",
      titleEn: "Prediction History",
      titleTa: "நோய் கணிப்பு வரலாறு",
      descEn: "Review previous crop disease detection results.",
      descTa: "முந்தைய பயிர் நோய் பரிசோதனை முடிவுகள் மற்றும் பதிவுகளை மதிப்பாய்வு செய்யுங்கள்."
    },
    {
      id: "reports",
      icon: FileText,
      route: "/reports",
      titleEn: "AI Reports",
      titleTa: "AI பண்ணை அறிக்கைகள்",
      descEn: "View and manage AI-generated agricultural reports and insights.",
      descTa: "AI உருவாக்கிய விரிவான பயிர் ஆரோக்கிய மற்றும் விவசாய அறிக்கைகளைக் காண்க."
    },
    {
      id: "voice-assistant",
      icon: Mic,
      route: "/voice-assistant",
      titleEn: "Voice Assistant",
      titleTa: "குரல் உதவியாளர் (Voice Assistant)",
      descEn: "Interact with SmartFarm AI using voice-based farming assistance.",
      descTa: "குரல் வழி விவசாய உதவியைப் பயன்படுத்தி ஸ்மார்ட்ஃபார்ம் AI உடன் உரையாடுங்கள்."
    }
  ];

  // 4 Steps for "How It Works"
  const steps = [
    {
      step: "01",
      titleEn: "Upload",
      titleTa: "பதிவேற்று",
      descEn: "Farmer uploads a crop leaf image.",
      descTa: "பாதிக்கப்பட்ட பயிர் இலையின் புகைப்படத்தைப் பதிவேற்றவும்."
    },
    {
      step: "02",
      titleEn: "Analyze",
      titleTa: "ஆய்வு செய்",
      descEn: "AI analyzes the crop image using the disease detection pipeline.",
      descTa: "AI அமைப்பு பயிர் புகைப்படத்தை நவீன கணினி பார்வை மூலம் ஆய்வு செய்கிறது."
    },
    {
      step: "03",
      titleEn: "Understand",
      titleTa: "புரிந்துகொள்",
      descEn: "The system provides disease prediction, confidence and explanation.",
      descTa: "கண்டறியப்பட்ட நோய், நம்பிக்கை வீதம் மற்றும் LIME விளக்கத்தை வழங்குகிறது."
    },
    {
      step: "04",
      titleEn: "Act",
      titleTa: "செயல்படுத்து",
      descEn: "Farmer receives useful advisory, weather information and farming guidance.",
      descTa: "பரிந்துரைக்கப்பட்ட தெளிப்பு சிகிச்சை, வானிலை எச்சரிக்கை மற்றும் பயிர் வழிகாட்டலைப் பெறுங்கள்."
    }
  ];


  // 3 Supported Crops
  const crops = [
    {
      nameEn: "Tomato",
      nameTa: "தக்காளி",
      icon: "🍅",
      descEn: "Comprehensive diagnostics for Early Blight, Late Blight, Leaf Curl, and Bacterial Spot with staking, irrigation, and harvest window management.",
      descTa: "ஏர்லி பிளைட், லேட் பிளைட், இலை சுருட்டல் மற்றும் பாக்டீரியா புள்ளிகளைக் கண்டறிந்து, பாசனம் மற்றும் அறுவடை கால வழிகாட்டல்."
    },
    {
      nameEn: "Potato",
      nameTa: "உருளைக்கிழங்கு",
      icon: "🥔",
      descEn: "Specialized detection of Late Blight lesions, tuber development stage tracking, earthing-up reminders, and post-harvest storage guidelines.",
      descTa: "லேட் பிளைட் இலைக்கருகல் கண்டறிதல், கிழங்கு வளர்ச்சி நிலை கண்காணிப்பு, மண் அணைக்கும் நேரம் மற்றும் சேமிப்பு வழிகாட்டல்."
    },
    {
      nameEn: "Brinjal",
      nameTa: "கத்தரிக்காய்",
      icon: "🍆",
      descEn: "Targeted protection against Cercospora leaf spot, fruit and shoot borer management, and eco-friendly biological spray recommendations.",
      descTa: "செர்கோஸ்போரா இலைப்புள்ளி, காய் மற்றும் தண்டு துளைப்பான் மேலாண்மை மற்றும் இயற்கை பூச்சி மருந்து தெளிப்பு வழிகாட்டல்."
    }
  ];

  return (
    <div id="top" className="min-h-screen bg-[#F8FAF8] dark:bg-[#0b0f19] text-gray-900 dark:text-slate-100 font-sans selection:bg-agri-200 selection:text-agri-900">

      {/* 1. HEADER / NAVIGATION */}
      <header className="sticky top-0 z-50 bg-white/95 dark:bg-[#0b0f19]/95 backdrop-blur-md border-b border-gray-200 dark:border-slate-800 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-agri-600 to-agri-700 flex items-center justify-center text-white shadow-md shadow-agri-600/20 group-hover:scale-105 transition-transform">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-extrabold tracking-tight text-gray-900 dark:text-white flex items-center gap-1">
                SmartFarm <span className="text-agri-600">AI</span>
              </span>
              <span className="text-[10px] font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                {isTa ? "ஸ்மார்ட் விவசாய தளம்" : "Unified Smart Agriculture"}
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600 dark:text-slate-300">
            <button
              onClick={() => scrollToSection('top')}
              className="hover:text-agri-600 dark:hover:text-agri-400 transition-colors cursor-pointer"
            >
              {isTa ? "முகப்பு" : "Home"}
            </button>
            <button
              onClick={() => scrollToSection('features')}
              className="hover:text-agri-600 dark:hover:text-agri-400 transition-colors cursor-pointer"
            >
              {isTa ? "வசதிகள்" : "Features"}
            </button>
            <button
              onClick={() => scrollToSection('how-it-works')}
              className="hover:text-agri-600 dark:hover:text-agri-400 transition-colors cursor-pointer"
            >
              {isTa ? "செயல்முறை" : "How It Works"}
            </button>
            <button
              onClick={() => scrollToSection('about')}
              className="hover:text-agri-600 dark:hover:text-agri-400 transition-colors cursor-pointer"
            >
              {isTa ? "எங்களை பற்றி" : "About"}
            </button>
            <button
              onClick={() => scrollToSection('contact')}
              className="hover:text-agri-600 dark:hover:text-agri-400 transition-colors cursor-pointer"
            >
              {isTa ? "தொடர்பு" : "Contact"}
            </button>
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {/* Quick Theme Toggle */}
            <button
              id="landing-theme-toggle"
              type="button"
              onClick={toggleTheme}
              className="flex items-center gap-1 p-1 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-100/90 dark:bg-slate-800 text-xs font-semibold cursor-pointer transition-all hover:border-agri-500"
              aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
              title={isDark ? (isTa ? "லைட் தீமுக்கு மாற்றவும்" : "Switch to light mode") : (isTa ? "டார்க் தீமுக்கு மாற்றவும்" : "Switch to dark mode")}
            >
              <div className={`p-1.5 rounded-lg transition-all flex items-center gap-1 ${!isDark ? 'bg-white text-amber-600 shadow-xs' : 'text-gray-400'}`}>
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                {!isDark && <span className="text-[10px] font-bold text-gray-800 hidden lg:inline">Light</span>}
              </div>
              <div className={`p-1.5 rounded-lg transition-all flex items-center gap-1 ${isDark ? 'bg-slate-700 text-emerald-300 shadow-xs' : 'text-gray-400'}`}>
                <Moon className="w-3.5 h-3.5 text-indigo-400" />
                {isDark && <span className="text-[10px] font-bold text-slate-200 hidden lg:inline">Dark</span>}
              </div>
            </button>

            {/* Language Switcher */}
            <button
              onClick={toggleLang}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-xs font-semibold text-gray-700 dark:text-slate-200 hover:border-agri-400 hover:bg-agri-50 hover:text-agri-700 dark:hover:bg-slate-700 transition-all cursor-pointer"
              title="Toggle Language"
            >
              <Globe className="w-3.5 h-3.5 text-agri-600 dark:text-emerald-400" />
              <span>{isTa ? "தமிழ் (TA)" : "English (EN)"}</span>
            </button>

            {/* Auth State: Profile button or Login button */}
            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-agri-50 dark:bg-slate-800 border border-agri-200 dark:border-slate-700 text-agri-900 dark:text-emerald-300 text-xs font-bold hover:bg-agri-100 dark:hover:bg-slate-700 transition-all cursor-pointer shadow-2xs"
                >
                  <div className="w-6 h-6 rounded-lg bg-agri-600 text-white flex items-center justify-center font-bold text-xs">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <span className="max-w-[140px] truncate">{user.name || user.email?.split('@')[0] || (isTa ? 'விவசாயி' : 'Farmer')}</span>
                  <ChevronDown className="w-3 h-3 text-gray-500 dark:text-slate-400" />
                </button>

                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-xl py-2 z-50 animate-in fade-in duration-150">
                    <div className="px-4 py-2 border-b border-gray-100 dark:border-slate-700">
                      <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{user.name || (isTa ? 'விவசாயி' : 'Farmer')}</p>
                      <p className="text-[11px] text-gray-500 dark:text-slate-400 truncate">{user.email}</p>
                    </div>
                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        navigate('/dashboard');
                      }}
                      className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-gray-700 dark:text-slate-200 hover:bg-agri-50 dark:hover:bg-slate-700 hover:text-agri-700 dark:hover:text-emerald-400 w-full text-left transition-colors cursor-pointer"
                    >
                      <LayoutDashboard className="w-4 h-4 text-agri-600 dark:text-emerald-400" />
                      <span>{isTa ? "டாஷ்போர்டு" : "Dashboard"}</span>
                    </button>
                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        navigate('/profile');
                      }}
                      className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-gray-700 dark:text-slate-200 hover:bg-agri-50 dark:hover:bg-slate-700 hover:text-agri-700 dark:hover:text-emerald-400 w-full text-left transition-colors cursor-pointer"
                    >
                      <User className="w-4 h-4 text-gray-500 dark:text-slate-400" />
                      <span>{isTa ? "விவசாயி விவரக்குறிப்பு" : "Farmer Profile"}</span>
                    </button>
                    <div className="pt-1 mt-1 border-t border-gray-100 dark:border-slate-700">
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 w-full text-left transition-colors cursor-pointer"
                      >
                        <LogOut className="w-4 h-4 text-rose-500" />
                        <span>{isTa ? "வெளியேறு" : "Logout"}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="px-5 py-2.5 rounded-xl bg-agri-600 hover:bg-agri-700 text-white text-xs font-bold transition-all shadow-sm shadow-agri-600/20 hover:shadow-md hover:shadow-agri-600/30 flex items-center gap-1.5"
              >
                <span>{isTa ? "உள்நுழை" : "Sign In"}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>

          {/* Mobile Menu Hamburger Toggle */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={toggleLang}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-700"
            >
              <Globe className="w-3.5 h-3.5 text-agri-600" />
              <span>{isTa ? "தமிழ்" : "EN"}</span>
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-gray-700 hover:text-agri-600 focus:outline-none"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>

        {/* Mobile Slide-Down Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 px-5 py-6 space-y-4 shadow-xl animate-fade-in">
            <nav className="flex flex-col space-y-3 font-medium text-gray-700 dark:text-slate-200">
              <button
                onClick={() => scrollToSection('top')}
                className="text-left py-1 hover:text-agri-600 dark:hover:text-emerald-400"
              >
                {isTa ? "முகப்பு (Home)" : "Home"}
              </button>
              <button
                onClick={() => scrollToSection('features')}
                className="text-left py-1 hover:text-agri-600 dark:hover:text-emerald-400"
              >
                {isTa ? "வசதிகள் (Features)" : "Features"}
              </button>
              <button
                onClick={() => scrollToSection('how-it-works')}
                className="text-left py-1 hover:text-agri-600 dark:hover:text-emerald-400"
              >
                {isTa ? "செயல்முறை (How It Works)" : "How It Works"}
              </button>
              <button
                onClick={() => scrollToSection('about')}
                className="text-left py-1 hover:text-agri-600 dark:hover:text-emerald-400"
              >
                {isTa ? "எங்களை பற்றி (About)" : "About"}
              </button>
              <button
                onClick={() => scrollToSection('contact')}
                className="text-left py-1 hover:text-agri-600 dark:hover:text-emerald-400"
              >
                {isTa ? "தொடர்பு (Contact)" : "Contact"}
              </button>
            </nav>

            {/* Mobile Controls (Theme + Language) */}
            <div className="flex items-center justify-between py-2.5 border-t border-gray-100 dark:border-slate-800">
              <button
                type="button"
                onClick={toggleTheme}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-xs font-bold text-gray-800 dark:text-slate-200"
              >
                {isDark ? (
                  <>
                    <Sun className="w-4 h-4 text-amber-400" />
                    <span>Dark Mode</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4 text-gray-600" />
                    <span>Light Mode</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={toggleLang}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-xs font-bold text-gray-800 dark:text-slate-200"
              >
                <Globe className="w-3.5 h-3.5 text-agri-600 dark:text-emerald-400" />
                <span>{isTa ? "தமிழ்" : "English"}</span>
              </button>
            </div>

            <div className="pt-4 border-t border-gray-100 flex flex-col gap-2.5">
              {isAuthenticated && user ? (
                <>
                  <div className="px-3 py-2 bg-gray-50 rounded-xl border border-gray-100 mb-1">
                    <p className="text-xs font-bold text-gray-900 truncate">{user.name || (isTa ? 'விவசாயி' : 'Farmer')}</p>
                    <p className="text-[11px] text-gray-500 truncate">{user.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigate('/dashboard');
                    }}
                    className="w-full text-center py-2.5 rounded-xl bg-agri-600 text-white text-sm font-bold shadow-md hover:bg-agri-700 cursor-pointer"
                  >
                    {isTa ? "டாஷ்போர்டிற்கு செல் →" : "Go to Dashboard →"}
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full text-center py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-rose-600 hover:bg-rose-50 cursor-pointer"
                  >
                    {isTa ? "வெளியேறு" : "Logout"}
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-800 hover:bg-gray-50"
                  >
                    {isTa ? "உள்நுழை →" : "Login →"}
                  </Link>
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center py-2.5 rounded-xl bg-agri-600 text-white text-sm font-bold shadow-md shadow-agri-600/20 hover:bg-agri-700"
                  >
                    {isTa ? "தொடங்கவும் →" : "Get Started →"}
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>


      {/* 2. HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-16 md:pb-28 lg:pt-20">

        {/* Subtle Background Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-agri-100/60 to-emerald-100/40 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">

            {/* Left Hero Content */}
            <div className="lg:col-span-7 flex flex-col items-start space-y-6 text-left">

              {/* Pill Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-agri-50 dark:bg-emerald-950/60 border border-agri-200/80 dark:border-emerald-800 text-agri-700 dark:text-emerald-300 text-xs font-bold tracking-wide shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-agri-600 dark:text-emerald-400 animate-pulse" />
                <span>{isTa ? "முழுமையான ஸ்மார்ட் விவசாய தளம்" : "AI-Driven Unified Smart Farming Platform"}</span>
              </div>

              {/* Main Heading */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-950 dark:text-white tracking-tight leading-[1.12]">
                {isTa ? (
                  <>
                    புத்திசாலித்தனமான விவசாயம். <br />
                    <span className="bg-gradient-to-r from-agri-500 via-emerald-400 to-agri-300 bg-clip-text text-transparent">
                      செழிப்பான அறுவடை.
                    </span>
                  </>
                ) : (
                  <>
                    Smarter Farming. <br />
                    <span className="bg-gradient-to-r from-agri-500 via-emerald-400 to-agri-300 bg-clip-text text-transparent">
                      Healthier Harvests.
                    </span>
                  </>
                )}
              </h1>

              {/* Supporting Text */}
              <p className="text-base sm:text-lg text-gray-600 dark:text-slate-300 max-w-xl leading-relaxed">
                {isTa
                  ? "பயிர் நோய்களைக் கண்டறிய, வயல் நிலவரத்தை கண்காணிக்க, வானிலையை புரிந்துகொள்ள, விவசாயப் பணிகளை திட்டமிட மற்றும் நுண்ணறிவு ஆலோசனைகளைப் பெற AI கருவிகள் — அனைத்தும் ஒரே தளத்தில்."
                  : "AI-powered tools to help farmers detect crop diseases, monitor field conditions, understand weather, plan farming activities, and receive intelligent agricultural advice — all in one place."}
              </p>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
                <button
                  onClick={() => navigate(isAuthenticated ? '/dashboard' : '/login')}
                  className="inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl bg-agri-600 text-white font-bold text-base shadow-lg shadow-agri-600/30 hover:bg-agri-700 transition-all transform hover:-translate-y-0.5 text-center cursor-pointer"
                >
                  <span>{isAuthenticated ? (isTa ? "டாஷ்போர்டிற்கு செல்" : "Go to Dashboard") : (isTa ? "தொடங்கவும்" : "Get Started")}</span>
                  <ArrowRight className="w-5 h-5" />
                </button>

                <button
                  onClick={() => scrollToSection('features')}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-gray-800 dark:text-slate-200 font-semibold text-base hover:bg-gray-50 dark:hover:bg-slate-700 hover:border-gray-400 transition-all cursor-pointer text-center"
                >
                  <span>{isTa ? "வசதிகளைக் காண்க" : "Explore Features"}</span>
                  <ChevronRight className="w-4 h-4 text-gray-500 dark:text-slate-400" />
                </button>
              </div>

              {/* Trust Badge */}
              <div className="pt-3 flex items-center gap-3 text-xs text-gray-500 dark:text-slate-400">
                <ShieldCheck className="w-4 h-4 text-agri-600 dark:text-emerald-400" />
                <span>{isTa ? "தமிழ்நாடு வேளாண் சூழலுக்கு உகந்தது (Tomato • Potato • Brinjal)" : "Optimized for Solanaceae Crops & Regional Indian Agricultural Conditions"}</span>
              </div>

            </div>

            {/* Right Hero Visual Showcase */}
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-3xl overflow-hidden border-2 border-white/80 dark:border-slate-700/80 shadow-2xl shadow-agri-950/10 bg-white dark:bg-slate-900">

                {/* Hero Image */}
                <img
                  src="/hero_smartfarm.jpg"
                  alt="SmartFarm AI Agricultural Field and Digital Monitoring"
                  className="w-full h-[360px] sm:h-[440px] object-cover object-center"
                  loading="eager"
                />

                {/* Subtle Gradient Shade on bottom */}
                <div className="absolute inset-0 bg-gradient-to-t from-gray-950/70 via-transparent to-transparent pointer-events-none" />

                {/* Overlaid Badges */}
                <div className="absolute top-4 left-4 right-4 flex items-center pointer-events-none">
                  <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl text-[11px] font-bold text-agri-800 dark:text-emerald-300 shadow-sm border border-white/60 dark:border-slate-700 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-agri-600 dark:text-emerald-400" />
                    <span>IoT Telemetry Active</span>
                  </div>
                </div>

                {/* Bottom Card Inside Image */}
                <div className="absolute bottom-4 left-4 right-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-3.5 rounded-2xl border border-white/80 dark:border-slate-700/80 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-agri-100 dark:bg-emerald-950/80 flex items-center justify-center text-agri-700 dark:text-emerald-300">
                        <Leaf className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-extrabold text-gray-900 dark:text-white">
                          {isTa ? "பயிர் ஆரோக்கிய கண்காணிப்பு" : "Edge Diagnostic Engine"}
                        </div>
                        <div className="text-[11px] text-gray-500 dark:text-slate-400">
                          {isTa ? "தக்காளி, உருளை, கத்தரிக்காய்" : "Active: Tomato, Potato & Brinjal"}
                        </div>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] border border-emerald-200 dark:border-emerald-800">
                      96.4% Conf.
                    </span>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>


      {/* 3. HERO HIGHLIGHTS SECTION */}
      <section className="border-y border-gray-200/80 dark:border-slate-800 bg-white dark:bg-[#0f172a] py-10 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-gray-100 dark:divide-slate-800">

            {/* Stat 1 */}
            <div className="px-4 pt-4 md:pt-0 flex flex-col items-center">
              <span className="text-4xl sm:text-5xl font-black text-agri-600 dark:text-emerald-400 tracking-tight">
                3
              </span>
              <span className="text-sm font-bold text-gray-900 dark:text-white mt-1">
                {isTa ? "ஆதரிக்கப்படும் பயிர்கள்" : "Supported Crops"}
              </span>
              <span className="text-xs text-gray-500 dark:text-slate-400 font-medium mt-0.5">
                Tomato • Potato • Brinjal
              </span>
            </div>

            {/* Stat 2 */}
            <div className="px-4 pt-6 md:pt-0 flex flex-col items-center">
              <span className="text-4xl sm:text-5xl font-black text-gray-900 dark:text-white tracking-tight">
                AI
              </span>
              <span className="text-sm font-bold text-gray-900 dark:text-white mt-1">
                {isTa ? "நவீன நோய் கண்டறிதல்" : "Advanced Disease Detection"}
              </span>
              <span className="text-xs text-gray-500 dark:text-slate-400 font-medium mt-0.5">
                {isTa ? "துல்லியமான முடிவுகள்" : "Fast & Accurate"}
              </span>
            </div>

            {/* Stat 3 */}
            <div className="px-4 pt-6 md:pt-0 flex flex-col items-center">
              <span className="text-4xl sm:text-5xl font-black text-agri-600 dark:text-emerald-400 tracking-tight">
                24/7
              </span>
              <span className="text-sm font-bold text-gray-900 dark:text-white mt-1">
                {isTa ? "உழவர் ஆதரவு" : "Farmer Support"}
              </span>
              <span className="text-xs text-gray-500 dark:text-slate-400 font-medium mt-0.5">
                AI Assistant • Weather • Planning
              </span>
            </div>

          </div>
        </div>
      </section>


      {/* 4. FEATURES SECTION */}
      <section id="features" className="py-20 bg-[#F8FAF8] dark:bg-[#0b0f19]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-agri-100 dark:bg-emerald-950/80 text-agri-800 dark:text-emerald-300 text-xs font-bold mb-3">
              <span>{isTa ? "அனைத்து அம்சங்களும்" : "Full Platform Suite"}</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-950 dark:text-white tracking-tight">
              {isTa ? "விவசாயிக்கு தேவையான அனைத்தும்" : "Everything a Farmer Needs"}
            </h2>
            <p className="mt-3 text-base sm:text-lg text-gray-600 dark:text-slate-300">
              {isTa
                ? "விவசாயத்தை எளிதாக்க, விரைவுபடுத்த மற்றும் விழிப்புணர்வுடன் செய்ய வடிவமைக்கப்பட்ட நவீன கருவிகள்."
                : "Smart tools designed to make farming easier, faster and more informed."}
            </p>
          </div>

          {/* 10 Feature Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feat) => {
              const IconComp = feat.icon;
              return (
                <div
                  key={feat.id}
                  onClick={() => handleExploreFacility(feat.route)}
                  className="bg-white dark:bg-slate-800/90 rounded-2xl p-7 border border-gray-200/80 dark:border-slate-700 shadow-2xs hover:shadow-md hover:border-agri-400 dark:hover:border-emerald-500 transition-all duration-200 flex flex-col justify-between group hover:-translate-y-1 cursor-pointer"
                >
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-agri-50 dark:bg-slate-700/60 border border-agri-100 dark:border-slate-600 flex items-center justify-center text-agri-600 dark:text-emerald-400 mb-5 group-hover:bg-agri-600 group-hover:text-white transition-colors duration-200 shrink-0">
                      <IconComp className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-agri-700 dark:group-hover:text-emerald-400 transition-colors">
                      {isTa ? feat.titleTa : feat.titleEn}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed">
                      {isTa ? feat.descTa : feat.descEn}
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-gray-100 dark:border-slate-700 flex items-center justify-between text-xs font-bold text-agri-600 dark:text-emerald-400 group-hover:text-agri-700 dark:group-hover:text-emerald-300">
                    <span>{isTa ? "வசதியைத் திறக்கவும்" : "Explore Facility"}</span>
                    <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>


      {/* 5. HOW IT WORKS */}
      <section id="how-it-works" className="py-20 bg-white dark:bg-[#0f172a] border-y border-gray-200/80 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-agri-100 dark:bg-emerald-950/80 text-agri-800 dark:text-emerald-300 text-xs font-bold mb-3">
              <span>{isTa ? "4 எளிய படிகள்" : "Simple 4-Step Workflow"}</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-950 dark:text-white tracking-tight">
              {isTa ? "இது எவ்வாறு செயல்படுகிறது?" : "How It Works"}
            </h2>
            <p className="mt-3 text-base text-gray-600 dark:text-slate-300">
              {isTa
                ? "இலையை புகைப்படம் எடுப்பதில் தொடங்கி துல்லியமான அறுவடை வரையிலான எளிமையான வழிமுறை."
                : "From capturing an affected leaf to implementing precise agronomic action in the field."}
            </p>
          </div>

          {/* 4 Steps Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            {steps.map((st, idx) => (
              <div
                key={st.step}
                className="bg-[#F8FAF8] dark:bg-slate-800/80 rounded-2xl p-6 border border-gray-200/80 dark:border-slate-700 flex flex-col justify-between relative"
              >
                <div>
                  <div className="text-3xl font-black text-agri-600/40 dark:text-emerald-400/40 mb-3">
                    {st.step}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    {isTa ? st.titleTa : st.titleEn}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed">
                    {isTa ? st.descTa : st.descEn}
                  </p>
                </div>
                <div className="mt-6 flex items-center gap-1 text-[11px] font-bold text-agri-700 dark:text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5 text-agri-600 dark:text-emerald-400" />
                  <span>{isTa ? `படிநிலை ${idx + 1}` : `Phase ${idx + 1}`}</span>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>




      {/* 7. SMART FARMING INTEGRATED ARCHITECTURE */}
      <section className="py-20 bg-white dark:bg-[#0f172a] border-y border-gray-200/80 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-950 dark:text-white tracking-tight">
              {isTa ? "ஒருங்கிணைந்த விவசாய நுண்ணறிவு" : "Integrated Smart Farming Workflow"}
            </h2>
            <p className="mt-3 text-base text-gray-600 dark:text-slate-300">
              {isTa
                ? "பலதரப்பட்ட களத் தரவுகள் எவ்வாறு பகுப்பாய்வு செய்யப்பட்டு துல்லியமான உழவர் முடிவாக மாறுகிறது."
                : "How multi-sensor field intelligence and agricultural knowledge bases fuse to empower farmers."}
            </p>
          </div>

          {/* Flow Container */}
          <div className="bg-[#F8FAF8] dark:bg-slate-900/90 rounded-3xl p-8 lg:p-12 border border-gray-200 dark:border-slate-700 max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">

              {/* Box 1: Inputs */}
              <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-xs flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold text-agri-600 dark:text-emerald-400 uppercase tracking-wider block mb-1">01. Ground Data</span>
                  <h4 className="font-extrabold text-gray-900 dark:text-white text-sm mb-3">
                    {isTa ? "களத் தரவுகள்" : "Field Inputs"}
                  </h4>
                  <ul className="space-y-1.5 text-xs text-gray-600 dark:text-slate-300">
                    <li className="flex items-center gap-1.5"><span>📷</span> Crop Leaf Image</li>
                    <li className="flex items-center gap-1.5"><span>📡</span> Field Soil Moisture</li>
                    <li className="flex items-center gap-1.5"><span>🌦️</span> Microclimate Forecast</li>
                    <li className="flex items-center gap-1.5"><span>📚</span> Agronomy Protocols</li>
                  </ul>
                </div>
              </div>

              {/* Box 2: AI Processing */}
              <div className="bg-agri-50 dark:bg-emerald-950/60 p-5 rounded-2xl border border-agri-200 dark:border-emerald-800 shadow-xs flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold text-agri-700 dark:text-emerald-400 uppercase tracking-wider block mb-1">02. Intelligence</span>
                  <h4 className="font-extrabold text-agri-900 dark:text-emerald-200 text-sm mb-3">
                    {isTa ? "AI பகுப்பாய்வு" : "AI Processing"}
                  </h4>
                  <p className="text-xs text-agri-800 dark:text-emerald-300 leading-relaxed">
                    {isTa
                      ? "இலை எல்லைகளைக் கண்டறிந்து, நோய்களை வகைப்படுத்தி, பாதிக்கப்பட்ட பகுதிகளைக் காட்சிப்படுத்தி, சரியான மேலாண்மை முறைகளை வழங்குகிறது."
                      : "Detects leaf boundaries, classifies pathogen severity, visualizes affected zones, and retrieves verified agricultural treatment protocols."}
                  </p>
                </div>
              </div>

              {/* Box 3: Advisory */}
              <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-xs flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold text-agri-600 dark:text-emerald-400 uppercase tracking-wider block mb-1">03. Synthesis</span>
                  <h4 className="font-extrabold text-gray-900 dark:text-white text-sm mb-3">
                    {isTa ? "வழிகாட்டுதல்" : "Intelligent Advisory"}
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-slate-300 leading-relaxed">
                    Actionable dosage recommendation, spray timing before unseasonal rain, drip irrigation cycle alerts, and organic biocontrol options.
                  </p>
                </div>
              </div>

              {/* Box 4: Farmer Action */}
              <div className="bg-gradient-to-br from-agri-600 to-agri-700 text-white p-5 rounded-2xl shadow-md flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold text-agri-200 uppercase tracking-wider block mb-1">04. Outcome</span>
                  <h4 className="font-extrabold text-white text-sm mb-3">
                    {isTa ? "உழவர் முடிவு" : "Farmer Decision"}
                  </h4>
                  <p className="text-xs text-agri-50 leading-relaxed">
                    Targeted chemical application, reduced input costs, prevention of harvest loss, and maximum crop yield at market peak.
                  </p>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>


      {/* 8. CROP SECTION */}
      <section className="py-20 bg-[#F8FAF8] dark:bg-[#0b0f19]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-950 dark:text-white tracking-tight">
              {isTa ? "உங்கள் பயிர்களுக்காக வடிவமைக்கப்பட்டது" : "Designed for Your Crops"}
            </h2>
            <p className="mt-3 text-base text-gray-600 dark:text-slate-300">
              {isTa
                ? "தக்காளி, உருளைக்கிழங்கு மற்றும் கத்தரிக்காய்க்கான சிறப்பு மாதிரிகள் மற்றும் வேளாண் வழிகாட்டிகள்."
                : "Tailored detection models, developmental milestones, and agro-climatic advisories for vital Solanaceous vegetables."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {crops.map((crop) => (
              <div
                key={crop.nameEn}
                className="bg-white dark:bg-slate-800/90 rounded-2xl p-8 border border-gray-200/80 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-agri-300 dark:hover:border-slate-600 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="text-4xl mb-4">{crop.icon}</div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                    {isTa ? crop.nameTa : crop.nameEn}
                  </h3>
                  <div className="text-xs font-semibold text-agri-600 dark:text-emerald-400 mb-4">
                    {isTa ? "முழுமையான நோய் & அறுவடை திட்டம்" : "Disease Detection & Crop Planning"}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed">
                    {isTa ? crop.descTa : crop.descEn}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-100 dark:border-slate-700 flex items-center justify-between text-xs text-gray-500 dark:text-slate-400 font-medium">
                  <span>Solanaceae Family</span>
                  <span className="text-agri-600 dark:text-emerald-400 font-bold">Fully Supported ✓</span>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>


      {/* 9. LANGUAGE SUPPORT SECTION */}
      <section className="py-20 bg-white dark:bg-[#0f172a] border-y border-gray-200/80 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-agri-100 dark:bg-emerald-950/80 text-agri-800 dark:text-emerald-300 text-xs font-bold">
                <Globe className="w-3.5 h-3.5 text-agri-600 dark:text-emerald-400" />
                <span>{isTa ? "இருமொழி வசதி" : "Bilingual Accessibility"}</span>
              </div>

              <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-950 dark:text-white tracking-tight">
                {isTa ? "உங்கள் தாய்மொழியில் பேசும் தொழில்நுட்பம்" : "Technology That Speaks Your Language"}
              </h2>

              <p className="text-base sm:text-lg text-gray-600 dark:text-slate-300 leading-relaxed">
                {isTa
                  ? "விவசாயிகள் தளத்துடன் ஆங்கிலம் அல்லது தமிழில் உரையாடலாம். AI உழவர் உதவியாளர் மற்றும் குரல் உதவியாளர் நீங்கள் தேர்ந்தெடுக்கும் மொழியை ஆதரிக்கிறது."
                  : "Farmers can interact with the platform in English or Tamil. The AI assistant and voice assistant support the selected language."}
              </p>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => setLanguage('en')}
                  className={`px-5 py-2.5 rounded-xl text-sm font-bold border transition-all ${language === 'en'
                      ? 'bg-agri-600 text-white border-agri-600 shadow-md shadow-agri-600/20'
                      : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200 border-gray-200 dark:border-slate-700 hover:border-agri-300 dark:hover:border-slate-600'
                    }`}
                >
                  English Interface
                </button>

                <button
                  onClick={() => setLanguage('ta')}
                  className={`px-5 py-2.5 rounded-xl text-sm font-bold border transition-all ${language === 'ta'
                      ? 'bg-agri-600 text-white border-agri-600 shadow-md shadow-agri-600/20'
                      : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200 border-gray-200 dark:border-slate-700 hover:border-agri-300 dark:hover:border-slate-600'
                    }`}
                >
                  தமிழ் இடைமுகம் (Tamil)
                </button>
              </div>
            </div>

            {/* Interactive Bilingual Demo Card */}
            <div className="lg:col-span-6">
              <div className="bg-[#F8FAF8] dark:bg-slate-900/90 rounded-3xl p-6 sm:p-8 border border-gray-200 dark:border-slate-700 shadow-lg">
                <div className="space-y-4">

                  {/* English Snippet */}
                  <div className={`p-4 rounded-2xl border transition-all ${language === 'en' ? 'bg-white dark:bg-slate-800 border-agri-400 dark:border-emerald-500 shadow-sm' : 'bg-gray-50 dark:bg-slate-900 border-gray-200 dark:border-slate-800 opacity-60'}`}>
                    <div className="flex items-center gap-2 mb-1.5 text-xs font-bold text-gray-700 dark:text-slate-300">
                      <Mic className="w-3.5 h-3.5 text-agri-600 dark:text-emerald-400" />
                      <span>English Voice Query</span>
                    </div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      "What is the recommended spray for early blight on tomato leaves?"
                    </p>
                    <p className="text-xs text-agri-700 dark:text-emerald-400 mt-2 font-medium">
                      AI: Apply Mancozeb 75% WP @ 2g/L. Avoid spraying 4h before rainfall.
                    </p>
                  </div>

                  {/* Tamil Snippet */}
                  <div className={`p-4 rounded-2xl border transition-all ${language === 'ta' ? 'bg-white dark:bg-slate-800 border-agri-400 dark:border-emerald-500 shadow-sm' : 'bg-gray-50 dark:bg-slate-900 border-gray-200 dark:border-slate-800 opacity-60'}`}>
                    <div className="flex items-center gap-2 mb-1.5 text-xs font-bold text-gray-700 dark:text-slate-300">
                      <Mic className="w-3.5 h-3.5 text-agri-600 dark:text-emerald-400" />
                      <span>தமிழ் குரல் கேள்வி (Tamil Voice Query)</span>
                    </div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      "தக்காளி இலைக்கருகலுக்கு என்ன மருந்து தெளிக்க வேண்டும்?"
                    </p>
                    <p className="text-xs text-agri-700 dark:text-emerald-400 mt-2 font-medium">
                      AI: மான்கோசெப் 75% WP பூஞ்சைக்கொல்லியை 2 கிராம்/லிட்டர் வீதம் தெளிக்கவும்.
                    </p>
                  </div>

                </div>
              </div>
            </div>

          </div>

        </div>
      </section>


      {/* 10. ABOUT SECTION */}
      <section id="about" className="py-20 bg-[#F8FAF8] dark:bg-[#0b0f19]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-agri-100 dark:bg-emerald-950/80 text-agri-800 dark:text-emerald-300 text-xs font-bold">
              <span>{isTa ? "திட்டம் பற்றி" : "Engineering Project"}</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-950 dark:text-white tracking-tight">
              {isTa ? "SmartFarm AI பற்றி" : "About SmartFarm AI"}
            </h2>

            <p className="text-base sm:text-lg text-gray-600 dark:text-slate-300 leading-relaxed">
              {isTa
                ? "SmartFarm AI என்பது இறுதி ஆண்டு கணினி மற்றும் வேளாண் பொறியியல் ஆராய்ச்சி திட்டமாகும். இது பயிர் நோய் கண்டறிதல், IoT கள சென்சார்கள், வானிலை முன்னறிவிப்பு மற்றும் AI உழவர் வழிகாட்டலை ஒரே பாதுகாப்பான தளத்தில் ஒருங்கிணைக்கிறது."
                : "SmartFarm AI is an engineering capstone platform engineered to demonstrate how accessible artificial intelligence, explainable computer vision, and IoT field telemetry can solve practical challenges for vegetable farmers in Tamil Nadu and beyond."}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 text-left">
              <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-200 dark:border-slate-700">
                <div className="font-extrabold text-agri-700 dark:text-emerald-400 text-sm">Computer Vision</div>
                <div className="text-xs text-gray-500 dark:text-slate-400 mt-1">Deep learning models trained on agricultural leaf disease datasets</div>
              </div>
              <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-200 dark:border-slate-700">
                <div className="font-extrabold text-agri-700 dark:text-emerald-400 text-sm">Field Telemetry</div>
                <div className="text-xs text-gray-500 dark:text-slate-400 mt-1">Micro-climate sensors monitoring soil and ambient conditions</div>
              </div>
              <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-200 dark:border-slate-700">
                <div className="font-extrabold text-agri-700 dark:text-emerald-400 text-sm">Visual Explanations</div>
                <div className="text-xs text-gray-500 dark:text-slate-400 mt-1">Visual heatmaps highlighting affected lesion areas for farmers</div>
              </div>
            </div>

          </div>

        </div>
      </section>


      {/* 11. CALL TO ACTION */}
      <section className="py-20 bg-white dark:bg-[#0f172a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="rounded-3xl bg-gradient-to-br from-agri-700 via-agri-600 to-emerald-800 text-white p-10 sm:p-16 text-center relative overflow-hidden shadow-2xl shadow-agri-950/15">

            {/* Background Glow */}
            <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-96 h-96 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none" />

            <div className="max-w-3xl mx-auto relative z-10 space-y-6">
              <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
                {isTa ? "உங்கள் புத்திசாலித்தனமான விவசாயப் பயணத்தைத் தொடங்குங்கள்" : "Start Your Smarter Farming Journey"}
              </h2>

              <p className="text-base sm:text-lg text-agri-50 leading-relaxed max-w-2xl mx-auto">
                {isTa
                  ? "AI-பவர் பயிர் நோய் கண்டறிதல், வானிலை தகவல்கள், பயிர் திட்டமிடல் மற்றும் உழவர் வழிகாட்டலை ஒரே தளத்தில் அனுபவியுங்கள்."
                  : "Use AI-powered crop detection, weather insights, farming planning and intelligent farmer assistance in one platform."}
              </p>

              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  to="/login"
                  className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white text-agri-800 font-extrabold text-base hover:bg-gray-100 transition-all shadow-lg transform hover:-translate-y-0.5"
                >
                  {isTa ? "தொடங்கவும் →" : "Get Started →"}
                </Link>

                <Link
                  to="/login"
                  className="w-full sm:w-auto px-8 py-4 rounded-xl bg-agri-800/80 border border-white/20 text-white font-bold text-base hover:bg-agri-800 transition-all"
                >
                  {isTa ? "உள்நுழை →" : "Login →"}
                </Link>
              </div>

            </div>

          </div>

        </div>
      </section>


      {/* 12. FOOTER & CONTACT */}
      <footer id="contact" className="bg-gray-950 text-gray-300 py-16 border-t border-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-gray-800">

            {/* Col 1: Brand & Tagline */}
            <div className="md:col-span-2 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-agri-600 flex items-center justify-center text-white">
                  <Leaf className="w-5 h-5" />
                </div>
                <span className="text-xl font-extrabold text-white tracking-tight">
                  SmartFarm <span className="text-agri-400">AI</span>
                </span>
              </div>

              <p className="text-sm text-gray-400 max-w-sm leading-relaxed">
                "AI for Farmers. A Smarter Future for Agriculture."
              </p>

              <div className="text-xs text-gray-500 pt-2 space-y-1.5">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-agri-400" />
                  <span>Tiruchengode, Namakkal District, Tamil Nadu, India</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-agri-400" />
                  <span>support@smartfarm.ai</span>
                </div>
              </div>
            </div>

            {/* Col 2: Navigation Links */}
            <div>
              <h4 className="text-xs font-extrabold text-white uppercase tracking-wider mb-4">
                Platform
              </h4>
              <ul className="space-y-2.5 text-sm text-gray-400">
                <li>
                  <button onClick={() => scrollToSection('top')} className="hover:text-white transition-colors">
                    Home
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection('features')} className="hover:text-white transition-colors">
                    Features
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection('how-it-works')} className="hover:text-white transition-colors">
                    How It Works
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection('about')} className="hover:text-white transition-colors">
                    About
                  </button>
                </li>
              </ul>
            </div>

            {/* Col 3: Authentication & Legal */}
            <div>
              <h4 className="text-xs font-extrabold text-white uppercase tracking-wider mb-4">
                Access
              </h4>
              <ul className="space-y-2.5 text-sm text-gray-400">
                <li>
                  <Link to="/login" className="hover:text-white transition-colors">
                    Login
                  </Link>
                </li>
                <li>
                  <Link to="/signup" className="hover:text-white transition-colors">
                    Register Account
                  </Link>
                </li>
                <li className="pt-2 text-xs text-gray-500">
                  <span className="hover:text-gray-400 cursor-pointer">Privacy Policy</span>
                </li>
                <li className="text-xs text-gray-500">
                  <span className="hover:text-gray-400 cursor-pointer">Terms of Service</span>
                </li>
              </ul>
            </div>

          </div>

          {/* Copyright Sub-bar */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
            <div>
              © {new Date().getFullYear()} SmartFarm AI. All rights reserved.
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
}
