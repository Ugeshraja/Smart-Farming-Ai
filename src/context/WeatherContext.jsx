import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import {
  fetchOpenWeatherData,
  resolveWeatherLocation,
  getSavedWeatherLocation,
  setSavedWeatherLocation,
  geocodeLocation,
  KNOWN_AGRICULTURAL_LOCATIONS
} from '../services/weatherService';

const WeatherContext = createContext(null);

export const WeatherProvider = ({ children }) => {
  const { user } = useAuth();

  // Location state: { name, lat, lon, source }
  const [location, setLocationState] = useState(() => {
    const saved = getSavedWeatherLocation();
    if (saved) return saved;
    return KNOWN_AGRICULTURAL_LOCATIONS.tiruchengode;
  });

  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Core weather loader function
  const loadWeather = useCallback(async (targetLoc, forceRefresh = false) => {
    if (!targetLoc || typeof targetLoc.lat !== 'number' || typeof targetLoc.lon !== 'number') {
      return;
    }

    if (forceRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(false);
    setErrorMessage('');

    try {
      const data = await fetchOpenWeatherData(targetLoc.lat, targetLoc.lon, forceRefresh);
      setWeatherData(data);
      // Sync official returned name if available and not custom
      if (data?.location_name && (!targetLoc.name || targetLoc.name === 'Coordinates')) {
        const updatedLoc = { ...targetLoc, name: data.location_name };
        setLocationState(updatedLoc);
        setSavedWeatherLocation(updatedLoc);
      }
    } catch (err) {
      console.error('WeatherContext error fetching weather:', err);
      setError(true);
      setErrorMessage(err.message || 'Weather temporarily unavailable');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial location resolution on mount or when user changes
  useEffect(() => {
    let isMounted = true;

    async function initLocation() {
      try {
        const resolved = await resolveWeatherLocation(user);
        if (isMounted && resolved) {
          setLocationState(resolved);
          await loadWeather(resolved, false);
        }
      } catch (err) {
        console.warn('WeatherContext: Error resolving initial location:', err);
        if (isMounted) {
          loadWeather(KNOWN_AGRICULTURAL_LOCATIONS.tiruchengode, false);
        }
      }
    }

    initLocation();

    // Listen for cross-component weather location changes (e.g. from Planner or Weather search)
    const handleLocationChange = (e) => {
      const newLoc = e.detail;
      if (newLoc && typeof newLoc.lat === 'number' && typeof newLoc.lon === 'number') {
        setLocationState(newLoc);
        loadWeather(newLoc, false);
      }
    };
    window.addEventListener('smartfarm_weather_location_changed', handleLocationChange);

    return () => {
      isMounted = false;
      window.removeEventListener('smartfarm_weather_location_changed', handleLocationChange);
    };
  }, [user, loadWeather]);

  // Set selected location and immediately fetch updated weather for all consumers
  const setLocation = useCallback(async (newLoc) => {
    if (!newLoc) return;

    let target = newLoc;
    if (typeof newLoc === 'string') {
      target = await geocodeLocation(newLoc);
    }

    if (target && typeof target.lat === 'number' && typeof target.lon === 'number') {
      const saved = setSavedWeatherLocation(target);
      setLocationState(saved);
      await loadWeather(saved, true);
    }
  }, [loadWeather]);

  // Refresh weather for currently active location
  const refreshWeather = useCallback(async () => {
    if (location) {
      await loadWeather(location, true);
    }
  }, [location, loadWeather]);

  return (
    <WeatherContext.Provider
      value={{
        location,
        weatherData,
        loading,
        refreshing,
        error,
        errorMessage,
        setLocation,
        refreshWeather
      }}
    >
      {children}
    </WeatherContext.Provider>
  );
};

export const useWeather = () => {
  const context = useContext(WeatherContext);
  if (!context) {
    throw new Error('useWeather must be used within a WeatherProvider');
  }
  return context;
};
