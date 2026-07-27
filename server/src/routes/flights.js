const express = require('express');
const fetch = require('node-fetch');
const auth = require('../middleware/auth');

const router = express.Router();

// Simple in-memory cache (5 minutes)
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000;

function getCached(key) {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.ts < CACHE_TTL) return entry.data;
  return null;
}

function setCache(key, data) {
  cache.set(key, { data, ts: Date.now() });
}

// GET /api/flights?flight=EK513
router.get('/', auth, async (req, res) => {
  const flightIata = req.query.flight || 'EK513';
  const cacheKey = `flight_${flightIata}`;

  const cached = getCached(cacheKey);
  if (cached) {
    return res.json({ ...cached, cached: true });
  }

  const apiKey = process.env.AVIATIONSTACK_KEY;
  if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
    // Return simulated data if no API key
    return res.json(getSimulatedFlight(flightIata));
  }

  try {
    const url = `http://api.aviationstack.com/v1/flights?access_key=${apiKey}&flight_iata=${flightIata}&limit=1`;
    const response = await fetch(url, { timeout: 8000 });
    
    if (!response.ok) {
      throw new Error(`AviationStack API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message || 'AviationStack API error');
    }

    if (!data.data || data.data.length === 0) {
      return res.json(getSimulatedFlight(flightIata));
    }

    const flight = data.data[0];
    const result = {
      flight_iata: flight.flight?.iata || flightIata,
      airline: flight.airline?.name || 'Emirates',
      status: flight.flight_status || 'scheduled',
      departure: {
        airport: flight.departure?.airport || 'Indira Gandhi International',
        iata: flight.departure?.iata || 'DEL',
        scheduled: flight.departure?.scheduled,
        estimated: flight.departure?.estimated,
        actual: flight.departure?.actual,
        delay: flight.departure?.delay
      },
      arrival: {
        airport: flight.arrival?.airport || 'Dubai International',
        iata: flight.arrival?.iata || 'DXB',
        scheduled: flight.arrival?.scheduled,
        estimated: flight.arrival?.estimated,
        actual: flight.arrival?.actual,
        delay: flight.arrival?.delay
      },
      live: flight.live ? {
        latitude: flight.live.latitude,
        longitude: flight.live.longitude,
        altitude: flight.live.altitude,
        speed_horizontal: flight.live.speed_horizontal,
        is_ground: flight.live.is_ground
      } : null,
      cached: false
    };

    setCache(cacheKey, result);
    res.json(result);
  } catch (err) {
    console.error('[Flights] Error:', err.message);
    // Fallback to simulated data on error
    res.json({ ...getSimulatedFlight(flightIata), error_fallback: true });
  }
});

function getSimulatedFlight(flightIata) {
  const now = new Date();
  return {
    flight_iata: flightIata,
    airline: flightIata.startsWith('EK') ? 'Emirates' : 'Qatar Airways',
    status: 'active',
    departure: {
      airport: 'Indira Gandhi International',
      iata: 'DEL',
      scheduled: new Date(now.getTime() - 2 * 3600000).toISOString(),
      actual: new Date(now.getTime() - 2 * 3600000).toISOString(),
      delay: 0
    },
    arrival: {
      airport: 'Dubai International',
      iata: 'DXB',
      scheduled: new Date(now.getTime() + 2 * 3600000).toISOString(),
      estimated: new Date(now.getTime() + 2 * 3600000).toISOString(),
      delay: 0
    },
    live: {
      latitude: 23.5,
      longitude: 63.2,
      altitude: 11278,
      speed_horizontal: 892,
      is_ground: false
    },
    simulated: true,
    cached: false
  };
}

module.exports = router;
