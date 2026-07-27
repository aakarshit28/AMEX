import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:3001/api',
  timeout: 10000,
});

// Attach JWT on every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('atlas_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Redirect to login on 401
API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      // Avoid wiping session or redirecting if on landing page or login form
      if (window.location.pathname !== '/' && !window.location.pathname.includes('/login')) {
        localStorage.removeItem('atlas_token');
        localStorage.removeItem('atlas_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default API;
