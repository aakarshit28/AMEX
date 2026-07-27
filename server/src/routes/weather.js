const express = require('express');
const fetch = require('node-fetch');
const auth = require('../middleware/auth');
const { getAirport } = require('../utils/airports');

const router = express.Router();

const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 min cache for live weather

function getCached(key) {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.ts < CACHE_TTL) return entry.data;
  return null;
}

function setCache(key, data) {
  cache.set(key, { data, ts: Date.now() });
}

// Fetch live weather from Open-Meteo API for given lat/lon
async function fetchOpenMeteo(lat, lon, label) {
  const cacheKey = `weather_${lat}_${lon}`;
  const cached = getCached(cacheKey);
  if (cached) return { ...cached, cached: true };

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,wind_speed_10m,wind_gusts_10m,precipitation,weather_code,visibility&wind_speed_unit=kmh&timezone=auto`;
  const response = await fetch(url, { timeout: 8000 });

  if (!response.ok) throw new Error(`Weather API error: ${response.status}`);

  const data = await response.json();
  const c = data.current;

  const result = {
    location: label,
    lat, lon,
    temperature: c.temperature_2m,
    wind_speed_kmh: c.wind_speed_10m,
    wind_gusts_kmh: c.wind_gusts_10m,
    precipitation_mm: c.precipitation,
    weather_code: c.weather_code,
    weather_description: describeWeatherCode(c.weather_code),
    visibility_m: c.visibility,
    airport_safe: isAirportSafe(c.wind_gusts_10m, c.precipitation, c.weather_code),
    health_score: calcHealthScore(c.wind_gusts_10m, c.precipitation, c.weather_code),
    updated_at: c.time,
    cached: false
  };

  setCache(cacheKey, result);
  return result;
}

// GET /api/weather — Single location live weather
router.get('/', auth, async (req, res) => {
  const lat = parseFloat(req.query.lat) || 25.2;
  const lon = parseFloat(req.query.lon) || 55.4;
  const label = req.query.label || 'Dubai';
  try {
    const result = await fetchOpenMeteo(lat, lon, label);
    res.json(result);
  } catch (err) {
    console.error('[Weather] Error:', err.message);
    res.status(500).json({ error: 'Could not fetch weather data', details: err.message });
  }
});

// GET /api/weather/route-live?codes=DEL,DXB,LHR — Parallel live weather for active itinerary
router.get('/route-live', auth, async (req, res) => {
  const codesParam = req.query.codes || 'DEL,DXB,LHR';
  const codes = codesParam.split(',').map(c => c.trim().toUpperCase()).filter(Boolean);

  try {
    const weatherPromises = codes.map(async (code) => {
      const airport = getAirport(code);
      try {
        const liveData = await fetchOpenMeteo(airport.lat, airport.lon, `${code} (${airport.city})`);
        return { code, airport, weather: liveData, error: null };
      } catch (e) {
        return {
          code,
          airport,
          weather: {
            location: `${code} (${airport.city})`,
            temperature: 24,
            wind_speed_kmh: 18,
            wind_gusts_kmh: 22,
            precipitation_mm: 0,
            weather_code: 0,
            weather_description: 'Clear (Simulated Fallback)',
            airport_safe: true,
            health_score: 95,
            cached: true
          },
          error: e.message
        };
      }
    });

    const results = await Promise.all(weatherPromises);

    // Compute route health score
    const avgHealth = Math.round(results.reduce((acc, r) => acc + (r.weather?.health_score || 90), 0) / results.length);
    const hasHazard = results.some(r => !r.weather?.airport_safe);

    res.json({
      airports: results,
      overall_route_health: avgHealth,
      has_hazard: hasHazard,
      fetched_at: new Date().toISOString()
    });
  } catch (err) {
    console.error('[Route Weather] Error:', err.message);
    res.status(500).json({ error: 'Route weather fetch failed', details: err.message });
  }
});

function describeWeatherCode(code) {
  if (code === 0) return 'Clear Sky';
  if (code <= 3) return 'Partly Cloudy';
  if (code <= 49) return 'Foggy Conditions';
  if (code <= 59) return 'Light Drizzle';
  if (code <= 69) return 'Rain Showers';
  if (code <= 79) return 'Snow';
  if (code <= 82) return 'Heavy Rain';
  if (code <= 86) return 'Snow Showers';
  if (code <= 99) return 'Severe Thunderstorm';
  return 'Overcast';
}

function isAirportSafe(gusts, precip, code) {
  if (gusts > 75) return false;
  if (code >= 95) return false;
  return true;
}

function calcHealthScore(gusts, precip, code) {
  let score = 100;
  if (gusts > 30) score -= Math.min(40, (gusts - 30) * 1.5);
  if (precip > 5) score -= Math.min(20, precip * 2);
  if (code >= 95) score -= 35;
  else if (code >= 80) score -= 18;
  else if (code >= 50) score -= 10;
  return Math.max(0, Math.round(score));
}

module.exports = router;
