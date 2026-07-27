const express = require('express');
const auth = require('../middleware/auth');
const { prepare } = require('../db');

const router = express.Router();

// GET /api/notifications — fetch user notifications
router.get('/', auth, (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  const notifications = prepare(
    'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ?'
  ).all(req.user.id, limit);
  res.json(notifications);
});

// GET /api/notifications/unread-count
router.get('/unread-count', auth, (req, res) => {
  const result = prepare(
    'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0'
  ).get(req.user.id);
  res.json({ count: result?.count || 0 });
});

// POST /api/notifications — create notification
router.post('/', auth, (req, res) => {
  const { type, title, message, metadata } = req.body;
  if (!title || !message) {
    return res.status(400).json({ error: 'title and message are required' });
  }
  prepare(
    'INSERT INTO notifications (user_id, type, title, message, metadata) VALUES (?, ?, ?, ?, ?)'
  ).run(req.user.id, type || 'system', title, message, metadata ? JSON.stringify(metadata) : null);

  res.status(201).json({ success: true });
});

// PUT /api/notifications/:id/read — mark one as read
router.put('/:id/read', auth, (req, res) => {
  prepare(
    'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?'
  ).run(parseInt(req.params.id), req.user.id);
  res.json({ success: true });
});

// PUT /api/notifications/read-all — mark all as read
router.put('/read-all', auth, (req, res) => {
  prepare(
    'UPDATE notifications SET is_read = 1 WHERE user_id = ?'
  ).run(req.user.id);
  res.json({ success: true });
});

// DELETE /api/notifications — clear all
router.delete('/', auth, (req, res) => {
  prepare('DELETE FROM notifications WHERE user_id = ?').run(req.user.id);
  res.json({ success: true });
});

module.exports = router;
