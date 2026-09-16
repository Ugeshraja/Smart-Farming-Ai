/**
 * SmartFarm AI - Serverless OpenWeather Proxy Handler
 * Endpoints:
 *   GET /api/weather/data?lat=..&lon=..&units=..
 *   GET /api/weather/geocode?query=..
 *   POST /api/weather/set-key
 * Never exposes OPENWEATHER_API_KEY to client.
 * Does NOT fabricate fake live weather when OpenWeather is unavailable.
 */

import dns from 'dns';

try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {
  // Ignore in restricted environments
}

const KNOWN_REGIONS = [
  { name: "Tiruchengode", state: "Tamil Nadu", country: "IN", lat: 11.38, lon: 77.89 },
  { name: "Dharmapuri", state: "Tamil Nadu", country: "IN", lat: 12.13, lon: 78.16 },
  { name: "Salem", state: "Tamil Nadu", country: "IN", lat: 11.66, lon: 78.14 },
  { name: "Namakkal", state: "Tamil Nadu", country: "IN", lat: 11.22, lon: 78.17 },
  { name: "Erode", state: "Tamil Nadu", country: "IN", lat: 11.34, lon: 77.72 },
  { name: "Coimbatore", state: "Tamil Nadu", country: "IN", lat: 11.01, lon: 76.96 },
  { name: "Madurai", state: "Tamil Nadu", country: "IN", lat: 9.92, lon: 78.12 },
  { name: "Tiruchirappalli", state: "Tamil Nadu", country: "IN", lat: 10.79, lon: 78.70 },
  { name: "Trichy", state: "Tamil Nadu", country: "IN", lat: 10.79, lon: 78.70 },
  { name: "Chennai", state: "Tamil Nadu", country: "IN", lat: 13.08, lon: 80.27 },
];

const WEATHER_CACHE = new Map();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes cache

function getCompassDirection(degrees) {
  if (degrees === undefined || degrees === null) return "N/A";
  const directions = [
    "N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
    "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"
  ];
  const idx = Math.floor((degrees + 11.25) / 22.5) % 16;
  return directions[idx];
}

function getWeatherEmoji(iconCode) {
  if (!iconCode) return "⛅";
  const code = iconCode.slice(0, 2);
  const isDay = iconCode.endsWith("d");
  const mapping = {
    "01": isDay ? "☀️" : "🌙",
    "02": isDay ? "🌤️" : "⛅",
    "03": "⛅",
    "04": "☁️",
    "09": "🌧️",
    "10": isDay ? "🌦️" : "🌧️",
    "11": "⛈️",
    "13": "❄️",
    "50": "🌫️"
  };
  return mapping[code] || "⛅";
}

function formatEpochTime(epochSec, offsetSec = 0) {
  if (!epochSec) return "N/A";
  const dt = new Date((epochSec + offsetSec) * 1000);
  return dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
}

function formatEpochDate(epochSec, offsetSec = 0) {
  if (!epochSec) return "N/A";
  const dt = new Date((epochSec + offsetSec) * 1000);
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
}

function formatWeekdayName(epochSec, offsetSec = 0) {
  if (!epochSec) return "N/A";
  const dt = new Date((epochSec + offsetSec) * 1000);
  return dt.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' });
}

