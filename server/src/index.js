require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDb } = require('./db');

const authRoutes          = require('./routes/auth');
const profileRoutes       = require('./routes/profile');
const cardRoutes          = require('./routes/card');
const eventsRoutes        = require('./routes/events');
const flightsRoutes       = require('./routes/flights');
const weatherRoutes       = require('./routes/weather');
const exportRoutes        = require('./routes/export');
const analyticsRoutes     = require('./routes/analytics');
const notificationsRoutes = require('./routes/notifications');
const journeysRoutes      = require('./routes/journeys');
const { startRealtimeMonitor } = require('./services/realtimeMonitor');

const app  = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

app.use('/api/auth',          authRoutes);
app.use('/api/profile',       profileRoutes);
app.use('/api/card',          cardRoutes);
app.use('/api/events',        eventsRoutes);
app.use('/api/flights',       flightsRoutes);
app.use('/api/weather',       weatherRoutes);
app.use('/api/export',        exportRoutes);
app.use('/api/analytics',     analyticsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/journeys',      journeysRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'ATLAS API', timestamp: new Date().toISOString() });
});

app.use((req, res) => res.status(404).json({ error: `Route ${req.method} ${req.path} not found` }));
app.use((err, req, res, next) => { console.error('[Error]', err); res.status(500).json({ error: 'Internal server error' }); });

// Initialize DB then start server
initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`\n🚀 ATLAS API running on http://localhost:${PORT}`);
    console.log(`   Health: http://localhost:${PORT}/api/health\n`);
    startRealtimeMonitor();
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});

module.exports = app;
