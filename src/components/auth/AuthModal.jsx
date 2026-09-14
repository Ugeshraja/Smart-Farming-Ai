import React, { useState } from 'react';
import { Leaf, X, Mail, Lock, User, Phone, MapPin, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

export default function AuthModal({ isOpen, onClose, initialMode = 'login' }) {
  const { login, signup, forgotPassword, user } = useAuth();
  const langContext = useLanguage ? useLanguage() : null;
  const language = langContext?.language || 'en';
  const setLanguage = langContext?.setLanguage || (() => {});
  const t = langContext?.t || ((k) => k);

  const [mode, setMode] = useState(initialMode); // 'login' | 'signup' | 'forgot'
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+91 98765 43210');
  const [preferredLang, setPreferredLang] = useState(language || 'en');
  const [farmLocation, setFarmLocation] = useState('Dharmapuri, Tamil Nadu');
  const [farmArea, setFarmArea] = useState('3.5 Acres');
  const [primaryCrops, setPrimaryCrops] = useState(['Tomato', 'Potato', 'Brinjal']);

  if (!isOpen) return null;

  const resetMessages = () => {
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleCropToggle = (crop) => {
    setPrimaryCrops(prev => 
      prev.includes(crop) ? prev.filter(c => c !== crop) : [...prev, crop]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    resetMessages();
    setLoading(true);

    try {
      if (mode === 'login') {
        await login(email, password);
        setSuccessMessage(language === 'ta' ? 'வெற்றிகரமாக உள்நுழைந்தீர்கள்!' : 'Logged in successfully!');
        setTimeout(() => {
          onClose();
        }, 800);
      } else if (mode === 'signup') {
        const payload = {
          name,
          email,
          password,
          phone,
          preferred_language: preferredLang,
          farm_location: farmLocation,
          farm_details: {
            farm_area: farmArea,
            primary_crops: primaryCrops,
            soil_type: 'Red Loamy',
            irrigation_type: 'Drip Irrigation'
          }
        };
        await signup(payload);
        if (preferredLang !== language) {
          setLanguage(preferredLang);
        }
        setSuccessMessage(language === 'ta' ? 'விவசாயி கணக்கு வெற்றிகரமாக உருவாக்கப்பட்டது!' : 'Farmer account created successfully!');
        setTimeout(() => {
          onClose();
        }, 800);
      } else if (mode === 'forgot') {
        const res = await forgotPassword(email);
        setSuccessMessage(res.message || 'Password reset link sent.');
      }
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'An error occurred during authentication.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
      <div 
        className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-agri-700 to-agri-800 p-5 text-white flex items-center justify-between relative">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-xs border border-white/20">
              <Leaf className="w-6 h-6 text-agri-200" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg tracking-tight leading-tight">
                {mode === 'login' ? (language === 'ta' ? 'உள்நுழைக' : 'Farmer Login') : 
                 mode === 'signup' ? (language === 'ta' ? 'புதிய பதிவு' : 'Register New Farmer') : 
                 (language === 'ta' ? 'கடவுச்சொல் மீட்பு' : 'Reset Password')}
              </h3>
              <p className="text-xs text-agri-100">SmartFarm AI Authentication & Profile</p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector (Login / Sign Up) */}
        {mode !== 'forgot' && (
          <div className="flex border-b border-gray-200 bg-gray-50/80 p-1.5 text-xs font-semibold">
            <button
              type="button"
              onClick={() => { setMode('login'); resetMessages(); }}
              className={`flex-1 py-2 rounded-xl text-center transition-all ${
                mode === 'login'
                  ? 'bg-white text-agri-700 shadow-2xs font-bold'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {language === 'ta' ? 'உள்நுழைக' : 'Sign In'}
            </button>
            <button
              type="button"
              onClick={() => { setMode('signup'); resetMessages(); }}
              className={`flex-1 py-2 rounded-xl text-center transition-all ${
                mode === 'signup'
                  ? 'bg-white text-agri-700 shadow-2xs font-bold'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {language === 'ta' ? 'புதிய கணக்கு' : 'Create Account'}
            </button>
          </div>
        )}

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          
          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="text-xs">{errorMessage}</div>
            </div>
          )}

          {/* Success Banner */}
          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="text-xs font-semibold">{successMessage}</div>
            </div>
          )}

          {/* Sign Up Specific: Name */}
          {mode === 'signup' && (
            <div>
              <label className="font-semibold text-gray-700 block mb-1">
                {language === 'ta' ? 'விவசாயி பெயர்' : 'Farmer Full Name'} *
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ugeshraja S"
                  className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-agri-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Email Address */}
          <div>
            <label className="font-semibold text-gray-700 block mb-1">
              {language === 'ta' ? 'மின்னஞ்சல் முகவரி' : 'Email Address'} *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="farmer@example.com"
                className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-agri-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Password */}
          {mode !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-gray-700">
                  {language === 'ta' ? 'கடவுச்சொல்' : 'Password'} *
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => { setMode('forgot'); resetMessages(); }}
                    className="text-[11px] text-agri-600 hover:text-agri-800 hover:underline"
                  >
                    {language === 'ta' ? 'கடவுச்சொல் மறந்துவிட்டதா?' : 'Forgot Password?'}
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-agri-500 focus:outline-none"
                />
              </div>
              {mode === 'signup' && (
                <p className="text-[10px] text-gray-500 mt-1">Minimum 6 characters</p>
              )}
            </div>
          )}

          {/* Sign Up Fields: Phone, Location, Language, Crops */}
          {mode === 'signup' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">
                    {language === 'ta' ? 'தொலைபேசி' : 'Phone'}
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-agri-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-gray-700 block mb-1">
                    {language === 'ta' ? 'மொழி' : 'Language'} *
                  </label>
                  <select
                    value={preferredLang}
                    onChange={(e) => setPreferredLang(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-agri-500 focus:outline-none font-medium"
                  >
                    <option value="en">🇬🇧 English</option>
                    <option value="ta">🇮🇳 தமிழ் (Tamil)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">
                    {language === 'ta' ? 'பண்ணை இடம்' : 'Farm Location'}
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                    <input
                      type="text"
                      value={farmLocation}
                      onChange={(e) => setFarmLocation(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-agri-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-gray-700 block mb-1">
                    {language === 'ta' ? 'நிலப்பரப்பு' : 'Farm Area'}
                  </label>
                  <input
                    type="text"
                    value={farmArea}
                    onChange={(e) => setFarmArea(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-agri-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">
                  {language === 'ta' ? 'முதன்மைப் பயிர்கள்' : 'Primary Solanaceae Crops'}
                </label>
                <div className="flex items-center space-x-2">
                  {['Tomato', 'Potato', 'Brinjal'].map(crop => (
                    <button
                      key={crop}
                      type="button"
                      onClick={() => handleCropToggle(crop)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                        primaryCrops.includes(crop)
                          ? 'bg-agri-600 border-agri-600 text-white'
                          : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {crop}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-agri-600 hover:bg-agri-700 text-white font-bold rounded-xl shadow-md transition-colors flex items-center justify-center space-x-2 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{language === 'ta' ? 'செயலாக்குகிறது...' : 'Processing...'}</span>
                </>
              ) : (
                <span>
                  {mode === 'login' ? (language === 'ta' ? 'உள்நுழையவும்' : 'Sign In') :
                   mode === 'signup' ? (language === 'ta' ? 'பதிவு செய்யவும்' : 'Create Farmer Account') :
                   (language === 'ta' ? 'இணைப்பை அனுப்பவும்' : 'Send Reset Link')}
                </span>
              )}
            </button>
          </div>

          {/* Back to Login link in forgot password */}
          {mode === 'forgot' && (
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => { setMode('login'); resetMessages(); }}
                className="text-xs text-agri-600 font-semibold hover:underline"
              >
                ← {language === 'ta' ? 'உள்நுழைவுக்குத் திரும்பு' : 'Back to Sign In'}
              </button>
            </div>
          )}

        </form>

        {/* Footer info note */}
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 text-[11px] text-gray-500 flex items-center justify-between">
          <span>🔒 Secured with Firebase Auth</span>
          {user && (
            <span className="text-agri-700 font-medium">Logged in as {user.name}</span>
          )}
        </div>
      </div>
    </div>
  );
}