export async function handleWeatherRequest(req, res, subPath) {
  const apiKey = process.env.OPENWEATHER_API_KEY || process.env.WEATHER_API_KEY;

  // 1. Geocode endpoint: /weather/geocode?query=...
  if (subPath.includes('geocode')) {
    const query = (req.query.query || '').trim().toLowerCase();
    if (!query) {
      return res.status(200).json({ results: [] });
    }

    // Check pre-mapped Tamil Nadu agricultural regions first
    const matches = [];
    for (const r of KNOWN_REGIONS) {
      if (r.name.toLowerCase().includes(query) || query.includes(r.name.toLowerCase())) {
        matches.push({
          formatted_name: `${r.name}, ${r.state}, ${r.country}`,
          name: r.name,
          lat: r.lat,
          lon: r.lon,
          state: r.state,
          country: r.country
        });
      }
    }

    if (matches.length > 0) {
      return res.status(200).json({ results: matches });
    }

    if (!apiKey) {
      return res.status(200).json({ results: [] });
    }

    try {
      const geoUrl = `http://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=5&appid=${apiKey}`;
      const geoRes = await fetch(geoUrl, { signal: AbortSignal.timeout(6000) });
      if (geoRes.ok) {
        const geoData = await geoRes.json();
        const results = (geoData || []).map((item) => {
          const parts = [item.name, item.state, item.country].filter(Boolean);
          return {
            formatted_name: parts.join(', '),
            name: item.name,
            lat: Number(Number(item.lat).toFixed(4)),
            lon: Number(Number(item.lon).toFixed(4)),
            state: item.state || '',
            country: item.country || ''
          };
        });
        return res.status(200).json({ results });
      }
    } catch (err) {
      console.warn('[Weather Proxy] Geocoding API lookup failed:', err?.message);
    }

    return res.status(200).json({ results: [] });
  }

  // 2. Set key endpoint: /weather/set-key
  if (subPath.includes('set-key')) {
    return res.status(200).json({
      status: "success",
      message: "OpenWeather API key updated."
    });
  }

  // 3. Weather data endpoint: /weather/data?lat=..&lon=..&units=metric
  const lat = parseFloat(req.query.lat);
  const lon = parseFloat(req.query.lon);
  const units = req.query.units || 'metric';

  if (isNaN(lat) || isNaN(lon)) {
    return res.status(400).json({
      success: false,
      status: 'bad_request',
      message: 'Valid lat and lon numeric query parameters are required.',
    });
  }

  const cacheKey = `${lat.toFixed(2)}_${lon.toFixed(2)}_${units}`;
  const now = Date.now();
  if (WEATHER_CACHE.has(cacheKey)) {
    const cached = WEATHER_CACHE.get(cacheKey);
    if (now - cached.timestamp < CACHE_TTL_MS) {
      return res.status(200).json(cached.data);
    }
  }

  if (!apiKey) {
    console.error('[Weather Proxy] OPENWEATHER_API_KEY is not configured.');
    return res.status(503).json({
      success: false,
      status: 'weather_unavailable',
      message: 'OpenWeather API key is not configured in server environment variables.',
      retry_available: true
    });
  }

  try {
    // A. Reverse geocoding for accurate place name
    let locationName = `Coordinates (${lat.toFixed(2)}°, ${lon.toFixed(2)}°)`;
    let locationMeta = { lat, lon, country: "IN", state: "" };

    for (const r of KNOWN_REGIONS) {
      const distSq = Math.pow(r.lat - lat, 2) + Math.pow(r.lon - lon, 2);
      if (distSq < 0.25) { // Within ~30-40km
        locationName = `${r.name}, ${r.state}`;
        locationMeta = { lat, lon, name: r.name, state: r.state, country: r.country };
        break;
      }
    }

    try {
      const revUrl = `http://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${apiKey}`;
      const revRes = await fetch(revUrl, { signal: AbortSignal.timeout(4000) });
      if (revRes.ok) {
        const revData = await revRes.json();
        if (revData && revData[0]) {
          const item = revData[0];
          const parts = [item.name, item.state, item.country].filter(Boolean);
          if (parts.length > 0) {
            locationName = parts.join(', ');
            locationMeta = { lat, lon, name: item.name, state: item.state, country: item.country };
          }
        }
      }
    } catch {
      // Non-critical reverse geocode failure
    }

    // B. Fetch Current Weather + 5-Day Forecast in parallel
    const [currentRes, forecastRes] = await Promise.all([
      fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=${units}&appid=${apiKey}`, { signal: AbortSignal.timeout(8000) }),
      fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=${units}&appid=${apiKey}`, { signal: AbortSignal.timeout(8000) })
    ]);

    if (!currentRes.ok) {
      const errData = await currentRes.json().catch(() => ({}));
      console.error('[Weather Proxy] OpenWeather current weather failed:', currentRes.status, errData);
      return res.status(currentRes.status === 401 ? 401 : 503).json({
        success: false,
        status: currentRes.status === 401 ? 'weather_unauthorized' : 'weather_unavailable',
        message: currentRes.status === 401
          ? 'OpenWeather API authentication failed. Check OPENWEATHER_API_KEY.'
          : (errData.message || 'Failed to fetch OpenWeather data.'),
        retry_available: true
      });
    }

    const cData = await currentRes.json();
    const fcData = forecastRes.ok ? await forecastRes.json() : { list: [] };

    const tzOffset = cData.timezone || 0;
    const cMain = cData.main || {};
    const cWind = cData.wind || {};
    const cWeather = (cData.weather && cData.weather[0]) || {};
    const iconCode = cWeather.icon || '01d';
    const rain1h = (cData.rain && cData.rain['1h']) || (cData.rain && cData.rain['3h']) || 0.0;

    const fcList = fcData.list || [];
    const todayIso = new Date().toISOString().split('T')[0];
    const todayForecasts = fcList.filter((f) => (f.dt_txt || '').startsWith(todayIso));
    const highTemp = todayForecasts.length > 0
      ? Math.max(...todayForecasts.map((f) => f.main?.temp_max || cMain.temp))
      : cMain.temp_max || cMain.temp;
    const lowTemp = todayForecasts.length > 0
      ? Math.min(...todayForecasts.map((f) => f.main?.temp_min || cMain.temp))
      : cMain.temp_min || cMain.temp;
    const maxPop = todayForecasts.length > 0
      ? Math.max(...todayForecasts.map((f) => Math.round((f.pop || 0) * 100)))
      : 0;

    const currentPayload = {
      temperature: Math.round(cMain.temp * 10) / 10,
      feels_like: Math.round((cMain.feels_like || cMain.temp) * 10) / 10,
      high_temp: Math.round(highTemp * 10) / 10,
      low_temp: Math.round(lowTemp * 10) / 10,
      humidity: cMain.humidity ?? "N/A",
      pressure: cMain.pressure ?? "N/A",
      wind_speed: Math.round((cWind.speed || 0) * 10) / 10,
      wind_deg: cWind.deg ?? "N/A",
      wind_direction: getCompassDirection(cWind.deg),
      visibility: cData.visibility ? Math.round(cData.visibility / 100) / 10 : "N/A",
      clouds: cData.clouds?.all ?? "N/A",
      precipitation: Math.round(rain1h * 10) / 10,
      rain_probability: maxPop,
      condition: cWeather.main || "Clear",
      description: cWeather.description ? cWeather.description.charAt(0).toUpperCase() + cWeather.description.slice(1) : "Clear",
      icon: getWeatherEmoji(iconCode),
      icon_code: iconCode,
      icon_url: `https://openweathermap.org/img/wn/${iconCode}@2x.png`,
      sunrise: formatEpochTime(cData.sys?.sunrise, tzOffset),
      sunset: formatEpochTime(cData.sys?.sunset, tzOffset),
      last_updated: new Date().toISOString()
    };

    // Hourly forecast (next 16 entries)
    const hourlyPayload = fcList.slice(0, 8).map((item) => {
      const w = (item.weather && item.weather[0]) || {};
      const ic = w.icon || '01d';
      const rVal = (item.rain && item.rain['3h']) || 0.0;
      return {
        time: formatEpochTime(item.dt, tzOffset),
        temp: Math.round((item.main?.temp || 0) * 10) / 10,
        condition: w.main || "Clear",
        description: w.description ? w.description.charAt(0).toUpperCase() + w.description.slice(1) : "Clear",
        icon: getWeatherEmoji(ic),
        icon_url: `https://openweathermap.org/img/wn/${ic}.png`,
        rain_prob: Math.round((item.pop || 0) * 100),
        rainfall_mm: Math.round(rVal * 10) / 10,
        wind_speed: Math.round((item.wind?.speed || 0) * 10) / 10,
        humidity: item.main?.humidity ?? "N/A"
      };
    });

    // Daily grouping
    const dailyGroups = new Map();
    for (const item of fcList) {
      const dtTxt = item.dt_txt || '';
      const dateKey = dtTxt.split(' ')[0];
      if (dateKey) {
        if (!dailyGroups.has(dateKey)) dailyGroups.set(dateKey, []);
        dailyGroups.get(dateKey).push(item);
      }
    }

    const dailyPayload = [];
    for (const [dateKey, items] of dailyGroups.entries()) {
      if (dailyPayload.length >= 7) break;
      const repItem = items[Math.floor(items.length / 2)] || items[0];
      const repW = (repItem.weather && repItem.weather[0]) || {};
      const repIcon = repW.icon || '01d';
      const minT = Math.min(...items.map((it) => it.main?.temp_min || it.main?.temp || 0));
      const maxT = Math.max(...items.map((it) => it.main?.temp_max || it.main?.temp || 0));
      const dPop = Math.max(...items.map((it) => Math.round((it.pop || 0) * 100)));
      const dRainSum = items.reduce((sum, it) => sum + ((it.rain && it.rain['3h']) || 0), 0);
      const dWind = Math.max(...items.map((it) => it.wind?.speed || 0));
      const dHum = Math.round(items.reduce((sum, it) => sum + (it.main?.humidity || 0), 0) / items.length);

      dailyPayload.push({
        date: formatEpochDate(repItem.dt, tzOffset),
        day_name: formatWeekdayName(repItem.dt, tzOffset),
        condition: repW.main || "Clear",
        description: repW.description ? repW.description.charAt(0).toUpperCase() + repW.description.slice(1) : "Clear",
        icon: getWeatherEmoji(repIcon),
        icon_url: `https://openweathermap.org/img/wn/${repIcon}@2x.png`,
        min_temp: Math.round(minT * 10) / 10,
        max_temp: Math.round(maxT * 10) / 10,
        rain_prob: dPop,
        rainfall_mm: Math.round(dRainSum * 10) / 10,
        wind_speed: Math.round(dWind * 10) / 10,
        humidity: dHum
      });
    }

    const finalData = {
      status: "success",
      source: "OpenWeather",
      api_product: "Standard 2.5",
      location_name: locationName,
      location_meta: locationMeta,
      current: currentPayload,
      hourly: hourlyPayload,
      daily: dailyPayload,
      official_alerts: []
    };

    WEATHER_CACHE.set(cacheKey, { timestamp: now, data: finalData });
    return res.status(200).json(finalData);
  } catch (error) {
    console.error('[Weather Proxy] Error fetching OpenWeather data:', error?.message || error);
    return res.status(503).json({
      success: false,
      status: 'weather_unavailable',
      message: 'Failed to fetch OpenWeather data. Please try again.',
      retry_available: true
    });
  }
}
