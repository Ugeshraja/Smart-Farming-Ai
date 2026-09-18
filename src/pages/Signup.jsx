import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Leaf, User, Mail, Lock, Phone, MapPin, AlertCircle, Loader2, ArrowRight, Globe, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function Signup() {
  const { signup, isAuthenticated } = useAuth();
  const { language, setLanguage } = useLanguage();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('+91 98765 43210');
  const [location, setLocation] = useState('Dharmapuri, Tamil Nadu');
  const [preferredLang, setPreferredLang] = useState(language || 'en');

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const validate = () => {
    if (!name.trim()) {
      return language === 'ta' ? 'விவசாயி பெயரை உள்ளிடவும்.' : 'Please enter your full name.';
    }
    if (!email.trim()) {
      return language === 'ta' ? 'மின்னஞ்சல் முகவரியை உள்ளிடவும்.' : 'Please enter your email address.';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return language === 'ta' ? 'சரியான மின்னஞ்சல் முகவரியை உள்ளிடவும்.' : 'Please enter a valid email address.';
    }
    if (!password) {
      return language === 'ta' ? 'கடவுச்சொல்லை உள்ளிடவும்.' : 'Please enter a password.';
    }
    if (password.length < 6) {
      return language === 'ta' ? 'கடவுச்சொல் குறைந்தபட்சம் 6 எழுத்துகள் கொண்டிருக்க வேண்டும்.' : 'Password must be at least 6 characters long.';
    }
    if (password !== confirmPassword) {
      return language === 'ta' ? 'கடவுச்சொற்கள் பொருந்தவில்லை.' : 'Passwords do not match.';
    }
    if (!phone.trim()) {
      return language === 'ta' ? 'தொலைபேசி எண்ணை உள்ளிடவும்.' : 'Please enter a contact phone number.';
    }
    if (!location.trim()) {
      return language === 'ta' ? 'பண்ணை இடத்தை உள்ளிடவும்.' : 'Please enter your farm location.';
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const valError = validate();
    if (valError) {
      setErrorMessage(valError);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        phone: phone.trim(),
        farm_location: location.trim(),
        preferred_language: preferredLang,
        farm_details: {
          farm_area: '3.5 Acres',
          primary_crops: ['Tomato', 'Potato', 'Brinjal'],
          soil_type: 'Red Loamy',
          irrigation_type: 'Drip Irrigation'
        }
      };

      const res = await signup(payload);
      if (preferredLang !== language) {
        setLanguage(preferredLang);
      }

      if (res?.session) {
        setSuccessMessage(
          language === 'ta' 
            ? 'கணக்கு வெற்றிகரமாக உருவாக்கப்பட்டது! முகப்பிற்குச் செல்கிறது...' 
            : 'Account created successfully! Redirecting to dashboard...'
        );
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 1000);
      } else {
        setSuccessMessage(
          language === 'ta'
            ? 'கணக்கு உருவாக்கப்பட்டது! உங்கள் மின்னஞ்சல் முகவரியை சரிபார்த்து உறுதிப்படுத்தவும்.'
            : 'Account created! If email confirmation is required, please check your inbox.'
        );
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 3000);
      }
    } catch (err) {
      let msg = err?.message || (language === 'ta' ? 'பதிவு செய்வதில் பிழை ஏற்பட்டது.' : 'Registration failed.');
      if (msg.toLowerCase().includes('already registered') || msg.toLowerCase().includes('already exists')) {
        msg = language === 'ta' ? 'இந்த மின்னஞ்சல் முகவரியில் ஏற்கனவே ஒரு கணக்கு உள்ளது.' : 'An account with this email address already exists.';
      }
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAF8] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      
      {/* Top Bar Language Selector */}
      <div className="absolute top-6 right-6 flex items-center space-x-2 bg-white border border-gray-200 rounded-xl px-3 py-1.5 shadow-2xs text-xs font-semibold">
        <Globe className="w-3.5 h-3.5 text-gray-500" />
        <button
          onClick={() => { setLanguage('en'); setPreferredLang('en'); }}
          className={`px-2 py-0.5 rounded-lg transition-colors ${language === 'en' ? 'bg-agri-600 text-white font-bold' : 'text-gray-600 hover:text-gray-900'}`}
        >
          English
        </button>
        <button
          onClick={() => { setLanguage('ta'); setPreferredLang('ta'); }}
          className={`px-2 py-0.5 rounded-lg transition-colors ${language === 'ta' ? 'bg-agri-600 text-white font-bold' : 'text-gray-600 hover:text-gray-900'}`}
        >
          தமிழ்
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-agri-600 text-white shadow-md mb-4">
          <Leaf className="w-8 h-8" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
          SmartFarm <span className="text-agri-600">AI</span>
        </h2>
        <p className="mt-2 text-xs sm:text-sm text-gray-600">
          {language === 'ta' 
            ? 'புதிய விவசாயி கணக்கை உருவாக்கி AI ஆலோசனைகளைப் பெறுங்கள்' 
            : 'Create a farmer account to access intelligent agricultural management'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl border border-gray-200 rounded-2xl sm:rounded-3xl">
          
          <form className="space-y-4" onSubmit={handleSubmit} noValidate>
            
            {/* Error Banner */}
            {errorMessage && (
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-2 text-red-700 animate-fadeIn">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                <span className="text-xs font-medium">{errorMessage}</span>
              </div>
            )}

            {/* Success Banner */}
            {successMessage && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start space-x-2 text-emerald-700 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                <span className="text-xs font-semibold">{successMessage}</span>
              </div>
            )}

            {/* Farmer Name */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                {language === 'ta' ? 'விவசாயி பெயர்' : 'Farmer Name'} *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ugeshraja S"
                  className="w-full pl-10 pr-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-agri-500 focus:bg-white"
                />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                {language === 'ta' ? 'மின்னஞ்சல் முகவரி' : 'Email Address'} *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="farmer@example.com"
                  className="w-full pl-10 pr-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-agri-500 focus:bg-white"
                />
              </div>
            </div>

            {/* Password & Confirm Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  {language === 'ta' ? 'கடவுச்சொல்' : 'Password'} *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-agri-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  {language === 'ta' ? 'கடவுச்சொல் உறுதிப்படுத்தல்' : 'Confirm Password'} *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-agri-500 focus:bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Phone & Location */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  {language === 'ta' ? 'தொலைபேசி எண்' : 'Phone Number'} *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full pl-10 pr-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-agri-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  {language === 'ta' ? 'பண்ணை இடம்' : 'Location'} *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Dharmapuri, Tamil Nadu"
                    className="w-full pl-10 pr-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-agri-500 focus:bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Preferred Language */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                {language === 'ta' ? 'விருப்பமான மொழி' : 'Preferred Language'} *
              </label>
              <select
                value={preferredLang}
                onChange={(e) => setPreferredLang(e.target.value)}
                className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-agri-500 font-semibold"
              >
                <option value="en">🇬🇧 English</option>
                <option value="ta">🇮🇳 தமிழ் (Tamil)</option>
              </select>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center py-2.5 px-4 bg-agri-600 hover:bg-agri-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    <span>{language === 'ta' ? 'பதிவு செய்கிறது...' : 'Creating account...'}</span>
                  </>
                ) : (
                  <>
                    <span>{language === 'ta' ? 'பதிவு செய்க' : 'Create Farmer Account'}</span>
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </>
                )}
              </button>
            </div>

          </form>

          {/* Footer to Login */}
          <div className="mt-6 pt-6 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-600">
              {language === 'ta' ? 'ஏற்கனவே கணக்கு உள்ளதா?' : 'Already have an account?'}{' '}
              <Link to="/login" className="font-bold text-agri-600 hover:text-agri-700 hover:underline">
                {language === 'ta' ? 'உள்நுழைக' : 'Sign In here'}
              </Link>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
