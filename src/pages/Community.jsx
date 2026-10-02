import React, { useState, useEffect, useCallback } from 'react';
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
  AlertCircle,
  RefreshCw,
  Trash2,
  MapPin,
  Sprout,
  Calendar
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/apiService';
import { supabase } from '../lib/supabaseClient';
import {
  getAuthorDisplayName,
  getAuthorInitials,
  getAvatarColor,
  formatRelativeTime
} from '../utils/communityUtils';

export default function Community() {
  const { t, language } = useLanguage();
  const { user } = useAuth();

  const isTa = language === 'ta';

  // Data states
  const [members, setMembers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Search
  const [selectedCrop, setSelectedCrop] = useState('All');
  const [selectedLang, setSelectedLang] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Create Post Modal State
  const [showModal, setShowModal] = useState(false);
  const [newCrop, setNewCrop] = useState('Tomato');
  const [newTopic, setNewTopic] = useState('Crop Health');
  const [newPostLang, setNewPostLang] = useState(language || 'en');
  const [newContent, setNewContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Comment reply state (keyed by postId)
  const [activeReplyPostId, setActiveReplyPostId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  // Initial Data Fetcher
  const loadData = useCallback(async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    setError(null);

    try {
      const [membersData, postsData] = await Promise.all([
        apiService.getCommunityMembers(),
        apiService.getCommunityPosts()
      ]);

      setMembers(Array.isArray(membersData) ? membersData : []);
      const validPosts = Array.isArray(postsData) ? postsData : [];
      setPosts(validPosts);
      setFilteredPosts(validPosts);
    } catch (err) {
      console.error("[Community] Load error:", err);
      setError(
        isTa
          ? 'சமூகத் தரவை ஏற்ற முடியவில்லை. மீண்டும் முயற்சிக்கவும்.'
          : 'Unable to load community. Please try again.'
      );
    } finally {
      if (showSpinner) setLoading(false);
    }
  }, [isTa]);

  useEffect(() => {
    loadData(true);
  }, [loadData]);

  // Supabase Realtime Subscription
  useEffect(() => {
    const channel = supabase
      .channel('public:community_feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'community_posts' }, (payload) => {
        console.log('[Community Realtime] Post event:', payload.eventType);
        loadData(false);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'community_comments' }, (payload) => {
        console.log('[Community Realtime] Comment event:', payload.eventType);
        loadData(false);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'community_likes' }, (payload) => {
        console.log('[Community Realtime] Like event:', payload.eventType);
        loadData(false);
      })
      .subscribe((status) => {
        console.log('[Community Realtime] Subscription status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadData]);

  // Filtering Logic
  useEffect(() => {
    let result = [...posts];

    if (selectedCrop !== 'All') {
      result = result.filter(p => (p.crop || '').toLowerCase() === selectedCrop.toLowerCase());
    }

    if (selectedLang !== 'All') {
      result = result.filter(p => p.language === selectedLang);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p => {
        const content = (p.content || '').toLowerCase();
        const author = (p.farmerName || p.author_name || '').toLowerCase();
        const topic = (p.topic || '').toLowerCase();
        return content.includes(q) || author.includes(q) || topic.includes(q);
      });
    }

    setFilteredPosts(result);
  }, [selectedCrop, selectedLang, searchQuery, posts]);

  // Like / Unlike action
  const handleLike = async (postId) => {
    // Optimistic UI update
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        const wasLiked = p.has_liked;
        return {
          ...p,
          has_liked: !wasLiked,
          likes: wasLiked ? Math.max(0, p.likes - 1) : p.likes + 1
        };
      }
      return p;
    }));

    try {
      const res = await apiService.likeCommunityPost(postId);
      if (res && res.likes !== undefined) {
        setPosts(prev => prev.map(p => {
          if (p.id === postId) {
            return { ...p, likes: res.likes, has_liked: res.has_liked };
          }
          return p;
        }));
      }
    } catch (e) {
      console.warn("Like error, reverting:", e?.message);
      // Revert on failure
      loadData(false);
    }
  };

  // Create Post
  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newContent.trim()) return;

    setSubmitting(true);
    try {
      const created = await apiService.createCommunityPost({
        crop: newCrop,
        topic: newTopic,
        language: newPostLang,
        content: newContent.trim(),
      });

      setPosts(prev => [created, ...prev]);
      setShowModal(false);
      setNewContent('');
      setToastMessage(
        isTa
          ? 'பதிவு வெற்றிகரமாக பகிரப்பட்டது!'
          : 'Community post published successfully!'
      );
      setTimeout(() => setToastMessage(''), 3000);
    } catch (err) {
      setToastMessage(
        isTa
          ? 'பதிவை உருவாக்க முடியவில்லை. உள்நுழைந்துள்ளீர்களா என்பதை உறுதிப்படுத்தவும்.'
          : 'Failed to publish post. Please verify you are logged in.'
      );
      setTimeout(() => setToastMessage(''), 4000);
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Post (Author only)
  const handleDeletePost = async (postId) => {
    if (!window.confirm(isTa ? 'இந்த பதிவை நிச்சயமாக நீக்க விரும்புகிறீர்களா?' : 'Are you sure you want to delete this post?')) {
      return;
    }

    try {
      await apiService.deleteCommunityPost(postId);
      setPosts(prev => prev.filter(p => p.id !== postId));
      setToastMessage(isTa ? 'பதிவு நீக்கப்பட்டது!' : 'Post deleted successfully!');
      setTimeout(() => setToastMessage(''), 3000);
    } catch (e) {
      alert(isTa ? 'பதிவை நீக்க முடியவில்லை.' : 'Failed to delete post.');
    }
  };

  // Add Comment Reply
  const handleAddComment = async (postId) => {
    if (!replyText.trim()) return;

    setSubmittingReply(true);
    try {
      const newComment = await apiService.addCommunityComment(postId, replyText.trim());
      setPosts(prev => prev.map(p => {
        if (p.id === postId) {
          const currentComments = p.comments || [];
          return {
            ...p,
            comments: [...currentComments, newComment]
          };
        }
        return p;
      }));
      setReplyText('');
      setActiveReplyPostId(null);
      setToastMessage(isTa ? 'பதில் பகிரப்பட்டது!' : 'Reply submitted!');
      setTimeout(() => setToastMessage(''), 3000);
    } catch (e) {
      alert(isTa ? 'பதிலை சேர்க்க முடியவில்லை.' : 'Failed to submit reply.');
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleShare = (post) => {
    try {
      navigator.clipboard.writeText(window.location.href);
      setToastMessage(isTa ? 'இணைப்பு நகலெடுக்கப்பட்டது!' : 'Link copied to clipboard!');
      setTimeout(() => setToastMessage(''), 3000);
    } catch {
      alert(isTa ? 'இணைப்பை பகிரவும்.' : 'Share link copied.');
    }
  };

  const currentUserId = user?.user_id || user?.id;

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

      {/* Registered Community Members Directory Card */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sprout className="w-4 h-4 text-agri-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">
              {isTa ? 'விவசாயக் கூட்டமைப்பு உறுப்பினர்கள்' : 'Community Members'}
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-agri-100 text-agri-800 text-[10px] font-extrabold">
              {members.length} {isTa ? 'உறுப்பினர்கள்' : 'Registered Farmers'}
            </span>
          </div>
          <button
            onClick={() => loadData(true)}
            title="Refresh community"
            className="p-1.5 text-gray-400 hover:text-agri-600 rounded-lg hover:bg-agri-50 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Member Avatar Badges Horizontal Scroll */}
        {members.length === 0 ? (
          <p className="text-xs text-gray-400 italic">
            {isTa ? 'உறுப்பினர்கள் ஏற்றப்படுகிறார்கள்...' : 'No community members registered yet.'}
          </p>
        ) : (
          <div className="flex items-center space-x-3 overflow-x-auto pb-2 pt-1 scrollbar-thin">
            {members.map((m) => {
              const displayName = getAuthorDisplayName(m.name || m.display_name);
              const initials = getAuthorInitials(displayName);
              const colorClass = getAvatarColor(displayName);
              const isCurrentUser = currentUserId && (m.id === currentUserId || m.user_id === currentUserId);

              return (
                <div
                  key={m.id || m.user_id}
                  className="flex items-center space-x-2.5 px-3 py-2 rounded-xl bg-gray-50 border border-gray-100 shrink-0 hover:bg-agri-50/50 transition-colors"
                  title={`${displayName} - ${m.location || 'Tamil Nadu, India'}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border ${colorClass} shrink-0`}>
                    {initials}
                  </div>
                  <div className="text-left">
                    <span className="text-xs font-bold text-gray-800 block truncate max-w-[110px]">
                      {displayName} {isCurrentUser && <span className="text-[10px] text-agri-600">({isTa ? 'நீங்கள்' : 'You'})</span>}
                    </span>
                    <span className="text-[10px] text-gray-400 flex items-center space-x-1 truncate max-w-[110px]">
                      <MapPin className="w-2.5 h-2.5 shrink-0" />
                      <span>{m.location ? m.location.split(',')[0] : 'Tamil Nadu'}</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">

          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder={isTa ? "கலந்துரையாடல்களைத் தேடவும்..." : "Search discussions..."}
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

      {/* Community Posts Stream */}
      <div className="space-y-4">

        {/* Loading State */}
        {loading && (
          <div className="bg-white p-12 rounded-2xl border border-gray-200 shadow-2xs text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-agri-600 animate-spin mx-auto" />
            <p className="text-xs font-semibold text-gray-600">
              {isTa ? 'விவசாயக் கலந்துரையாடல்கள் ஏற்றப்படுகிறது...' : 'Loading community discussions...'}
            </p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="bg-white p-8 rounded-2xl border border-red-200 shadow-2xs text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
            <p className="text-xs font-semibold text-red-600">{error}</p>
            <button
              onClick={() => loadData(true)}
              className="px-4 py-2 bg-agri-600 hover:bg-agri-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors inline-flex items-center space-x-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{isTa ? 'மீண்டும் முயற்சிக்கவும்' : 'Retry'}</span>
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredPosts.length === 0 && (
          <div className="bg-white p-12 rounded-2xl border border-gray-200 shadow-2xs text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-agri-50 text-agri-600 flex items-center justify-center mx-auto border border-agri-200">
              <Users className="w-7 h-7" />
            </div>
            <div className="max-w-md mx-auto space-y-1">
              <h3 className="text-base font-bold text-gray-900">
                {isTa ? 'விவசாயக் கலந்துரையாடல்கள் இல்லை' : 'No community discussions yet'}
              </h3>
              <p className="text-xs text-gray-500">
                {isTa
                  ? 'உங்கள் தக்காளி, உருளைக்கிழங்கு, கத்தரி பயிர் சாகுபடி அனுபவத்தைப் பகிர முதல் பதிவைத் தொடங்குங்கள்!'
                  : 'Be the first farmer to start a discussion or ask a question to fellow Solanaceae growers!'}
              </p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="px-5 py-2.5 bg-agri-600 hover:bg-agri-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors inline-flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>{isTa ? 'முதல் பதிவை உருவாக்கவும்' : 'Start Discussion'}</span>
            </button>
          </div>
        )}

        {/* Posts Stream */}
        {!loading && !error && filteredPosts.map((post) => {
          const authorName = getAuthorDisplayName(post.farmerName || post.author_name);
          const initials = getAuthorInitials(authorName);
          const avatarColor = getAvatarColor(authorName);
          const relativeTime = formatRelativeTime(post.created_at || post.createdAt, language);
          const isAuthor = currentUserId && (post.user_id === currentUserId || post.author_id === currentUserId);
          const isReplying = activeReplyPostId === post.id;

          return (
            <div
              key={post.id}
              className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-4 hover:shadow-xs transition-shadow"
            >

              {/* Author Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs border ${avatarColor} shrink-0`}>
                    {initials}
                  </div>
                  <div>
                    <span className="font-bold text-gray-900 text-sm block">
                      {authorName} {isAuthor && <span className="text-[10px] text-agri-600 font-normal">({isTa ? 'நீங்கள்' : 'You'})</span>}
                    </span>
                    <span className="text-[11px] text-gray-400 font-medium">
                      {relativeTime}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-agri-50 text-agri-700 text-xs font-bold border border-agri-200">
                    {post.crop || 'General'}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 text-[10px] uppercase font-mono font-semibold">
                    {post.language === 'ta' ? 'தமிழ்' : 'English'}
                  </span>
                  {isAuthor && (
                    <button
                      onClick={() => handleDeletePost(post.id)}
                      title="Delete post"
                      className="p-1 text-gray-400 hover:text-red-500 rounded-md transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Topic Badge if present */}
              {post.topic && (
                <div className="text-xs font-bold text-agri-800 bg-agri-50/60 px-3 py-1 rounded-lg inline-block">
                  📌 {post.topic}
                </div>
              )}

              {/* Post Content Text */}
              <p className="text-sm text-gray-800 leading-relaxed font-medium whitespace-pre-wrap">
                {post.content}
              </p>

              {/* Comments / Replies List */}
              {post.comments && post.comments.length > 0 && (
                <div className="bg-gray-50/80 p-3 rounded-xl space-y-2 border border-gray-100 text-xs">
                  <span className="font-bold text-gray-700 block">
                    {isTa ? `பதில்கள் (${post.comments.length}):` : `Replies (${post.comments.length}):`}
                  </span>
                  {post.comments.map((c) => {
                    const cAuthor = getAuthorDisplayName(c.author || c.author_name);
                    const cInitials = getAuthorInitials(cAuthor);
                    const cColor = getAvatarColor(cAuthor);
                    const cTime = formatRelativeTime(c.created_at || c.time, language);

                    return (
                      <div key={c.id} className="bg-white p-2.5 rounded-lg border border-gray-200 space-y-1">
                        <div className="flex items-center justify-between font-bold text-gray-800 text-[11px]">
                          <div className="flex items-center space-x-1.5">
                            <span className={`w-4 h-4 rounded-full text-[9px] flex items-center justify-center border font-bold ${cColor}`}>
                              {cInitials}
                            </span>
                            <span>{cAuthor}</span>
                          </div>
                          <span className="text-gray-400 font-normal">{cTime}</span>
                        </div>
                        <p className="text-gray-700 text-xs pl-5">{c.content || c.text}</p>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Reply Box if opened */}
              {isReplying && (
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
                  <textarea
                    rows={2}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={isTa ? 'உங்கள் பதிலை எழுதவும்...' : 'Write your response to this discussion...'}
                    className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-agri-500"
                  />
                  <div className="flex justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => { setActiveReplyPostId(null); setReplyText(''); }}
                      className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs rounded-lg font-medium"
                    >
                      {isTa ? 'ரத்து செய்' : 'Cancel'}
                    </button>
                    <button
                      type="button"
                      disabled={submittingReply || !replyText.trim()}
                      onClick={() => handleAddComment(post.id)}
                      className="px-3 py-1 bg-agri-600 hover:bg-agri-700 disabled:opacity-50 text-white text-xs rounded-lg font-bold inline-flex items-center space-x-1"
                    >
                      <Send className="w-3 h-3" />
                      <span>{isTa ? 'அனுப்பு' : 'Submit'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Footer Action Buttons */}
              <div className="flex items-center space-x-4 border-t border-gray-100 pt-3 text-xs">
                <button
                  onClick={() => handleLike(post.id)}
                  className={`flex items-center space-x-1.5 font-semibold transition-colors ${
                    post.has_liked
                      ? 'text-red-600'
                      : 'text-gray-500 hover:text-red-600'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${post.has_liked ? 'text-red-500 fill-red-500' : 'text-gray-400'}`} />
                  <span>{post.likes} {t('like')}</span>
                </button>

                <button
                  onClick={() => setActiveReplyPostId(isReplying ? null : post.id)}
                  className="flex items-center space-x-1.5 text-gray-500 hover:text-agri-600 font-semibold transition-colors"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>{t('reply')}</span>
                </button>

                <button
                  onClick={() => handleShare(post)}
                  className="flex items-center space-x-1.5 text-gray-500 hover:text-gray-800 font-semibold transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Share</span>
                </button>
              </div>

            </div>
          );
        })}
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
                  <label className="font-semibold text-gray-700 block mb-1">
                    {isTa ? 'பயிர் வகை' : 'Crop Selection'}
                  </label>
                  <select
                    value={newCrop}
                    onChange={(e) => setNewCrop(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 focus:ring-2 focus:ring-agri-500 font-semibold"
                  >
                    <option value="Tomato">Tomato (தக்காளி)</option>
                    <option value="Potato">Potato (உருளை)</option>
                    <option value="Brinjal">Brinjal (கத்தரி)</option>
                    <option value="General">{isTa ? 'பொதுவான விவசாயம்' : 'General Farming'}</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-gray-700 block mb-1">
                    {isTa ? 'பதிவின் மொழி' : 'Post Language'}
                  </label>
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
                <label className="font-semibold text-gray-700 block mb-1">
                  {isTa ? 'கலந்துரையாடல் தலைப்பு' : 'Discussion Topic'}
                </label>
                <input
                  type="text"
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value)}
                  placeholder={isTa ? "எ.கா: இலை கருகல் அறிகுறிகள், சொட்டு நீர் பாசனம்..." : "e.g. Early Blight Treatment, Drip Schedule..."}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 focus:ring-2 focus:ring-agri-500"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">
                  {isTa ? 'பதிவின் உள்ளடக்கம்' : 'Post Content'}
                </label>
                <textarea
                  rows={4}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder={
                    newPostLang === 'ta'
                      ? 'உங்கள் விவசாய சந்தேகங்களை அல்லது அனுபவங்களை எழுதவும்...'
                      : 'Write your Solanaceae farming question or field experience...'
                  }
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
                  {isTa ? 'ரத்து செய்' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={submitting || !newContent.trim()}
                  className="px-5 py-2 bg-agri-600 hover:bg-agri-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-xs flex items-center space-x-1"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submitting ? (isTa ? 'பகிரப்படுகிறது...' : 'Publishing...') : (isTa ? 'பதிவை வெளியிடு' : 'Publish Post')}</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
