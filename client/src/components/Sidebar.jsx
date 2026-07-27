import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';

const NAV_ITEMS = [
  {
    label: 'Core Intelligence',
    items: [
      { id: 'simulator', label: 'Operations Dashboard', icon: <svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></svg> },
      { id: 'graph', label: 'Journey Knowledge Graph', icon: <svg viewBox="0 0 24 24"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="5" r="2"/><circle cx="19" cy="12" r="2"/><circle cx="12" cy="19" r="2"/><line x1="7" y1="12" x2="17" y2="12"/><line x1="12" y1="7" x2="12" y2="17"/></svg> },
      { id: 'swarm', label: 'Agent Swarm Control', icon: <svg viewBox="0 0 24 24"><path d="M12 2a3 3 0 100 6 3 3 0 000-6zM4 8a2 2 0 100 4 2 2 0 000-4zm16 0a2 2 0 100 4 2 2 0 000-4zM12 14c-3.3 0-10 1.7-10 5v1h20v-1c0-3.3-6.7-5-10-5z"/></svg> },
      { id: 'flights', label: 'Live Flight Tracker', icon: <svg viewBox="0 0 24 24"><path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L14 19v-5.5l8 2.5z"/></svg> },
    ]
  },
  {
    label: 'Analytics & Profile',
    items: [
      { id: 'analytics', label: 'Analytics Dashboard', icon: <svg viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/></svg> },
      { id: 'twin', label: 'Traveler Digital Twin', icon: <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg> },
      { id: 'history', label: 'Alert History', icon: <svg viewBox="0 0 24 24"><path d="M13 3a9 9 0 0 0-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42A8.954 8.954 0 0 0 13 21a9 9 0 0 0 0-18zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/></svg> },
      { id: 'logs', label: 'System Telemetry', icon: <svg viewBox="0 0 24 24"><path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg> },
    ]
  },
  {
    label: 'System',
    items: [
      { id: 'settings', label: 'Settings', icon: <svg viewBox="0 0 24 24"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.488.488 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg> },
    ]
  }
];

export default function Sidebar({ activeTab, onTabChange, collapsed, onToggleCollapse }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [cardInfo, setCardInfo] = useState({
    cardNumberMasked: '3782 •••••• 81005',
    tier: 'Platinum Business',
    memberSince: '2018'
  });

  useEffect(() => {
    if (!user) return;
    API.get('/card/status')
      .then(res => {
        if (res.data) setCardInfo(res.data);
      })
      .catch(() => {});
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = (user?.name || 'AARAV GUPTA').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="brand-section">
        <div className="brand-logo-row">
          <div className="brand-logo" title="American Express">
            <svg viewBox="0 0 32 20"><text x="0" y="16" fontFamily="Arial" fontWeight="900" fontSize="12" fill="white" letterSpacing="1">AMEX</text></svg>
          </div>
          {!collapsed && <h1 className="brand-name">ATLAS</h1>}
        </div>
        {!collapsed && <div className="brand-tagline">Intelligent Travel Command</div>}
      </div>

      {/* User Avatar Strip */}
      <div className={`sidebar-user-strip ${collapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-user-avatar">
          {initials}
          <div className="sidebar-user-pulse" />
        </div>
        {!collapsed && (
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user?.name || 'AARAV GUPTA'}</div>
            <div className="sidebar-user-role">{cardInfo.tier || 'Platinum Member'}</div>
          </div>
        )}
      </div>

      <div className="nav-menu">
        {NAV_ITEMS.map(group => (
          <div key={group.label} className="nav-group">
            {!collapsed && (
              <button
                type="button"
                className="nav-label"
                onClick={() => onTabChange(group.items[0].id)}
                title={`Switch to ${group.label}`}
              >
                {group.label}
              </button>
            )}
            {group.items.map(item => (
              <button
                key={item.id}
                type="button"
                className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                onClick={() => onTabChange(item.id)}
                title={collapsed ? item.label : ''}
              >
                {item.icon}
                {!collapsed && <span>{item.label}</span>}
              </button>
            ))}
          </div>
        ))}
      </div>

      {/* Quick Stats */}
      {!collapsed && (
        <div className="sidebar-quick-stats">
          <div className="sidebar-stat">
            <div className="sidebar-stat-value" style={{ color: 'var(--status-green)' }}>●</div>
            <div className="sidebar-stat-label">System Health</div>
          </div>
          <div className="sidebar-stat">
            <div className="sidebar-stat-value">1</div>
            <div className="sidebar-stat-label">Active Journey</div>
          </div>
        </div>
      )}

      <div className="sidebar-footer">
        {!collapsed && (
          <div
            className="amex-sidebar-card-box"
            onClick={() => onTabChange('twin')}
            title="Click to view Traveler Digital Twin profile"
          >
            <div className="s-card-header">
              <span className="s-card-logo">AMERICAN EXPRESS</span>
              <span className="s-card-tier">{cardInfo.tier}</span>
            </div>

            <div className="s-card-chip-row">
              <div className="s-card-chip"></div>
              <svg viewBox="0 0 24 24" width="14" height="14" fill="rgba(255,255,255,0.7)">
                <path d="M12 3a9 9 0 0 0-9 9h2a7 7 0 0 1 7-7V3zm0 4a5 5 0 0 0-5 5h2a3 3 0 0 1 3-3V7zm0 4a1 1 0 0 0-1 1h2a1 1 0 0 0-1-1z"/>
              </svg>
            </div>

            <div className="s-card-num">{cardInfo.cardNumberMasked || '3782 •••••• 81005'}</div>

            <div className="s-card-footer">
              <div>
                <span className="s-lbl">CARDHOLDER</span>
                <div className="s-val">{(user?.name || 'AARAV GUPTA').toUpperCase()}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className="s-lbl">MEMBER SINCE</span>
                <div className="s-val">{cardInfo.memberSince || '2018'}</div>
              </div>
            </div>
          </div>
        )}

        <div className="system-status">
          <div className="status-dot" id="system-status-dot"></div>
          {!collapsed && <span className="system-status-text">ATLAS Core Online</span>}
        </div>

        <button
          className="sidebar-logout-btn"
          onClick={handleLogout}
          title="Sign out of ATLAS"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
            <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
          </svg>
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>

      {/* Collapse Toggle */}
      <button className="sidebar-collapse-btn" onClick={onToggleCollapse} title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
        <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
          {collapsed
            ? <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
            : <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
          }
        </svg>
      </button>
    </aside>
  );
}
