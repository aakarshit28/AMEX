import { useState, useEffect, useRef } from 'react';
import API from '../services/api';

const TYPE_CONFIG = {
  disruption: { icon: '⚠', color: 'var(--status-red)', label: 'Disruption' },
  resolution: { icon: '✓', color: 'var(--status-green)', label: 'Resolved' },
  agent: { icon: '🤖', color: 'var(--amex-blue)', label: 'Agent' },
  system: { icon: '⚙', color: 'var(--text-muted)', label: 'System' },
  info: { icon: 'ℹ', color: 'var(--amex-blue-light)', label: 'Info' },
};

export default function NotificationPanel({ isOpen, onClose, onCountUpdate }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const panelRef = useRef(null);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await API.get('/notifications?limit=50');
      setNotifications(res.data);
      const unread = res.data.filter(n => !n.is_read).length;
      if (onCountUpdate) onCountUpdate(unread);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (isOpen) fetchNotifications();
  }, [isOpen]);

  const markAsRead = async (id) => {
    try {
      await API.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
      if (onCountUpdate) {
        const unread = notifications.filter(n => !n.is_read && n.id !== id).length;
        onCountUpdate(unread);
      }
    } catch (e) { console.error(e); }
  };

  const markAllRead = async () => {
    try {
      await API.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
      if (onCountUpdate) onCountUpdate(0);
    } catch (e) { console.error(e); }
  };

  const clearAll = async () => {
    try {
      await API.delete('/notifications');
      setNotifications([]);
      if (onCountUpdate) onCountUpdate(0);
    } catch (e) { console.error(e); }
  };

  const filtered = filter === 'all'
    ? notifications
    : notifications.filter(n => n.type === filter);

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  // Close on click outside
  useEffect(() => {
    const handleClick = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target) && !e.target.closest('.notif-bell-btn')) {
        onClose();
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="notification-panel-overlay open">
      <div className={`notification-panel ${isOpen ? 'open' : ''}`} ref={panelRef}>
        <div className="notif-panel-header">
          <div className="notif-panel-title">
            <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/></svg>
            Notifications
          </div>
          <div className="notif-panel-actions">
            {notifications.some(n => !n.is_read) && (
              <button className="notif-action-btn" onClick={markAllRead} title="Mark all read">
                <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M18 7l-1.41-1.41-6.34 6.34 1.41 1.41L18 7zm4.24-1.41L11.66 16.17 7.48 12l-1.41 1.41L11.66 19l12-12-1.42-1.41zM.41 13.41L6 19l1.41-1.41L1.83 12 .41 13.41z"/></svg>
              </button>
            )}
            {notifications.length > 0 && (
              <button className="notif-action-btn" onClick={clearAll} title="Clear all">
                <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
              </button>
            )}
            <button className="notif-close-btn" onClick={onClose}>
              <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
            </button>
          </div>
        </div>

        <div className="notif-filters">
          {['all', 'disruption', 'resolution', 'agent', 'system'].map(f => (
            <button
              key={f}
              className={`notif-filter-btn ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'All' : TYPE_CONFIG[f]?.label || f}
            </button>
          ))}
        </div>

        <div className="notif-list">
          {loading && (
            <div className="notif-empty">
              <div className="auth-spinner" style={{ margin: '0 auto 12px', borderTopColor: 'var(--amex-blue)' }} />
              Loading...
            </div>
          )}
          {!loading && filtered.length === 0 && (
            <div className="notif-empty">
              <div style={{ fontSize: 32, marginBottom: 8 }}>🔔</div>
              <div style={{ color: 'var(--text-muted)' }}>No notifications yet</div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>Run a simulation to generate activity</div>
            </div>
          )}
          {!loading && filtered.map(n => {
            const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.system;
            return (
              <div
                key={n.id}
                className={`notif-item ${n.is_read ? 'read' : 'unread'}`}
                onClick={() => !n.is_read && markAsRead(n.id)}
              >
                <div className="notif-item-icon" style={{ background: `${cfg.color}20`, color: cfg.color }}>
                  {cfg.icon}
                </div>
                <div className="notif-item-body">
                  <div className="notif-item-title">{n.title}</div>
                  <div className="notif-item-msg">{n.message}</div>
                  <div className="notif-item-time">{timeAgo(n.created_at)}</div>
                </div>
                {!n.is_read && <div className="notif-unread-dot" />}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
