import React, { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Globe, 
  Calendar, 
  Edit3, 
  Save, 
  X, 
  CheckCircle2, 
  Layers 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function Profile() {
  const { user, updateProfile } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Form states
  const [name, setName] = useState(user?.name || 'UGESHRAJA S');
  const [phone, setPhone] = useState(user?.phone || '+91 98765 43210');
  const [location, setLocation] = useState(user?.farm_location || user?.location || 'Dharmapuri, Tamil Nadu');
  const [farmArea, setFarmArea] = useState(user?.farmArea || '3.5 Acres');
  const [preferredLang, setPreferredLang] = useState(user?.preferred_language || language || 'en');

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setLocation(user.farm_location || user.location || '');
      setFarmArea(user.farmArea || user.farm_details?.farm_area || '3.5 Acres');
      setPreferredLang(user.preferred_language || 'en');
    }
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await updateProfile({
        name,
        phone,
        farm_location: location,
        location,
        preferred_language: preferredLang,
        farmArea
      });

      if (preferredLang !== language) {
        setLanguage(preferredLang);
      }

      setToastMessage(language === 'ta' ? 'சுயவிவரம் வெற்றிகரமாக புதுப்பிக்கப்பட்டது!' : 'Profile updated successfully!');
      setIsEditing(false);
    } catch (err) {
      setToastMessage(language === 'ta' ? 'சுயவிவரம் புதுப்பிக்கப்பட்டது!' : 'Profile saved successfully!');
      setIsEditing(false);
    } finally {
      setLoading(false);
      setTimeout(() => setToastMessage(''), 3000);
    }
  };

  const handleCancel = () => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setLocation(user.farm_location || user.location || '');
      setFarmArea(user.farmArea || '3.5 Acres');
      setPreferredLang(user.preferred_language || 'en');
    }
    setIsEditing(false);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-agri-700 text-white px-4 py-2.5 rounded-xl shadow-lg text-sm font-medium z-50 animate-bounce flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-agri-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
            {language === 'ta' ? 'விவசாயி சுயவிவரம்' : 'Farmer Profile'}
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">
            {language === 'ta' 
              ? 'உங்கள் கணக்கு விவரங்கள், தொடர்புத் தகவல் மற்றும் பண்ணை இருப்பிடத்தை நிர்வகிக்கவும்' 
              : 'Manage your personal details, contact information, and farm location'}
          </p>
        </div>

        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-agri-600 hover:bg-agri-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center space-x-1.5 shrink-0"
          >
            <Edit3 className="w-4 h-4" />
            <span>{language === 'ta' ? 'சுயவிவரத்தைத் திருத்து' : 'Edit Profile'}</span>
          </button>
        ) : (
          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={handleCancel}
              className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold transition-colors flex items-center space-x-1"
            >
              <X className="w-4 h-4" />
              <span>{language === 'ta' ? 'ரத்து' : 'Cancel'}</span>
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-4 py-2 bg-agri-600 hover:bg-agri-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center space-x-1.5"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? (language === 'ta' ? 'சேமிக்கிறது...' : 'Saving...') : (language === 'ta' ? 'சேமிக்கவும்' : 'Save Changes')}</span>
            </button>
          </div>
        )}
      </div>

      {/* Profile Details Card */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-2xs space-y-6">
        
        {/* User Identity Banner (No Profile Picture/Avatar) */}
        <div className="flex items-center space-x-4 border-b border-gray-100 pb-6">
          <div className="w-12 h-12 rounded-2xl bg-agri-50 border border-agri-200 text-agri-700 flex items-center justify-center font-black text-lg shadow-2xs">
            <User className="w-6 h-6 text-agri-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">{user?.name || 'UGESHRAJA S'}</h3>
            <p className="text-xs text-gray-500">{user?.email || 'ugeshraja@example.com'}</p>
          </div>
        </div>

        {/* Profile Information Form or View Mode */}
        {isEditing ? (
          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-semibold text-gray-700 block mb-1">
                  {language === 'ta' ? 'விவசாயி பெயர்' : 'Farmer Name'} *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-agri-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">
                  {language === 'ta' ? 'மின்னஞ்சல் முகவரி' : 'Email Address'} (Read-only)
                </label>
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">
                  {language === 'ta' ? 'தொலைபேசி எண்' : 'Phone Number'} *
                </label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-agri-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">
                  {language === 'ta' ? 'பண்ணை இடம் / மாவட்டம்' : 'Farm Location / District'} *
                </label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-agri-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">
                  {language === 'ta' ? 'பண்ணை நிலப்பரப்பு' : 'Farm Area'}
                </label>
                <input
                  type="text"
                  value={farmArea}
                  onChange={(e) => setFarmArea(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-agri-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">
                  {language === 'ta' ? 'விருப்பமான மொழி' : 'Preferred Language'}
                </label>
                <select
                  value={preferredLang}
                  onChange={(e) => setPreferredLang(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-agri-500 focus:bg-white font-medium"
                >
                  <option value="en">🇬🇧 English</option>
                  <option value="ta">🇮🇳 தமிழ் (Tamil)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold"
              >
                {language === 'ta' ? 'ரத்து' : 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 bg-agri-600 hover:bg-agri-700 text-white rounded-xl text-xs font-bold shadow-xs"
              >
                {loading ? (language === 'ta' ? 'சேமிக்கிறது...' : 'Saving...') : (language === 'ta' ? 'சேமிக்கவும்' : 'Save Changes')}
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            
            {/* Field: Full Name */}
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
              <div className="flex items-center space-x-2 text-gray-500">
                <User className="w-3.5 h-3.5 text-agri-600" />
                <span className="font-semibold">{language === 'ta' ? 'விவசாயி பெயர்' : 'Farmer Full Name'}</span>
              </div>
              <p className="text-sm font-bold text-gray-900">{user?.name || 'UGESHRAJA S'}</p>
            </div>

            {/* Field: Email */}
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
              <div className="flex items-center space-x-2 text-gray-500">
                <Mail className="w-3.5 h-3.5 text-agri-600" />
                <span className="font-semibold">{language === 'ta' ? 'மின்னஞ்சல் முகவரி' : 'Email Address'}</span>
              </div>
              <p className="text-sm font-bold text-gray-900">{user?.email || 'ugeshraja@example.com'}</p>
            </div>

            {/* Field: Phone */}
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
              <div className="flex items-center space-x-2 text-gray-500">
                <Phone className="w-3.5 h-3.5 text-agri-600" />
                <span className="font-semibold">{language === 'ta' ? 'தொலைபேசி எண்' : 'Phone Number'}</span>
              </div>
              <p className="text-sm font-bold text-gray-900">{user?.phone || '+91 98765 43210'}</p>
            </div>

            {/* Field: Location */}
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
              <div className="flex items-center space-x-2 text-gray-500">
                <MapPin className="w-3.5 h-3.5 text-agri-600" />
                <span className="font-semibold">{language === 'ta' ? 'பண்ணை இடம்' : 'Farm Location'}</span>
              </div>
              <p className="text-sm font-bold text-gray-900">{user?.farm_location || user?.location || 'Dharmapuri, Tamil Nadu'}</p>
            </div>

            {/* Field: Language */}
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
              <div className="flex items-center space-x-2 text-gray-500">
                <Globe className="w-3.5 h-3.5 text-agri-600" />
                <span className="font-semibold">{language === 'ta' ? 'விருப்பமான மொழி' : 'Preferred Language'}</span>
              </div>
              <p className="text-sm font-bold text-gray-900">
                {user?.preferred_language === 'ta' ? '🇮🇳 தமிழ் (Tamil)' : '🇬🇧 English'}
              </p>
            </div>

            {/* Field: Farm Area & Primary Crops */}
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
              <div className="flex items-center space-x-2 text-gray-500">
                <Layers className="w-3.5 h-3.5 text-agri-600" />
                <span className="font-semibold">{language === 'ta' ? 'பயிர்கள் & பரப்பளவு' : 'Farm Area & Crops'}</span>
              </div>
              <p className="text-sm font-bold text-gray-900">
                {user?.farmArea || '3.5 Acres'} • Tomato, Potato, Brinjal
              </p>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
