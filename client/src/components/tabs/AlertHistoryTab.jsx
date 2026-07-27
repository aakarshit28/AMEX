import { useState, useEffect } from 'react';
import API from '../../services/api';

const LEVEL_COLORS = { info: '#006FCF', warn: '#F59E0B', err: '#C41E3A', success: '#00A650' };
const LEVEL_LABELS = { info: 'INFO', warn: 'WARN', err: 'ERROR', success: 'RESOLVED' };

export default function AlertHistoryTab() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await API.get('/events?limit=100');
      setEvents(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchEvents(); }, []);

  const clearAll = async () => {
    if (!window.confirm('Clear all alert history?')) return;
    await API.delete('/events');
    setEvents([]);
  };

  const filtered = filter === 'all' ? events : events.filter(e => e.level === filter);

  return (
    <section id="tab-history" className="tab-content active">
      <div className="page-scroll">
        <div className="card">
          <div className="logs-toolbar">
            <div className="logs-filters">
              {['all', 'info', 'warn', 'err', 'success'].map(f => (
                <button key={f} className={`log-filter-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                  {f === 'all' ? 'All' : LEVEL_LABELS[f] || f.toUpperCase()}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <button className="btn btn-outline" style={{ fontSize: 11, padding: '4px 10px' }} onClick={fetchEvents}>Refresh</button>
              {events.length > 0 && (
                <button className="btn btn-outline" style={{ fontSize: 11, padding: '4px 10px', color: 'var(--status-red)', borderColor: 'rgba(196,30,58,0.4)' }} onClick={clearAll}>
                  Clear All
                </button>
              )}
            </div>
          </div>

          <div style={{ padding: '8px 0' }}>
            {loading && (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                <div className="auth-spinner" style={{ margin: '0 auto 12px', borderTopColor: 'var(--amex-blue)' }} />
                Loading alert history...
              </div>
            )}
            {!loading && filtered.length === 0 && (
              <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-dim)' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
                <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>No alert events yet.</div>
                <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 6 }}>Run the simulation to generate events that get saved here.</div>
              </div>
            )}
            {!loading && filtered.map(ev => (
              <div key={ev.id} style={{ display: 'flex', gap: 16, padding: '14px 20px', borderBottom: '1px solid var(--border-subtle)', alignItems: 'flex-start' }}>
                <div style={{ width: 4, minWidth: 4, borderRadius: 4, alignSelf: 'stretch', background: LEVEL_COLORS[ev.level] || '#555' }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: LEVEL_COLORS[ev.level], textTransform: 'uppercase', letterSpacing: '1px' }}>
                        {LEVEL_LABELS[ev.level] || ev.level}
                      </span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-white)' }}>{ev.event_type}</span>
                    </div>
                    <span style={{ fontSize: 10, color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>
                      {new Date(ev.created_at).toLocaleString()}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-silver)', lineHeight: 1.5 }}>{ev.message}</div>
                  {ev.journey && (
                    <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 4 }}>Journey: {ev.journey}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
