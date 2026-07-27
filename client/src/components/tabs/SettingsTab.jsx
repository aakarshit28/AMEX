import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import API from '../../services/api';
import AmexCardModal from '../AmexCardModal';

export default function SettingsTab() {
  const { user } = useAuth();
  const [cardModalOpen, setCardModalOpen] = useState(false);
  const [cardStatus, setCardStatus] = useState({
    verified: true,
    tier: 'Platinum Business',
    cardNumberMasked: '3782 •••••• 81005',
    memberSince: '2018',
    loungeAccess: 'Centurion Lounge & Delta Sky Club Priority'
  });

  const [settings, setSettings] = useState({
    emailAlerts: true,
    pushAlerts: true,
    smsAlerts: false,
    autoResolution: true,
    autoBooking: true,
    autoCompensation: true,
    dataRetention: '90',
    theme: 'dark',
    language: 'en',
    timezone: 'auto',
  });
  const [saved, setSaved] = useState(false);

  const fetchCardStatus = async () => {
    try {
      const res = await API.get('/card/status');
      if (res.data) {
        setCardStatus(res.data);
      }
    } catch (e) {
      console.error('Failed to fetch card status in settings:', e);
    }
  };

  useEffect(() => {
    fetchCardStatus();
  }, []);

  const toggle = (key) => setSettings(s => ({ ...s, [key]: !s[key] }));
  const setVal = (key, val) => setSettings(s => ({ ...s, [key]: val }));

  const handleSave = () => {
    localStorage.setItem('atlas_settings', JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const connectedServices = [
    { name: 'AviationStack', status: 'connected', icon: '✈', desc: 'Live flight telemetry radar API' },
    { name: 'Open-Meteo Radar', status: 'connected', icon: '⛅', desc: 'Doppler weather intelligence feed' },
    { name: 'Amadeus GDS', status: 'simulated', icon: '🎫', desc: 'Global reservation distribution system' },
    { name: 'Marriott Bonvoy', status: 'simulated', icon: '🏨', desc: 'Hotel channel & concierge manager' },
    { name: 'AMEX Gateway', status: cardStatus.verified ? 'connected' : 'unverified', icon: '💳', desc: `AMEX ${cardStatus.tier} (${cardStatus.cardNumberMasked})` },
  ];

  return (
    <section id="tab-settings" className="tab-content active">
      <div className="page-scroll">
        <div className="settings-layout">

          {/* Left Column */}
          <div className="settings-column">

            {/* Notification Preferences */}
            <div className="card card-blue-header settings-card">
              <div className="card-header">
                <div className="card-title">
                  <div className="card-title-icon">
                    <svg viewBox="0 0 24 24"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/></svg>
                  </div>
                  Notification Preferences
                </div>
              </div>
              <div className="settings-section">
                {[
                  { key: 'emailAlerts', label: 'Email Alerts', desc: 'Receive disruption alerts via email' },
                  { key: 'pushAlerts', label: 'Push Notifications', desc: 'Browser push notifications for critical events' },
                  { key: 'smsAlerts', label: 'SMS Alerts', desc: 'Text message alerts for high-priority disruptions' },
                ].map(item => (
                  <div key={item.key} className="settings-toggle-row">
                    <div className="settings-toggle-info">
                      <div className="settings-toggle-label">{item.label}</div>
                      <div className="settings-toggle-desc">{item.desc}</div>
                    </div>
                    <button
                      className={`settings-toggle ${settings[item.key] ? 'on' : 'off'}`}
                      onClick={() => toggle(item.key)}
                    >
                      <div className="settings-toggle-thumb" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Autonomous Resolution */}
            <div className="card card-blue-header settings-card">
              <div className="card-header">
                <div className="card-title">
                  <div className="card-title-icon">
                    <svg viewBox="0 0 24 24"><path d="M19.36 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.64-4.96zM17 13l-5 6v-4H9l5-6v4h3z"/></svg>
                  </div>
                  Autonomous Resolution
                </div>
              </div>
              <div className="settings-section">
                {[
                  { key: 'autoResolution', label: 'Auto-Resolve Disruptions', desc: 'ATLAS automatically resolves journey disruptions' },
                  { key: 'autoBooking', label: 'Auto-Booking', desc: 'Allow autonomous flight and hotel rebooking' },
                  { key: 'autoCompensation', label: 'Auto-Compensation Filing', desc: 'Automatically file EU261 and insurance claims' },
                ].map(item => (
                  <div key={item.key} className="settings-toggle-row">
                    <div className="settings-toggle-info">
                      <div className="settings-toggle-label">{item.label}</div>
                      <div className="settings-toggle-desc">{item.desc}</div>
                    </div>
                    <button
                      className={`settings-toggle ${settings[item.key] ? 'on' : 'off'}`}
                      onClick={() => toggle(item.key)}
                    >
                      <div className="settings-toggle-thumb" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Appearance */}
            <div className="card card-blue-header settings-card">
              <div className="card-header">
                <div className="card-title">
                  <div className="card-title-icon">
                    <svg viewBox="0 0 24 24"><path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-1-.01-.83.67-1.5 1.49-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 9 6.5 9 8 9.67 8 10.5 7.33 12 6.5 12zm3-4C8.67 8 8 7.33 8 6.5S8.67 5 9.5 5s1.5.67 1.5 1.5S10.33 8 9.5 8zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 5 14.5 5s1.5.67 1.5 1.5S15.33 8 14.5 8zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 9 17.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg>
                  </div>
                  Appearance & Locale
                </div>
              </div>
              <div className="settings-section">
                <div className="settings-select-row">
                  <div className="settings-toggle-info">
                    <div className="settings-toggle-label">Theme</div>
                    <div className="settings-toggle-desc">Choose your dashboard appearance</div>
                  </div>
                  <select className="settings-select" value={settings.theme} onChange={e => setVal('theme', e.target.value)}>
                    <option value="dark">Dark (Default)</option>
                    <option value="midnight">Midnight Blue</option>
                    <option value="classic">AMEX Classic</option>
                  </select>
                </div>
                <div className="settings-select-row">
                  <div className="settings-toggle-info">
                    <div className="settings-toggle-label">Data Retention</div>
                    <div className="settings-toggle-desc">How long to keep alert history</div>
                  </div>
                  <select className="settings-select" value={settings.dataRetention} onChange={e => setVal('dataRetention', e.target.value)}>
                    <option value="30">30 days</option>
                    <option value="90">90 days</option>
                    <option value="180">6 months</option>
                    <option value="365">1 year</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="settings-column">

            {/* Account */}
            <div className="card card-blue-header settings-card">
              <div className="card-header">
                <div className="card-title">
                  <div className="card-title-icon">
                    <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg>
                  </div>
                  Account & Verified AMEX Card
                </div>
              </div>
              <div className="settings-section">
                <div className="settings-account-card">
                  <div className="settings-account-avatar">
                    {user?.name?.charAt(0)?.toUpperCase() || 'A'}
                  </div>
                  <div className="settings-account-info">
                    <div className="settings-account-name">{cardStatus.cardholderName || user?.name || 'Atlas User'}</div>
                    <div className="settings-account-email">{user?.email || 'user@atlas.com'}</div>
                    <div className="settings-account-badge" style={{ marginTop: 4 }}>
                      <span className="badge badge-gold">
                        {cardStatus.verified ? `Verified AMEX ${cardStatus.tier}` : 'Card Unverified'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="settings-account-actions" style={{ marginTop: 12 }}>
                  <button
                    className="btn btn-primary"
                    style={{ fontSize: 12, width: '100%', background: 'linear-gradient(135deg, #006FCF 0%, #004080 100%)' }}
                    onClick={() => setCardModalOpen(true)}
                  >
                    💳 Manage / Verify AMEX Card Details
                  </button>
                </div>
              </div>
            </div>

            {/* Connected Services */}
            <div className="card card-blue-header settings-card">
              <div className="card-header">
                <div className="card-title">
                  <div className="card-title-icon">
                    <svg viewBox="0 0 24 24"><path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z"/></svg>
                  </div>
                  Connected Services
                </div>
              </div>
              <div className="settings-section">
                {connectedServices.map(svc => (
                  <div key={svc.name} className="settings-service-row">
                    <div className="settings-service-icon">{svc.icon}</div>
                    <div className="settings-service-info">
                      <div className="settings-service-name">{svc.name}</div>
                      <div className="settings-service-desc">{svc.desc}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className={`badge ${svc.status === 'connected' ? 'badge-green' : 'badge-amber'}`} style={{ fontSize: 10 }}>
                        {svc.status === 'connected' ? 'Connected' : 'Simulated'}
                      </span>
                      {svc.name === 'AMEX Gateway' && (
                        <button
                          className="btn btn-outline"
                          style={{ padding: '2px 8px', fontSize: 10 }}
                          onClick={() => setCardModalOpen(true)}
                        >
                          Verify
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div className="settings-save-bar">
          <button className="btn btn-primary" onClick={handleSave} style={{ minWidth: 160 }}>
            {saved ? (
              <><svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg> Settings Saved</>
            ) : (
              <><svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/></svg> Save All Settings</>
            )}
          </button>
          <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>
            Changes apply to your current session
          </span>
        </div>
      </div>

      <AmexCardModal
        isOpen={cardModalOpen}
        onClose={() => setCardModalOpen(false)}
        onVerified={fetchCardStatus}
      />
    </section>
  );
}
