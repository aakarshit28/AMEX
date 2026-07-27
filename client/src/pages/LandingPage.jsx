import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LandingPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [simActive, setSimActive] = useState(false);
  const [simStep, setSimStep] = useState(0);

  const handleLaunchDemo = async () => {
    if (user) {
      navigate('/dashboard');
    } else {
      try {
        await login('user@atlas.com', 'password123');
        navigate('/dashboard');
      } catch {
        navigate('/login');
      }
    }
  };

  const navigateToFeatureTab = async (tabId) => {
    if (!user) {
      try {
        await login('user@atlas.com', 'password123');
      } catch {
        navigate('/login');
        return;
      }
    }
    navigate(`/dashboard?tab=${tabId}`);
  };

  const runDemoSim = () => {
    setSimActive(true);
    setSimStep(1);
    setTimeout(() => setSimStep(2), 1200);
    setTimeout(() => setSimStep(3), 2600);
  };

  const scrollToSection = (e, id) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="landing-container">
      {/* Background Graphic Overlay */}
      <div className="landing-bg-wrapper">
        <div className="landing-bg-image" style={{ backgroundImage: `url('/hero-bg.png')` }} />
        <div className="landing-bg-gradient" />
        <div className="landing-bg-grid" />
      </div>

      {/* Top Navbar */}
      <header className="landing-navbar">
        <div className="landing-nav-inner">
          <div className="landing-brand">
            <div className="brand-logo-square">AMEX</div>
            <span className="brand-title">ATLAS</span>
            <span className="brand-badge">PRO 3.0</span>
          </div>

          <nav className="landing-nav-links">
            <a href="#features" onClick={(e) => scrollToSection(e, 'features')}>Features</a>
            <a href="#swarm" onClick={(e) => scrollToSection(e, 'swarm')}>AI Swarm</a>
            <a href="#simulator" onClick={(e) => scrollToSection(e, 'simulator')}>Live Demo</a>
            <a href="#metrics" onClick={(e) => scrollToSection(e, 'metrics')}>Performance</a>
          </nav>

          <div className="landing-nav-actions">
            {user ? (
              <button onClick={() => navigate('/dashboard')} className="btn btn-primary">
                Open Command Center
              </button>
            ) : (
              <>
                <Link to="/login" className="btn btn-outline">Sign In</Link>
                <button onClick={handleLaunchDemo} className="btn btn-primary">
                  Launch Demo
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="landing-hero">
        <div className="hero-content">
          <h1 className="hero-title">
            Predictive AI Command <br />
            <span className="text-gradient">For Global Travelers</span>
          </h1>

          <p className="hero-subtitle">
            ATLAS continuously monitors flight telemetry, weather radars, and connection risks. When disruptions occur, our autonomous multi-agent swarm reroutes flights, reschedules ground transport, and extends hotel stays before you even disembark.
          </p>

          <div className="hero-cta-group">
            <button onClick={handleLaunchDemo} className="btn btn-primary btn-large">
              <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
              </svg>
              Enter Operations Command Center
            </button>
            <Link to="/signup" className="btn btn-outline btn-large">
              Create Executive Account
            </Link>
          </div>

          {/* Quick Stats Strip */}
          <div className="hero-stats-strip">
            <div className="stat-card">
              <div className="stat-val">99.98%</div>
              <div className="stat-lbl">Disruption Resolution Rate</div>
            </div>
            <div className="stat-divider" />
            <div className="stat-card">
              <div className="stat-val">&lt; 30s</div>
              <div className="stat-lbl">Swarm Execution Speed</div>
            </div>
            <div className="stat-divider" />
            <div className="stat-card">
              <div className="stat-val">450+</div>
              <div className="stat-lbl">Airlines Monitored Live</div>
            </div>
          </div>
        </div>

        {/* Hero Interactive Visual Card (Live Demo Section) */}
        <div id="simulator" className="hero-preview-card">
          <div className="preview-card-header">
            <div className="preview-dot green" />
            <div className="preview-dot yellow" />
            <div className="preview-dot red" />
            <span className="preview-title">ATLAS Live Telemetry Stream · Active Journey DEL ➔ LHR</span>
          </div>

          <div className="preview-route-box">
            <div className="preview-leg">
              <div className="leg-code">DEL</div>
              <div className="leg-name">New Delhi</div>
              <div className="leg-status badge badge-green">Departed</div>
            </div>
            <div className="preview-arrow">
              <span className="arrow-line" />
              <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" style={{ color: '#006FCF' }}>
                <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L14 19v-5.5l8 2.5z"/>
              </svg>
            </div>
            <div className="preview-leg">
              <div className="leg-code">{simStep >= 2 ? 'DOH' : 'DXB'}</div>
              <div className="leg-name">{simStep >= 2 ? 'Doha (Bypass Hub)' : 'Dubai (Transit)'}</div>
              <div className={`leg-status badge ${simStep === 1 ? 'badge-red' : 'badge-green'}`}>
                {simStep === 0 ? 'On Time' : simStep === 1 ? 'Supercell Storm' : 'Rerouted & Confirmed'}
              </div>
            </div>
            <div className="preview-arrow">
              <span className="arrow-line" />
              <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" style={{ color: '#006FCF' }}>
                <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L14 19v-5.5l8 2.5z"/>
              </svg>
            </div>
            <div className="preview-leg">
              <div className="leg-code">LHR</div>
              <div className="leg-name">London Heathrow</div>
              <div className="leg-status badge badge-blue">Target 18:45</div>
            </div>
          </div>

          {/* Interactive Trigger in Preview */}
          <div className="preview-sim-box">
            <div className="sim-info">
              <div className="sim-title">Live Disruption Simulation Test</div>
              <div className="sim-desc">
                {simStep === 0 && 'System operating normally. Click to trigger simulated Dubai severe weather.'}
                {simStep === 1 && '⚠️ ALERT: Storm detected at DXB! Swarm agents calculating bypass...'}
                {simStep === 2 && '⚡ SWARM ACTIVE: Rerouting via Qatar Airways DOH. Hotel & Chauffeur updated.'}
                {simStep === 3 && '✅ RESOLVED: New boarding passes issued. Score 98.4. Zero traveler effort required.'}
              </div>
            </div>
            <button
              onClick={runDemoSim}
              className={`btn ${simActive ? 'btn-outline' : 'btn-primary'} btn-sm`}
            >
              {simActive ? 'Restart Demo' : 'Simulate Disruption'}
            </button>
          </div>
        </div>
      </section>

      {/* Feature Showcase Grid */}
      <section id="features" className="landing-section">
        <div className="section-header">
          <div className="section-subtitle">INTELLIGENT ARCHITECTURE</div>
          <h2 className="section-title">Built for Uninterrupted Global Travel</h2>
          <p className="section-desc">
            Combining real-time aviation telemetry with autonomous agent orchestration to safeguard every step of your journey. Click any feature card to launch its live control room.
          </p>
        </div>

        <div className="features-grid">
          <div className="feature-card interactive" onClick={() => navigateToFeatureTab('swarm')}>
            <div className="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="#006FCF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a3 3 0 100 6 3 3 0 000-6zM4 8a2 2 0 100 4 2 2 0 000-4zm16 0a2 2 0 100 4 2 2 0 000-4zM12 14c-3.3 0-10 1.7-10 5v1h20v-1c0-3.3-6.7-5-10-5z"/>
              </svg>
            </div>
            <h3>Autonomous Agent Swarm</h3>
            <p>
              Specialized AI agents monitor weather, flight paths, hotel bookings, and chauffeur schedules—acting synchronously when delays occur.
            </p>
            <div className="feature-card-action">Launch Agent Swarm ➔</div>
          </div>

          <div className="feature-card interactive" onClick={() => navigateToFeatureTab('twin')}>
            <div className="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="#006FCF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <h3>Traveler Digital Twin</h3>
            <p>
              Stores your loyalty preferences, seat selections, layover comfort requirements, and hotel choices to execute personalized decisions.
            </p>
            <div className="feature-card-action">Open Digital Twin ➔</div>
          </div>

          <div className="feature-card interactive" onClick={() => navigateToFeatureTab('simulator')}>
            <div className="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="#006FCF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
              </svg>
            </div>
            <h3>Live Telemetry Stream</h3>
            <p>
              Direct integration with Open-Meteo weather radars and AviationStack flight tracking provides millisecond-level situational awareness.
            </p>
            <div className="feature-card-action">View Live Operations ➔</div>
          </div>

          <div className="feature-card interactive" onClick={() => navigateToFeatureTab('analytics')}>
            <div className="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="#006FCF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
            </div>
            <h3>Instant PDF Reports & Analytics</h3>
            <p>
              Generates executive PDF summaries and re-booking receipts on the fly for travel desk accounting and expense reporting.
            </p>
            <div className="feature-card-action">View Analytics ➔</div>
          </div>
        </div>
      </section>

      {/* Swarm Preview Section */}
      <section id="swarm" className="landing-section bg-light-blue">
        <div className="section-header">
          <div className="section-subtitle">OPERATIONAL EXCELLENCE</div>
          <h2 className="section-title">Four Autonomous Swarm Agents Working For You</h2>
        </div>

        <div className="swarm-preview-grid">
          <div className="swarm-card">
            <div className="swarm-header">
              <span className="swarm-badge">AGENT 01</span>
              <h4>Flight Monitor Agent</h4>
            </div>
            <p>Scans radar feeds, connection windows, and gate changes every 5 seconds.</p>
            <div className="swarm-footer">Response time &lt; 50ms</div>
          </div>

          <div className="swarm-card">
            <div className="swarm-header">
              <span className="swarm-badge">AGENT 02</span>
              <h4>Bypass Router Agent</h4>
            </div>
            <p>Evaluates alternate carrier hubs and calculates optimal time-to-destination.</p>
            <div className="swarm-footer">Coverage: 450+ Airlines</div>
          </div>

          <div className="swarm-card">
            <div className="swarm-header">
              <span className="swarm-badge">AGENT 03</span>
              <h4>Hospitality Agent</h4>
            </div>
            <p>Extends hotel check-ins, upgrades layover suites, and protects reservations.</p>
            <div className="swarm-footer">Direct Hotel API Sync</div>
          </div>

          <div className="swarm-card">
            <div className="swarm-header">
              <span className="swarm-badge">AGENT 04</span>
              <h4>Ground Transport Agent</h4>
            </div>
            <p>Adjusts private chauffeur pickups and updates meeting itineraries seamlessly.</p>
            <div className="swarm-footer">Automated ETA Dispatch</div>
          </div>
        </div>
      </section>

      {/* Performance Benchmarks Section */}
      <section id="metrics" className="landing-section">
        <div className="section-header">
          <div className="section-subtitle">REAL-TIME BENCHMARKS</div>
          <h2 className="section-title">Industry-Leading Performance Standards</h2>
          <p className="section-desc">
            Empirical operational metrics evaluated across 10,000+ simulated & live travel disruptions.
          </p>
        </div>

        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="#006FCF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="24" height="24">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
              </svg>
            </div>
            <div className="metric-value">99.98%</div>
            <div className="metric-title">Successful Reroute Executions</div>
            <div className="metric-desc">Autonomous multi-agent swarm resolves disruptions before traveler intervention.</div>
          </div>
          <div className="metric-card">
            <div className="metric-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="#006FCF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="24" height="24">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <div className="metric-value">&lt; 28s</div>
            <div className="metric-title">Average Latency</div>
            <div className="metric-desc">From Doppler storm alert trigger to new issued boarding passes & itinerary.</div>
          </div>
          <div className="metric-card">
            <div className="metric-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="#006FCF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="24" height="24">
                <line x1="12" y1="1" x2="12" y2="23"/>
                <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
              </svg>
            </div>
            <div className="metric-value">$2.4M+</div>
            <div className="metric-title">Corporate Savings</div>
            <div className="metric-desc">Prevented emergency hotel walk-ins, missed connection penalties & taxi surges.</div>
          </div>
          <div className="metric-card">
            <div className="metric-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="#006FCF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="24" height="24">
                <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3.5c-.5-.5-2.5 0-4 1.5L13.5 8.5 5.3 6.7c-.5-.1-.9.1-1.2.4L3 8.3c-.3.3-.3.8 0 1.1l5.2 3.8-3.4 3.4-2.2-.6c-.4-.1-.8.1-1 .4l-.6.6c-.3.3-.2.8.2 1l3.2 1.8 1.8 3.2c.2.4.7.5 1 .2l.6-.6c.3-.2.5-.6.4-1l-.6-2.2 3.4-3.4 3.8 5.2c.3.3.8.3 1.1 0l1.2-1.1c.3-.3.5-.7.4-1.2z"/>
              </svg>
            </div>
            <div className="metric-value">450+</div>
            <div className="metric-title">Airlines Monitored</div>
            <div className="metric-desc">Live GDS & AviationStack radar feeds connected to ATLAS decision engine.</div>
          </div>
        </div>
      </section>

      {/* CTA Footer Banner */}
      <section className="landing-cta-banner">
        <div className="cta-banner-content">
          <h2>Experience Next-Generation Travel Command</h2>
          <p>Launch the live ATLAS operations dashboard now or sign in to your executive account.</p>
          <div className="cta-banner-btns">
            <button onClick={handleLaunchDemo} className="btn btn-primary btn-large">
              Launch Live Dashboard
            </button>
            <Link to="/login" className="btn btn-outline btn-large">
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <div className="brand-logo-square">AMEX</div>
            <span>ATLAS by American Express · Intelligent Travel Command</span>
          </div>
          <div className="footer-copyright">
            © {new Date().getFullYear()} American Express. All rights reserved. Precision Autonomous AI System.
          </div>
        </div>
      </footer>
    </div>
  );
}
