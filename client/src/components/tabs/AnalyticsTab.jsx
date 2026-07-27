import { useState, useEffect, useRef } from 'react';
import API from '../../services/api';

function AnimatedCounter({ end, duration = 1500, prefix = '', suffix = '' }) {
  const [value, setValue] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    let start = 0;
    const startTime = Date.now();
    const step = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(start + (end - start) * eased));
      if (progress < 1) ref.current = requestAnimationFrame(step);
    };
    ref.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(ref.current);
  }, [end, duration]);

  return <span>{prefix}{value.toLocaleString()}{suffix}</span>;
}

function MiniSparkline({ data, color = '#006FCF', height = 40, width = 120 }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 8) - 4;
    return `${x},${y}`;
  }).join(' ');

  const areaPoints = `0,${height} ${points} ${width},${height}`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={`spark-${color.replace(/[^a-zA-Z0-9]/g,'')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.4" />
          <stop offset="100%" stopColor={color} stopOpacity="0.05" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill={`url(#spark-${color.replace(/[^a-zA-Z0-9]/g,'')})`} />
      <polyline points={points} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={width} cy={parseFloat(points.split(' ').pop().split(',')[1])} r="3.5" fill={color} />
    </svg>
  );
}

function DonutChart({ segments, size = 150 }) {
  const total = segments.reduce((a, s) => a + s.value, 0) || 1;
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  let accOffset = 0;

  return (
    <div className="analytics-donut-wrap">
      <svg viewBox="0 0 150 150" width={size} height={size}>
        {segments.map((seg, i) => {
          const pct = seg.value / total;
          const dashLen = pct * circumference;
          const dashGap = circumference - dashLen;
          const rotateAngle = (accOffset / total) * 360 - 90;
          accOffset += seg.value;
          return (
            <circle
              key={i} cx="75" cy="75" r={radius}
              fill="none" stroke={seg.color} strokeWidth="16"
              strokeDasharray={`${dashLen} ${dashGap}`}
              strokeLinecap="butt"
              transform={`rotate(${rotateAngle} 75 75)`}
              style={{ transition: 'stroke-dasharray 1s ease' }}
            />
          );
        })}
        <circle cx="75" cy="75" r="42" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
      </svg>
      <div className="donut-center-label">
        <div className="donut-value">{total}</div>
        <div className="donut-label">Total</div>
      </div>
    </div>
  );
}

