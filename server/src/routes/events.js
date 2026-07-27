const express = require('express');
const auth = require('../middleware/auth');
const { prepare } = require('../db');

const router = express.Router();

router.get('/', auth, (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 50, 200);
  const events = prepare(
    'SELECT * FROM alert_events WHERE user_id = ? ORDER BY created_at DESC LIMIT ?'
  ).all(req.user.id, limit);
  res.json(events);
});

router.post('/', auth, (req, res) => {
  const { event_type, level, message, journey, resolution } = req.body;
  if (!event_type || !message) {
    return res.status(400).json({ error: 'event_type and message are required' });
  }

  const result = prepare(`
    INSERT INTO alert_events (user_id, event_type, level, message, journey, resolution)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    req.user.id, event_type, level || 'info', message,
    journey || 'DEL → DXB → LHR', resolution || null
  );

  const created = prepare('SELECT * FROM alert_events WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(created);
});

router.delete('/', auth, (req, res) => {
  prepare('DELETE FROM alert_events WHERE user_id = ?').run(req.user.id);
  res.json({ message: 'All events cleared' });
});

module.exports = router;
