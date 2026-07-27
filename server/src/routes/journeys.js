const express = require('express');
const auth = require('../middleware/auth');
const { prepare } = require('../db');

const router = express.Router();

const DEFAULT_PRESETS = [
  {
    title: 'DEL → DXB → LHR (Delhi to London)',
    origin_code: 'DEL',
    origin_city: 'New Delhi',
    transit_code: 'DXB',
    transit_city: 'Dubai Intl',
    destination_code: 'LHR',
    destination_city: 'London Heathrow',
    flight_leg1: 'EK-513 · Airborne',
    flight_leg2: 'EK-007 · Scheduled',
    hotel_name: 'Marriott Park Lane',
    ground_transport: 'Addison Lee',
    meeting_title: 'Global Leadership Board Meeting',
    status: 'In-Air',
    is_active: 1,
  },
  {
    title: 'JFK → FRA → SIN (New York to Singapore)',
    origin_code: 'JFK',
    origin_city: 'New York JFK',
    transit_code: 'FRA',
    transit_city: 'Frankfurt Main',
    destination_code: 'SIN',
    destination_city: 'Singapore Changi',
    flight_leg1: 'LH-401 · Scheduled',
    flight_leg2: 'SQ-025 · Upcoming',
    hotel_name: 'Marina Bay Sands',
    ground_transport: 'Grab Executive',
    meeting_title: 'APAC Regional Financial Summit',
    status: 'Scheduled',
    is_active: 0,
  },
  {
    title: 'SFO → HND → BOM (San Francisco to Mumbai)',
    origin_code: 'SFO',
    origin_city: 'San Francisco',
    transit_code: 'HND',
    transit_city: 'Tokyo Haneda',
    destination_code: 'BOM',
    destination_city: 'Mumbai Chhatrapati',
    flight_leg1: 'NH-107 · Scheduled',
    flight_leg2: 'AI-307 · Upcoming',
    hotel_name: 'Taj Mahal Palace',
    ground_transport: 'Uber Black',
    meeting_title: 'India Tech Innovation Keynote',
    status: 'Scheduled',
    is_active: 0,
  }
];

// Helper: Seed default presets if user has no journeys
function ensureUserJourneys(userId) {
  const existing = prepare('SELECT COUNT(*) as count FROM journeys WHERE user_id = ?').get(userId);
  if (!existing || existing.count === 0) {
    DEFAULT_PRESETS.forEach(p => {
      prepare(`
        INSERT INTO journeys (
          user_id, title, origin_code, origin_city, transit_code, transit_city,
          destination_code, destination_city, flight_leg1, flight_leg2,
          hotel_name, ground_transport, meeting_title, status, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        userId, p.title, p.origin_code, p.origin_city, p.transit_code, p.transit_city,
        p.destination_code, p.destination_city, p.flight_leg1, p.flight_leg2,
        p.hotel_name, p.ground_transport, p.meeting_title, p.status, p.is_active
      );
    });
  }
}

// GET /api/journeys — List all user journeys
router.get('/', auth, (req, res) => {
  ensureUserJourneys(req.user.id);
  const journeys = prepare('SELECT * FROM journeys WHERE user_id = ? ORDER BY is_active DESC, created_at DESC').all(req.user.id);
  res.json(journeys);
});

// POST /api/journeys — Create a new custom journey
router.post('/', auth, (req, res) => {
  const {
    title, origin_code, origin_city, transit_code, transit_city,
    destination_code, destination_city, flight_leg1, flight_leg2,
    hotel_name, ground_transport, meeting_title
  } = req.body;

  if (!origin_code || !destination_code || !origin_city || !destination_city) {
    return res.status(400).json({ error: 'Origin and Destination codes and cities are required' });
  }

  const journeyTitle = title || `${origin_code.toUpperCase()} → ${transit_code ? transit_code.toUpperCase() + ' → ' : ''}${destination_code.toUpperCase()} (${origin_city} to ${destination_city})`;

  // Deactivate existing journeys if setting this active
  prepare('UPDATE journeys SET is_active = 0 WHERE user_id = ?').run(req.user.id);

  const result = prepare(`
    INSERT INTO journeys (
      user_id, title, origin_code, origin_city, transit_code, transit_city,
      destination_code, destination_city, flight_leg1, flight_leg2,
      hotel_name, ground_transport, meeting_title, status, is_active
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Scheduled', 1)
  `).run(
    req.user.id,
    journeyTitle,
    origin_code.toUpperCase(),
    origin_city,
    transit_code ? transit_code.toUpperCase() : null,
    transit_city || null,
    destination_code.toUpperCase(),
    destination_city,
    flight_leg1 || `${origin_code.toUpperCase()}-101 · Scheduled`,
    flight_leg2 || (transit_code ? `${transit_code.toUpperCase()}-202 · Scheduled` : null),
    hotel_name || 'Partner Executive Hotel',
    ground_transport || 'Chauffeur Service',
    meeting_title || 'Business Conference',
  );

  const newJourney = prepare('SELECT * FROM journeys WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(newJourney);
});

// PUT /api/journeys/:id/activate — Set active journey
router.put('/:id/activate', auth, (req, res) => {
  const journeyId = parseInt(req.params.id);
  prepare('UPDATE journeys SET is_active = 0 WHERE user_id = ?').run(req.user.id);
  prepare('UPDATE journeys SET is_active = 1 WHERE id = ? AND user_id = ?').run(journeyId, req.user.id);

  const active = prepare('SELECT * FROM journeys WHERE id = ? AND user_id = ?').get(journeyId, req.user.id);
  res.json(active);
});

// DELETE /api/journeys/:id — Delete journey
router.delete('/:id', auth, (req, res) => {
  const journeyId = parseInt(req.params.id);
  prepare('DELETE FROM journeys WHERE id = ? AND user_id = ?').run(journeyId, req.user.id);

  // If deleted trip was active, activate the first remaining trip
  const remaining = prepare('SELECT * FROM journeys WHERE user_id = ? ORDER BY id ASC').all(req.user.id);
  if (remaining.length > 0) {
    prepare('UPDATE journeys SET is_active = 1 WHERE id = ?').run(remaining[0].id);
  }
  res.json({ success: true, remaining });
});

module.exports = router;
