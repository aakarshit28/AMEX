import { useState } from 'react';

const AGENTS = [
  { id: 'flight', name: 'Flight Intel Agent', desc: 'Monitors gate, crew, aircraft location, runway queue, and connection windows.', icon: '✈' },
  { id: 'weather', name: 'Weather Agent', desc: 'Predicts storm vectors, fog limits, crosswinds and runway visibility from Doppler feeds.', icon: '⛅' },
  { id: 'hotel', name: 'Hotel Agent', desc: 'Extends stays, negotiates late checkout, adjusts dates, and maps nearby alternatives.', icon: '🏨' },
  { id: 'mobility', name: 'Mobility Agent', desc: 'Coordinates airport transfers, parking, Eurostar, rental cars, and transit options.', icon: '🚗' },
  { id: 'calendar', name: 'Calendar Agent', desc: 'Maintains corporate agendas, re-aligns conflicting meetings, notifies Slack and email.', icon: '📅' },
  { id: 'finance', name: 'Finance Agent', desc: 'Optimizes payment using AMEX rewards, applies travel insurance, and tracks corporate budget.', icon: '💳' },
  { id: 'compensation', name: 'Compensation Agent', desc: 'Automatically files EU261 delay claims, insurance refunds, and airline voucher requests.', icon: '⚖️' },
  { id: 'negotiation', name: 'Negotiation Agent', desc: 'Interfaces with airline GDS APIs for priority seating, upgrades, and fee waivers.', icon: '🤝' },
  { id: 'safety', name: 'Safety & Advisory Agent', desc: 'Monitors travel advisories, visa rules, airport strikes, and health entry requirements.', icon: '🛡️' },
  { id: 'personal', name: 'Personal AI Twin', desc: 'Encodes traveler preferences: dietary, seating, pace, loyalty, budget, and schedule rules.', icon: '👤' },
];

const DEFAULT_LOGS = {
  flight:       ['[Telemetry] Tracking EK-513 (DEL→DXB) and EK-003 (DXB→LHR).', '[Status] All flight data nominal. Latency 14ms.'],
  weather:      ['[Doppler] Polling DXB Airport METAR every 30 seconds.', '[Alert] No active weather warnings in forecast.'],
  hotel:        ['[API] Connected to Marriott Bonvoy Channel Manager (London).', '[Booking] LHR Park Lane confirmed: Jul 20–21. Rate locked.'],
  mobility:     ['[Addison Lee] Booking AL-9821 active. Driver: M. Khan. Pre-assigned.', '[Traffic] LHR→City nominal at ETA 17:20.'],
  calendar:     ['[Google API] Calendar synced for Amit Sharma.', '[Meeting] Board meeting Jul 21 09:00 BST detected.'],
  finance:      ['[AMEX API] Platinum Corporate Card authorized. Limit: $50K.', '[Policy] AMEX Travel Interruption Coverage: Active.'],
  compensation: ['[EU261] Regulation compliance module loaded.', '[Database] No prior claims for EK-003 on record.'],
  negotiation:  ['[Amadeus] Seat-release websocket listening on EK-513 and EK-003.', '[Profile] Window/Row-15 preference. Fee waiver eligible.'],
  safety:       ['[FCO/FCDO] Checking UK & UAE advisories for Indian nationals.', '[Visa DB] Indian passport: UK ETA held. UAE: visa-free 30d.'],
  personal:     ['[Memory] Profile: Amit Sharma. Vegetarian · Window/Aisle ≤row15 · Marriott.', '[Pace] Walk speed 1.4m/s. Concourse model loaded.']
};

export default function SwarmTab({ agentStates }) {
  const running = Object.values(agentStates).filter(s => s.state === 'running').length;
  const done = Object.values(agentStates).filter(s => s.state === 'done').length;

  return (
    <section id="tab-swarm" className="tab-content active">
      <div className="page-scroll">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            10 specialized AI employees operating autonomously in parallel
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span className="badge badge-blue">{running} Active</span>
            <span className="badge badge-green">{done} Resolved</span>
          </div>
        </div>
        <div className="agents-grid">
          {AGENTS.map(agent => {
            const agState = agentStates[agent.id] || { state: 'idle', logs: DEFAULT_LOGS[agent.id] || [] };
            return (
              <div key={agent.id} className={`card card-padded agent-card ${agState.state}`}>
                <div className="agent-card-inner">
                  <div className="agent-card-header-row">
                    <div className="agent-icon-box" style={{ fontSize: 20 }}>{agent.icon}</div>
                    <div className="agent-status-row">
                      <div className="agent-status-dot"></div>
                      <span className="agent-status-text">{agState.state}</span>
                    </div>
                  </div>
                  <div className="agent-name">{agent.name}</div>
                  <div className="agent-desc">{agent.desc}</div>
                  <div className="agent-console">
                    {(agState.logs || DEFAULT_LOGS[agent.id] || []).slice(0, 6).map((l, i) => (
                      <div key={i}>{l}</div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
