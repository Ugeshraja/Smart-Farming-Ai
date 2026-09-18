import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiService, getUserStorageKey } from '../services/apiService';
import { evaluateFieldSuitability } from '../services/fieldEvaluator';

const AuthContext = createContext();

// Pre-seeded demo account for fallback/offline testing
const DEMO_ACCOUNTS = [
  {
    id: "00000000-0000-0000-0000-000000000001",
    user_id: "00000000-0000-0000-0000-000000000001",
    name: "UGESHRAJA S",
    email: "ugeshraja@example.com",
    password: "password123",
    phone: "+91 98765 43210",
    location: "Dharmapuri, Tamil Nadu",
    farm_location: "Dharmapuri, Tamil Nadu",
    farmArea: "3.5 Acres",
    farm_details: {
      farm_area: "3.5 Acres",
      primary_crops: ["Tomato", "Potato", "Brinjal"],
      soil_type: "Red Loamy",
      irrigation_type: "Drip Irrigation"
    },
    field_profile: {
      crop_type: "Brinjal",
      soil_type: "Loamy",
      soil_ph: 6.4,
      water_capacity: "72%",
      field_size: 2.0,
      field_size_unit: "Acre",
      npk_nitrogen: 80,
      npk_phosphorus: 40,
      npk_potassium: 40,
      sowing_date: "2026-06-15",
      irrigation_method: "Drip",
      field_location: "Tamil Nadu",
      season: "Kharif"
    },
    primaryCrops: ["Tomato", "Potato", "Brinjal"],
    preferred_language: "ta",
    created_date: "2026-01-15T09:00:00Z"
  }
];

