class DigitalTwin {
  constructor() {
    this.sliders = {
      cost:    document.getElementById('twin-slider-cost'),
      loyalty: document.getElementById('twin-slider-loyalty'),
      layover: document.getElementById('twin-slider-layover'),
      hotel:   document.getElementById('twin-slider-hotel')
    };
    this.labels = {
      cost:    document.getElementById('twin-val-cost'),
      loyalty: document.getElementById('twin-val-loyalty'),
      layover: document.getElementById('twin-val-layover'),
      hotel:   document.getElementById('twin-val-hotel')
    };
    this._callbacks = [];
  }

  init() {
    Object.values(this.sliders).forEach(sl => {
      if (sl) sl.addEventListener('input', () => { this._updateLabels(); this._notify(); });
    });
    this._updateLabels();
  }

  _updateLabels() {
    const get = id => parseInt(this.sliders[id]?.value || 50);

    const cost = get('cost');
    this.labels.cost.textContent =
      cost < 30 ? `Minimize Cost (${cost}%)` :
      cost < 65 ? `Balanced Budget (${cost}%)` :
      cost < 85 ? `Delay Avoidance (${cost}%)` :
                  `Aggressive Avoidance (${cost}%)`;

    const loyalty = get('loyalty');
    this.labels.loyalty.textContent =
      loyalty < 30 ? `Any Carrier (${loyalty}%)` :
      loyalty < 70 ? `Moderate (${loyalty}%)` :
                     `Emirates Priority (${loyalty}%)`;

    const layover = get('layover');
    this.labels.layover.textContent =
      layover < 30 ? `Tolerates Long Layovers (${layover}%)` :
      layover < 70 ? `Moderate (${layover}%)` :
                     `Short Layovers Only (${layover}%)`;

    const hotel = get('hotel');
    this.labels.hotel.textContent =
      hotel < 30 ? `Budget Options (${hotel}%)` :
      hotel < 70 ? `Mid-scale (${hotel}%)` :
                   `Premium Only (${hotel}%)`;
  }

  getPreferences() {
    const get = id => parseInt(this.sliders[id]?.value || 50);
    return {
      costAvoidsDelay: get('cost'),
      loyaltyWeight:   get('loyalty'),
      layoverTolerance:get('layover'),
      hotelComfort:    get('hotel')
    };
  }

  onPreferenceChange(cb) { this._callbacks.push(cb); }

  _notify() {
    const p = this.getPreferences();
    this._callbacks.forEach(cb => cb(p));
  }
}
