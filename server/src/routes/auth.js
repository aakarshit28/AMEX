const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { prepare } = require('../db');

const router = express.Router();

function signToken(user) {
  const secret = process.env.JWT_SECRET || 'atlas_dev_secret_fallback_key';
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    secret,
    { expiresIn: '7d' }
  );
}

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'name, email and password are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  const existing = prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) return res.status(409).json({ error: 'Email already registered' });

  const hash = await bcrypt.hash(password, 12);
  prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)').run(name, email, hash);

  const user = prepare('SELECT id, name, email FROM users WHERE email = ?').get(email);
  if (!user) return res.status(500).json({ error: 'Failed to create user' });

  // Default profile
  prepare('INSERT INTO traveler_profiles (user_id, traveler_name) VALUES (?, ?)').run(user.id, name);

  const token = signToken(user);
  res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email } });
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email and password are required' });

  let user = prepare('SELECT * FROM users WHERE email = ?').get(email);

  // Auto-provision demo account if missing
  if (!user && (email === 'user@atlas.com' || email === 'demo@atlas.com' || email === 'amit@amex.com')) {
    const defaultName = email === 'amit@amex.com' ? 'Amit Sharma' : 'Atlas Demo User';
    const hash = await bcrypt.hash(password || 'password123', 12);
    prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)').run(defaultName, email, hash);
    user = prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (user) {
      prepare('INSERT OR IGNORE INTO traveler_profiles (user_id, traveler_name) VALUES (?, ?)').run(user.id, defaultName);
      prepare('INSERT INTO journeys (user_id, title, origin_code, origin_city, transit_code, transit_city, destination_code, destination_city, flight_leg1, flight_leg2, hotel_name, ground_transport, meeting_title, status, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
        user.id, 'New Delhi to London Heathrow', 'DEL', 'New Delhi', 'DXB', 'Dubai Intl', 'LHR', 'London Heathrow', 'EK-513 · Airborne', 'EK-007 · Scheduled', 'Marriott Park Lane', 'Addison Lee Chauffeur', 'Global Executive Summit', 'Active', 1
      );
    }
  }

  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

  const token = signToken(user);
  res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
});

// GET /api/auth/me
const auth = require('../middleware/auth');
router.get('/me', auth, (req, res) => {
  const user = prepare('SELECT id, name, email, created_at FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

module.exports = router;
