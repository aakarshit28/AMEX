const express = require('express');
const auth = require('../middleware/auth');
const { prepare } = require('../db');

const router = express.Router();

router.get('/', auth, (req, res) => {
  const profile = prepare('SELECT * FROM traveler_profiles WHERE user_id = ?').get(req.user.id);
  if (!profile) return res.status(404).json({ error: 'Profile not found' });
  res.json(profile);
});

router.put('/', auth, (req, res) => {
  const {
    traveler_name, employer, preferred_airline, preferred_hotel,
    dietary, seat_preference, amex_card,
    cost_vs_delay, loyalty_weight, layover_tolerance, hotel_comfort
  } = req.body;

  const existing = prepare('SELECT id FROM traveler_profiles WHERE user_id = ?').get(req.user.id);

  if (!existing) {
    prepare(`
      INSERT INTO traveler_profiles 
        (user_id, traveler_name, employer, preferred_airline, preferred_hotel, dietary,
         seat_preference, amex_card, cost_vs_delay, loyalty_weight, layover_tolerance, hotel_comfort)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      req.user.id, traveler_name || req.user.name,
      employer || 'Delta Corp International',
      preferred_airline || 'Emirates (Skywards Gold)',
      preferred_hotel || 'Marriott (Bonvoy Elite)',
      dietary || 'Vegetarian',
      seat_preference || 'Window / Aisle (row ≤15)',
      amex_card || 'Platinum Business',
      cost_vs_delay ?? 85, loyalty_weight ?? 60,
      layover_tolerance ?? 75, hotel_comfort ?? 90
    );
  } else {
    // Update only provided fields
    const fields = [];
    const vals = [];
    const updates = {
      traveler_name, employer, preferred_airline, preferred_hotel,
      dietary, seat_preference, amex_card,
      cost_vs_delay, loyalty_weight, layover_tolerance, hotel_comfort
    };
    for (const [k, v] of Object.entries(updates)) {
      if (v !== undefined) { fields.push(`${k} = ?`); vals.push(v); }
    }
    if (fields.length > 0) {
      fields.push('updated_at = CURRENT_TIMESTAMP');
      vals.push(req.user.id);
      prepare(`UPDATE traveler_profiles SET ${fields.join(', ')} WHERE user_id = ?`).run(...vals);
    }
  }

  const updated = prepare('SELECT * FROM traveler_profiles WHERE user_id = ?').get(req.user.id);
  res.json(updated);
});

module.exports = router;
