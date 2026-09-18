import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { apiService, getUserStorageKey } from '../services/apiService';
import { evaluateFieldSuitability } from '../services/fieldEvaluator';

const AuthContext = createContext();

/**
 * Extracts a normalized user profile strictly from the authenticated Supabase user entity.
 * Uses the authentic Supabase user.id as canonical user_id across the entire application.
 */
function extractUserDataFromSupabaseUser(u, extraMetadata = {}) {
  if (!u) return null;
  const meta = { ...(u.user_metadata || {}), ...extraMetadata };
  return {
    id: u.id,
    user_id: u.id,
    email: (u.email || "").toLowerCase().trim(),
    name: meta.name || "Farmer",
    phone: meta.phone || "+91 98765 43210",
    location: meta.farm_location || meta.location || "Tamil Nadu, India",
    farm_location: meta.farm_location || meta.location || "Tamil Nadu, India",
    farmArea: meta.farm_details?.farm_area || meta.farmArea || "3.5 Acres",
    farm_details: meta.farm_details || {
      farm_area: "3.5 Acres",
      primary_crops: ["Tomato", "Potato", "Brinjal"]
    },
    primaryCrops: meta.farm_details?.primary_crops || ["Tomato", "Potato", "Brinjal"],
    preferred_language: meta.preferred_language || "ta",
    created_date: u.created_at || new Date().toISOString()
  };
}

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => {
    try {
      const storedToken = localStorage.getItem('smartfarm_token');
      if (storedToken && !storedToken.startsWith('demo_token')) {
        return storedToken;
      }
      return null;
    } catch {
      return null;
    }
  });

  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('smartfarm_user');
      const storedToken = localStorage.getItem('smartfarm_token');
      if (stored && storedToken && !storedToken.startsWith('demo_token')) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.user_id && !parsed.user_id.startsWith('00000000-0000-4000-a000')) {
          return parsed;
        }
      }
    } catch (e) {
      console.error("Error reading stored auth user:", e);
    }
    return null;
  });

  const [fieldProfile, setFieldProfile] = useState(() => {
    try {
      const storedUser = localStorage.getItem('smartfarm_user');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        const uid = parsed.user_id || parsed.id;
        if (uid && !uid.startsWith('00000000-0000-4000-a000')) {
          const userKey = getUserStorageKey('smartfarm_field_profile', uid);
          const cached = localStorage.getItem(userKey);
          if (cached) {
            const prof = JSON.parse(cached);
            delete prof.assessment;
            delete prof.field;
            return prof;
          }
        }
      }
    } catch {}
    return null;
  });

  const [fieldAssessment, setFieldAssessment] = useState(() => {
    try {
      const storedUser = localStorage.getItem('smartfarm_user');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        const uid = parsed.user_id || parsed.id;
        if (uid && !uid.startsWith('00000000-0000-4000-a000')) {
          const assessKey = getUserStorageKey('smartfarm_field_assessment', uid);
          const cached = localStorage.getItem(assessKey);
          if (cached) {
            return JSON.parse(cached);
          }
        }
      }
    } catch {}
    return null;
  });

  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Single source of truth for authentication
  const isAuthenticated = Boolean(user && token);

  // Sync token to localStorage
  useEffect(() => {
    if (token && !token.startsWith('demo_token')) {
      localStorage.setItem('smartfarm_token', token);
    } else {
      localStorage.removeItem('smartfarm_token');
    }
  }, [token]);

  // Sync user to localStorage
  useEffect(() => {
    if (user && user.user_id && !user.user_id.startsWith('00000000-0000-4000-a000')) {
      localStorage.setItem('smartfarm_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('smartfarm_user');
    }
  }, [user]);

  // Refresh field profile and assessment for current authenticated user
  const refreshFieldProfile = async (targetUser) => {
    const currentUser = targetUser || user;
    const uid = currentUser?.user_id || currentUser?.id;
    if (!uid) {
      setFieldProfile(null);
      setFieldAssessment(null);
      return;
    }

    try {
      const data = await apiService.getFieldProfile();
      if (data) {
        const profile = data.field || data;
        const cleanProfile = { ...profile };
        delete cleanProfile.assessment;
        delete cleanProfile.field;
        const assessment = data.assessment || evaluateFieldSuitability(cleanProfile);

        setFieldProfile(cleanProfile);
        setFieldAssessment(assessment);
        try {
          localStorage.setItem(getUserStorageKey('smartfarm_field_profile', uid), JSON.stringify(cleanProfile));
          localStorage.setItem(getUserStorageKey('smartfarm_field_assessment', uid), JSON.stringify(assessment));
        } catch {}
      }
    } catch (e) {
      console.warn("Error refreshing field profile:", e);
      if (fieldProfile) {
        const cleanProfile = { ...fieldProfile };
        delete cleanProfile.assessment;
        delete cleanProfile.field;
        const assessment = evaluateFieldSuitability(cleanProfile);
        setFieldAssessment(assessment);
        try {
          localStorage.setItem(getUserStorageKey('smartfarm_field_assessment', uid), JSON.stringify(assessment));
        } catch {}
      }
    }
  };

  // 1. Initial Session initialization with Supabase
  // 2. Continuous onAuthStateChange listener
  useEffect(() => {
    let mounted = true;

    async function initSession() {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.warn("[Auth] Supabase getSession error:", error.message);
        }

        const session = data?.session;
        if (session && session.user && mounted) {
          const normalized = extractUserDataFromSupabaseUser(session.user);
          const sessionToken = session.access_token;

          setToken(sessionToken);
          setUser(normalized);
          localStorage.setItem('smartfarm_token', sessionToken);
          localStorage.setItem('smartfarm_user', JSON.stringify(normalized));
        } else if (mounted) {
          // Verify if existing local token is stale/demo
          const localToken = localStorage.getItem('smartfarm_token');
          if (localToken && localToken.startsWith('demo_token')) {
            localStorage.removeItem('smartfarm_token');
            localStorage.removeItem('smartfarm_user');
            setToken(null);
            setUser(null);
          }
        }
      } catch (err) {
        console.warn("[Auth] Session initialization error:", err);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    initSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        if (session && session.user) {
          const normalized = extractUserDataFromSupabaseUser(session.user);
          const sessionToken = session.access_token;

          setToken(sessionToken);
          setUser(normalized);
          localStorage.setItem('smartfarm_token', sessionToken);
          localStorage.setItem('smartfarm_user', JSON.stringify(normalized));
        }
      } else if (event === 'SIGNED_OUT') {
        setToken(null);
        setUser(null);
        setFieldProfile(null);
        setFieldAssessment(null);
        localStorage.removeItem('smartfarm_token');
        localStorage.removeItem('smartfarm_user');
      }
    });

    return () => {
      mounted = false;
      authListener?.subscription?.unsubscribe?.();
    };
  }, []);

  // Sync field profile on authenticated user change
  useEffect(() => {
    if (user && user.user_id && token) {
      refreshFieldProfile(user);
    } else {
      setFieldProfile(null);
      setFieldAssessment(null);
    }
  }, [user?.user_id, token]);

  // Login handler using Supabase Auth
  const login = async (email, password) => {
    setLoading(true);
    setAuthError(null);
    const cleanEmail = (email || "").toLowerCase().trim();

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password
      });

      if (error) {
        throw error;
      }

      const sessionUser = data?.user;
      const sessionToken = data?.session?.access_token;
      if (!sessionUser || !sessionToken) {
        throw new Error("Authentication failed: No session returned from Supabase.");
      }

      const normalized = extractUserDataFromSupabaseUser(sessionUser);

      setToken(sessionToken);
      setUser(normalized);
      localStorage.setItem('smartfarm_token', sessionToken);
      localStorage.setItem('smartfarm_user', JSON.stringify(normalized));

      await refreshFieldProfile(normalized);
      return normalized;
    } catch (err) {
      const msg = err?.message || "Invalid email or password.";
      setAuthError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Sign up handler using Supabase Auth
  const signup = async (formData) => {
    setLoading(true);
    setAuthError(null);
    const cleanEmail = (formData.email || "").toLowerCase().trim();
    const password = formData.password;

    try {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            name: formData.name ? formData.name.trim() : "Farmer",
            phone: formData.phone || "+91 98765 43210",
            farm_location: formData.farm_location || formData.location || "Tamil Nadu, India",
            preferred_language: formData.preferred_language || "ta",
            farm_details: formData.farm_details || {
              farm_area: formData.farmArea || "3.5 Acres",
              primary_crops: formData.primaryCrops || ["Tomato", "Potato", "Brinjal"]
            }
          }
        }
      });

      if (error) {
        throw error;
      }

      const sessionUser = data?.user;
      if (!sessionUser) {
        throw new Error("Registration failed: User was not created in Supabase.");
      }

      const normalized = extractUserDataFromSupabaseUser(sessionUser, {
        name: formData.name ? formData.name.trim() : "Farmer",
        phone: formData.phone || "+91 98765 43210",
        farm_location: formData.farm_location || formData.location || "Tamil Nadu, India",
        farm_details: formData.farm_details
      });

      const sessionToken = data?.session?.access_token || null;
      if (sessionToken) {
        setToken(sessionToken);
        localStorage.setItem('smartfarm_token', sessionToken);
      }

      setUser(normalized);
      localStorage.setItem('smartfarm_user', JSON.stringify(normalized));

      // Synchronize profile with backend if backend service is reachable
      try {
        await apiService.signup({ ...formData, user_id: sessionUser.id });
      } catch (backendErr) {
        console.warn("Backend profile sync notice:", backendErr?.message);
      }

      await refreshFieldProfile(normalized);
      return { user: normalized, session: data?.session };
    } catch (err) {
      const msg = err?.message || "Registration failed. Please try again.";
      setAuthError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Logout handler - Calls Supabase signOut and clears all user tokens and in-memory state
  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn("Supabase signOut error:", err);
    } finally {
      // 1. Clear session and tokens
      localStorage.removeItem('smartfarm_token');
      localStorage.removeItem('smartfarm_user');
      localStorage.removeItem('smartfarm_registered_users');
      setToken(null);
      setUser(null);
      // 2. Clear in-memory state so User A's data NEVER survives into User B
      setFieldProfile(null);
      setFieldAssessment(null);
      setAuthError(null);
    }
  };

  // Update profile handler
  const updateProfile = async (updateData) => {
    setLoading(true);
    try {
      const { error: supaError } = await supabase.auth.updateUser({
        data: {
          name: updateData.name,
          phone: updateData.phone,
          farm_location: updateData.farm_location || updateData.location,
          preferred_language: updateData.preferred_language,
          farm_details: updateData.farm_details
        }
      });
      if (supaError) {
        console.warn("Supabase updateUser notice:", supaError.message);
      }

      try {
        await apiService.updateProfile(updateData);
      } catch {}

      const updatedUser = {
        ...user,
        ...updateData,
        name: updateData.name !== undefined ? updateData.name : user?.name,
        phone: updateData.phone !== undefined ? updateData.phone : user?.phone,
        location: updateData.farm_location || updateData.location || user?.location,
        farm_location: updateData.farm_location || updateData.location || user?.farm_location,
        preferred_language: updateData.preferred_language || user?.preferred_language
      };
      setUser(updatedUser);
      localStorage.setItem('smartfarm_user', JSON.stringify(updatedUser));
      return updatedUser;
    } catch (err) {
      console.error("Profile update error:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update field profile handler
  const updateFieldProfile = async (fieldData) => {
    setLoading(true);
    const uid = user?.user_id || user?.id;

    try {
      const updated = await apiService.updateFieldProfile(fieldData);
      const profile = updated.field || updated;
      const cleanProfile = { ...profile };
      delete cleanProfile.assessment;
      delete cleanProfile.field;
      const assessment = updated.assessment || evaluateFieldSuitability(cleanProfile);

      setFieldProfile(cleanProfile);
      setFieldAssessment(assessment);
      if (uid) {
        try {
          localStorage.setItem(getUserStorageKey('smartfarm_field_profile', uid), JSON.stringify(cleanProfile));
          localStorage.setItem(getUserStorageKey('smartfarm_field_assessment', uid), JSON.stringify(assessment));
        } catch {}
      }

      setUser(prev => {
        if (!prev) return prev;
        const newUser = { ...prev, field_profile: cleanProfile };
        try {
          localStorage.setItem('smartfarm_user', JSON.stringify(newUser));
        } catch {}
        return newUser;
      });
      return { field: cleanProfile, assessment };
    } catch (err) {
      console.warn("updateFieldProfile error:", err);
      const cleanProfile = { ...(fieldProfile || {}), ...fieldData };
      delete cleanProfile.assessment;
      delete cleanProfile.field;
      const assessment = evaluateFieldSuitability(cleanProfile);

      setFieldProfile(cleanProfile);
      setFieldAssessment(assessment);
      if (uid) {
        try {
          localStorage.setItem(getUserStorageKey('smartfarm_field_profile', uid), JSON.stringify(cleanProfile));
          localStorage.setItem(getUserStorageKey('smartfarm_field_assessment', uid), JSON.stringify(assessment));
        } catch {}
      }

      setUser(prev => {
        if (!prev) return prev;
        const newUser = { ...prev, field_profile: cleanProfile };
        try {
          localStorage.setItem('smartfarm_user', JSON.stringify(newUser));
        } catch {}
        return newUser;
      });
      return { field: cleanProfile, assessment };
    } finally {
      setLoading(false);
    }
  };

  // Forgot password handler via Supabase
  const forgotPassword = async (email) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      return { message: `Password reset instructions have been sent to ${email}.` };
    } catch (err) {
      try {
        return await apiService.forgotPassword(email);
      } catch {
        throw new Error(err.message || "Could not send password reset instructions.");
      }
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      setUser, 
      token,
      fieldProfile,
      setFieldProfile,
      fieldAssessment,
      setFieldAssessment,
      refreshFieldProfile,
      updateFieldProfile,
      isAuthenticated,
      loading,
      authError,
      login, 
      signup, 
      logout,
      updateProfile,
      forgotPassword
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
