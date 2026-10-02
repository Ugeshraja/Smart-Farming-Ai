/**
 * SmartFarm AI - Community Utilities
 * Provides:
 *  - Centralized relative timestamp formatting with UTC interpretation & localization (EN/TA)
 *  - Deterministic initials & avatar styling for registered farmer accounts
 *  - Author display name resolution adhering to strict priority rules
 */

/**
 * Resolves the display name for a user or profile adhering to priority:
 * 1. profile.display_name
 * 2. profile.full_name
 * 3. profile.name
 * 4. metadata.name
 * 5. email-derived name
 * 6. "Farmer" only as last resort
 */
export function getAuthorDisplayName(profile, fallback = 'Farmer') {
  if (!profile) return fallback;

  if (typeof profile === 'string') {
    const trimmed = profile.trim();
    if (trimmed && trimmed.toLowerCase() !== 'farmer') return trimmed;
    return fallback;
  }

  // 1. display_name
  if (profile.display_name && profile.display_name.trim()) {
    return profile.display_name.trim();
  }

  // 2. full_name
  if (profile.full_name && profile.full_name.trim()) {
    return profile.full_name.trim();
  }

  // 3. name
  if (profile.name && profile.name.trim()) {
    return profile.name.trim();
  }

  // 4. metadata name
  const meta = profile.user_metadata || profile.raw_user_meta_data;
  if (meta) {
    const metaName = meta.name || meta.display_name || meta.full_name;
    if (metaName && metaName.trim()) {
      return metaName.trim();
    }
  }

  // 5. email-derived username
  if (profile.email && typeof profile.email === 'string' && profile.email.includes('@')) {
    const userPart = profile.email.split('@')[0].trim();
    if (userPart) {
      return userPart.charAt(0).toUpperCase() + userPart.slice(1);
    }
  }

  return fallback;
}

/**
 * Generates clean uppercase initials from a name (e.g. "UGESHRAJA S" -> "US", "Kavitha Raman" -> "KR")
 */
export function getAuthorInitials(name) {
  if (!name || typeof name !== 'string') return 'F';
  const clean = name.trim().replace(/[^a-zA-Z0-9\s]/g, '');
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'F';
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Generates a consistent, aesthetic avatar background and text color based on name hash
 */
export function getAvatarColor(name) {
  const palettes = [
    { bg: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
    { bg: 'bg-blue-100 text-blue-800 border-blue-300' },
    { bg: 'bg-amber-100 text-amber-800 border-amber-300' },
    { bg: 'bg-purple-100 text-purple-800 border-purple-300' },
    { bg: 'bg-rose-100 text-rose-800 border-rose-300' },
    { bg: 'bg-teal-100 text-teal-800 border-teal-300' },
    { bg: 'bg-indigo-100 text-indigo-800 border-indigo-300' },
    { bg: 'bg-lime-100 text-lime-800 border-lime-300' },
  ];

  if (!name || typeof name !== 'string') return palettes[0].bg;

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % palettes.length;
  return palettes[index].bg;
}

/**
 * Formats a database UTC/ISO timestamp into an accurate relative time string.
 * Automatically converts to user's local timezone.
 * Supports both English and Tamil.
 */
export function formatRelativeTime(timestamp, language = 'en') {
  if (!timestamp) {
    return language === 'ta' ? 'சமீபத்தில்' : 'Just now';
  }

  // Parse ISO string (e.g. 2026-10-02T11:45:22.318096Z) as UTC Date
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) {
    return language === 'ta' ? 'சமீபத்தில்' : 'Just now';
  }

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  const isTa = language === 'ta';

  if (diffSec < 30) {
    return isTa ? 'சமீபத்தில்' : 'Just now';
  }

  if (diffMin < 60) {
    if (diffMin <= 1) {
      return isTa ? '1 நிமிடத்திற்கு முன்' : '1 minute ago';
    }
    return isTa ? `${diffMin} நிமிடங்களுக்கு முன்` : `${diffMin} minutes ago`;
  }

  if (diffHours < 24) {
    if (diffHours === 1) {
      return isTa ? '1 மணி நேரத்திற்கு முன்' : '1 hour ago';
    }
    return isTa ? `${diffHours} மணி நேரத்திற்கு முன்` : `${diffHours} hours ago`;
  }

  if (diffDays === 1) {
    return isTa ? 'நேற்று' : 'Yesterday';
  }

  if (diffDays < 7) {
    return isTa ? `${diffDays} நாட்களுக்கு முன்` : `${diffDays} days ago`;
  }

  // Localized date formatting for older records in the user's browser locale & timezone
  try {
    const locale = isTa ? 'ta-IN' : 'en-US';
    return new Intl.DateTimeFormat(locale, {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    }).format(date);
  } catch {
    return date.toLocaleDateString();
  }
}
