class AgentSwarm {
  constructor(gridId) {
    this.gridId = gridId;
    this.grid   = null;

    this.agents = [
      {
        id: 'flight', name: 'Flight Intel Agent',
        desc: 'Monitors gate, crew, aircraft location, runway queue, and connection windows.',
        state: 'idle',
        logs: ['[Telemetry] Tracking EK-513 (DEL→DXB) and EK-003 (DXB→LHR).', '[Status] All flight data nominal. Latency 14ms.'],
        icon: `<svg viewBox="0 0 24 24"><path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L14 19v-5.5l8 2.5z"/></svg>`
      },
      {
        id: 'weather', name: 'Weather Agent',
        desc: 'Predicts storm vectors, fog limits, crosswinds and runway visibility from Doppler feeds.',
        state: 'idle',
        logs: ['[Doppler] Polling DXB Airport METAR every 30 seconds.', '[Alert] No active weather warnings in forecast.'],
        icon: `<svg viewBox="0 0 24 24"><path d="M19.36 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.64-4.96z"/></svg>`
      },
      {
        id: 'hotel', name: 'Hotel Agent',
        desc: 'Extends stays, negotiates late checkout, adjusts dates, and maps nearby alternatives.',
        state: 'idle',
        logs: ['[API] Connected to Marriott Bonvoy Channel Manager (London).', '[Booking] LHR Park Lane confirmed: Jul 20–21. Rate locked.'],
        icon: `<svg viewBox="0 0 24 24"><path d="M7 14c1.66 0 3-1.34 3-3S8.66 8 7 8s-3 1.34-3 3 1.34 3 3 3zm0-4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm12-3h-8v8H3V5H1v16h2v-3h18v3h2v-9c0-2.21-1.79-4-4-4zm2 9H11v-5h8c1.1 0 2 .9 2 2v3z"/></svg>`
      },
      {
        id: 'mobility', name: 'Mobility Agent',
        desc: 'Coordinates airport transfers, parking, Eurostar, rental cars, and transit options.',
        state: 'idle',
        logs: ['[Addison Lee] Booking AL-9821 active. Driver: M. Khan. Pre-assigned.', '[Traffic] LHR→City nominal at ETA 17:20.'],
        icon: `<svg viewBox="0 0 24 24"><path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42.99L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99z"/></svg>`
      },
      {
        id: 'calendar', name: 'Calendar Agent',
        desc: 'Maintains corporate agendas, re-aligns conflicting meetings, notifies Slack and email.',
        state: 'idle',
        logs: ['[Google API] Calendar synced for Amit Sharma.', '[Meeting] Board meeting Jul 21 09:00 BST detected. Sensitivity flagged.'],
        icon: `<svg viewBox="0 0 24 24"><path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z"/></svg>`
      },
      {
        id: 'finance', name: 'Finance Agent',
        desc: 'Optimizes payment using AMEX rewards, applies travel insurance, and tracks corporate budget.',
        state: 'idle',
        logs: ['[AMEX API] Platinum Corporate Card authorized. Limit: $50K.', '[Policy] AMEX Travel Interruption Coverage: Active. Max claim $15K.'],
        icon: `<svg viewBox="0 0 24 24"><path d="M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9z"/></svg>`
      },
      {
        id: 'compensation', name: 'Compensation Agent',
        desc: 'Automatically files EU261 delay claims, insurance refunds, and airline voucher requests.',
        state: 'idle',
        logs: ['[EU261] Regulation compliance module loaded.', '[Database] No prior claims for EK-003 on record.'],
        icon: `<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.04-.42 1.99-1.07 2.25z"/></svg>`
      },
      {
        id: 'negotiation', name: 'Negotiation Agent',
        desc: 'Interfaces with airline GDS APIs for priority seating, upgrades, and fee waivers.',
        state: 'idle',
        logs: ['[Amadeus] Seat-release websocket listening on EK-513 and EK-003.', '[Profile] Window/Row-15 preference. Fee waiver eligible (Skywards Gold).'],
        icon: `<svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm0 4h9v2H6v-2zm0-8h12v2H6V5z"/></svg>`
      },
      {
        id: 'safety', name: 'Safety & Advisory Agent',
        desc: 'Monitors travel advisories, visa rules, airport strikes, and health entry requirements.',
        state: 'idle',
        logs: ['[FCO/FCDO] Checking UK & UAE advisories for Indian nationals.', '[Visa DB] Indian passport: UK ETA required — already held. UAE: visa-free 30d.'],
        icon: `<svg viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-1 15h2v2h-2v-2zm0-8h2v6h-2V7z"/></svg>`
      },
      {
        id: 'personal', name: 'Personal AI Twin',
        desc: 'Encodes traveler preferences: dietary, seating, pace, loyalty, budget, and schedule rules.',
        state: 'idle',
        logs: ['[Memory] Profile: Amit Sharma. Vegetarian · Window/Aisle ≤row15 · Marriott Bonvoy · Skywards Gold.', '[Pace] Walk speed 1.4m/s. Concourse model loaded.'],
        icon: `<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg>`
      }
    ];
  }

  init() {
    this.grid = document.getElementById(this.gridId);
    this.render();
  }

  render() {
    if (!this.grid) return;
    this.grid.innerHTML = '';
    this.agents.forEach(agent => {
      const card = document.createElement('div');
      card.className = `card card-padded agent-card ${agent.state}`;
      card.id = `agent-card-${agent.id}`;

      const logsHtml = agent.logs.slice(0, 6).map(l => `<div>${l}</div>`).join('');

      card.innerHTML = `
        <div class="agent-card-inner">
          <div class="agent-card-header-row">
            <div class="agent-icon-box">${agent.icon}</div>
            <div class="agent-status-row">
              <div class="agent-status-dot"></div>
              <span class="agent-status-text">${agent.state}</span>
            </div>
          </div>
          <div class="agent-name">${agent.name}</div>
          <div class="agent-desc">${agent.desc}</div>
          <div class="agent-console" id="agent-log-${agent.id}">${logsHtml}</div>
        </div>
      `;
      this.grid.appendChild(card);
    });
    if (window._updateSwarmBadges) window._updateSwarmBadges();
  }

  setAgentState(id, state, logMessage = null) {
    const agent = this.agents.find(a => a.id === id);
    if (!agent) return;

    agent.state = state;
    if (logMessage) {
      const ts = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      agent.logs.unshift(`[${ts}] ${logMessage}`);
    }

    const card = document.getElementById(`agent-card-${id}`);
    if (!card) return;

    card.className = `card card-padded agent-card ${state}`;
    const statusDot  = card.querySelector('.agent-status-dot');
    const statusText = card.querySelector('.agent-status-text');
    if (statusText) statusText.textContent = state;

    const logEl = document.getElementById(`agent-log-${id}`);
    if (logEl) {
      logEl.innerHTML = agent.logs.slice(0, 8).map(l => `<div>${l}</div>`).join('');
      logEl.scrollTop = 0;
    }

    if (window._updateSwarmBadges) window._updateSwarmBadges();
  }

  reset() {
    // Reset each agent to defaults
    const defaults = {
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

    this.agents.forEach(agent => {
      agent.state = 'idle';
      agent.logs  = defaults[agent.id] || ['[Status] Ready.'];
    });

    this.render();
  }
}
