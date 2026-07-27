import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';

const TAB_TITLES = {
  simulator:  { title: 'Operations Dashboard', crumb: 'American Express ATLAS › Live Journey Intelligence › Simulation' },
  graph:      { title: 'Journey Knowledge Graph', crumb: 'American Express ATLAS › Intelligence › Knowledge Graph' },
  swarm:      { title: 'Agent Swarm Control Room', crumb: 'American Express ATLAS › Intelligence › Agent Swarm' },
  flights:    { title: 'Live Flight Tracker', crumb: 'American Express ATLAS › Live Data › AviationStack' },
  twin:       { title: 'Traveler Digital Twin', crumb: 'American Express ATLAS › Profile › Digital Twin' },
  history:    { title: 'Alert History', crumb: 'American Express ATLAS › Logs › Simulation History' },
  logs:       { title: 'System Telemetry Logs', crumb: 'American Express ATLAS › Logs › System Telemetry' },
  analytics:  { title: 'Analytics Dashboard', crumb: 'American Express ATLAS › Intelligence › Analytics' },
  settings:   { title: 'Settings & Preferences', crumb: 'American Express ATLAS › System › Settings' },
};

export default function TopHeader({
  activeTab,
  onTabChange,
  journeyScore,
  alertActive,
  notifCount,
  onNotifClick,
  journeys = [],
  activeJourney,
  onSelectJourney,
  onOpenTripPlanner,
  onExportPDF
}) {
  const { title, crumb } = TAB_TITLES[activeTab] || TAB_TITLES.simulator;
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [clock, setClock] = useState(new Date());
  const [showTripMenu, setShowTripMenu] = useState(false);
  const [cardTier, setCardTier] = useState('Platinum Business');
  const [cardVerified, setCardVerified] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!user) return;
    API.get('/card/status')
      .then(res => {
        if (res.data) {
          setCardTier(res.data.tier || 'Platinum Business');
          setCardVerified(Boolean(res.data.verified));
        }
      })
      .catch(() => {});
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const currJourneyTitle = activeJourney
    ? `${activeJourney.origin_code} ➔ ${activeJourney.transit_code ? activeJourney.transit_code + ' ➔ ' : ''}${activeJourney.destination_code}`
    : 'DEL ➔ DXB ➔ LHR';

  return (
    <div className="top-header">
      <div className="top-header-left">
        <div className="top-header-title">{title}</div>
        <div className="top-header-breadcrumb">{crumb}</div>
      </div>

      <div className="top-header-right">
        {/* AMEX Verified Member Badge */}
        {cardVerified && (
          <div
            className="header-pill amex-header-pill"
            title={`Verified ${cardTier} Member`}
            onClick={() => onTabChange('twin')}
            style={{ cursor: 'pointer' }}
          >
            <div className="amex-pill-chip">AMEX</div>
            <span>{cardTier}</span>
            <svg viewBox="0 0 24 24" fill="#10B981" width="14" height="14">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
        )}

        {/* Executive Synchronized Live Clock */}
        <div className="header-clock" title="ATLAS Synchronized Live Operations Telemetry Clock">
          <div className="clock-pulse-dot" />
          <div className="clock-time-display">
            {clock.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
          <span className="clock-tz-badge">LIVE UTC</span>
        </div>

        {alertActive && (
          <div className="header-alert-pill show">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>
            Disruption Alert
          </div>
        )}

        {/* Active Trip Selector Dropdown */}
        <div className="header-trip-selector-wrap" style={{ position: 'relative' }}>
          <button className="header-pill trip-selector-btn" onClick={() => setShowTripMenu(!showTripMenu)}>
            <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
              <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L14 19v-5.5l8 2.5z"/>
            </svg>
            <span>{currJourneyTitle}</span>
            <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12"><path d="M7 10l5 5 5-5z"/></svg>
          </button>

          {showTripMenu && (
            <div className="header-trip-dropdown">
              <div className="trip-dropdown-header">
                <span>Select Trip Plan</span>
                <button className="trip-add-btn" onClick={() => { setShowTripMenu(false); onOpenTripPlanner(); }}>
                  + Plan New Trip
                </button>
              </div>

              <div className="trip-dropdown-list">
                {journeys.map(j => (
                  <div
                    key={j.id}
                    className={`trip-dropdown-item ${activeJourney?.id === j.id ? 'active' : ''}`}
                    onClick={() => { onSelectJourney(j); setShowTripMenu(false); }}
                  >
                    <div className="trip-item-title">{j.title}</div>
                    <div className="trip-item-sub">
                      {j.origin_city} ➔ {j.destination_city} ({j.flight_leg1})
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Export PDF Button */}
        <button onClick={onExportPDF} className="header-pill export-btn" title="Export Executive Summary PDF">
          <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
            <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
          </svg>
          <span>PDF Report</span>
        </button>

        {/* Notifications Bell */}
        <button onClick={onNotifClick} className="notif-bell-btn" title="Notifications">
          <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
            <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
          </svg>
          {notifCount > 0 && <span className="notif-badge">{notifCount}</span>}
        </button>

        {/* Top Header Sign Out Button */}
        <button onClick={handleLogout} className="header-pill logout-pill-btn" title="Sign Out of ATLAS">
          <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
            <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
          </svg>
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}
