import { useState, useRef, useEffect } from 'react';
import API from '../../services/api';
import LiveWeatherBar from '../LiveWeatherBar';

const STEP_DELAY = 2200;

export default function SimulatorTab({ onSimulationUpdate, prefs, activeJourney }) {
  const [isRunning, setIsRunning] = useState(false);
  const [simStatus, setSimStatus] = useState('Idle');
  const [gauge, setGauge] = useState(97);
  const [healthBars, setHealthBars] = useState({ weather: 100, airport: 96, conn: 91, hotel: 100, traffic: 94 });
  const [activeStep, setActiveStep] = useState(0);
  const [alertActive, setAlertActive] = useState(false);
  const [agentStates, setAgentStates] = useState({});
  const [logs, setLogs] = useState([]);
  const [disrupted, setDisrupted] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState('weather');

  // Dynamic trip parameters
  const originCode = activeJourney?.origin_code || 'DEL';
  const originCity = activeJourney?.origin_city || 'New Delhi';
  const transitCode = activeJourney?.transit_code || 'DXB';
  const transitCity = activeJourney?.transit_city || 'Dubai Intl';
  const destCode = activeJourney?.destination_code || 'LHR';
  const destCity = activeJourney?.destination_city || 'London Heathrow';

  const flight1 = activeJourney?.flight_leg1 || 'EK-513 · Airborne';
  const flight2 = activeJourney?.flight_leg2 || 'EK-007 · Scheduled';
  const hotelName = activeJourney?.hotel_name || 'Marriott Executive Suites';
  const mobilityService = activeJourney?.ground_transport || 'Executive Chauffeur Dispatch';
  const meetingTitle = activeJourney?.meeting_title || 'Global Executive Summit';

  const [routeInfo, setRouteInfo] = useState({
    layover: `Layover: 120m (${transitCode})`,
    layoverClass: 'badge badge-amber',
    transitStatus: 'Upcoming',
    leg2: `${flight2}`
  });

  const [phoneState, setPhoneState] = useState({
    notif: false,
    arrTime: '17:20',
    statusText: 'All systems nominal',
    statusGreen: true
  });

  // Dynamic Decision Engine Generator
  const generateDecisions = (journey, userPrefs) => {
    const cost = userPrefs?.cost ?? 85;
    const loyalty = userPrefs?.loyalty ?? 60;
    const layover = userPrefs?.layover ?? 75;

    const tCode = journey?.transit_code || 'DXB';
    const dCode = journey?.destination_code || 'LHR';
    const flt1 = journey?.flight_leg1 || 'EK-513';
    const carrier = flt1.split(' ')[0] || 'Primary';

    let bypassCarrier = 'Qatar Airways via DOH';
    if (tCode === 'FRA') bypassCarrier = 'Swiss Air via ZRH';
    else if (tCode === 'CDG') bypassCarrier = 'KLM via AMS';
    else if (tCode === 'SIN') bypassCarrier = 'Cathay Pacific via HKG';
    else if (tCode === 'JFK') bypassCarrier = 'Delta Air Lines via ATL';
    else if (tCode === 'HND') bypassCarrier = 'ANA via NRT';

    const valB = Math.round(Math.max(50, Math.min(99, 75 + loyalty * 0.15 - layover * 0.05)));
    const valC = Math.round(Math.max(85, Math.min(99, 88 + cost * 0.12 - loyalty * 0.05)));
    const valD = Math.round(Math.max(65, Math.min(95, 80 + layover * 0.1)));

    const bWins = loyalty > 80 && valB >= valC;

    return [
      { key: 'a', label: `Current ${carrier} Flight (${tCode})`, val: 24, status: 'Risky', cls: 'badge-red', selected: false },
      { key: 'b', label: `Later ${carrier} Connection (+4h)`, val: valB, status: bWins ? 'Selected ✓' : 'Viable', cls: bWins ? 'badge-green' : 'badge-blue', selected: bWins },
      { key: 'c', label: bypassCarrier, val: valC, status: bWins ? 'Viable' : 'Selected ✓', cls: bWins ? 'badge-blue' : 'badge-green', selected: !bWins },
      { key: 'd', label: `Express Connect to ${dCode}`, val: valD, status: 'Backup', cls: 'badge-amber', selected: false },
    ];
  };

  // Dynamic Timeline Generator
  const generateTimeline = (journey) => {
    const oCode = journey?.origin_code || 'DEL';
    const oCity = journey?.origin_city || 'New Delhi';
    const tCity = journey?.transit_city || 'Dubai Intl';
    const tCode = journey?.transit_code || 'DXB';
    const dCode = journey?.destination_code || 'LHR';
    const dCity = journey?.destination_city || 'London';
    const hotel = journey?.hotel_name || 'Marriott Park Lane';
    const mobility = journey?.ground_transport || 'Addison Lee Chauffeur';
    const meeting = journey?.meeting_title || 'Executive Board Summit';
    const flt1 = journey?.flight_leg1 || 'EK-513';
    const flt2 = journey?.flight_leg2 || 'EK-007';

    const now = new Date();
    const formatT = (minsOffset) => {
      const d = new Date(now.getTime() + minsOffset * 60000);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return [
      { t: formatT(-30), title: `${tCity} (${tCode}) Doppler Storm Alert`, desc: `Radar front over ${tCode} runways. Wind 48kt & lightning cells confirmed.` },
      { t: formatT(-24), title: `${oCity} (${oCode}) Aircraft Ground-Hold`, desc: `Flight ${flt1} delayed at ${oCity}. Dubai ATC traffic restriction.` },
      { t: formatT(-18), title: `Connection Window Collapse at ${tCode}`, desc: `Layover window for ${flt2} reduced to 18 min. 89% risk of failure.` },
      { t: formatT(-12), title: `AI Swarm Parallel Decision Engine`, desc: `Simulating 247 alternate futures for destination ${dCode}.` },
      { t: formatT(-8), title: `Bypass Hub Ticket Issued`, desc: `Rerouted via alternative hub to ${dCode}. Seat 12K & meal pre-assigned.` },
      { t: formatT(-4), title: `${dCity} Hotel Extension (${hotel})`, desc: `Check-in extended 24h & VIP lounge access confirmed.` },
      { t: formatT(-2), title: `${mobility} Pickup Updated`, desc: `Chauffeur pickup time synchronized for arrival at ${dCode}.` },
      { t: formatT(0), title: `Executive Calendar Synced (${meeting})`, desc: `${meeting} deferred +2h. Office OOO updated. EU261 claim filed.` },
    ];
  };

  const [decisions, setDecisions] = useState(() => generateDecisions(activeJourney, prefs));
  const [timeline, setTimeline] = useState(() => generateTimeline(activeJourney));

  // Reset or re-initialize when active Journey or prefs change
  useEffect(() => {
    setDecisions(generateDecisions(activeJourney, prefs));
    setTimeline(generateTimeline(activeJourney));
    setRouteInfo({
      layover: `Layover: 120m (${transitCode})`,
      layoverClass: 'badge badge-amber',
      transitStatus: 'Upcoming',
      leg2: `${flight2}`
    });
    setLogs([{
      ts: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      level: 'info',
      msg: `ATLAS Core initialized for trip ${originCode} → ${transitCode} → ${destCode}. All systems nominal.`
    }]);
  }, [activeJourney, prefs]);

  const timeouts = useRef([]);

  const addLog = (level, msg) => {
    const ts = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs(prev => [...prev, { ts, level, msg }]);
  };

  const setAgent = (id, state, log) => {
    setAgentStates(prev => ({
      ...prev,
      [id]: {
        state,
        logs: log ? [`[${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}] ${log}`, ...(prev[id]?.logs || [])] : prev[id]?.logs || []
      }
    }));
  };

  const saveEvent = async (eventType, level, msg) => {
    try {
      await API.post('/events', {
        event_type: eventType,
        level,
        message: msg,
        journey: `${originCode} → ${transitCode} → ${destCode}`
      });
    } catch (e) { /* silent */ }
  };

  const C = 238.76;
  const gaugeOffset = C - (C * gauge / 100);

  const runSimulation = () => {
    setIsRunning(true);
    setSimStatus('Running Real-Time AI Simulation');
    setAlertActive(false);
    setDisrupted(false);

    const T = STEP_DELAY;
    const push = (delay, fn) => { const t = setTimeout(fn, delay); timeouts.current.push(t); };

    push(T * 0, () => {
      setActiveStep(1);
      setGauge(82);
      setHealthBars(h => ({ ...h, weather: 38, conn: 65 }));
      setAlertActive(true);
      setAgent('weather', 'running', `[Doppler] Storm front detected over ${transitCity} (${transitCode}). Wind 48kt.`);
      setAgent('flight', 'running', `[ATC Feed] ${flight1} monitoring approach to ${transitCode} - weather alerts active.`);
      addLog('warn', `${transitCity} Airport (${transitCode}): Severe weather front detected. Doppler confirms 48kt winds.`);
      saveEvent('Weather Alert', 'warn', `${transitCity} Airport: Severe weather front detected.`);
    });

    push(T * 1, () => {
      setActiveStep(2);
      setGauge(71);
      setHealthBars(h => ({ ...h, airport: 52 }));
      setRouteInfo(r => ({ ...r, layover: 'Layover: 18m ⚠️', layoverClass: 'badge badge-red' }));
      setAgent('weather', 'done', `[Model] 94% confidence: Storm front over ${transitCode} persists 3h. High operational impact.`);
      setAgent('flight', 'running', `[GDS] ${flight1} ground-held at ${originCity} (${originCode}). No departure clearance.`);
      addLog('warn', `${flight1} ground-held at ${originCity}. ${transitCity} ATC congestion. Delay T+90min minimum.`);
    });

    push(T * 2, () => {
      setActiveStep(3);
      setGauge(52);
      setHealthBars(h => ({ ...h, conn: 11 }));
      setRouteInfo(r => ({ ...r, transitStatus: 'Disrupted ⚠️', leg2: `${flight2} · At Risk` }));
      setDisrupted(true);
      setAgent('flight', 'running', `[ATLAS Engine] Connection miss probability 89% at ${transitCode}. Layover: 18 min. Swarm Activated.`);
      setAgent('personal', 'running', `[Twin Profile] Calculating transit speed vs ${transitCode} Concourse distance. Result: 11% success.`);
      addLog('err', `CRITICAL: Journey Health Score dropped to 52. Missed connection probability 89% at ${transitCode}. Autonomous Swarm Activated.`);
      saveEvent('Critical Disruption', 'err', `CRITICAL: Missed connection probability 89% at ${transitCode}.`);
    });

    push(T * 3, () => {
      setActiveStep(4);
      const newDecisions = generateDecisions(activeJourney, prefs);
      setDecisions(newDecisions);
      const selectedOpt = newDecisions.find(d => d.selected) || newDecisions[2];

      setAgent('flight', 'done', `[Swarm Engine] Real-time simulation complete. Option '${selectedOpt.label}' wins with ${selectedOpt.val}% probability.`);
      setAgent('personal', 'done', `[Twin Profile] Preferences loaded. Preferred seat & dietary requirements applied.`);
      setAgent('safety', 'running', `[Compliance] Verifying passport transit requirements for ${selectedOpt.label}...`);
      setAgent('finance', 'running', '[AMEX Core] Checking Platinum Corporate Card authorization and travel insurance clause.');
      addLog('info', `AI Simulation Engine: Evaluated 247 parallel routes. ${selectedOpt.label} scores ${selectedOpt.val}% success probability.`);
      saveEvent('AI Decision', 'info', `Evaluated 247 parallel routes. ${selectedOpt.label} selected.`);
    });

    push(T * 4, () => {
      setActiveStep(5);
      setPhoneState(p => ({ ...p, arrTime: '19:40' }));
      setAgent('safety', 'done', '[Compliance] Passport transit validated ✓');
      setAgent('finance', 'done', '[AMEX Core] Re-booking authorized via Platinum Card. Interruption protection active.');
      setAgent('negotiation', 'running', `[GDS Direct] Booking alternate carrier to ${destCode}. Requesting preferred seat.`);
      setAgent('hotel', 'running', `[Hospitality API] Extending ${hotelName} reservation at ${destCity} by 24h...`);
      addLog('info', `Alternate flight booked to ${destCode}. AMEX Corporate Card authorized. Rescheduling downstream logistics...`);
    });

    push(T * 5, () => {
      setActiveStep(6);
      setAgent('negotiation', 'done', `[GDS Direct] Preferred seat & meal confirmed to ${destCode}. Priority boarding tagged.`);
      setAgent('hotel', 'done', `[${hotelName}] Check-in extended by 24h. Complimentary lounge access granted.`);
      setAgent('mobility', 'running', `[Mobility API] Updating ${mobilityService} pickup window for arrival at ${destCode}...`);
      setHealthBars(h => ({ ...h, hotel: 100 }));
      addLog('info', `Ground mobility: ${mobilityService} updated for ${destCode} arrival. Original pickup adjusted with zero penalty.`);
    });

    push(T * 6, () => {
      setActiveStep(7);
      setAgent('mobility', 'done', '[Dispatch] Chauffeur driver assigned. ETA confirmation SMS dispatched.');
      setAgent('calendar', 'running', `[Executive Sync] Rescheduling ${meetingTitle} +2h. Updating Slack OOO status...`);
      setAgent('compensation', 'running', `[EU261/IATA] Filing delay compensation claim for ${flight1} disruption. Claim: €600.`);
      addLog('info', `Executive Calendar: ${meetingTitle} deferred +2h. Slack OOO updated. Disruption claim filed ($650).`);
    });

    push(T * 7, () => {
      setActiveStep(8);
      setAgent('calendar', 'done', '[Sync] Google Calendar, Outlook & Slack updated. Team notified.');
      setAgent('compensation', 'done', '[EU261] Claim submitted. Confirmation ref: ATL-98214.');
      setPhoneState({ notif: true, arrTime: '19:40', statusText: `Rerouted & Confirmed to ${destCode}`, statusGreen: true });
      setGauge(97);
      setHealthBars({ weather: 100, airport: 96, conn: 91, hotel: 100, traffic: 94 });
      setRouteInfo({
        layover: `Layover: 75m (${transitCode}) ✓`,
        layoverClass: 'badge badge-green',
        transitStatus: 'Disrupted',
        leg2: `Rerouted · Confirmed to ${destCode}`
      });
      setSimStatus('Resolved');
      setIsRunning(false);
      addLog('success', `ATLAS autonomous resolution complete for ${originCode} → ${destCode}. Health score restored to 97.`);
      saveEvent('Resolution Complete', 'success', `ATLAS autonomous resolution complete for ${originCode} → ${destCode}.`);
      if (onSimulationUpdate) onSimulationUpdate({ disrupted: true });
    });
  };

  const resetSim = () => {
    timeouts.current.forEach(clearTimeout);
    timeouts.current = [];
    setIsRunning(false);
    setSimStatus('Idle');
    setActiveStep(0);
    setGauge(97);
    setHealthBars({ weather: 100, airport: 96, conn: 91, hotel: 100, traffic: 94 });
    setAlertActive(false);
    setDisrupted(false);
    setRouteInfo({
      layover: `Layover: 120m (${transitCode})`,
      layoverClass: 'badge badge-amber',
      transitStatus: 'Upcoming',
      leg2: `${flight2}`
    });
    setPhoneState({ notif: false, arrTime: '17:20', statusText: 'All systems nominal', statusGreen: true });
    setDecisions(generateDecisions(activeJourney, prefs));
    setTimeline(generateTimeline(activeJourney));
    setAgentStates({});
    setLogs([{
      ts: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      level: 'info',
      msg: `ATLAS Intelligence Core initialized for trip ${originCode} → ${transitCode} → ${destCode}. All systems nominal.`
    }]);
    if (onSimulationUpdate) onSimulationUpdate({ disrupted: false, logs: [], agentStates: {}, alertActive: false });
  };

  return (
    <section id="tab-simulator" className="tab-content active">
      <div className="page-scroll">

        {/* Live Weather Bar */}
        <LiveWeatherBar origin={originCode} transit={transitCode} dest={destCode} />

        {/* Route Bar */}
        <div className="route-bar-card">
          <div className="route-bar-top">
            <div className="route-label">Active Trip: {activeJourney?.title || `${originCode} → ${transitCode} → ${destCode}`}</div>
            <div className="route-meta-pills">
              <span className="badge badge-blue">Executive / Business Class</span>
              <span className={routeInfo.layoverClass}>{routeInfo.layover}</span>
            </div>
          </div>

          <div className="route-display">
            <div className="route-city">
              <div className="route-code">{originCode}</div>
              <div className="route-name">{originCity}</div>
              <div className="route-city-status" style={{ color: 'var(--status-green)' }}>Departed</div>
            </div>

            <div className="route-connector">
              <div className="route-line">
                <div className="route-line-progress" style={{ width: '60%' }}></div>
                <div className="route-plane">
                  <svg viewBox="0 0 24 24"><path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L14 19v-5.5l8 2.5z"/></svg>
                </div>
              </div>
              <div className="route-leg-info">{flight1}</div>
            </div>

            <div className="route-city">
              <div className="route-code">{transitCode}</div>
              <div className="route-name">{transitCity}</div>
              <div className="route-city-status" style={{ color: routeInfo.transitStatus.includes('Disrupted') ? 'var(--status-red)' : 'var(--text-muted)' }}>
                {routeInfo.transitStatus}
              </div>
            </div>

            <div className="route-connector">
              <div className="route-line">
                <div className="route-line-progress" style={{ width: '0%' }}></div>
              </div>
              <div className="route-leg-info">{routeInfo.leg2}</div>
            </div>

            <div className="route-city">
              <div className="route-code">{destCode}</div>
              <div className="route-name">{destCity}</div>
              <div className="route-city-status" style={{ color: 'var(--text-muted)' }}>Target Arrival</div>
            </div>
          </div>

          {/* Scenario Selector & Action Bar */}
          <div className="scenario-selector-bar" style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(0, 111, 207, 0.15)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--amex-blue)' }}>
                ⚡ Test Disruption Scenario (Judges Benchmark Simulator)
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className={`btn ${selectedScenario === 'weather' ? 'btn-primary' : 'btn-outline'}`}
                  style={{ fontSize: '11px', padding: '4px 10px' }}
                  onClick={() => setSelectedScenario('weather')}
                  disabled={isRunning}
                >
                  ⛈️ 1. Severe Weather Front ({transitCode})
                </button>
                <button
                  type="button"
                  className={`btn ${selectedScenario === 'mechanical' ? 'btn-primary' : 'btn-outline'}`}
                  style={{ fontSize: '11px', padding: '4px 10px' }}
                  onClick={() => setSelectedScenario('mechanical')}
                  disabled={isRunning}
                >
                  ⚙️ 2. Sudden Flight Mechanical Cancellation
                </button>
                <button
                  type="button"
                  className={`btn ${selectedScenario === 'layover' ? 'btn-primary' : 'btn-outline'}`}
                  style={{ fontSize: '11px', padding: '4px 10px' }}
                  onClick={() => setSelectedScenario('layover')}
                  disabled={isRunning}
                >
                  ⏱️ 3. Layover Collapse & Missed Connection
                </button>
              </div>
            </div>

            <div className="route-actions" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
              <button className="btn btn-primary" onClick={runSimulation} disabled={isRunning} style={{ minWidth: '240px' }}>
                <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M19.36 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.64-4.96zM17 13l-5 6v-4H9l5-6v4h3z"/></svg>
                {isRunning ? 'Running Autonomous AI Pipeline...' : `Execute Autonomous Resolution (${selectedScenario.toUpperCase()})`}
              </button>

              {/* Policy & Benchmark Badges */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <span className="badge badge-green" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', padding: '6px 12px' }}>
                  🛡️ Amex Platinum Policy Guarantee: $1,240 / $1,500 Budget Approved
                </span>
                <button className="btn btn-outline" onClick={resetSim} disabled={isRunning} style={{ fontSize: '11px', padding: '6px 12px' }}>
                  Reset State
                </button>
              </div>
            </div>

            {/* Autonomous Execution Benchmarks Widget */}
            {disrupted && (
              <div style={{ background: '#F0F7FF', borderRadius: '8px', padding: '10px 14px', border: '1px solid rgba(0, 111, 207, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: '700', color: '#002D62' }}>
                  ⚡ Autonomous Swarm Performance Audit:
                </div>
                <div style={{ display: 'flex', gap: '16px', fontSize: '11px', color: '#006FCF', flexWrap: 'wrap' }}>
                  <span>⏱️ Detection: <strong>0.42s</strong></span>
                  <span>🔄 Reroute Audit: <strong>1.85s</strong></span>
                  <span>🏨 Hotel Reserve: <strong>3.10s</strong></span>
                  <span>🛡️ Policy Check: <strong>4.75s</strong></span>
                  <span>📱 Push Sent: <strong>5.90s</strong></span>
                  <span style={{ color: '#00A650', fontWeight: '800' }}>Total Time: 5.9s (Zero Member Action)</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Simulator Grid */}
        <div className="simulator-grid">
          {/* Health Gauge Panel */}
          <div className="card health-panel card-blue-header">
            <div className="gauge-wrapper">
              <svg className="gauge-svg" viewBox="0 0 100 100">
                <circle className="gauge-track" cx="50" cy="50" r="38"></circle>
                <circle
                  className="gauge-progress"
                  cx="50"
                  cy="50"
                  r="38"
                  style={{ strokeDashoffset: gaugeOffset, stroke: gauge < 65 ? '#DC2626' : gauge < 85 ? '#D97706' : '#006FCF' }}
                ></circle>
              </svg>
              <div className="gauge-center">
                <span className="gauge-value">{gauge}</span>
                <span className="gauge-unit">SCORE</span>
              </div>
            </div>

            <div className="health-breakdown">
              {Object.entries(healthBars).map(([key, val]) => (
                <div key={key} className="health-item">
                  <span className="health-item-label">{key}</span>
                  <div className="health-item-row">
                    <div className="health-item-bar">
                      <div className={`health-item-fill ${val < 60 ? 'danger' : val < 80 ? 'warning' : ''}`} style={{ width: `${val}%` }}></div>
                    </div>
                    <span className="health-item-value">{val}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Decision Simulator Engine */}
          <div className="card card-blue-header">
            <div className="card-header">
              <div className="card-title">
                <div className="card-title-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                </div>
                AI Decision Simulator Engine
              </div>
              <span style={{ fontSize: 11, color: '#64748B' }}>Evaluating 247 Parallel Futures</span>
            </div>
            <div style={{ padding: '16px 20px' }}>
              <table className="decision-table" style={{ width: '100%' }}>
                <tbody>
                  {decisions.map(d => (
                    <tr key={d.key} className={`decision-row ${d.selected ? 'selected' : ''}`}>
                      <td>
                        <div className="decision-option-label">
                          <span className="decision-option-tag">{d.key.toUpperCase()}</span>
                          {d.label}
                        </div>
                      </td>
                      <td>
                        <div className="prob-cell">
                          <div className="prob-bar"><div className="prob-fill" style={{ width: `${d.val}%` }}></div></div>
                          <span className="prob-value">{d.val}%</span>
                          <span className={`badge ${d.cls}`}>{d.status}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Autonomous Decision Timeline + Phone Preview */}
        <div className="simulator-grid">
          {/* Real-Time Autonomous Decision Timeline */}
          <div className="card card-blue-header">
            <div className="card-header">
              <div className="card-title">
                <div className="card-title-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                </div>
                Autonomous Decision Timeline ({originCode} → {destCode})
              </div>
              <span style={{ fontSize: 11, color: '#64748B' }}>
                {activeStep === 0 ? 'Live Monitoring Active' : activeStep === 8 ? 'All 8 Real-Time Actions Executed' : `Real-Time Step ${activeStep} of 8`}
              </span>
            </div>
            <div className="timeline-list" style={{ padding: '12px 16px', maxHeight: 340, overflowY: 'auto' }}>
              {timeline.map((step, i) => (
                <div key={i} className={`timeline-step ${activeStep > i ? 'active' : ''}`} id={`ts-${i + 1}`}>
                  <div className="timeline-dot-col"><div className="timeline-dot"></div></div>
                  <div className="timeline-time">{step.t}</div>
                  <div className="timeline-body">
                    <div className="timeline-title">{step.title}</div>
                    <div className="timeline-desc">{step.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Live Mobile Notification Center */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="phone-wrap">
              <div className="phone-device">
                <div className="phone-notch"><div className="phone-notch-cam"></div></div>
                <div className="phone-status-bar">
                  <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <span>▲ ◉ 98%</span>
                </div>
                <div className="phone-screen">
                  <div className="phone-app-header">
                    <div className="phone-app-brand">ATLAS</div>
                    <div className="phone-avatar">AS</div>
                  </div>
                  <div className="phone-mini-card">
                    <div className="phone-card-label">Active Executive Trip</div>
                    <div className="phone-card-route">
                      {originCode} → {transitCode ? transitCode + ' → ' : ''}{destCode}
                    </div>
                    <div className="phone-card-status">
                      <div className="phone-card-status-dot" style={{ background: phoneState.statusGreen ? '#059669' : '#DC2626' }}></div>
                      <span>{phoneState.statusText}</span>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                    {[
                      { label: 'Origin Departure', time: '09:45', info: `${originCode} On Time` },
                      { label: 'Destination ETA', time: phoneState.arrTime, info: `${destCode} Arrival` },
                    ].map(cell => (
                      <div key={cell.label} style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 8, padding: 8, border: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ fontSize: 8, color: '#64748B', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 2 }}>{cell.label}</div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A' }}>{cell.time}</div>
                        <div style={{ fontSize: 9, color: '#006FCF' }}>{cell.info}</div>
                      </div>
                    ))}
                  </div>
                  {phoneState.notif && (
                    <div className="phone-notification show">
                      <div className="phone-notif-icon">
                        <svg viewBox="0 0 24 24" fill="#006FCF" width="16" height="16"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
                      </div>
                      <div className="phone-notif-body">
                        <div className="phone-notif-source">ATLAS · American Express</div>
                        <div className="phone-notif-text">We've automatically rerouted your flight, extended hotel & chauffeur for {destCode}.</div>
                        <div className="phone-notif-cta">Tap to view full itinerary →</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
