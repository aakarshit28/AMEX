import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import API from '../../services/api';
import AmexCardModal from '../AmexCardModal';

export default function TwinTab({ onPrefsChange }) {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState({ cost: 85, loyalty: 60, layover: 75, hotel: 90 });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [cardModalOpen, setCardModalOpen] = useState(false);

  const [profile, setProfile] = useState({
    traveler_name: user?.name || 'AARAV GUPTA',
    employer: 'Delta Corp International',
    preferred_airline: 'Emirates (Skywards Gold)',
    preferred_hotel: 'Marriott (Bonvoy Elite)',
    dietary: 'Vegetarian',
    seat_preference: 'Window / Aisle (row ≤15)',
    amex_card: 'Platinum Business',
    amex_card_number: '3782 •••••• 81005',
    amex_card_tier: 'Platinum Business',
    amex_member_since: '2018',
    amex_verified: 1,
    amex_lounge_access: 'Centurion Lounge & Delta Sky Club Priority'
  });

  const fetchProfileAndCard = async () => {
    try {
      const [profRes, cardRes] = await Promise.all([
        API.get('/profile').catch(() => null),
        API.get('/card/status').catch(() => null)
      ]);

      if (profRes && profRes.data) {
        setProfile(prev => ({
          ...prev,
          ...profRes.data,
          traveler_name: profRes.data.traveler_name || user?.name || prev.traveler_name
        }));
        if (profRes.data.cost_vs_delay !== undefined) {
          setPrefs({
            cost: profRes.data.cost_vs_delay,
            loyalty: profRes.data.loyalty_weight,
            layover: profRes.data.layover_tolerance,
            hotel: profRes.data.hotel_comfort
          });
        }
      }

      if (cardRes && cardRes.data) {
        setProfile(prev => ({
          ...prev,
          amex_card_number: cardRes.data.cardNumberMasked,
          amex_card_tier: cardRes.data.tier,
          amex_member_since: cardRes.data.memberSince,
          amex_verified: cardRes.data.verified ? 1 : 0,
          amex_lounge_access: cardRes.data.loungeAccess,
          traveler_name: cardRes.data.cardholderName || user?.name || prev.traveler_name
        }));
      }
    } catch (e) {
      console.error('Error loading profile/card status:', e);
    }
  };

  useEffect(() => {
    fetchProfileAndCard();
  }, [user]);

  const labels = {
    cost: v => v < 30 ? `Minimize Cost (${v}%)` : v < 65 ? `Balanced Budget (${v}%)` : v < 85 ? `Delay Avoidance (${v}%)` : `Aggressive Avoidance (${v}%)`,
    loyalty: v => v < 30 ? `Any Carrier (${v}%)` : v < 70 ? `Moderate (${v}%)` : `Emirates Priority (${v}%)`,
    layover: v => v < 30 ? `Tolerates Long Layovers (${v}%)` : v < 70 ? `Moderate (${v}%)` : `Short Layovers Only (${v}%)`,
    hotel: v => v < 30 ? `Budget Options (${v}%)` : v < 70 ? `Mid-scale (${v}%)` : `Premium Only (${v}%)`
  };

  const handleSlider = (key, val) => {
    const newPrefs = { ...prefs, [key]: Number(val) };
    setPrefs(newPrefs);
    if (onPrefsChange) onPrefsChange(newPrefs);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await API.put('/profile', {
        cost_vs_delay: prefs.cost,
        loyalty_weight: prefs.loyalty,
        layover_tolerance: prefs.layover,
        hotel_comfort: prefs.hotel
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error('Save failed:', e);
    } finally {
      setSaving(false);
    }
  };

  const handleVerifiedCard = () => {
    fetchProfileAndCard();
  };

  // Determine card theme gradient
  const tierLower = (profile.amex_card_tier || '').toLowerCase();
  let cardTheme = 'platinum';
  if (tierLower.includes('centurion') || tierLower.includes('black')) cardTheme = 'centurion';
  else if (tierLower.includes('gold')) cardTheme = 'gold';

  return (
    <section id="tab-twin" className="tab-content active">
      <div className="page-scroll">
        <div className="twin-layout">

          {/* Profile Card */}
          <div className="card card-padded twin-profile-card">
            <div className="twin-card-inner">

              {/* Avatar & Verified Badge */}
              <div className="twin-avatar">
                <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg>
                {profile.amex_verified ? (
                  <div className="twin-verified" title="Verified AMEX Cardmember">
                    <svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                  </div>
                ) : null}
              </div>

              <div className="twin-name">{profile.traveler_name || user?.name || 'AARAV GUPTA'}</div>
              <div className="twin-role">
                Corporate Executive · {profile.amex_card_tier || 'Platinum Member'}
              </div>

              {/* Verified Badge Pill */}
              <div className="amex-verified-pill-row">
                {profile.amex_verified ? (
                  <span className="amex-verified-badge">
                    <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
                      <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-5.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/>
                    </svg>
                    VERIFIED AMEX CARDMEMBER
                  </span>
                ) : (
                  <span className="badge badge-amber">Unverified Card</span>
                )}
              </div>

              {/* Visible Interactive AMEX Credit Card Graphic */}
              <div className={`amex-visual-card amex-theme-${cardTheme}`} style={{ margin: '18px 0 12px 0' }}>
                <div className="card-top-row">
                  <div className="amex-logo-box">AMERICAN EXPRESS</div>
                  <div className="card-tier-tag">{profile.amex_card_tier || 'Platinum Business'}</div>
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
                  {profile.amex_card_number || '3782 •••••• 81005'}
                </div>

                <div className="card-bottom-row">
                  <div>
                    <div className="card-lbl">CARDHOLDER</div>
                    <div className="card-val">{(profile.traveler_name || user?.name || 'AARAV GUPTA').toUpperCase()}</div>
                  </div>
                  <div>
                    <div className="card-lbl">MEMBER SINCE</div>
                    <div className="card-val">{profile.amex_member_since || '2018'}</div>
                  </div>
                  <div>
                    <div className="card-lbl">EXPIRES</div>
                    <div className="card-val">08/28</div>
                  </div>
                </div>
              </div>

              <div className="twin-divider"></div>

              {/* Profile Attributes Table */}
              <div className="twin-attrs">
                {[
                  ['Employer', profile.employer || 'Delta Corp International'],
                  ['Preferred Airline', profile.preferred_airline || 'Emirates (Skywards Gold)'],
                  ['Preferred Hotel', profile.preferred_hotel || 'Marriott (Bonvoy Elite)'],
                  ['Dietary Need', profile.dietary || 'Vegetarian'],
                  ['Seat Preference', profile.seat_preference || 'Window / Aisle (row ≤15)'],
                  ['AMEX Card Tier', profile.amex_card_tier || 'Platinum Business'],
                  ['Card Number', profile.amex_card_number || '3782 •••••• 81005'],
                  ['Member Since', profile.amex_member_since ? `Class of ${profile.amex_member_since}` : '2018'],
                ].map(([label, value]) => (
                  <div key={label} className="twin-attr">
                    <span className="twin-attr-label">{label}</span>
                    <span className="twin-attr-value">{value}</span>
                  </div>
                ))}
              </div>

              <div className="twin-divider"></div>

              {/* Lounge & Privileges Badges */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
                <span className="badge badge-gold" style={{ justifyContent: 'center', textAlign: 'center' }}>
                  💳 {profile.amex_lounge_access || 'Centurion Lounge & Delta Sky Club Priority'}
                </span>
                <span className="badge badge-blue" style={{ justifyContent: 'center' }}>
                  ⚡ Priority Immigration & Autonomous Rerouting
                </span>
              </div>

              {/* Verify / Update AMEX Card Button */}
              <button
                className="btn btn-primary btn-block"
                style={{ marginTop: 16, background: 'linear-gradient(135deg, #006FCF 0%, #004080 100%)' }}
                onClick={() => setCardModalOpen(true)}
              >
                <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" style={{ marginRight: 6 }}>
                  <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/>
                </svg>
                {profile.amex_verified ? 'Re-Verify / Change AMEX Card Details' : 'Verify AMEX Card'}
              </button>

            </div>
          </div>

          {/* Sliders Panel */}
          <div className="card card-padded sliders-panel">
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--text-white)' }}>
                Behavioral Decision Model
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 5, lineHeight: 1.5 }}>
                Configure how ATLAS makes autonomous decisions on behalf of this traveler. Changes dynamically recalibrate the AI Decision Simulator.
              </div>
            </div>

            {[
              { key: 'cost', label: 'Cost vs. Delay Avoidance', left: 'Minimize Cost', right: 'Avoid Delay' },
              { key: 'loyalty', label: 'Airline Loyalty Preference', left: 'Any Carrier', right: 'Emirates Only' },
              { key: 'layover', label: 'Layover Tolerance', left: 'Accept 8h+ Layovers', right: 'Under 2h Only' },
              { key: 'hotel', label: 'Hotel Comfort Level', left: 'Budget', right: '5-Star Premium' },
            ].map(({ key, label, left, right }) => (
              <div key={key} className="slider-group">
                <div className="slider-header">
                  <span className="slider-label">{label}</span>
                  <span className="slider-value">{labels[key](prefs[key])}</span>
                </div>
                <div className="slider-track-row">
                  <span className="slider-endpoint">{left}</span>
                  <input
                    type="range" min="0" max="100"
                    value={prefs[key]}
                    onChange={e => handleSlider(key, e.target.value)}
                  />
                  <span className="slider-endpoint right">{right}</span>
                </div>
              </div>
            ))}

            <div className="slider-hint">
              <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
              <div>
                <strong style={{ color: 'var(--text-cream)' }}>Decision Impact:</strong> High Delay Avoidance with Verified {profile.amex_card_tier || 'Platinum'} Card causes ATLAS to prioritize Centurion Lounge layover hubs.
              </div>
            </div>

            <button className="btn btn-outline" style={{ marginTop: 16, alignSelf: 'flex-start' }} onClick={handleSave} disabled={saving}>
              {saved ? '✓ Saved to Profile' : saving ? 'Saving...' : 'Save to Cloud Profile'}
            </button>
          </div>

        </div>
      </div>

      {/* AMEX Card Modal */}
      <AmexCardModal
        isOpen={cardModalOpen}
        onClose={() => setCardModalOpen(false)}
        onVerified={handleVerifiedCard}
      />
    </section>
  );
}
