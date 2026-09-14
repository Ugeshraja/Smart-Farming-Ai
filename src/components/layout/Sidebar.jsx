import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  CloudSun,
  Scan,
  Bot,
  Users,
  BookOpen,
  CalendarDays,
  History,
  FileText,
  Mic,
  Settings,
  LogOut,
  Leaf,
  X,
  User,
  Landmark,
  Sprout
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar({ isOpen, onClose }) {
  const { t, language } = useLanguage();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { path: '/dashboard', label: t('dashboard'), icon: LayoutDashboard },
    { path: '/my-field', label: language === 'ta' ? 'என் நிலம்' : 'My Field', icon: Sprout },
    { path: '/crop-disease', label: t('cropDetection'), icon: Scan },
    { path: '/ai-assistant', label: t('farmerAssistant'), icon: Bot },
    { path: '/weather', label: t('weather'), icon: CloudSun },
    { path: '/library', label: t('library'), icon: BookOpen },
    { path: '/government-schemes', label: language === 'ta' ? 'அரசு திட்டங்கள்' : 'Government Schemes', icon: Landmark },
    { path: '/farming-planner', label: t('planner'), icon: CalendarDays },
    { path: '/history', label: t('predictionHistory'), icon: History },
    { path: '/reports', label: t('aiReports'), icon: FileText },
    { path: '/voice-assistant', label: t('voiceAssistant'), icon: Mic },
    { path: '/community', label: t('community'), icon: Users },
    { path: '/settings', label: t('settings'), icon: Settings },
    { path: '/profile', label: language === 'ta' ? 'விவசாயி சுயவிவரம்' : 'Farmer Profile', icon: User },
  ];

  const handleLogout = async () => {
    onClose?.();
    await logout();
    navigate('/login', { replace: true });
  };

  const handleProfileClick = () => {
    onClose?.();
    navigate('/profile');
  };

  const handleBrandClick = () => {
    onClose?.();
    navigate('/');
  };

  return (
    <>
      {/* Mobile backdrop overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/30 backdrop-blur-xs z-30 lg:hidden"
        />
      )}

      <aside className={`
        fixed top-0 bottom-0 left-0 z-40 w-64 bg-white border-r border-gray-200 flex flex-col justify-between transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Top Header Logo */}
        <div>
          <div className="h-16 px-6 flex items-center justify-between border-b border-gray-100">
            <div
              onClick={handleBrandClick}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleBrandClick();
                }
              }}
              className="flex items-center space-x-2.5 cursor-pointer select-none group"
              title="SmartFarm AI"
            >
              <div className="w-9 h-9 rounded-xl bg-agri-600 flex items-center justify-center text-white shadow-xs group-hover:bg-agri-700 transition-colors">
                <Leaf className="w-5 h-5" />
              </div>
              <div>
                <span className="text-lg font-extrabold text-gray-900 tracking-tight block leading-none group-hover:text-agri-700 transition-colors">
                  SmartFarm <span className="text-agri-600">AI</span>
                </span>
                <span className="text-[10px] text-gray-500 font-medium">Unified Smart Farming</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="lg:hidden p-1.5 text-gray-400 hover:text-gray-600 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-140px)]">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={({ isActive }) => `
                    flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150
                    ${isActive
                      ? 'bg-agri-600 text-white font-semibold shadow-2xs'
                      : 'text-gray-700 hover:bg-agri-50 hover:text-agri-700'
                    }
                  `}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Bottom Sidebar: User Info & Logout */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/50">
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-gray-200 shadow-2xs">
            <button
              onClick={handleProfileClick}
              className="flex items-center space-x-2.5 min-w-0 text-left hover:opacity-80 transition-opacity"
              title="View Farmer Profile"
            >
              <div className="w-8 h-8 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-600 shrink-0">
                <User className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-gray-900 truncate leading-tight">{user?.name || "UGESHRAJA S"}</p>
                <p className="text-[11px] text-gray-500 truncate leading-tight">{user?.email || "ugeshraja@example.com"}</p>
              </div>
            </button>

            <button
              onClick={handleLogout}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0 ml-1"
              title={language === 'ta' ? 'வெளியேறு' : 'Logout'}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