export const AuthProvider = ({ children }) => {
  // 1. Initial State: Strict null if not authenticated in localStorage
  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem('smartfarm_token') || null;
    } catch {
      return null;
    }
  });

  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('smartfarm_user');
      const storedToken = localStorage.getItem('smartfarm_token');
      if (stored && storedToken) {
        return JSON.parse(stored);
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
        if (uid) {
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
        if (uid) {
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

  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState(null);

  // Single source of truth for authentication
  const isAuthenticated = Boolean(user && token);

  const normalizeUserData = (userData) => {
    if (!userData) return null;
    const canonicalId = userData.user_id || userData.id || `USR-${Math.floor(1000 + Math.random() * 9000)}`;
    return {
      id: canonicalId,
      user_id: canonicalId,
      name: userData.name || "Farmer",
      email: (userData.email || "").toLowerCase().trim(),
      phone: userData.phone || "+91 98765 43210",
      location: userData.farm_location || userData.location || "Dharmapuri, Tamil Nadu",
      farm_location: userData.farm_location || userData.location || "Dharmapuri, Tamil Nadu",
      farmArea: userData.farm_details?.farm_area || userData.farmArea || "3.5 Acres",
      farm_details: userData.farm_details || {
        farm_area: "3.5 Acres",
        primary_crops: ["Tomato", "Potato", "Brinjal"]
      },
      field_profile: userData.field_profile || null,
      primaryCrops: userData.farm_details?.primary_crops || userData.primaryCrops || ["Tomato", "Potato", "Brinjal"],
      preferred_language: userData.preferred_language || "ta",
      created_date: userData.created_date || new Date().toISOString()
    };
  };

  // Sync token to localStorage
  useEffect(() => {
    if (token) {
      localStorage.setItem('smartfarm_token', token);
    } else {
      localStorage.removeItem('smartfarm_token');
    }
  }, [token]);

  // Sync user to localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem('smartfarm_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('smartfarm_user');
    }
  }, [user]);

  // Refresh field profile and assessment from authoritative backend or user-scoped cache
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

  // Trigger field profile refresh whenever user changes (switch account)
  useEffect(() => {
    if (user && user.user_id && token) {
      refreshFieldProfile(user);
    } else {
      setFieldProfile(null);
      setFieldAssessment(null);
    }
  }, [user?.user_id, token]);

  // Login handler
  const login = async (email, password) => {
    setLoading(true);
    setAuthError(null);
    const cleanEmail = (email || "").toLowerCase().trim();

    try {
      // 1. Try Backend API
      const data = await apiService.login(cleanEmail, password);
      if (data && data.access_token) {
        const normalized = normalizeUserData(data.user);
        setToken(data.access_token);
        setUser(normalized);
        localStorage.setItem('smartfarm_token', data.access_token);
        localStorage.setItem('smartfarm_user', JSON.stringify(normalized));
        await refreshFieldProfile(normalized);
        return normalized;
      }
    } catch (err) {
      // 2. Fallback check for offline/dev demo accounts
      const localUsers = JSON.parse(localStorage.getItem('smartfarm_registered_users') || '[]');
      const allAccounts = [...DEMO_ACCOUNTS, ...localUsers];
      const match = allAccounts.find(acc => acc.email.toLowerCase() === cleanEmail);

      if (match && match.password === password) {
        const simulatedToken = `demo_token_${Date.now()}_${match.user_id}`;
        const normalized = normalizeUserData(match);
        setToken(simulatedToken);
        setUser(normalized);
        localStorage.setItem('smartfarm_token', simulatedToken);
        localStorage.setItem('smartfarm_user', JSON.stringify(normalized));
        await refreshFieldProfile(normalized);
        return normalized;
      }

      const msg = err.response?.data?.detail || "Invalid email or password.";
      setAuthError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Sign up handler
  const signup = async (formData) => {
    setLoading(true);
    setAuthError(null);
    const cleanEmail = (formData.email || "").toLowerCase().trim();

    try {
      // 1. Try Backend API
      const data = await apiService.signup(formData);
      if (data && data.access_token) {
        const normalized = normalizeUserData(data.user);
        setToken(data.access_token);
        setUser(normalized);
        localStorage.setItem('smartfarm_token', data.access_token);
        localStorage.setItem('smartfarm_user', JSON.stringify(normalized));
        await refreshFieldProfile(normalized);
        return normalized;
      }
    } catch (err) {
      // 2. Fallback local registration
      const localUsers = JSON.parse(localStorage.getItem('smartfarm_registered_users') || '[]');
      const existing = [...DEMO_ACCOUNTS, ...localUsers].find(u => u.email.toLowerCase() === cleanEmail);
      if (existing) {
        const msg = "An account with this email address already exists.";
        setAuthError(msg);
        throw new Error(msg);
      }

      const newUserId = `00000000-0000-4000-a000-${Math.floor(100000000000 + Math.random() * 900000000000)}`;
      const newFarmer = {
        id: newUserId,
        user_id: newUserId,
        name: formData.name.trim(),
        email: cleanEmail,
        password: formData.password,
        phone: formData.phone || "+91 98765 43210",
        location: formData.farm_location || formData.location || "Tamil Nadu, India",
        farm_location: formData.farm_location || formData.location || "Tamil Nadu, India",
        farmArea: formData.farm_details?.farm_area || "3.5 Acres",
        farm_details: formData.farm_details || {
          farm_area: "3.5 Acres",
          primary_crops: ["Tomato", "Potato", "Brinjal"]
        },
        primaryCrops: formData.farm_details?.primary_crops || ["Tomato", "Potato", "Brinjal"],
        preferred_language: formData.preferred_language || "en",
        created_date: new Date().toISOString()
      };

      localUsers.push(newFarmer);
      localStorage.setItem('smartfarm_registered_users', JSON.stringify(localUsers));

      const simulatedToken = `demo_token_${Date.now()}_${newUserId}`;
      const normalized = normalizeUserData(newFarmer);
      setToken(simulatedToken);
      setUser(normalized);
      localStorage.setItem('smartfarm_token', simulatedToken);
      localStorage.setItem('smartfarm_user', JSON.stringify(normalized));
      await refreshFieldProfile(normalized);
      return normalized;
    } finally {
      setLoading(false);
    }
  };

  // Logout handler - Clears all user tokens and in-memory user-specific state
  const logout = async () => {
    try {
      await apiService.logout();
    } catch (err) {
      console.warn("Backend logout error:", err);
    } finally {
      // 1. Clear session and tokens
      localStorage.removeItem('smartfarm_token');
      localStorage.removeItem('smartfarm_user');
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
      const updated = await apiService.updateProfile(updateData);
      const normalized = normalizeUserData(updated);
      setUser(normalized);
      localStorage.setItem('smartfarm_user', JSON.stringify(normalized));
      return normalized;
    } catch (err) {
      // Local fallback
      setUser(prev => {
        const updated = {
          ...prev,
          ...updateData,
          name: updateData.name !== undefined ? updateData.name : prev?.name,
          phone: updateData.phone !== undefined ? updateData.phone : prev?.phone,
          location: updateData.farm_location || updateData.location || prev?.location,
          farm_location: updateData.farm_location || updateData.location || prev?.farm_location,
          preferred_language: updateData.preferred_language || prev?.preferred_language
        };
        localStorage.setItem('smartfarm_user', JSON.stringify(updated));
        return updated;
      });
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

  // Forgot password handler
  const forgotPassword = async (email) => {
    try {
      return await apiService.forgotPassword(email);
    } catch (err) {
      return { message: `Password reset instructions have been sent to ${email}.` };
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