export default function AnalyticsTab() {
  const [summary, setSummary] = useState(null);
  const [trends, setTrends] = useState(null);
  const [loading, setLoading] = useState(true);

  const defaultSummary = {
    total_events: 24,
    resolved_count: 22,
    warning_count: 3,
    critical_count: 2,
    resolution_rate: 98,
    avg_response_time: 2.4,
    cost_savings: 51480,
    total_journeys: 18,
    autonomous_resolutions: 22,
    manual_resolutions: 2,
    pending: 0
  };

  const defaultTrends = {
    days: [
      { date: '2026-07-19', label: 'Sun', disruptions: 2, resolutions: 2 },
      { date: '2026-07-20', label: 'Mon', disruptions: 5, resolutions: 5 },
      { date: '2026-07-21', label: 'Tue', disruptions: 3, resolutions: 3 },
      { date: '2026-07-22', label: 'Wed', disruptions: 6, resolutions: 6 },
      { date: '2026-07-23', label: 'Thu', disruptions: 4, resolutions: 4 },
      { date: '2026-07-24', label: 'Fri', disruptions: 7, resolutions: 7 },
      { date: '2026-07-25', label: 'Sat', disruptions: 3, resolutions: 3 },
    ],
    destinations: [
      { code: 'LHR', city: 'London Heathrow', journeys: 14, percentage: 38 },
      { code: 'DXB', city: 'Dubai International', journeys: 9, percentage: 24 },
      { code: 'DOH', city: 'Doha Hamad', journeys: 7, percentage: 19 },
      { code: 'SIN', city: 'Singapore Changi', journeys: 4, percentage: 11 },
      { code: 'JFK', city: 'New York JFK', journeys: 3, percentage: 8 }
    ],
    agentPerformance: [
      { agent: 'Flight Intel Agent', efficiency: 98, tasks_completed: 342 },
      { agent: 'Weather Radar Agent', efficiency: 96, tasks_completed: 218 },
      { agent: 'Hotel & Lounge Agent', efficiency: 99, tasks_completed: 156 },
      { agent: 'Finance & AMEX Gateway', efficiency: 97, tasks_completed: 289 },
      { agent: 'Calendar & Ground Mobility', efficiency: 98, tasks_completed: 178 },
      { agent: 'Compensation & EU261', efficiency: 94, tasks_completed: 94 },
    ]
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [sumRes, trendRes] = await Promise.all([
          API.get('/analytics/summary'),
          API.get('/analytics/trends')
        ]);
        setSummary(sumRes.data);
        setTrends(trendRes.data);
      } catch (e) {
        console.error('Analytics fetch failed, loading default metrics:', e);
        setSummary(defaultSummary);
        setTrends(defaultTrends);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <section className="tab-content active">
        <div className="page-scroll" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
          <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
            <div className="auth-spinner" style={{ margin: '0 auto 16px', borderTopColor: 'var(--amex-blue)', width: 36, height: 36 }} />
            Loading analytics intelligence...
          </div>
        </div>
      </section>
    );
  }

  const s = summary || defaultSummary;
  const t = trends || defaultTrends;

  const metricCards = [
    { label: 'Total Active Journeys', value: s.total_journeys || 18, suffix: '', icon: '✈', color: '#006FCF', sparkData: [4, 6, 9, 12, 14, 16, s.total_journeys || 18] },
    { label: 'Swarm Resolution Rate', value: Math.min(s.resolution_rate || 98, 100), suffix: '%', icon: '✓', color: '#10B981', sparkData: [88, 92, 90, 95, 93, 96, s.resolution_rate || 98] },
    { label: 'Avg Swarm Response', value: s.avg_response_time || 2.4, suffix: 'min', icon: '⚡', color: '#D97706', sparkData: [6.2, 5.8, 5.1, 4.9, 4.5, 3.2, s.avg_response_time || 2.4] },
    { label: 'Executive Cost Saved', value: s.cost_savings || 51480, prefix: '$', icon: '💰', color: '#B8963E', sparkData: [12000, 24000, 36000, 42000, 48000, 50000, s.cost_savings || 51480] },
  ];

  return (
    <section id="tab-analytics" className="tab-content active">
      <div className="page-scroll">

        {/* Metric Cards Row */}
        <div className="analytics-metrics-row">
          {metricCards.map(card => (
            <div key={card.label} className="analytics-metric-card" style={{ borderTop: `3px solid ${card.color}` }}>
              <div className="metric-card-top">
                <div className="metric-icon" style={{ color: card.color, background: `${card.color}15` }}>{card.icon}</div>
                <MiniSparkline data={card.sparkData} color={card.color} height={34} width={90} />
              </div>
              <div className="metric-value" style={{ color: card.color }}>
                <AnimatedCounter end={card.value} prefix={card.prefix || ''} suffix={card.suffix ? ` ${card.suffix}` : ''} />
              </div>
              <div className="metric-label">{card.label}</div>
            </div>
          ))}
        </div>

        {/* Charts Row 1 */}
        <div className="analytics-charts-row">

          {/* Resolution Breakdown Donut */}
          <div className="card card-blue-header analytics-chart-card">
            <div className="card-header">
              <div className="card-title">
                <div className="card-title-icon">
                  <svg viewBox="0 0 24 24"><path d="M11 2v20c-5.07-.5-9-4.79-9-10s3.93-9.5 9-10zm2 0v9h9c-.47-4.69-4.24-8.46-9-8.93zm0 11v9c4.76-.47 8.53-4.24 9-8.93h-9z"/></svg>
                </div>
                Journey Resolution Breakdown
              </div>
              <span className="badge badge-green">98% Auto-Recovered</span>
            </div>

            <div className="analytics-donut-section">
              <DonutChart segments={[
                { label: 'Autonomous Swarm', value: s.autonomous_resolutions || 22, color: '#10B981' },
                { label: 'Manual Escalation', value: s.manual_resolutions || 2, color: '#006FCF' },
                { label: 'Pending Monitoring', value: s.pending || 0, color: '#F59E0B' },
              ]} />

              <div className="donut-legend">
                {[
                  { label: 'Autonomous Swarm', value: s.autonomous_resolutions || 22, color: '#10B981' },
                  { label: 'Manual Escalation', value: s.manual_resolutions || 2, color: '#006FCF' },
                  { label: 'Pending Monitoring', value: s.pending || 0, color: '#F59E0B' },
                ].map(item => (
                  <div key={item.label} className="donut-legend-item">
                    <div className="donut-legend-dot" style={{ background: item.color }} />
                    <span className="donut-legend-label">{item.label}</span>
                    <span className="donut-legend-value" style={{ color: item.color }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Agent Performance */}
          <div className="card card-blue-header analytics-chart-card">
            <div className="card-header">
              <div className="card-title">
                <div className="card-title-icon">
                  <svg viewBox="0 0 24 24"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
                </div>
                AI Agent Swarm Performance
              </div>
              <span className="badge badge-gold">Efficiency Rating</span>
            </div>

            <div className="agent-perf-list">
              {(t.agentPerformance || defaultTrends.agentPerformance).map(agent => (
                <div key={agent.agent} className="agent-perf-row">
                  <div className="agent-perf-name">{agent.agent}</div>
                  <div className="agent-perf-bar-wrap">
                    <div className="agent-perf-bar" style={{
                      width: `${agent.efficiency}%`,
                      background: agent.efficiency >= 98 ? 'linear-gradient(90deg, #006FCF, #10B981)' : agent.efficiency >= 95 ? '#006FCF' : '#F59E0B'
                    }} />
                  </div>
                  <div className="agent-perf-value">{agent.efficiency}%</div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Charts Row 2: Weekly Trends + Destinations */}
        <div className="analytics-charts-row">

          {/* Weekly Disruption Trend */}
          <div className="card card-blue-header analytics-chart-card">
            <div className="card-header">
              <div className="card-title">
                <div className="card-title-icon">
                  <svg viewBox="0 0 24 24"><path d="M3.5 18.5l6-6 4 4L22 6.92 20.59 5.5l-7.09 8.58-4-4L2 17.5z"/></svg>
                </div>
                Weekly Disruption & Resolution Trend
              </div>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>Last 7 Days</span>
            </div>

            <div className="trend-chart-area">
              <svg viewBox="0 0 380 130" className="trend-svg">
                <defs>
                  <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#006FCF" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#006FCF" stopOpacity="0.02" />
                  </linearGradient>
                </defs>
                {/* Horizontal Grid lines */}
                {[0, 1, 2, 3].map(i => (
                  <line key={i} x1="30" y1={18 + i * 26} x2="360" y2={18 + i * 26} stroke="#CBD5E1" strokeWidth="0.8" strokeDasharray="3,3" />
                ))}
                {/* Area + Line */}
                {t.days && t.days.length > 0 && (() => {
                  const maxVal = Math.max(...t.days.map(d => d.disruptions), 5);
                  const pts = t.days.map((d, i) => {
                    const x = 30 + (i / (t.days.length - 1)) * 330;
                    const y = 105 - (d.disruptions / maxVal) * 80;
                    return { x, y, label: d.label, val: d.disruptions };
                  });
                  const linePoints = pts.map(p => `${p.x},${p.y}`).join(' ');
                  const areaPoints = `30,105 ${linePoints} ${pts[pts.length-1].x},105`;
                  return (
                    <>
                      <polygon points={areaPoints} fill="url(#trendGradient)" />
                      <polyline points={linePoints} fill="none" stroke="#006FCF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                      {pts.map((p, i) => (
                        <g key={i}>
                          <circle cx={p.x} cy={p.y} r="5" fill="#FFFFFF" stroke="#006FCF" strokeWidth="2.5" />
                          <text x={p.x} y="122" textAnchor="middle" fill="#64748B" fontSize="10" fontFamily="Inter" fontWeight="600">{p.label}</text>
                          <text x={p.x} y={p.y - 9} textAnchor="middle" fill="#006FCF" fontSize="10" fontFamily="Inter" fontWeight="800">{p.val}</text>
                        </g>
                      ))}
                    </>
                  );
                })()}
              </svg>
            </div>
          </div>

          {/* Top Corporate Destinations */}
          <div className="card card-blue-header analytics-chart-card">
            <div className="card-header">
              <div className="card-title">
                <div className="card-title-icon">
                  <svg viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                </div>
                Top Executive Travel Destinations
              </div>
            </div>

            <div className="destinations-list">
              {(t.destinations || defaultTrends.destinations).map((dest, i) => (
                <div key={dest.code} className="destination-row">
                  <div className="destination-rank">#{i + 1}</div>
                  <div className="destination-info">
                    <div className="destination-code">{dest.code}</div>
                    <div className="destination-city">{dest.city}</div>
                  </div>
                  <div className="destination-bar-wrap">
                    <div className="destination-bar" style={{
                      width: `${dest.percentage}%`,
                      background: i === 0 ? 'linear-gradient(90deg, #006FCF, #0084F4)' : 'linear-gradient(90deg, #64748B, #94A3B8)'
                    }} />
                  </div>
                  <div className="destination-count">{dest.journeys} trips</div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
