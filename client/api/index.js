const express = require('express');
const cors = require('cors');
const { initDb } = require('../../server/src/db');

const authRoutes          = require('../../server/src/routes/auth');
const profileRoutes       = require('../../server/src/routes/profile');
const cardRoutes          = require('../../server/src/routes/card');
const eventsRoutes        = require('../../server/src/routes/events');
const flightsRoutes       = require('../../server/src/routes/flights');
const weatherRoutes       = require('../../server/src/routes/weather');
const exportRoutes        = require('../../server/src/routes/export');
const analyticsRoutes     = require('../../server/src/routes/analytics');
const notificationsRoutes = require('../../server/src/routes/notifications');
const journeysRoutes      = require('../../server/src/routes/journeys');

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

let isDbInitialized = false;

app.use(async (req, res, next) => {
  if (!isDbInitialized) {
    try {
      await initDb();
      isDbInitialized = true;
    } catch (e) {
      console.error('[Vercel Serverless DB Init Error]:', e);
    }
  }
  next();
});

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
  res.json({ status: 'ok', service: 'ATLAS API (Vercel Serverless Subfolder)', timestamp: new Date().toISOString() });
});

module.exports = app;
