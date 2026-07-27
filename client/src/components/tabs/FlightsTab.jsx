import { useState, useEffect } from 'react';
import API from '../../services/api';

const FLIGHTS = [
  { label: 'EK-513 (DEL → DXB)', code: 'EK513' },
  { label: 'EK-003 (DXB → LHR)', code: 'EK3' },
  { label: 'QR-571 (DEL → DOH)', code: 'QR571' },
  { label: 'QR-003 (DOH → LHR)', code: 'QR3' },
];

function statusBadge(status) {
  const map = {
    active:     'badge-green', landed:     'badge-green',
    scheduled:  'badge-blue',  cancelled:  'badge-red',
    incident:   'badge-red',   diverted:   'badge-amber'
  };
  return `badge ${map[status] || 'badge-blue'}`;
}

export default function FlightsTab() {
  const [selectedFlight, setSelectedFlight] = useState('EK513');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [weatherDxb, setWeatherDxb] = useState(null);

  const fetchFlight = async (code) => {
    setLoading(true); setError(''); setData(null);
    try {
      const res = await API.get(`/flights?flight=${code}`);
      setData(res.data);
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to fetch flight data');
    } finally {
      setLoading(false);
    }
  };

  const fetchWeather = async () => {
    try {
      const res = await API.get('/weather?lat=25.2532&lon=55.3657&label=Dubai+DXB');
      setWeatherDxb(res.data);
    } catch (e) { /* silent */ }
  };

  useEffect(() => {
    fetchFlight(selectedFlight);
    fetchWeather();
  }, [selectedFlight]);

  const formatTime = (iso) => {
    if (!iso) return 'N/A';
    try { return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
    catch { return 'N/A'; }
  };

  return (
    <section id="tab-flights" className="tab-content active">
      <div className="page-scroll">

        {/* Flight Selector */}
        <div className="card card-padded" style={{ marginBottom: 20 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: 'var(--text-white)', marginBottom: 14 }}>
            Select Flight to Track
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {FLIGHTS.map(f => (
              <button
                key={f.code}
                className={`btn ${selectedFlight === f.code ? 'btn-primary' : 'btn-outline'}`}
                style={{ fontSize: 12 }}
                onClick={() => setSelectedFlight(f.code)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Flight Data Card */}
          <div className="card card-blue-header">
            <div className="card-header">
              <div className="card-title">
                <div className="card-title-icon">
                  <svg viewBox="0 0 24 24"><path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L14 19v-5.5l8 2.5z"/></svg>
                </div>
                Live Flight Status
              </div>
              <button className="btn btn-outline" style={{ fontSize: 11, padding: '4px 10px' }} onClick={() => fetchFlight(selectedFlight)}>
                Refresh
              </button>
            </div>
            <div style={{ padding: '20px' }}>
              {loading && (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>
                  <div className="auth-spinner" style={{ margin: '0 auto 12px', borderTopColor: 'var(--amex-blue)' }} />
                  Fetching real-time data...
                </div>
              )}
              {error && <div className="auth-error" style={{ marginTop: 0 }}>{error}</div>}
              {data && !loading && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 28, fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--text-white)' }}>
                        {data.flight_iata}
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{data.airline}</div>
                    </div>
                    <span className={statusBadge(data.status)} style={{ fontSize: 12 }}>
                      {data.status?.toUpperCase()}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    {[
                      { label: 'Departure', airport: data.departure?.airport, iata: data.departure?.iata, time: data.departure?.actual || data.departure?.scheduled, delay: data.departure?.delay },
                      { label: 'Arrival', airport: data.arrival?.airport, iata: data.arrival?.iata, time: data.arrival?.estimated || data.arrival?.scheduled, delay: data.arrival?.delay },
                    ].map(col => (
                      <div key={col.label} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 14, border: '1px solid var(--border-subtle)' }}>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 4 }}>{col.label}</div>
                        <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-white)' }}>{col.iata}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-silver)', marginTop: 2 }}>{col.airport}</div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--amex-blue-light)', marginTop: 6 }}>{formatTime(col.time)}</div>
                        {col.delay > 0 && (
                          <div style={{ fontSize: 11, color: 'var(--status-amber)', marginTop: 2 }}>+{col.delay} min delay</div>
                        )}
                      </div>
                    ))}
                  </div>

                  {data.live && !data.live.is_ground && (
                    <div style={{ background: 'rgba(0,111,207,0.08)', borderRadius: 10, padding: 14, border: '1px solid var(--border-blue)' }}>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '1px' }}>Live Position</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                        {[
                          { label: 'Altitude', value: `${(data.live.altitude || 0).toLocaleString()} m` },
                          { label: 'Speed', value: `${Math.round(data.live.speed_horizontal || 0)} km/h` },
                          { label: 'Position', value: `${(data.live.latitude || 0).toFixed(1)}°, ${(data.live.longitude || 0).toFixed(1)}°` },
                        ].map(item => (
                          <div key={item.label}>
                            <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>{item.label}</div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--amex-blue-light)', marginTop: 2 }}>{item.value}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {data.simulated && (
                    <div style={{ fontSize: 11, color: 'var(--text-dim)', fontStyle: 'italic', textAlign: 'center' }}>
                      ⚠ Simulated data — add your AviationStack API key in server/.env for live data
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* DXB Weather Card */}
          <div className="card card-blue-header">
            <div className="card-header">
              <div className="card-title">
                <div className="card-title-icon">
                  <svg viewBox="0 0 24 24"><path d="M19.36 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.64-4.96z"/></svg>
                </div>
                Dubai DXB Live Weather
              </div>
              <span className={`badge ${weatherDxb?.airport_safe ? 'badge-green' : 'badge-red'}`}>
                {weatherDxb ? (weatherDxb.airport_safe ? 'Airport Safe' : 'Caution') : 'Loading...'}
              </span>
            </div>
            <div style={{ padding: '20px' }}>
              {!weatherDxb ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>
                  <div className="auth-spinner" style={{ margin: '0 auto 12px', borderTopColor: 'var(--amex-blue)' }} />
                  Fetching weather data...
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: 40, fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--text-white)' }}>
                      {Math.round(weatherDxb.temperature_2m || weatherDxb.temperature)}°C
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 14, color: 'var(--text-silver)' }}>{weatherDxb.weather_description}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Dubai International</div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    {[
                      { label: 'Wind Speed', value: `${Math.round(weatherDxb.wind_speed_kmh || 0)} km/h` },
                      { label: 'Wind Gusts', value: `${Math.round(weatherDxb.wind_gusts_kmh || 0)} km/h`, warn: weatherDxb.wind_gusts_kmh > 50 },
                      { label: 'Precipitation', value: `${weatherDxb.precipitation_mm || 0} mm` },
                      { label: 'Visibility', value: `${(weatherDxb.visibility_m / 1000).toFixed(1)} km` },
                    ].map(item => (
                      <div key={item.label} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: 12, border: `1px solid ${item.warn ? 'rgba(245,158,11,0.4)' : 'var(--border-subtle)'}` }}>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>{item.label}</div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: item.warn ? 'var(--status-amber)' : 'var(--text-white)', marginTop: 4 }}>{item.value}</div>
                      </div>
                    ))}
                  </div>

                  <div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8 }}>Airport Weather Health</div>
                    <div className="health-item-row">
                      <div className="health-item-bar">
                        <div className="health-item-fill" style={{ width: `${weatherDxb.health_score}%`, background: weatherDxb.health_score >= 80 ? 'var(--status-green)' : weatherDxb.health_score >= 50 ? 'var(--status-amber)' : 'var(--status-red)' }}></div>
                      </div>
                      <div className="health-item-value">{weatherDxb.health_score}</div>
                    </div>
                  </div>

                  <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                    Updated: {weatherDxb.updated_at ? new Date(weatherDxb.updated_at).toLocaleTimeString() : 'Just now'} · Source: Open-Meteo
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
