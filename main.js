document.addEventListener('DOMContentLoaded', () => {

  // ── Instantiate Modules ──────────────────────────────────────────────
  const graph = new JourneyGraph('graph-svg');
  const swarm = new AgentSwarm('agents-grid');
  const twin  = new DigitalTwin();
  const sim   = new SimulatorEngine(graph, swarm, twin);

  graph.init();
  swarm.init();
  twin.init();
  sim.init();

  // ── Tab Navigation ───────────────────────────────────────────────────
  const navItems    = document.querySelectorAll('.nav-item[data-tab]');
  const tabContents = document.querySelectorAll('.tab-content');
  const headerTitle = document.getElementById('page-header-title');

  const tabTitles = {
    simulator: 'Operations Dashboard',
    graph:     'Journey Knowledge Graph',
    swarm:     'Agent Swarm Control Room',
    twin:      'Traveler Digital Twin',
    logs:      'System Telemetry Logs'
  };

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const tabId = item.getAttribute('data-tab');

      navItems.forEach(n => n.classList.remove('active'));
      item.classList.add('active');

      tabContents.forEach(t => t.classList.remove('active'));
      const target = document.getElementById('tab-' + tabId);
      if (target) target.classList.add('active');

      if (headerTitle) headerTitle.textContent = tabTitles[tabId] || '';
      if (tabId === 'graph') graph.render();
    });
  });

  // ── Real-time Phone Clock ─────────────────────────────────────────────
  function updateClocks() {
    const now  = new Date();
    const hh   = String(now.getHours()).padStart(2,'0');
    const mm   = String(now.getMinutes()).padStart(2,'0');
    const ts   = `${hh}:${mm}`;
    const el1  = document.getElementById('phone-clock-display');
    if (el1) el1.textContent = ts;
  }
  updateClocks();
  setInterval(updateClocks, 15000);

  // ── Logs: Filter & Search ─────────────────────────────────────────────
  const logFilterBtns = document.querySelectorAll('.log-filter-btn');
  const logsSearch    = document.getElementById('logs-search-input');
  const logsConsole   = document.getElementById('logs-console-window');
  let   activeFilter  = 'all';
  let   searchQuery   = '';

  logFilterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      logFilterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = btn.getAttribute('data-filter');
      applyLogsFilter();
    });
  });

  if (logsSearch) {
    logsSearch.addEventListener('input', () => {
      searchQuery = logsSearch.value.toLowerCase().trim();
      applyLogsFilter();
    });
  }

  function applyLogsFilter() {
    if (!logsConsole) return;
    const lines = logsConsole.querySelectorAll('.log-line');
    lines.forEach(line => {
      const lvEl  = line.querySelector('.log-lv');
      const msgEl = line.querySelector('.log-msg');
      if (!lvEl || !msgEl) return;

      const lv  = [...lvEl.classList].find(c => c !== 'log-lv') || '';
      const msg = msgEl.textContent.toLowerCase();

      const matchFilter = activeFilter === 'all' || lv === activeFilter;
      const matchSearch = searchQuery === '' || msg.includes(searchQuery);

      line.style.display = (matchFilter && matchSearch) ? '' : 'none';
    });
  }

  // ── Swarm Badge Counters ──────────────────────────────────────────────
  // Expose updater for simulator to call
  window._updateSwarmBadges = function() {
    const cards   = document.querySelectorAll('.agent-card');
    let running = 0, done = 0;
    cards.forEach(c => {
      if (c.classList.contains('running')) running++;
      if (c.classList.contains('done'))    done++;
    });
    const rEl = document.getElementById('swarm-running-count');
    const dEl = document.getElementById('swarm-done-count');
    if (rEl) rEl.textContent = `${running} Active`;
    if (dEl) dEl.textContent = `${done} Resolved`;
  };

  // Expose global for debugging
  window.atlas = { graph, swarm, twin, sim };
});
