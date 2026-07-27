import { useState, useEffect } from 'react';
import API from '../services/api';

export default function AmexCardModal({ isOpen, onClose, onVerified }) {
  const [cardNumber, setCardNumber] = useState('');
  const [expDate, setExpDate] = useState('08/28');
  const [cid, setCid] = useState('4821');
  const [cardholderName, setCardholderName] = useState('AMIT SHARMA');
  const [loading, setLoading] = useState(false);
  const [stepText, setStepText] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [verifiedCardInfo, setVerifiedCardInfo] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setError('');
      setSuccess(false);
      setVerifiedCardInfo(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Format card number with spaces (4 - 6 - 5 format for AMEX)
  const formatAmex = (val) => {
    const clean = val.replace(/\D/g, '').slice(0, 15);
    if (clean.length <= 4) return clean;
    if (clean.length <= 10) return `${clean.slice(0, 4)} ${clean.slice(4)}`;
    return `${clean.slice(0, 4)} ${clean.slice(4, 10)} ${clean.slice(10)}`;
  };

  const handleCardInput = (e) => {
    setCardNumber(formatAmex(e.target.value));
  };

  const selectPreset = (num, name) => {
    setCardNumber(formatAmex(num));
    if (name) setCardholderName(name);
    setError('');
  };

  // Determine theme for dynamic visual card
  const clean = cardNumber.replace(/\D/g, '');
  let cardTierTheme = 'platinum';
  let cardTierTitle = 'AMEX Platinum';

  if (clean.startsWith('3712') || clean.startsWith('3781')) {
    cardTierTheme = 'centurion';
    cardTierTitle = 'AMEX Centurion Black';
  } else if (clean.startsWith('3759') || clean.startsWith('3784')) {
    cardTierTheme = 'gold';
    cardTierTitle = 'AMEX Gold Rewards';
  } else if (clean.length > 0) {
    cardTierTheme = 'platinum';
    cardTierTitle = 'AMEX Platinum Business';
  }

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setSuccess(false);

    try {
      setStepText('1/3 Connecting to AMEX Authorization Gateway...');
      await new Promise(r => setTimeout(r, 600));

      setStepText('2/3 Validating 15-Digit Luhn Checksum & BIN Tier...');
      await new Promise(r => setTimeout(r, 600));

      setStepText('3/3 Verifying Cardmember Entitlements & Lounge Privileges...');
      const cleanNum = cardNumber.replace(/\D/g, '');

      const res = await API.post('/card/verify', {
        cardNumber: cleanNum,
        expDate,
        cid,
        cardholderName
      });

      setSuccess(true);
      setVerifiedCardInfo(res.data.card);
      if (onVerified) onVerified(res.data.card);

      setTimeout(() => {
        setLoading(false);
      }, 800);
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.error || 'AMEX Verification Failed. Please check details.');
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content amex-modal-card" onClick={e => e.stopPropagation()}>

        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title-wrap">
            <div className="amex-chip-badge">AMEX</div>
            <div>
              <h3 className="modal-title">AMEX Card Member Verification</h3>
              <p className="modal-subtitle">Verify your American Express Card to unlock priority lounge & AI concierge access</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>×</button>
        </div>

        {/* Full-Screen Fit 2-Column Modal Body */}
        <div className="amex-modal-body">
          <div className="amex-modal-grid">

            {/* Left Column: Visual Card & Tier Benefits */}
            <div className="amex-modal-col-left">
              {/* Dynamic Card Preview */}
              <div className={`amex-visual-card amex-theme-${cardTierTheme}`}>
                <div className="card-top-row">
                  <div className="amex-logo-box">AMERICAN EXPRESS</div>
                  <div className="card-tier-tag">{cardTierTitle}</div>
                </div>

                <div className="card-chip-row">
                  <div className="card-emv-chip"></div>
                  <div className="card-contactless">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                      <path d="M12 3a9 9 0 0 0-9 9h2a7 7 0 0 1 7-7V3zm0 4a5 5 0 0 0-5 5h2a3 3 0 0 1 3-3V7zm0 4a1 1 0 0 0-1 1h2a1 1 0 0 0-1-1z"/>
                    </svg>
                  </div>
                </div>

                <div className="card-number-display">
                  {cardNumber || '3782 •••••• 81005'}
                </div>

                <div className="card-bottom-row">
                  <div>
                    <div className="card-lbl">CARDHOLDER</div>
                    <div className="card-val">{cardholderName || 'AMIT SHARMA'}</div>
                  </div>
                  <div>
                    <div className="card-lbl">MEMBER SINCE</div>
                    <div className="card-val">2018</div>
                  </div>
                  <div>
                    <div className="card-lbl">EXPIRES</div>
                    <div className="card-val">{expDate || '08/28'}</div>
                  </div>
                </div>
              </div>

              {/* Quick Test Presets */}
              <div className="amex-presets-bar">
                <span className="preset-label">Instant Test Cards:</span>
                <div className="preset-pills-row">
                  <button
                    type="button"
                    className="preset-pill"
                    onClick={() => selectPreset('378282249181005', 'AMIT SHARMA')}
                  >
                    Platinum (3782)
                  </button>
                  <button
                    type="button"
                    className="preset-pill"
                    onClick={() => selectPreset('371294021992001', 'AMIT SHARMA')}
                  >
                    Centurion Black (3712)
                  </button>
                  <button
                    type="button"
                    className="preset-pill"
                    onClick={() => selectPreset('375940192831004', 'AMIT SHARMA')}
                  >
                    Gold Rewards (3759)
                  </button>
                </div>
              </div>

              {/* Tier Privileges Summary Box */}
              <div className="amex-privileges-box">
                <div className="privilege-title">✨ Tier Privileges & Benefits</div>
                <div className="privilege-item">
                  <span className="priv-icon">🏛️</span>
                  <span>Centurion & Partner Lounge Priority Access</span>
                </div>
                <div className="privilege-item">
                  <span className="priv-icon">⚡</span>
                  <span>ATLAS Autonomous Rebooking & Rerouting Priority</span>
                </div>
                <div className="privilege-item">
                  <span className="priv-icon">🛎️</span>
                  <span>24/7 Global Executive AI Concierge Service</span>
                </div>
              </div>
            </div>

            {/* Right Column: Form or Verification Status */}
            <div className="amex-modal-col-right">
              {success && verifiedCardInfo ? (
                <div className="amex-success-box">
                  <div className="success-icon-wrap">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" width="40" height="40">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                      <polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                  </div>
                  <h4>AMEX Card Member Verified!</h4>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    Cardholder <strong>{verifiedCardInfo.cardholderName}</strong> verified with tier <strong>{verifiedCardInfo.tier}</strong>.
                  </p>

                  <div className="verified-details-grid">
                    <div className="v-item">
                      <span className="v-label">Card Number</span>
                      <span className="v-val">{verifiedCardInfo.cardNumberMasked}</span>
                    </div>
                    <div className="v-item">
                      <span className="v-label">Member Since</span>
                      <span className="v-val">{verifiedCardInfo.memberSince}</span>
                    </div>
                    <div className="v-item" style={{ gridColumn: 'span 2' }}>
                      <span className="v-label">Lounge Privileges</span>
                      <span className="v-val" style={{ color: '#006FCF' }}>{verifiedCardInfo.loungeAccess}</span>
                    </div>
                  </div>

                  <button className="btn btn-primary" onClick={onClose} style={{ marginTop: 16, width: '100%' }}>
                    Done & Return to ATLAS
                  </button>
                </div>
              ) : (
                <form className="amex-form" onSubmit={handleVerify}>
                  <div className="form-group">
                    <label htmlFor="amex-card-num">AMEX Card Number (15 Digits)</label>
                    <input
                      id="amex-card-num"
                      type="text"
                      className="input-field"
                      placeholder="3782 822491 81005"
                      value={cardNumber}
                      onChange={handleCardInput}
                      required
                    />
                  </div>

                  <div className="form-row-2">
                    <div className="form-group">
                      <label htmlFor="amex-exp">Expiration Date</label>
                      <input
                        id="amex-exp"
                        type="text"
                        className="input-field"
                        placeholder="MM/YY"
                        value={expDate}
                        onChange={e => setExpDate(e.target.value)}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="amex-cid">4-Digit CID Security Code</label>
                      <input
                        id="amex-cid"
                        type="password"
                        maxLength="4"
                        className="input-field"
                        placeholder="4821"
                        value={cid}
                        onChange={e => setCid(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="amex-name">Cardholder Full Name</label>
                    <input
                      id="amex-name"
                      type="text"
                      className="input-field"
                      placeholder="AMIT SHARMA"
                      value={cardholderName}
                      onChange={e => setCardholderName(e.target.value)}
                      required
                    />
                  </div>

                  {error && <div className="auth-error" style={{ marginBottom: 12 }}>{error}</div>}

                  {loading && (
                    <div className="verification-progress">
                      <div className="progress-spinner-row">
                        <span className="auth-spinner" />
                        <span className="progress-text">{stepText}</span>
                      </div>
                    </div>
                  )}

                  <div className="modal-actions">
                    <button type="button" className="btn btn-outline" onClick={onClose} disabled={loading}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={loading || !cardNumber}>
                      {loading ? 'Verifying Card...' : 'Verify AMEX Card'}
                    </button>
                  </div>
                </form>
              )}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
