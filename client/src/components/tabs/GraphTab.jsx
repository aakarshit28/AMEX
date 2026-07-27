import { useEffect, useRef, useState } from 'react';

export default function GraphTab({ disrupted, activeJourney }) {
  const svgRef = useRef(null);
  const [selectedNode, setSelectedNode] = useState(null);

  const oCode = activeJourney?.origin_code || 'DEL';
  const tCode = activeJourney?.transit_code || 'DXB';
  const dCode = activeJourney?.destination_code || 'LHR';
  const hotelName = activeJourney?.hotel_name || 'Marriott Park Lane';
  const mobility = activeJourney?.ground_transport || 'Addison Lee Chauffeur';
  const meetingName = activeJourney?.meeting_title || 'Global Executive Summit';

  const getNodes = () => {
    const nodes = {
      del:     { id:'del',     label:`${oCode} Departure`,      type:'Airport',     icon:'✈',  status:'Departed',  impact:'On Time Departure',    conf:'99.8%', deps:['dxb','doh'] },
      dxb:     { id:'dxb',     label:`${tCode} Transit Hub`,    type:'Airport',     icon:'✈',  status:'On Time',   impact:'Standard Transit',     conf:'96.5%', deps:['lhr_old'] },
      doh:     { id:'doh',     label:'DOH Bypass Hub',         type:'Airport',     icon:'✈',  status:'Inactive',  impact:'Standby Reroute Path', conf:'—',     deps:['lhr_new'] },
      lhr_old: { id:'lhr_old', label:`${dCode} (Primary Leg)`,  type:'Destination', icon:'🏴', status:'Scheduled', impact:'On Schedule',          conf:'92.4%', deps:['cab'] },
      lhr_new: { id:'lhr_new', label:`${dCode} (Bypass Arrival)`,type:'Destination', icon:'🏴', status:'Inactive',  impact:'New Arrival QR-003',  conf:'98.5%', deps:['cab'] },
      cab:     { id:'cab',     label:mobility,                 type:'Mobility',    icon:'🚗', status:'Scheduled', impact:'Chauffeur Confirmed',   conf:'98.0%', deps:['hotel'] },
      hotel:   { id:'hotel',   label:hotelName,                type:'Hotel',       icon:'🏨', status:'Booked',    impact:'Suite Reserved',        conf:'100%',  deps:['meeting'] },
      meeting: { id:'meeting', label:meetingName,              type:'Activity',    icon:'💼', status:'Scheduled', impact:'Agenda On Track',      conf:'95.0%', deps:['restaurant'] },
      restaurant:{ id:'restaurant', label:'Executive Dinner',   type:'Activity',    icon:'🍴', status:'Reserved', impact:'Table Confirmed',       conf:'90.0%', deps:[] }
    };

    if (disrupted) {
      nodes.dxb.status = 'Disrupted (Severe Storm)'; nodes.dxb.impact = 'Missed Connection Risk 89%'; nodes.dxb.conf = '11.0%';
      nodes.lhr_old.status = 'Cancelled'; nodes.lhr_old.impact = 'Airspace Delay Grounded'; nodes.lhr_old.conf = '0.0%';
      nodes.doh.status = 'Active (Rerouted)'; nodes.doh.impact = 'Alternative Swarm Via QR-003'; nodes.doh.conf = '96.2%';
      nodes.lhr_new.status = 'Confirmed (QR-003)'; nodes.lhr_new.impact = 'New Confirmed Arrival 18:30'; nodes.lhr_new.conf = '98.5%';
      nodes.cab.status = 'Rescheduled'; nodes.cab.label = `${mobility} (Updated)`; nodes.cab.impact = 'Pickup ETA +90m Adjust';
      nodes.hotel.status = 'Extended'; nodes.hotel.label = `${hotelName} (Extended)`; nodes.hotel.impact = 'Late Check-in Guaranteed';
      nodes.meeting.status = 'Rescheduled'; nodes.meeting.impact = 'Moved +2h Calendar Sync';
    }

    return nodes;
  };

  const links = [
    { from:'del',     to:'dxb',     id:'l-del-dxb',     type:'primary' },
    { from:'dxb',     to:'lhr_old', id:'l-dxb-lhr',     type:'primary' },
    { from:'del',     to:'doh',     id:'l-del-doh',      type:'bypass' },
    { from:'doh',     to:'lhr_new', id:'l-doh-lhr',      type:'bypass' },
    { from:'lhr_old', to:'cab',     id:'l-lhr-cab-old', type:'primary' },
    { from:'lhr_new', to:'cab',     id:'l-lhr-cab-new', type:'bypass' },
    { from:'cab',     to:'hotel',   id:'l-cab-hotel',   type:'common' },
    { from:'hotel',   to:'meeting', id:'l-hotel-meet',  type:'common' },
    { from:'meeting', to:'restaurant', id:'l-meet-rest', type:'common' }
  ];

  const nodes = getNodes();

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const W = rect.width || 750, H = rect.height || 480;

    const pos = {
      del: { x: W*0.09, y: H*0.48 },
      dxb: { x: W*0.28, y: H*0.24 },
      doh: { x: W*0.28, y: H*0.75 },
      lhr_old: { x: W*0.48, y: H*0.24 },
      lhr_new: { x: W*0.48, y: H*0.75 },
      cab: { x: W*0.65, y: H*0.48 },
      hotel: { x: W*0.78, y: H*0.30 },
      meeting: { x: W*0.89, y: H*0.48 },
      restaurant: { x: W*0.89, y: H*0.72 }
    };

    svg.innerHTML = '';
    const ns = 'http://www.w3.org/2000/svg';
    const C = {
      primaryEdge: '#006FCF',
      bypassEdge: '#10B981',
      disruptEdge: '#EF4444',
      commonEdge: '#475569',
      goldEdge: '#B8963E'
    };

    // Draw connecting edges
    links.forEach(link => {
      const from = pos[link.from], to = pos[link.to];
      if (!from || !to) return;
      if (!disrupted && link.type === 'bypass') return;

      let color = C.primaryEdge, dash = 'none', width = 2.5, glow = false;
      if (disrupted) {
        if (['l-del-dxb','l-dxb-lhr','l-lhr-cab-old'].includes(link.id)) {
          color = C.disruptEdge; dash = '6,4'; width = 2;
        } else if (['l-del-doh','l-doh-lhr','l-lhr-cab-new'].includes(link.id)) {
          color = C.bypassEdge; width = 3; glow = true;
        } else {
          color = C.goldEdge; width = 2.5;
        }
      } else {
        color = link.type === 'common' ? C.commonEdge : C.primaryEdge;
      }

      const path = document.createElementNS(ns, 'path');
      const dx = to.x - from.x;
      path.setAttribute('d', `M ${from.x} ${from.y} C ${from.x + dx*0.45} ${from.y}, ${from.x + dx*0.55} ${to.y}, ${to.x} ${to.y}`);
      path.setAttribute('stroke', color);
      path.setAttribute('stroke-width', width);
      path.setAttribute('stroke-dasharray', dash);
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke-linecap', 'round');
      if (glow) path.style.filter = `drop-shadow(0 0 6px ${color})`;
      svg.appendChild(path);

      // Animated signal particle on active reroute bypass paths
      if (glow) {
        const particle = document.createElementNS(ns, 'circle');
        particle.setAttribute('r', '4');
        particle.setAttribute('fill', '#FFFFFF');
        particle.style.filter = `drop-shadow(0 0 8px ${color})`;
        const animMotion = document.createElementNS(ns, 'animateMotion');
        animMotion.setAttribute('dur', '2.5s');
        animMotion.setAttribute('repeatCount', 'indefinite');
        animMotion.setAttribute('path', path.getAttribute('d'));
        particle.appendChild(animMotion);
        svg.appendChild(particle);
      }
    });

    // Draw graph nodes
    Object.values(nodes).forEach(node => {
      const p = pos[node.id];
      if (!p) return;
      if (!disrupted && (node.id === 'doh' || node.id === 'lhr_new')) return;

      let fillColor = '#0F172A', strokeColor = C.primaryEdge, glowColor = null;
      if (disrupted) {
        if (node.id === 'dxb') { strokeColor = C.disruptEdge; fillColor = '#450A0A'; glowColor = C.disruptEdge; }
        else if (node.id === 'doh' || node.id === 'lhr_new') { strokeColor = C.bypassEdge; fillColor = '#064E3B'; glowColor = C.bypassEdge; }
        else if (node.id === 'lhr_old') { strokeColor = C.disruptEdge; fillColor = '#1F2937'; }
        else if (['cab','hotel','meeting'].includes(node.id)) { strokeColor = C.goldEdge; fillColor = '#3F2C08'; glowColor = C.goldEdge; }
      } else {
        if (['del','dxb','lhr_old'].includes(node.id)) { strokeColor = C.primaryEdge; fillColor = '#0A2540'; glowColor = C.primaryEdge; }
        else { strokeColor = C.commonEdge; fillColor = '#1E293B'; }
      }

      const g = document.createElementNS(ns, 'g');
      g.style.cursor = 'pointer';

      // Outer glow / hover ring
      const hoverRing = document.createElementNS(ns, 'circle');
      hoverRing.setAttribute('cx', p.x); hoverRing.setAttribute('cy', p.y); hoverRing.setAttribute('r', 32);
      hoverRing.setAttribute('fill', 'none'); hoverRing.setAttribute('stroke', strokeColor); hoverRing.setAttribute('stroke-width', 2);
      hoverRing.setAttribute('opacity', '0');
      g.appendChild(hoverRing);

      // Node main circle background
      const bg = document.createElementNS(ns, 'circle');
      bg.setAttribute('cx', p.x); bg.setAttribute('cy', p.y); bg.setAttribute('r', 25);
      bg.setAttribute('fill', fillColor); bg.setAttribute('stroke', strokeColor); bg.setAttribute('stroke-width', 2.5);
      if (glowColor) bg.style.filter = `drop-shadow(0 0 10px ${glowColor})`;
      g.appendChild(bg);

      // Node Icon
      const icon = document.createElementNS(ns, 'text');
      icon.setAttribute('x', p.x); icon.setAttribute('y', p.y + 6);
      icon.setAttribute('text-anchor', 'middle'); icon.setAttribute('font-size', '16');
      icon.textContent = node.icon;
      g.appendChild(icon);

      // Node Label Text (High-contrast bold text with subtle outline)
      const lbl = document.createElementNS(ns, 'text');
      lbl.setAttribute('x', p.x); lbl.setAttribute('y', p.y + 44);
      lbl.setAttribute('text-anchor', 'middle');
      lbl.setAttribute('fill', '#F8FAFC');
      lbl.setAttribute('font-size', '11');
      lbl.setAttribute('font-family', 'Inter, sans-serif');
      lbl.setAttribute('font-weight', '700');
      lbl.style.textShadow = '0 2px 4px rgba(0,0,0,0.8)';
      lbl.textContent = node.label;
      g.appendChild(lbl);

      // Node Type Badge Subtitle
      const typeBadge = document.createElementNS(ns, 'text');
      typeBadge.setAttribute('x', p.x); typeBadge.setAttribute('y', p.y + 57);
      typeBadge.setAttribute('text-anchor', 'middle');
      typeBadge.setAttribute('fill', disrupted && node.id === 'dxb' ? '#F87171' : strokeColor);
      typeBadge.setAttribute('font-size', '9');
      typeBadge.setAttribute('font-family', 'Inter, sans-serif');
      typeBadge.setAttribute('font-weight', '600');
      typeBadge.textContent = node.status;
      g.appendChild(typeBadge);

      // Click & Hover interactions
      g.addEventListener('click', () => setSelectedNode(node));
      g.addEventListener('mouseenter', () => {
        hoverRing.setAttribute('opacity', '0.8');
        bg.setAttribute('r', 27);
      });
      g.addEventListener('mouseleave', () => {
        hoverRing.setAttribute('opacity', '0');
        bg.setAttribute('r', 25);
      });

      svg.appendChild(g);
    });
  }, [disrupted, activeJourney]);

  const inspectorNode = selectedNode;

  return (
    <section id="tab-graph" className="tab-content active">
      <div className="page-scroll">
        <div className="graph-layout">

          {/* Graph Canvas Card */}
          <div className="card card-blue-header graph-canvas-card">
            <div className="card-header">
              <div className="card-title">
                <div className="card-title-icon">
                  <svg viewBox="0 0 24 24"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="5" r="2"/><circle cx="19" cy="12" r="2"/><circle cx="12" cy="19" r="2"/><line x1="7" y1="12" x2="17" y2="12"/><line x1="12" y1="7" x2="12" y2="17"/></svg>
                </div>
                Live Journey Knowledge Graph
              </div>
              <span className="badge badge-blue">Interactive Node Telemetry</span>
            </div>

            <div className="graph-canvas-wrapper">
              <svg className="graph-canvas" ref={svgRef} id="graph-svg"></svg>
            </div>

            <div className="graph-legend">
              <div className="legend-item"><div className="legend-dot" style={{ background: '#006FCF' }}></div>Primary Flight Leg</div>
              <div className="legend-item"><div className="legend-dot" style={{ background: '#EF4444' }}></div>Disrupted Connection</div>
              <div className="legend-item"><div className="legend-dot" style={{ background: '#10B981' }}></div>Autonomous Reroute (QR)</div>
              <div className="legend-item"><div className="legend-dot" style={{ background: '#B8963E' }}></div>Ground & Hotel Asset</div>
            </div>
          </div>

          {/* Inspector Panel */}
          <div className="card card-blue-header graph-inspector">
            <div className="card-header">
              <div className="card-title">
                <div className="card-title-icon">
                  <svg viewBox="0 0 24 24"><path d="M11 2a9 9 0 100 18A9 9 0 0011 2zm0 16a7 7 0 110-14 7 7 0 010 14zm7.71 1.29l-2.86-2.86c.57-.74.99-1.6 1.2-2.53l2.9 2.9-1.24 1.49z"/></svg>
                </div>
                Node Intelligence Inspector
              </div>
            </div>

            {!inspectorNode ? (
              <div className="inspector-empty">
                <div className="inspector-empty-icon">
                  <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="#006FCF" strokeWidth="1.5">
                    <path d="M15 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V9l-6-6zm4 16H5V5h9v5h5v9z"/>
                  </svg>
                </div>
                <div className="inspector-empty-text">
                  Click any node on the graph to inspect live telemetry, downstream impact, and AI confidence metrics.
                </div>
              </div>
            ) : (
              <div className="inspector-content">
                <div className="inspector-node-header">
                  <div className="inspector-node-icon">{inspectorNode.icon}</div>
                  <div>
                    <div className="inspector-node-name">{inspectorNode.label}</div>
                    <div className="inspector-node-type">{inspectorNode.type} Node</div>
                  </div>
                </div>

                <div className="inspector-fields">
                  <div className="inspector-field">
                    <div className="inspector-field-label">Status</div>
                    <div className={`inspector-field-value ${
                      inspectorNode.status.includes('Disrupted') || inspectorNode.status === 'Cancelled' ? 'status-red' :
                      inspectorNode.status.includes('Active') || inspectorNode.status.includes('Confirmed') ? 'status-green' :
                      inspectorNode.status.includes('Rescheduled') || inspectorNode.status.includes('Extended') ? 'status-amber' : ''
                    }`}>{inspectorNode.status}</div>
                  </div>

                  <div className="inspector-field">
                    <div className="inspector-field-label">AI Confidence</div>
                    <div className="inspector-field-value">
                      <div className="inspector-conf-bar">
                        <div className="inspector-conf-fill" style={{
                          width: inspectorNode.conf === '—' ? '0%' : inspectorNode.conf,
                          background: parseFloat(inspectorNode.conf) > 80 ? 'var(--status-green)' :
                                     parseFloat(inspectorNode.conf) > 50 ? 'var(--status-amber)' : 'var(--status-red)'
                        }} />
                      </div>
                      <span style={{ fontWeight: 700 }}>{inspectorNode.conf}</span>
                    </div>
                  </div>

                  <div className="inspector-field">
                    <div className="inspector-field-label">Disruption Impact</div>
                    <div className="inspector-field-value">{inspectorNode.impact}</div>
                  </div>

                  <div className="inspector-field">
                    <div className="inspector-field-label">Downstream Dependencies</div>
                    <div className="inspector-field-value">
                      {inspectorNode.deps && inspectorNode.deps.length > 0
                        ? inspectorNode.deps.map(d => {
                            const depNode = nodes[d];
                            return depNode ? (
                              <span key={d} className="inspector-dep-tag" onClick={() => setSelectedNode(depNode)}>
                                {depNode.icon} {depNode.label}
                              </span>
                            ) : null;
                          })
                        : <span style={{ color: 'var(--text-dim)' }}>Terminal node</span>
                      }
                    </div>
                  </div>
                </div>

                <button className="btn btn-outline" style={{ fontSize: 11, marginTop: 16, width: '100%' }} onClick={() => setSelectedNode(null)}>
                  Clear Selection
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </section>
  );
}
