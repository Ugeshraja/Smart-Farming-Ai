import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Leaf, Mail, Lock, AlertCircle, Loader2, ArrowRight, Globe } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Destination after login - supports ?redirect=/target or location.state.from
  const searchParams = new URLSearchParams(location.search);
  const redirectParam = searchParams.get('redirect');
  const rawTarget = redirectParam || location.state?.from?.pathname;
  const targetDestination = (rawTarget && rawTarget.startsWith('/') && rawTarget !== '/' && !rawTarget.startsWith('/login') && !rawTarget.startsWith('/signup') && !rawTarget.startsWith('/forgot-password'))
    ? rawTarget
    : '/dashboard';

  // If already authenticated, redirect straight to intended destination or dashboard
  useEffect(() => {
    const hasStoredAuth = Boolean(
      localStorage.getItem('smartfarm_token') && localStorage.getItem('smartfarm_user')
    );
    if (isAuthenticated || hasStoredAuth) {
      navigate(targetDestination, { replace: true });
    }
  }, [isAuthenticated, navigate, targetDestination]);

  const validate = () => {
    if (!email.trim()) {
      return language === 'ta' ? 'மின்னஞ்சல் முகவரியை உள்ளிடவும்.' : 'Please enter your email address.';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return language === 'ta' ? 'சரியான மின்னஞ்சல் முகவரியை உள்ளிடவும்.' : 'Please enter a valid email address.';
    }
    if (!password) {
      return language === 'ta' ? 'கடவுச்சொல்லை உள்ளிடவும்.' : 'Please enter your password.';
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const validationError = validate();
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      navigate(targetDestination, { replace: true });
    } catch (err) {
      // User-friendly error message, never technical traceback
      const msg = language === 'ta' 
        ? 'தவறான மின்னஞ்சல் அல்லது கடவுச்சொல்.' 
        : 'Invalid email or password.';
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
        {/* Brand Logo */}
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-agri-600 text-white shadow-md mb-4">
          <Leaf className="w-8 h-8" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
          SmartFarm <span className="text-agri-600">AI</span>
        </h2>
        <p className="mt-2 text-xs sm:text-sm text-gray-600">
          {language === 'ta' 
            ? 'விவசாயி கணக்கில் உள்நுழைந்து உங்கள் பயிர்களைக் கண்காணிக்கவும்' 
            : 'Sign in to access your farmer dashboard and AI tools'}
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

            {/* Email Field */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                {language === 'ta' ? 'மின்னஞ்சல் முகவரி' : 'Email Address'}
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

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-gray-700">
                  {language === 'ta' ? 'கடவுச்சொல்' : 'Password'}
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold text-agri-600 hover:text-agri-700 hover:underline"
                >
                  {language === 'ta' ? 'கடவுச்சொல் மறந்துவிட்டதா?' : 'Forgot Password?'}
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
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
                    <span>{language === 'ta' ? 'சரிபார்க்கிறது...' : 'Signing in...'}</span>
                  </>
                ) : (
                  <>
                    <span>{language === 'ta' ? 'உள்நுழைக' : 'Sign In'}</span>
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </>
                )}
              </button>
            </div>

          </form>

          {/* Footer to Signup */}
          <div className="mt-6 pt-6 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-600">
              {language === 'ta' ? 'புதிய விவசாயியா?' : "Don't have a farmer account?"}{' '}
              <Link to="/signup" className="font-bold text-agri-600 hover:text-agri-700 hover:underline">
                {language === 'ta' ? 'இப்போதே பதிவு செய்க' : 'Sign Up here'}
              </Link>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
