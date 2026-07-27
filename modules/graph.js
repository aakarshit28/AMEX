class JourneyGraph {
  constructor(svgId) {
    this.svgId = svgId;
    this.svg   = null;

    this.inspEmpty   = document.getElementById('inspector-empty');
    this.inspContent = document.getElementById('inspector-content');
    this.insType     = document.getElementById('ins-type');
    this.insName     = document.getElementById('ins-name');
    this.insStatus   = document.getElementById('ins-status');
    this.insConf     = document.getElementById('ins-confidence');
    this.insImpact   = document.getElementById('ins-impact');
    this.insDeps     = document.getElementById('ins-deps');

    this.disrupted = false;

    // Node definitions (positions are set in render based on SVG size)
    this.nodes = {
      del:     { id:'del',     label:'DEL Departure',      type:'Airport',     icon:'✈',  status:'Departed',  impact:'None',                 conf:'99.8%', deps:['dxb','doh'] },
      dxb:     { id:'dxb',     label:'DXB Transit Hub',    type:'Airport',     icon:'✈',  status:'On Time',   impact:'None',                 conf:'96.5%', deps:['lhr_old'] },
      doh:     { id:'doh',     label:'DOH Transit Hub',    type:'Airport',     icon:'✈',  status:'Inactive',  impact:'Reroute Path',         conf:'—',     deps:['lhr_new'] },
      lhr_old: { id:'lhr_old', label:'LHR (Emirates)',     type:'Destination', icon:'🏴', status:'Scheduled', impact:'None',                 conf:'92.4%', deps:['cab'] },
      lhr_new: { id:'lhr_new', label:'LHR (Qatar Airways)',type:'Destination', icon:'🏴', status:'Inactive',  impact:'New Confirmed Arrival', conf:'98.5%', deps:['cab'] },
      cab:     { id:'cab',     label:'Addison Lee',        type:'Mobility',    icon:'🚗', status:'Scheduled', impact:'None',                 conf:'98.0%', deps:['hotel'] },
      hotel:   { id:'hotel',   label:'Marriott Park Lane', type:'Hotel',       icon:'🏨', status:'Booked',    impact:'None',                 conf:'100%',  deps:['meeting'] },
      meeting: { id:'meeting', label:'Board Meeting',      type:'Activity',    icon:'💼', status:'Scheduled', impact:'None',                 conf:'95.0%', deps:['restaurant'] },
      restaurant:{ id:'restaurant', label:'Dinner Reservation', type:'Activity', icon:'🍴', status:'Reserved', impact:'None',               conf:'90.0%', deps:[] }
    };

    this.links = [
      { from:'del',     to:'dxb',     id:'l-del-dxb',     type:'primary' },
      { from:'dxb',     to:'lhr_old', id:'l-dxb-lhr',     type:'primary' },
      { from:'del',     to:'doh',     id:'l-del-doh',     type:'bypass' },
      { from:'doh',     to:'lhr_new', id:'l-doh-lhr',     type:'bypass' },
      { from:'lhr_old', to:'cab',     id:'l-lhr-cab-old', type:'primary' },
      { from:'lhr_new', to:'cab',     id:'l-lhr-cab-new', type:'bypass' },
      { from:'cab',     to:'hotel',   id:'l-cab-hotel',   type:'common' },
      { from:'hotel',   to:'meeting', id:'l-hotel-meet',  type:'common' },
      { from:'meeting', to:'restaurant', id:'l-meet-rest', type:'common' }
    ];
  }

  init() {
    this.svg = document.getElementById(this.svgId);
    this.render();
  }

  _nodePos(svgW, svgH) {
    // Positions as percentage of SVG dimensions
    const W = svgW, H = svgH;
    return {
      del:        { x: W*0.08,  y: H*0.48 },
      dxb:        { x: W*0.27,  y: H*0.22 },
      doh:        { x: W*0.27,  y: H*0.75 },
      lhr_old:    { x: W*0.47,  y: H*0.22 },
      lhr_new:    { x: W*0.47,  y: H*0.75 },
      cab:        { x: W*0.63,  y: H*0.48 },
      hotel:      { x: W*0.76,  y: H*0.28 },
      meeting:    { x: W*0.88,  y: H*0.48 },
      restaurant: { x: W*0.88,  y: H*0.70 }
    };
  }

  render() {
    if (!this.svg) this.svg = document.getElementById(this.svgId);
    if (!this.svg) return;

    this.svg.innerHTML = '';

    const rect = this.svg.getBoundingClientRect();
    const W = rect.width  || 600;
    const H = rect.height || 450;

    const pos = this._nodePos(W, H);

    // AMEX colors
    const C = {
      primaryEdge:  '#006FCF',
      bypassEdge:   '#00A650',
      disruptEdge:  '#C41E3A',
      commonEdge:   '#3D4E6B',
      bypassEdgeNew:'#00A650',
      goldEdge:     '#B8963E',
      nodePrimary:  '#006FCF',
      nodeBypass:   '#00A650',
      nodeDisrupt:  '#C41E3A',
      nodeDim:      '#3D4E6B',
      nodeGold:     '#B8963E',
      textWhite:    '#FFFFFF',
      textDim:      '#6B7A99'
    };

    // ── Draw Edges ────────────────────────────────────────────────────────
    this.links.forEach(link => {
      const from = pos[link.from];
      const to   = pos[link.to];
      if (!from || !to) return;

      // Determine if edge should show
      let show   = true;
      let color  = C.primaryEdge;
      let dash   = 'none';
      let width  = 2;
      let glow   = false;

      if (!this.disrupted) {
        if (link.type === 'bypass') return; // hide bypass in normal state
        color = link.type === 'common' ? C.commonEdge : C.primaryEdge;
      } else {
        if (link.id === 'l-del-dxb' || link.id === 'l-dxb-lhr' || link.id === 'l-lhr-cab-old') {
          color = C.disruptEdge;
          dash  = '6,4';
          width = 1.5;
        } else if (link.id === 'l-del-doh' || link.id === 'l-doh-lhr' || link.id === 'l-lhr-cab-new') {
          color = C.bypassEdge;
          width = 2.5;
          glow  = true;
        } else {
          color = C.goldEdge;
          width = 2;
        }
      }

      if (!show) return;

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const cx1 = from.x + dx * 0.45;
      const cy1 = from.y;
      const cx2 = from.x + dx * 0.55;
      const cy2 = to.y;

      path.setAttribute('d', `M ${from.x} ${from.y} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${to.x} ${to.y}`);
      path.setAttribute('stroke', color);
      path.setAttribute('stroke-width', width);
      path.setAttribute('stroke-dasharray', dash);
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke-linecap', 'round');
      if (glow) {
        path.style.filter = `drop-shadow(0 0 4px ${color})`;
      }
      this.svg.appendChild(path);
    });

    // ── Draw Nodes ────────────────────────────────────────────────────────
    Object.values(this.nodes).forEach(node => {
      const p = pos[node.id];
      if (!p) return;

      // Skip inactive bypass nodes when not disrupted
      if (!this.disrupted && (node.id === 'doh' || node.id === 'lhr_new')) return;

      // Node colors based on state
      let fillColor   = '#0A1640';
      let strokeColor = C.primaryEdge;
      let glowColor   = null;

      if (this.disrupted) {
        if (node.id === 'dxb') {
          strokeColor = C.disruptEdge;
          fillColor   = 'rgba(196,30,58,0.2)';
          glowColor   = C.disruptEdge;
        } else if (node.id === 'doh' || node.id === 'lhr_new') {
          strokeColor = C.bypassEdge;
          fillColor   = 'rgba(0,166,80,0.15)';
          glowColor   = C.bypassEdge;
        } else if (node.id === 'lhr_old') {
          strokeColor = C.disruptEdge;
          fillColor   = 'rgba(196,30,58,0.08)';
          dash = '4,3';
        } else if (node.id === 'cab' || node.id === 'hotel' || node.id === 'meeting') {
          strokeColor = C.goldEdge;
          fillColor   = 'rgba(184,150,62,0.1)';
          glowColor   = C.goldEdge;
        } else {
          strokeColor = C.primaryEdge;
        }
      } else {
        if (node.id === 'del' || node.id === 'dxb' || node.id === 'lhr_old') {
          strokeColor = C.primaryEdge;
          fillColor   = 'rgba(0,111,207,0.12)';
          glowColor   = C.primaryEdge;
        } else {
          strokeColor = C.commonEdge;
          fillColor   = '#060F2E';
        }
      }

      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.style.cursor = 'pointer';
      g.setAttribute('id', `gn-${node.id}`);

      g.addEventListener('click',      () => this.inspect(node.id));
      g.addEventListener('mouseenter', () => this.inspect(node.id));

      // Background circle
      const bg = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      bg.setAttribute('cx', p.x);
      bg.setAttribute('cy', p.y);
      bg.setAttribute('r',  24);
      bg.setAttribute('fill',   fillColor);
      bg.setAttribute('stroke', strokeColor);
      bg.setAttribute('stroke-width', 2);
      if (glowColor) {
        bg.style.filter = `drop-shadow(0 0 6px ${glowColor}40)`;
      }
      g.appendChild(bg);

      // Emoji icon
      const icon = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      icon.setAttribute('x', p.x);
      icon.setAttribute('y', p.y + 5);
      icon.setAttribute('text-anchor', 'middle');
      icon.setAttribute('font-size', '14');
      icon.textContent = node.icon;
      g.appendChild(icon);

      // Label
      const lbl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      lbl.setAttribute('x', p.x);
      lbl.setAttribute('y', p.y + 40);
      lbl.setAttribute('text-anchor', 'middle');
      lbl.setAttribute('fill', this.disrupted && node.id === 'dxb' ? C.disruptEdge : strokeColor === C.commonEdge ? C.textDim : C.textWhite);
      lbl.setAttribute('font-size', '10');
      lbl.setAttribute('font-family', 'Inter, sans-serif');
      lbl.setAttribute('font-weight', '600');
      lbl.textContent = node.label;
      g.appendChild(lbl);

      this.svg.appendChild(g);
    });
  }

  inspect(nodeId) {
    const node = this.nodes[nodeId];
    if (!node) return;

    if (this.inspEmpty)   this.inspEmpty.style.display   = 'none';
    if (this.inspContent) this.inspContent.style.display = 'flex';

    if (this.insType)   this.insType.textContent   = node.type;
    if (this.insName)   this.insName.textContent   = node.label;
    if (this.insConf)   this.insConf.textContent   = node.conf;
    if (this.insImpact) this.insImpact.textContent = node.impact;

    if (this.insStatus) {
      this.insStatus.textContent = node.status;
      this.insStatus.className = 'badge ';
      if (['On Time','Booked','Reserved','Scheduled','Departed','Confirmed'].includes(node.status)) {
        this.insStatus.className += 'badge-green';
      } else if (['Disrupted (Storm)','Cancelled (EK-003)'].includes(node.status)) {
        this.insStatus.className += 'badge-red';
      } else if (['Active (Rerouted)', 'Confirmed (QR-003)', 'Rescheduled', 'Extended'].includes(node.status)) {
        this.insStatus.className += 'badge-gold';
      } else if (node.status === 'Inactive') {
        this.insStatus.className += 'badge-blue';
      } else {
        this.insStatus.className += 'badge-amber';
      }
    }

    if (this.insDeps) {
      this.insDeps.innerHTML = '';
      if (node.deps.length === 0) {
        this.insDeps.innerHTML = '<span class="dep-chip">End of journey</span>';
      } else {
        node.deps.forEach(depId => {
          const dep = this.nodes[depId];
          if (dep) {
            const chip = document.createElement('span');
            chip.className = 'dep-chip';
            chip.textContent = dep.label;
            this.insDeps.appendChild(chip);
          }
        });
      }
    }
  }

  triggerStormState() {
    this.disrupted = true;

    this.nodes.dxb.status  = 'Disrupted (Storm)';
    this.nodes.dxb.impact  = 'Missed Connection 89%';
    this.nodes.dxb.conf    = '11.0%';

    this.nodes.lhr_old.status = 'Cancelled (EK-003)';
    this.nodes.lhr_old.impact = 'Aircraft Delay';
    this.nodes.lhr_old.conf   = '0.0%';

    this.nodes.doh.status = 'Active (Rerouted)';
    this.nodes.doh.impact = 'Alternative Via QR';
    this.nodes.doh.conf   = '96.2%';

    this.nodes.lhr_new.status = 'Confirmed (QR-003)';
    this.nodes.lhr_new.impact = 'New Arrival QR-003';
    this.nodes.lhr_new.conf   = '98.5%';

    this.nodes.cab.status  = 'Rescheduled';
    this.nodes.cab.label   = 'Addison Lee (Updated)';
    this.nodes.cab.impact  = 'ETA Updated +90m';

    this.nodes.hotel.status = 'Extended';
    this.nodes.hotel.label  = 'Marriott (Extended)';
    this.nodes.hotel.impact = 'Checkout +24h';

    this.nodes.meeting.status = 'Rescheduled';
    this.nodes.meeting.impact = 'Moved +2h';

    this.render();
    this.inspect('dxb');
  }

  reset() {
    this.disrupted = false;

    this.nodes.dxb.status  = 'On Time';   this.nodes.dxb.impact  = 'None'; this.nodes.dxb.conf = '96.5%';
    this.nodes.lhr_old.status = 'Scheduled'; this.nodes.lhr_old.impact = 'None'; this.nodes.lhr_old.conf = '92.4%';
    this.nodes.doh.status  = 'Inactive';  this.nodes.doh.impact  = 'Reroute Path'; this.nodes.doh.conf = '—';
    this.nodes.lhr_new.status = 'Inactive';  this.nodes.lhr_new.impact = 'New Confirmed Arrival'; this.nodes.lhr_new.conf = '—';
    this.nodes.cab.status  = 'Scheduled'; this.nodes.cab.label   = 'Addison Lee'; this.nodes.cab.impact = 'None';
    this.nodes.hotel.status = 'Booked';   this.nodes.hotel.label  = 'Marriott Park Lane'; this.nodes.hotel.impact = 'None';
    this.nodes.meeting.status = 'Scheduled'; this.nodes.meeting.impact = 'None';

    this.render();

    if (this.inspEmpty)   this.inspEmpty.style.display   = 'block';
    if (this.inspContent) this.inspContent.style.display = 'none';
  }
}
