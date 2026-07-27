import { useState } from 'react';

export default function LogsTab({ logs = [] }) {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const filtered = logs.filter(l => {
    const matchFilter = filter === 'all' || l.level === filter;
    const matchSearch = search === '' || l.msg.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const levelClass = { info: 'info', warn: 'warn', err: 'err', success: 'success' };

  return (
    <section id="tab-logs" className="tab-content active">
      <div className="page-scroll" style={{ flex: 1 }}>
        <div className="card logs-card">
          <div className="logs-toolbar">
            <div className="logs-filters">
              {['all', 'info', 'warn', 'err', 'success'].map(f => (
                <button
                  key={f}
                  className={`log-filter-btn ${filter === f ? 'active' : ''}`}
                  onClick={() => setFilter(f)}
                >
                  {f === 'all' ? 'All' : f === 'err' ? 'ERROR' : f.toUpperCase()}
                </button>
              ))}
            </div>
            <input
              type="text"
              className="logs-search"
              placeholder="Filter telemetry stream..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="logs-console">
            {filtered.length === 0 ? (
              <div className="log-line">
                <span className="log-ts">--:--:--</span>
                <span className="log-lv info">[INFO]</span>
                <span className="log-msg">ATLAS Intelligence Core initialized. All systems nominal. Journey monitoring active.</span>
              </div>
            ) : filtered.map((l, i) => (
              <div key={i} className="log-line">
                <span className="log-ts">{l.ts}</span>
                <span className={`log-lv ${levelClass[l.level] || 'info'}`}>[{l.level.toUpperCase()}]</span>
                <span className="log-msg">{l.msg}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
