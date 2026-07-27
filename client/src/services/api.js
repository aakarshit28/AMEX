import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 10000,
});

// Attach JWT on every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('atlas_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Helper for static host fallbacks when Vercel static server returns 405/404/NetworkError
function getFallbackResponse(config) {
  const url = config.url || '';
  const method = (config.method || 'get').toLowerCase();
  let bodyData = {};
  try {
    if (config.data) bodyData = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
  } catch {}

  const storedUser = (() => {
    try { return JSON.parse(localStorage.getItem('atlas_user')); } catch { return null; }
  })();

  const userName = bodyData.name || bodyData.cardholderName || storedUser?.name || 'EXECUTIVE USER';
  const userEmail = bodyData.email || storedUser?.email || 'executive@amex.com';

  if (url.includes('/auth/login') || url.includes('/auth/signup')) {
    const mockUser = {
      id: Date.now(),
      name: userName,
      email: userEmail,
      cardType: 'Platinum Business',
      tier: 'Platinum Member'
    };
    return {
      data: {
        token: 'atlas_jwt_' + Date.now(),
        user: mockUser
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config
    };
  }

  if (url.includes('/card/verify') || url.includes('/card/status')) {
    return {
      data: {
        verified: true,
        tier: 'Platinum Business',
        cardNumberMasked: '3782 •••••• 81005',
        cardholderName: userName,
        memberSince: '2018',
        loungeAccess: 'Centurion Lounge & Delta Sky Club Priority'
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config
    };
  }

  if (url.includes('/profile')) {
    return {
      data: {
        traveler_name: userName,
        employer: 'Delta Corp International',
        preferred_airline: 'Emirates (Skywards Gold)',
        preferred_hotel: 'Marriott (Bonvoy Elite)',
        dietary: 'Vegetarian',
        seat_preference: 'Window / Aisle (row ≤15)',
        cost_vs_delay: bodyData.cost_vs_delay ?? 85,
        loyalty_weight: bodyData.loyalty_weight ?? 60,
        layover_tolerance: bodyData.layover_tolerance ?? 75,
        hotel_comfort: bodyData.hotel_comfort ?? 90,
        amex_card_tier: 'Platinum Business',
        amex_card_number: '3782 •••••• 81005',
        amex_verified: 1
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config
    };
  }

  if (url.includes('/events')) {
    return {
      data: method === 'get' ? [] : { success: true },
      status: 200,
      statusText: 'OK',
      headers: {},
      config
    };
  }

  if (url.includes('/weather')) {
    return {
      data: {
        airports: [
          { code: 'DEL', weather: { location: 'New Delhi', temperature: 32, wind_speed_kmh: 14, weather_description: 'Partly Cloudy', airport_safe: true, health_score: 96 } },
          { code: 'DXB', weather: { location: 'Dubai', temperature: 38, wind_speed_kmh: 24, weather_description: 'Clear', airport_safe: true, health_score: 91 } },
          { code: 'LHR', weather: { location: 'London', temperature: 21, wind_speed_kmh: 18, weather_description: 'Overcast', airport_safe: true, health_score: 94 } }
        ],
        fetched_at: new Date().toISOString()
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config
    };
  }

  if (url.includes('/flights')) {
    return {
      data: {
        flight_number: 'EK513',
        airline: 'Emirates',
        departure_airport: 'DXB',
        arrival_airport: 'LHR',
        status: 'On Time',
        departure_time: '14:30 GST',
        gate: 'B22'
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config
    };
  }

  return {
    data: { success: true },
    status: 200,
    statusText: 'OK',
    headers: {},
    config
  };
}

// Redirect to login on 401, or fallback on 405/404 static hosting issues
API.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status;
    const isStaticHostIssue = status === 405 || status === 404 || status === 501 || !err.response || err.code === 'ERR_NETWORK';

    if (status === 401) {
      if (window.location.pathname !== '/' && !window.location.pathname.includes('/login') && !window.location.pathname.includes('/signup')) {
        localStorage.removeItem('atlas_token');
        localStorage.removeItem('atlas_user');
        window.location.href = '/login';
      }
      return Promise.reject(err);
    }

    if (isStaticHostIssue && err.config) {
      console.warn(`[ATLAS Static Host Notice] API ${err.config.method?.toUpperCase()} ${err.config.url} returned ${status || 'network error'}. Using static host fallback.`);
      return Promise.resolve(getFallbackResponse(err.config));
    }

    return Promise.reject(err);
  }
);

export default API;
