import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Background Graphic & Texture Overlay */}
      <div className="auth-bg-image" style={{ backgroundImage: `url('/hero-bg.png')` }} />
      <div className="auth-bg-overlay" />
      <div className="auth-bg-grid" />

      <div className="auth-container-wrapper">
        {/* Left Showcase Banner */}
        <div className="auth-showcase-panel">
          <div className="showcase-brand-tag">
            <span className="brand-badge-mini">AMEX</span> ATLAS COMMAND
          </div>
          <h2 className="showcase-heading">Intelligent Autonomous Travel Command</h2>
          <p className="showcase-subtext">
            ATLAS dynamically monitors flight telemetry, weather radars, and connection risks—rerouting itineraries before disruptions strike.
          </p>

          <div className="showcase-features-list">
            <div className="showcase-feat-item">
              <div className="feat-bullet-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="#006FCF" strokeWidth="2" width="20" height="20">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                </svg>
              </div>
              <div>
                <strong>Autonomous Swarm Rerouting</strong>
                <p>Monitors Doppler feeds and re-books flights, hotels, & ground transport in &lt;30s.</p>
              </div>
            </div>

            <div className="showcase-feat-item">
              <div className="feat-bullet-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="#006FCF" strokeWidth="2" width="20" height="20">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
              <div>
                <strong>Traveler Digital Twin</strong>
                <p>Learns seat preferences, airline loyalty perks, and layover tolerances.</p>
              </div>
            </div>

            <div className="showcase-feat-item">
              <div className="feat-bullet-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="#006FCF" strokeWidth="2" width="20" height="20">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
              <div>
                <strong>Platinum Corporate Assurance</strong>
                <p>Automated EU261 compensation filing & executive PDF receipts.</p>
              </div>
            </div>
          </div>

          <div className="showcase-footer-strip">
            <div className="showcase-stat-pill">
              <span className="stat-num">99.98%</span>
              <span className="stat-lbl">Recovery Rate</span>
            </div>
            <div className="showcase-stat-pill">
              <span className="stat-num">450+</span>
              <span className="stat-lbl">Airlines Monitored</span>
            </div>
          </div>
        </div>

        {/* Right Authentication Card */}
        <div className="auth-card">
          <Link to="/" className="auth-back-link">
            ← Back to Landing Page
          </Link>
          <div className="auth-brand">
            <div className="auth-amex-badge">AMEX</div>
            <h1 className="auth-title">ATLAS</h1>
            <p className="auth-subtitle">Sign in to your Operations Command</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="auth-field">
              <label htmlFor="login-email">Executive Email</label>
              <input
                id="login-email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="auth-field">
              <label htmlFor="login-password">Password</label>
              <input
                id="login-password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <div className="auth-error">{error}</div>}
            <button type="submit" className="btn btn-primary auth-btn" disabled={loading}>
              {loading ? (
                <span className="auth-spinner" />
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                    <path d="M11 7L9.6 8.4l2.6 2.6H2v2h10.2l-2.6 2.6L11 17l5-5-5-5zm9 12h-8v2h8c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-8v2h8v14z"/>
                  </svg>
                  Sign In to ATLAS
                </>
              )}
            </button>
          </form>

          <p className="auth-footer-text">
            New to ATLAS?{' '}
            <Link to="/signup" className="auth-link">Create account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
