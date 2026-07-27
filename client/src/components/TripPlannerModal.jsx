import { useState } from 'react';
import API from '../services/api';

export default function TripPlannerModal({ isOpen, onClose, onTripCreated }) {
  const [formData, setFormData] = useState({
    title: '',
    origin_code: 'JFK',
    origin_city: 'New York',
    transit_code: 'FRA',
    transit_city: 'Frankfurt Main',
    destination_code: 'SIN',
    destination_city: 'Singapore',
    flight_leg1: 'LH-401 · Scheduled',
    flight_leg2: 'SQ-025 · Upcoming',
    hotel_name: 'Marina Bay Sands',
    ground_transport: 'Grab Executive',
    meeting_title: 'APAC Leadership Summit',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.origin_code || !formData.destination_code || !formData.origin_city || !formData.destination_city) {
      setError('Please fill in required Origin and Destination details');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await API.post('/journeys', formData);
      if (onTripCreated) onTripCreated(res.data);
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to save custom trip plan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content trip-planner-modal">
        <div className="modal-header">
          <div className="modal-title">
            <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20" style={{ color: 'var(--amex-blue-light)' }}>
              <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L14 19v-5.5l8 2.5z"/>
            </svg>
            Plan Custom Trip & Itinerary
          </div>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        {error && <div className="auth-error" style={{ margin: '0 20px 10px' }}>{error}</div>}

        <form onSubmit={handleSubmit} className="trip-planner-form">
          <div className="form-section-title">✈ Flight Itinerary</div>

          <div className="form-row">
            <div className="form-field">
              <label>Origin Airport Code *</label>
              <input name="origin_code" value={formData.origin_code} onChange={handleChange} placeholder="e.g. JFK, DEL, SFO" required maxLength={4} />
            </div>
            <div className="form-field">
              <label>Origin City Name *</label>
              <input name="origin_city" value={formData.origin_city} onChange={handleChange} placeholder="e.g. New York, New Delhi" required />
            </div>
          </div>

          <div className="form-row">
            <div className="form-field">
              <label>Transit Hub Code (Optional)</label>
              <input name="transit_code" value={formData.transit_code} onChange={handleChange} placeholder="e.g. DXB, FRA, DOH" maxLength={4} />
            </div>
            <div className="form-field">
              <label>Transit City Name (Optional)</label>
              <input name="transit_city" value={formData.transit_city} onChange={handleChange} placeholder="e.g. Dubai, Frankfurt" />
            </div>
          </div>

          <div className="form-row">
            <div className="form-field">
              <label>Destination Airport Code *</label>
              <input name="destination_code" value={formData.destination_code} onChange={handleChange} placeholder="e.g. LHR, SIN, HND" required maxLength={4} />
            </div>
            <div className="form-field">
              <label>Destination City Name *</label>
              <input name="destination_city" value={formData.destination_city} onChange={handleChange} placeholder="e.g. London, Singapore" required />
            </div>
          </div>

          <div className="form-row">
            <div className="form-field">
              <label>Flight Leg 1 Info</label>
              <input name="flight_leg1" value={formData.flight_leg1} onChange={handleChange} placeholder="e.g. EK-513 · Scheduled" />
            </div>
            <div className="form-field">
              <label>Flight Leg 2 / Connection Info</label>
              <input name="flight_leg2" value={formData.flight_leg2} onChange={handleChange} placeholder="e.g. SQ-025 · Upcoming" />
            </div>
          </div>

          <div className="form-section-title" style={{ marginTop: 12 }}>🏨 Ground & Accommodation</div>

          <div className="form-row">
            <div className="form-field">
              <label>Hotel Name</label>
              <input name="hotel_name" value={formData.hotel_name} onChange={handleChange} placeholder="e.g. Marriott, Hilton, Taj" />
            </div>
            <div className="form-field">
              <label>Ground Mobility / Transfer</label>
              <input name="ground_transport" value={formData.ground_transport} onChange={handleChange} placeholder="e.g. Addison Lee, Chauffeur, Uber Black" />
            </div>
          </div>

          <div className="form-row">
            <div className="form-field" style={{ gridColumn: 'span 2' }}>
              <label>Meeting / Schedule Title</label>
              <input name="meeting_title" value={formData.meeting_title} onChange={handleChange} placeholder="e.g. Executive Board Summit, Client Keynote" />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating Trip...' : 'Submit & Activate Trip Plan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
