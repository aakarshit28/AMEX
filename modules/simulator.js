class SimulatorEngine {
  constructor(graph, swarm, twin) {
    this.graph = graph;
    this.swarm = swarm;
    this.twin  = twin;

    // Controls
    this.btnTrigger = document.getElementById('btn-trigger-storm');
    this.btnReset   = document.getElementById('btn-reset-sim');
    this.simText    = document.getElementById('sim-status-text');

    // Journey Health Gauge
    this.gaugeFill = document.getElementById('gauge-fill');
    this.gaugeVal  = document.getElementById('gauge-val');

    // Health Breakdown bars & values
    this.hbWeather = document.getElementById('hb-weather');
    this.hvWeather = document.getElementById('hv-weather');
    this.hbAirport = document.getElementById('hb-airport');
    this.hvAirport = document.getElementById('hv-airport');
    this.hbConn    = document.getElementById('hb-conn');
    this.hvConn    = document.getElementById('hv-conn');
    this.hbHotel   = document.getElementById('hb-hotel');
    this.hvHotel   = document.getElementById('hv-hotel');
    this.hbTraffic = document.getElementById('hb-traffic');
    this.hvTraffic = document.getElementById('hv-traffic');

    // Header score
    this.headerScore   = document.getElementById('header-score-val');
    this.headerBadge   = document.getElementById('health-status-badge');
    this.headerAlert   = document.getElementById('header-alert-pill');

    // Route info
    this.routeBadgeLayover = document.getElementById('route-badge-layover');
    this.dxbStatus         = document.getElementById('dxb-status');
    this.leg2Info          = document.getElementById('leg2-info');

    // Phone
    this.phoneNotif     = document.getElementById('phone-notif');
    this.phoneTicket    = document.getElementById('phone-ticket');
    this.btnCloseTicket = document.getElementById('btn-close-ticket');
    this.phoneStatusDot = document.getElementById('phone-status-dot');
    this.phoneStatusTxt = document.getElementById('phone-status-text');
    this.phoneArrTime   = document.getElementById('phone-arr-time');

    // Timeline
    this.timelineStatus = document.getElementById('timeline-status');

    // Logs console
    this.logsConsole = document.getElementById('logs-console-window');

    // Decision table rows
    this.rows  = {a: 'row-a', b: 'row-b', c: 'row-c', d: 'row-d'};
    this.fills = {a: 'fill-a', b: 'fill-b', c: 'fill-c', d: 'fill-d'};
    this.vals  = {a: 'val-a',  b: 'val-b',  c: 'val-c',  d: 'val-d'};
    this.stats = {a: 'status-a', b: 'status-b', c: 'status-c', d: 'status-d'};

    this.timeouts     = [];
    this.selectedRow  = 'row-c';
    this.isRunning    = false;
  }

  // ── Init ───────────────────────────────────────────────────────────────
  init() {
    this.resetAll();

    if (this.btnTrigger) {
      this.btnTrigger.addEventListener('click', () => this.runSimulation());
    }
    if (this.btnReset) {
      this.btnReset.addEventListener('click', () => this.resetAll());
    }
    if (this.btnCloseTicket) {
      this.btnCloseTicket.addEventListener('click', e => {
        e.stopPropagation();
        this.phoneTicket.classList.remove('show');
      });
    }

    // Dynamic decision updates when twin sliders change
    this.twin.onPreferenceChange(prefs => {
      if (this.isRunning && this._step >= 3) {
        this.recalcDecisions(prefs);
      }
    });
  }

  // ── Gauge Helper ──────────────────────────────────────────────────────
  setGauge(val) {
    if (!this.gaugeFill || !this.gaugeVal) return;
    // r=38, circumference = 2π×38 ≈ 238.76
    const C = 238.76;
    const offset = C - (C * val / 100);
    this.gaugeFill.style.strokeDasharray = C;
    this.gaugeFill.style.strokeDashoffset = offset;

    if (val >= 85) {
      this.gaugeFill.setAttribute('stroke', 'url(#gaugeGrad)');
    } else if (val >= 65) {
      this.gaugeFill.setAttribute('stroke', '#F59E0B');
    } else {
      this.gaugeFill.setAttribute('stroke', '#C41E3A');
    }

    if (this.gaugeVal) this.gaugeVal.textContent = val;
    if (this.headerScore) this.headerScore.textContent = val;

    // Update badge
    if (this.headerBadge) {
      if (val >= 85) {
        this.headerBadge.textContent = 'Optimal';
        this.headerBadge.className = 'badge badge-green';
      } else if (val >= 65) {
        this.headerBadge.textContent = 'Degraded';
        this.headerBadge.className = 'badge badge-amber';
      } else {
        this.headerBadge.textContent = 'Critical';
        this.headerBadge.className = 'badge badge-red';
      }
    }
  }

  // ── Health Bar Helper ─────────────────────────────────────────────────
  setHealthBar(barEl, valEl, value, status = 'ok') {
    if (barEl) {
      barEl.style.width = value + '%';
      barEl.className = 'health-item-fill';
      if (status === 'warn')   barEl.classList.add('warning');
      if (status === 'danger') barEl.classList.add('danger');
    }
    if (valEl) valEl.textContent = value;
  }

  // ── Logs Helper ───────────────────────────────────────────────────────
  log(level, msg) {
    if (!this.logsConsole) return;
    const ts = new Date().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit', second:'2-digit' });
    const line = document.createElement('div');
    line.className = 'log-line';
    line.innerHTML = `
      <span class="log-ts">${ts}</span>
      <span class="log-lv ${level}">[${level.toUpperCase()}]</span>
      <span class="log-msg">${msg}</span>
    `;
    this.logsConsole.appendChild(line);
    this.logsConsole.scrollTop = this.logsConsole.scrollHeight;
  }

  // ── Timeline Step Activation ──────────────────────────────────────────
  activateStep(n) {
    const el = document.getElementById('ts-' + n);
    if (el) {
      el.classList.add('active');
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    if (this.timelineStatus) this.timelineStatus.textContent = `Step ${n} of 8`;
  }

  // ── Decision Table Update ─────────────────────────────────────────────
  recalcDecisions(prefs) {
    const { costAvoidsDelay: cost, loyaltyWeight: loyalty, layoverTolerance: layover } = prefs;

    const valA = 24;
    let   valB = Math.max(50, Math.min(99, 75 + loyalty * 0.2 - layover * 0.1));
    let   valC = Math.max(60, Math.min(99, 85 + cost * 0.2 - loyalty * 0.1));
    let   valD = Math.max(50, Math.min(99, 88 + layover * 0.05));

    valB = Math.round(valB); valC = Math.round(valC); valD = Math.round(valD);

    this._updateRow('a', valA, 'Risky',   'badge-red',   false);
    this._updateRow('b', valB, loyalty > 80 && valB >= valC - 5 ? 'Selected ✓' : 'Viable', loyalty > 80 && valB >= valC - 5 ? 'badge-green' : 'badge-blue', loyalty > 80 && valB >= valC - 5);
    this._updateRow('c', valC, loyalty > 80 && valB >= valC - 5 ? 'Viable' : 'Selected ✓', loyalty > 80 && valB >= valC - 5 ? 'badge-blue' : 'badge-green', !(loyalty > 80 && valB >= valC - 5));
    this._updateRow('d', valD, 'Backup',  'badge-amber',  false);

    this.selectedRow = loyalty > 80 && valB >= valC - 5 ? 'row-b' : 'row-c';
  }

  _updateRow(key, val, statusText, statusClass, selected) {
    const rowEl    = document.getElementById(this.rows[key]);
    const fillEl   = document.getElementById(this.fills[key]);
    const valEl    = document.getElementById(this.vals[key]);
    const statusEl = document.getElementById(this.stats[key]);

    if (fillEl)   fillEl.style.width = val + '%';
    if (valEl)    valEl.textContent  = val + '%';
    if (statusEl) {
      statusEl.textContent = statusText;
      statusEl.className   = `badge ${statusClass}`;
    }
    if (rowEl) {
      rowEl.classList.toggle('selected', selected);
    }
  }

  // ── Main Simulation Sequence ──────────────────────────────────────────
  runSimulation() {
    this.isRunning  = true;
    this._step      = 0;
    this.btnTrigger.disabled = true;
    this.btnReset.disabled   = true;
    if (this.simText) { this.simText.textContent = 'Running'; this.simText.style.color = 'var(--amex-blue-light)'; }

    this.log('info', 'ATLAS simulation initiated. Evaluating active itinerary DEL → DXB → LHR...');

    const T = 2200; // ms per step

    // Step 1 — storm detected
    this.timeouts.push(setTimeout(() => {
      this._step = 1;
      this.activateStep(1);
      this.setGauge(82);
      this.setHealthBar(this.hbWeather, this.hvWeather, 38, 'danger');
      this.setHealthBar(this.hbConn,    this.hvConn,    65, 'warn');
      if (this.headerAlert) this.headerAlert.classList.add('show');
      this.swarm.setAgentState('weather', 'running', '[Doppler] Storm cells over DXB. Wind 48kt. Lightning risk confirmed.');
      this.swarm.setAgentState('flight',  'running', '[ATC Feed] EK-513 monitoring approach to DXB - storm alerts active.');
      this.log('warn', 'Dubai Airport: Storm front detected. Doppler confirms sustained wind 48kt at Runway 30L.');
    }, T * 0));

    // Step 2 — aircraft delayed
    this.timeouts.push(setTimeout(() => {
      this._step = 2;
      this.activateStep(2);
      this.setGauge(71);
      this.setHealthBar(this.hbAirport, this.hvAirport, 52, 'danger');
      if (this.routeBadgeLayover) { this.routeBadgeLayover.textContent = 'Layover: 18m ⚠️'; this.routeBadgeLayover.className = 'badge badge-red'; }
      this.swarm.setAgentState('weather', 'done', '[Model] 94% confidence: Storm persists 3h. DXB operational impact high.');
      this.swarm.setAgentState('flight',  'running', '[GDS] EK-513 Boeing 777 ground-held at DEL. No departure ETA from ATC.');
      this.log('warn', 'EK-513 ground-held at Indira Gandhi International. Dubai ATC congestion. Delay T+90min minimum.');
    }, T * 1));

    // Step 3 — connection failure predicted
    this.timeouts.push(setTimeout(() => {
      this._step = 3;
      this.activateStep(3);
      this.setGauge(52);
      this.setHealthBar(this.hbConn, this.hvConn, 11, 'danger');
      if (this.dxbStatus)  { this.dxbStatus.textContent  = 'Disrupted ⚠️'; this.dxbStatus.style.color = 'var(--status-red)'; }
      if (this.leg2Info)   { this.leg2Info.textContent   = 'EK-003 · At Risk'; }
      // Trigger graph visualization
      this.graph.triggerStormState();
      this.swarm.setAgentState('flight',  'running', '[ATLAS] Connection miss probability 89%. Layover window: 18 min. Safety threshold: 45 min. Swarm activation required.');
      this.swarm.setAgentState('personal','running', '[Twin] Calculating Amit Sharma transit speed vs Concourse A→C distance. Result: 11% success.');
      this.log('err', 'CRITICAL: Journey Health Score below threshold (70). Missed connection probability 89%. Autonomous Swarm Activated.');
    }, T * 2));

    // Step 4 — decision simulation
    this.timeouts.push(setTimeout(() => {
      this._step = 4;
      this.activateStep(4);
      this.recalcDecisions(this.twin.getPreferences());
      this.swarm.setAgentState('flight',   'done',    '[Swarm] Alternative search complete. Qatar Airways QR-571/QR-003 wins simulation with 96% success.');
      this.swarm.setAgentState('personal', 'done',    '[Twin] Preferences loaded. Seat 12K available. Vegetarian meal confirmed.');
      this.swarm.setAgentState('safety',   'running', '[Compliance] Verifying Indian passport DOH/QR transit visa requirements...');
      this.swarm.setAgentState('finance',  'running', '[AMEX] Checking corporate Platinum card authorization and travel insurance clause.');
      this.log('info', 'AI Simulation Engine: Running 247 parallel futures. Option C (Qatar Airways) scores 96% success probability.');
    }, T * 3));

    // Step 5 — book ticket + hotel
    this.timeouts.push(setTimeout(() => {
      this._step = 5;
      this.activateStep(5);
      this.swarm.setAgentState('safety',      'done', '[Compliance] Indian passport: No transit visa required for DOH. Validated ✓');
      this.swarm.setAgentState('finance',     'done', '[AMEX] Ticket purchased via Platinum Corporate Card. Travel interruption insurance activated.');
      this.swarm.setAgentState('negotiation', 'running', '[GDS] Negotiating seat 12K on QR-571. Requesting vegetarian meal code VGML.');
      this.swarm.setAgentState('hotel',       'running', '[Marriott API] Extending LHR Park Lane checkout by 24h. Requesting complimentary lounge access...');
      if (this.phoneArrTime) this.phoneArrTime.textContent = '19:40';
      this.log('info', 'Qatar Airways QR-003 booked: DEL→DOH→LHR. AMEX Corporate card charged. Rescheduling downstream logistics...');
    }, T * 4));

    // Step 6 — cab update
    this.timeouts.push(setTimeout(() => {
      this._step = 6;
      this.activateStep(6);
      this.swarm.setAgentState('negotiation', 'done', '[GDS] Seat 12K confirmed on QR-571. Vegetarian meal VGML set. Priority boarding tagged.');
      this.swarm.setAgentState('hotel',       'done', '[Marriott] Checkout July 22. Late checkout granted. Lounge access: complimentary.');
      this.swarm.setAgentState('mobility',    'running', '[Addison Lee API] Cancelling booking AL-9821. Re-booking for LHR arrival 19:40 BST...');
      this.setHealthBar(this.hbHotel, this.hvHotel, 100, 'ok');
      this.log('info', 'Ground mobility: Addison Lee (London) updated to 19:40 LHR arrival. Original booking cancelled at zero cost.');
    }, T * 5));

    // Step 7 — calendar + compensation
    this.timeouts.push(setTimeout(() => {
      this._step = 7;
      this.activateStep(7);
      this.swarm.setAgentState('mobility',     'done', '[Dispatch] Chauffeur pre-assigned. ETA confirmation SMS sent to driver.');
      this.swarm.setAgentState('calendar',     'running', '[Google API] Rescheduling board meeting +2h. Updating Slack OOO. Sending team notification...');
      this.swarm.setAgentState('compensation', 'running', '[EU261] Filing delay compensation claim for EK-003 disruption. Amount: €600 equivalent.');
      this.log('info', 'Calendar: Board meeting moved to 11:00 BST. Slack OOO updated. EU261 compensation claim generated — €600.');
    }, T * 6));

    // Step 8 — final notification
    this.timeouts.push(setTimeout(() => {
      this._step = 8;
      this.activateStep(8);
      this.swarm.setAgentState('calendar',     'done', '[Sync] Google Calendar, Outlook, Slack all updated. Office informed.');
      this.swarm.setAgentState('compensation', 'done', '[EU261] Claim filed. Insurance pre-authorization sent. Confirmation ref: ATL-78291.');

      // Show notification on phone
      if (this.phoneNotif) this.phoneNotif.classList.add('show');
      if (this.phoneStatusDot) { this.phoneStatusDot.style.background = 'var(--status-green)'; }
      if (this.phoneStatusTxt) this.phoneStatusTxt.textContent = 'All resolved — Qatar Airways';

      // Restore health to excellent
      this.setGauge(97);
      this.setHealthBar(this.hbWeather, this.hvWeather, 100, 'ok');
      this.setHealthBar(this.hbAirport, this.hvAirport, 96, 'ok');
      this.setHealthBar(this.hbConn,    this.hvConn,    91, 'ok');
      this.setHealthBar(this.hbTraffic, this.hvTraffic, 94, 'ok');

      if (this.routeBadgeLayover) { this.routeBadgeLayover.textContent = 'Layover: 75m (DOH) ✓'; this.routeBadgeLayover.className = 'badge badge-green'; }
      if (this.leg2Info) this.leg2Info.textContent = 'QR-003 · Confirmed';

      if (this.simText) { this.simText.textContent = 'Resolved'; this.simText.style.color = 'var(--status-green)'; }
      if (this.timelineStatus) this.timelineStatus.textContent = 'All 8 actions complete';

      this.btnReset.disabled = false;
      this.isRunning = false;

      if (window._updateSwarmBadges) window._updateSwarmBadges();

      this.log('success', 'ATLAS autonomous resolution complete. Traveler notified. Journey health restored to 97. All agents standing by.');
    }, T * 7));
  }

  // ── Reset ─────────────────────────────────────────────────────────────
  resetAll() {
    this.timeouts.forEach(clearTimeout);
    this.timeouts = [];
    this.isRunning = false;
    this._step = 0;

    if (this.btnTrigger) this.btnTrigger.disabled = false;
    if (this.btnReset)   this.btnReset.disabled   = true;
    if (this.simText)    { this.simText.textContent = 'Idle'; this.simText.style.color = 'var(--text-dim)'; }

    // Gauge
    this.setGauge(97);

    // Health bars
    this.setHealthBar(this.hbWeather, this.hvWeather, 100, 'ok');
    this.setHealthBar(this.hbAirport, this.hvAirport, 96,  'ok');
    this.setHealthBar(this.hbConn,    this.hvConn,    91,  'ok');
    this.setHealthBar(this.hbHotel,   this.hvHotel,   100, 'ok');
    this.setHealthBar(this.hbTraffic, this.hvTraffic, 94,  'ok');

    // Route badges
    if (this.routeBadgeLayover) { this.routeBadgeLayover.textContent = 'Layover: 120m (DXB)'; this.routeBadgeLayover.className = 'badge badge-amber'; }
    if (this.dxbStatus)  { this.dxbStatus.textContent  = 'Upcoming'; this.dxbStatus.style.color  = 'var(--text-muted)'; }
    if (this.leg2Info)   this.leg2Info.textContent   = 'EK-003 · Scheduled';
    if (this.headerAlert) this.headerAlert.classList.remove('show');

    // Decision table defaults
    this._updateRow('a', 24, 'Risky',   'badge-red',   false);
    this._updateRow('b', 84, 'Viable',  'badge-blue',  false);
    this._updateRow('c', 96, 'Selected ✓', 'badge-green', true);
    this._updateRow('d', 93, 'Backup',  'badge-amber', false);

    // Timeline
    for (let i = 1; i <= 8; i++) {
      const el = document.getElementById('ts-' + i);
      if (el) el.classList.remove('active');
    }
    if (this.timelineStatus) this.timelineStatus.textContent = 'Awaiting simulation';

    // Phone
    if (this.phoneNotif)    this.phoneNotif.classList.remove('show');
    if (this.phoneTicket)   this.phoneTicket.classList.remove('show');
    if (this.phoneStatusDot) this.phoneStatusDot.style.background = '';
    if (this.phoneStatusTxt) this.phoneStatusTxt.textContent = 'All systems nominal';
    if (this.phoneArrTime)   this.phoneArrTime.textContent = '17:20';

    // Modules
    this.graph.reset();
    this.swarm.reset();

    // Logs
    if (this.logsConsole) this.logsConsole.innerHTML = '';
    this.log('info', 'ATLAS Intelligence Core initialized. All systems nominal. Journey monitoring active.');
    if (window._updateSwarmBadges) window._updateSwarmBadges();
  }
}
