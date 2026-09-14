import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Heart,
  MessageSquare,
  Share2,
  Search,
  X,
  Send,
  CheckCircle2,
  User
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/apiService';

export default function Community() {
  const { t, language } = useLanguage();
  const { user } = useAuth();

  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [selectedCrop, setSelectedCrop] = useState('All');
  const [selectedLang, setSelectedLang] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Create Post Modal State
  const [showModal, setShowModal] = useState(false);
  const [newCrop, setNewCrop] = useState('Tomato');
  const [newTopic, setNewTopic] = useState('Crop Disease');
  const [newPostLang, setNewPostLang] = useState(language || 'en');
  const [newContent, setNewContent] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    async function loadPosts() {
      const data = await apiService.getCommunityPosts();
      setPosts(data);
      setFilteredPosts(data);
    }
    loadPosts();
  }, []);

  useEffect(() => {
    let result = [...posts];

    if (selectedCrop !== 'All') {
      result = result.filter(p => p.crop.toLowerCase() === selectedCrop.toLowerCase());
    }

    if (selectedLang !== 'All') {
      result = result.filter(p => p.language === selectedLang);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p =>
        p.content.toLowerCase().includes(q) ||
        p.farmerName.toLowerCase().includes(q) ||
        p.topic.toLowerCase().includes(q)
      );
    }

    setFilteredPosts(result);
  }, [selectedCrop, selectedLang, searchQuery, posts]);

  const handleLike = (postId) => {
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return { ...p, likes: p.likes + 1 };
      }
      return p;
    }));
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newContent.trim()) return;

    const created = await apiService.createCommunityPost({
      crop: newCrop,
      topic: newTopic,
      language: newPostLang,
      content: newContent,
    });

    setPosts(prev => [created, ...prev]);
    setShowModal(false);
    setNewContent('');
    setToastMessage(language === 'ta' ? 'பதிவு வெற்றி பெற்றது!' : 'Community post published successfully!');
    setTimeout(() => setToastMessage(''), 3000);
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

      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight flex items-center space-x-2">
            <Users className="w-6 h-6 text-agri-600" />
            <span>{t('communityTitle')}</span>
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">
            {t('communitySubtitle')}
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-5 py-2.5 bg-agri-600 hover:bg-agri-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center space-x-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{t('createPost')}</span>
        </button>
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">

          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search discussions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-agri-500"
            />
          </div>

          {/* Crop Category Filter */}
          <div>
            <select
              value={selectedCrop}
              onChange={(e) => setSelectedCrop(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-agri-500 font-medium"
            >
              <option value="All">{t('allCrops')} (Tomato, Potato, Brinjal)</option>
              <option value="Tomato">{t('tomato')} (தக்காளி)</option>
              <option value="Potato">{t('potato')} (உருளை)</option>
              <option value="Brinjal">{t('brinjal')} (கத்தரி)</option>
            </select>
          </div>

          {/* Language Filter */}
          <div>
            <select
              value={selectedLang}
              onChange={(e) => setSelectedLang(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-agri-500 font-medium"
            >
              <option value="All">{t('allLanguages')}</option>
              <option value="en">🇬🇧 English</option>
              <option value="ta">🇮🇳 தமிழ் (Tamil)</option>
            </select>
          </div>

        </div>
      </div>

      {/* Community Posts Stream (No profile avatars) */}
      <div className="space-y-4">
        {filteredPosts.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-gray-200 shadow-2xs text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-agri-50 text-agri-600 flex items-center justify-center mx-auto border border-agri-200">
              <Users className="w-7 h-7" />
            </div>
            <div className="max-w-md mx-auto space-y-1">
              <h3 className="text-base font-bold text-gray-900">
                {language === 'ta' ? 'விவசாயக் கலந்துரையாடல்கள் இல்லை' : 'No community discussions yet'}
              </h3>
              <p className="text-xs text-gray-500">
                {language === 'ta'
                  ? 'உங்கள் தக்காளி, உருளைக்கிழங்கு, கத்தரி பயிர் சாகுபடி அனுபவத்தைப் பகிர முதல் பதிவைத் தொடங்குங்கள்!'
                  : 'Be the first farmer to start a discussion or ask a question to fellow Solanaceae growers!'}
              </p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="px-5 py-2.5 bg-agri-600 hover:bg-agri-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors inline-flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>{language === 'ta' ? 'முதல் பதிவை உருவாக்கவும்' : 'Start Discussion'}</span>
            </button>
          </div>
        ) : (
          filteredPosts.map((post) => (
            <div key={post.id} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-4 hover:shadow-xs transition-shadow">

              {/* Author Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-600">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-gray-900 text-sm block">{post.farmerName}</span>
                    <span className="text-[11px] text-gray-400">{post.createdAt}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-agri-50 text-agri-700 text-xs font-bold border border-agri-200">
                    {post.crop}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 text-[10px] uppercase font-mono font-semibold">
                    {post.language === 'ta' ? 'தமிழ்' : 'English'}
                  </span>
                </div>
              </div>

              {/* Post Content Text */}
              <p className="text-sm text-gray-800 leading-relaxed font-medium">
                {post.content}
              </p>

              {/* Comments List */}
              {post.comments && post.comments.length > 0 && (
                <div className="bg-gray-50/80 p-3 rounded-xl space-y-2 border border-gray-100 text-xs">
                  <span className="font-bold text-gray-700 block">Replies ({post.comments.length}):</span>
                  {post.comments.map(c => (
                    <div key={c.id} className="bg-white p-2.5 rounded-lg border border-gray-200 space-y-0.5">
                      <div className="flex justify-between font-bold text-gray-800 text-[11px]">
                        <span>{c.author}</span>
                        <span className="text-gray-400 font-normal">{c.time}</span>
                      </div>
                      <p className="text-gray-700 text-xs">{c.text}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Footer Action Buttons */}
              <div className="flex items-center space-x-4 border-t border-gray-100 pt-3 text-xs">
                <button
                  onClick={() => handleLike(post.id)}
                  className="flex items-center space-x-1.5 text-gray-500 hover:text-red-600 font-semibold transition-colors"
                >
                  <Heart className="w-4 h-4 text-red-500 fill-red-500/20" />
                  <span>{post.likes} {t('like')}</span>
                </button>

                <button
                  onClick={() => alert("Write your response to this post:")}
                  className="flex items-center space-x-1.5 text-gray-500 hover:text-agri-600 font-semibold transition-colors"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>{t('reply')}</span>
                </button>

                <button
                  onClick={() => alert("Link copied to share community discussion.")}
                  className="flex items-center space-x-1.5 text-gray-500 hover:text-gray-800 font-semibold transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Share</span>
                </button>
              </div>

            </div>
          )))}
      </div>

      {/* Create Post Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-gray-200 p-6 space-y-4">

            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-lg font-bold text-gray-900">{t('postModalTitle')}</h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-4 text-xs">

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Crop Selection</label>
                  <select
                    value={newCrop}
                    onChange={(e) => setNewCrop(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 focus:ring-2 focus:ring-agri-500 font-semibold"
                  >
                    <option value="Tomato">Tomato (தக்காளி)</option>
                    <option value="Potato">Potato (உருளை)</option>
                    <option value="Brinjal">Brinjal (கத்தரி)</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Post Language</label>
                  <select
                    value={newPostLang}
                    onChange={(e) => setNewPostLang(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 focus:ring-2 focus:ring-agri-500 font-semibold"
                  >
                    <option value="en">English</option>
                    <option value="ta">தமிழ் (Tamil)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Discussion Topic</label>
                <input
                  type="text"
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value)}
                  placeholder="e.g. Leaf Spot Symptoms, Irrigation..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800"
                />
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Post Content</label>
                <textarea
                  rows={4}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder={newPostLang === 'ta' ? 'உங்கள் விவசாய சந்தேகங்களை எழுதவும்...' : 'Write your farming question or experience...'}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs text-gray-800 focus:ring-2 focus:ring-agri-500"
                  required
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-agri-600 hover:bg-agri-700 text-white font-bold rounded-xl shadow-xs flex items-center space-x-1"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Publish Post</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
