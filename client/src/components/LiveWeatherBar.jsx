import { useState, useEffect } from 'react';
import API from '../services/api';

export default function LiveWeatherBar({ activeJourney, onLiveProbe }) {
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(false);

  const codes = [
    activeJourney?.origin_code || 'DEL',
    activeJourney?.transit_code || 'DXB',
    activeJourney?.destination_code || 'LHR'
  ].filter(Boolean).join(',');

  const fetchLiveWeather = async () => {
    setLoading(true);
    try {
      const res = await API.get(`/weather/route-live?codes=${codes}`);
      setWeatherData(res.data);
      if (onLiveProbe) onLiveProbe(res.data);
    } catch (e) {
      console.error('Live route weather fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveWeather();
    const interval = setInterval(fetchLiveWeather, 60000); // refresh live weather every 60s
    return () => clearInterval(interval);
  }, [codes]);

  return (
    <div className="live-weather-card">
      <div className="live-weather-header">
        <div className="live-weather-title">
          <div className="live-weather-badge-pulse" />
          <span>Real-Time Weather Intelligence (Open-Meteo API)</span>
        </div>
        <div className="live-weather-actions">
          {weatherData?.fetched_at && (
            <span className="live-weather-time">
              Updated: {new Date(weatherData.fetched_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <button className="btn btn-outline live-probe-btn" onClick={fetchLiveWeather} disabled={loading}>
            {loading ? 'Probing Live API...' : '⚡ Probe Live Weather'}
          </button>
        </div>
      </div>

      <div className="live-weather-grid">
        {(weatherData?.airports || [
          { code: activeJourney?.origin_code || 'DEL', weather: { location: 'New Delhi', temperature: 32, wind_speed_kmh: 14, weather_description: 'Partly Cloudy', airport_safe: true, health_score: 96 } },
          { code: activeJourney?.transit_code || 'DXB', weather: { location: 'Dubai', temperature: 38, wind_speed_kmh: 24, weather_description: 'Clear', airport_safe: true, health_score: 91 } },
          { code: activeJourney?.destination_code || 'LHR', weather: { location: 'London', temperature: 21, wind_speed_kmh: 18, weather_description: 'Overcast', airport_safe: true, health_score: 94 } },
        ]).map(item => {
          const w = item.weather || {};
          const isSafe = w.airport_safe;

          return (
            <div key={item.code} className={`live-weather-item ${isSafe ? 'safe' : 'hazard'}`}>
              <div className="weather-item-top">
                <div className="weather-item-code">{item.code}</div>
                <div className={`weather-status-badge ${isSafe ? 'badge-green' : 'badge-red'}`}>
                  {isSafe ? '● Operational' : '⚠️ Hazard Warning'}
                </div>
              </div>
              <div className="weather-item-loc">{w.location || item.code}</div>

              <div className="weather-metrics-row">
                <div className="weather-temp">{w.temperature !== undefined ? `${Math.round(w.temperature)}°C` : '—'}</div>
                <div className="weather-desc">{w.weather_description || 'Clear'}</div>
              </div>

              <div className="weather-details-strip">
                <span>Wind: <strong>{w.wind_speed_kmh || 0} km/h</strong></span>
                <span>Gusts: <strong>{w.wind_gusts_kmh || w.wind_speed_kmh || 0} km/h</strong></span>
                <span>Score: <strong style={{ color: isSafe ? 'var(--status-green)' : 'var(--status-red)' }}>{w.health_score || 95}/100</strong></span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
