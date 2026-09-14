import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Leaf, Mail, AlertCircle, CheckCircle2, Loader2, ArrowLeft, Globe } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function ForgotPassword() {
  const { forgotPassword } = useAuth();
  const { language, setLanguage } = useLanguage();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!email.trim()) {
      setErrorMessage(language === 'ta' ? 'மின்னஞ்சல் முகவரியை உள்ளிடவும்.' : 'Please enter your email address.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setErrorMessage(language === 'ta' ? 'சரியான மின்னஞ்சல் முகவரியை உள்ளிடவும்.' : 'Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await forgotPassword(email.trim());
      setSuccessMessage(
        language === 'ta' 
          ? 'கடவுச்சொல் மீட்பு வழிமுறைகள் உங்கள் மின்னஞ்சலுக்கு அனுப்பப்பட்டுள்ளன.' 
          : res.message || 'Password reset instructions have been sent to your email.'
      );
    } catch (err) {
      setErrorMessage(language === 'ta' ? 'கோரிக்கையை நிறைவேற்ற முடியவில்லை.' : 'Failed to send password reset email.');
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
          onClick={() => setLanguage('en')}
          className={`px-2 py-0.5 rounded-lg transition-colors ${language === 'en' ? 'bg-agri-600 text-white font-bold' : 'text-gray-600 hover:text-gray-900'}`}
        >
          English
        </button>
        <button
          onClick={() => setLanguage('ta')}
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
          {language === 'ta' ? 'கடவுச்சொல் மீட்பு' : 'Reset Password'}
        </h2>
        <p className="mt-2 text-xs sm:text-sm text-gray-600">
          {language === 'ta' 
            ? 'உங்கள் பதிவுசெய்த மின்னஞ்சலை உள்ளிட்டு கடவுச்சொல் மீட்பு இணைப்பைப் பெறுங்கள்' 
            : 'Enter your registered email to receive password recovery instructions'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl border border-gray-200 rounded-2xl sm:rounded-3xl">
          
          <form className="space-y-5" onSubmit={handleSubmit} noValidate>
            
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

            {/* Email Field */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                {language === 'ta' ? 'மின்னஞ்சல் முகவரி' : 'Registered Email Address'}
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
                  className="w-full pl-10 pr-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-agri-500 focus:bg-white transition-colors"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center py-2.5 px-4 bg-agri-600 hover:bg-agri-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    <span>{language === 'ta' ? 'அனுப்பப்படுகிறது...' : 'Sending...'}</span>
                  </>
                ) : (
                  <span>{language === 'ta' ? 'மீட்பு இணைப்பை அனுப்புக' : 'Send Reset Instructions'}</span>
                )}
              </button>
            </div>

          </form>

          {/* Back to Login Link */}
          <div className="mt-6 pt-6 border-t border-gray-100 text-center">
            <Link 
              to="/login" 
              className="inline-flex items-center text-xs font-bold text-agri-600 hover:text-agri-700 hover:underline"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
              <span>{language === 'ta' ? 'உள்நுழைவுக்குத் திரும்பு' : 'Back to Sign In'}</span>
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
