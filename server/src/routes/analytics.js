const express = require('express');
const auth = require('../middleware/auth');
const { prepare } = require('../db');

const router = express.Router();

// GET /api/analytics/summary — aggregate metrics
router.get('/summary', auth, (req, res) => {
  const userId = req.user.id;

  const totalEvents = prepare('SELECT COUNT(*) as count FROM alert_events WHERE user_id = ?').get(userId);
  const resolved = prepare("SELECT COUNT(*) as count FROM alert_events WHERE user_id = ? AND level = 'success'").get(userId);
  const warnings = prepare("SELECT COUNT(*) as count FROM alert_events WHERE user_id = ? AND level = 'warn'").get(userId);
  const critical = prepare("SELECT COUNT(*) as count FROM alert_events WHERE user_id = ? AND level = 'err'").get(userId);

  const total = totalEvents?.count || 0;
  const resolvedCount = resolved?.count || 0;
  const resolutionRate = total > 0 ? Math.round((resolvedCount / Math.max(1, Math.ceil(total / 4))) * 100) : 0;

  // Simulated enriched metrics (in production, these would come from real journey data)
  const avgResponseTime = total > 0 ? Math.max(1.2, 4.8 - (resolvedCount * 0.3)) : 4.8;
  const costSavings = resolvedCount * 2340;

  res.json({
    total_events: total,
    resolved_count: resolvedCount,
    warning_count: warnings?.count || 0,
    critical_count: critical?.count || 0,
    resolution_rate: Math.min(resolutionRate, 100),
    avg_response_time: Number(avgResponseTime.toFixed(1)),
    cost_savings: costSavings,
    total_journeys: Math.max(1, Math.ceil(total / 4)),
    autonomous_resolutions: resolvedCount,
    manual_resolutions: Math.max(0, Math.ceil(total / 8) - resolvedCount),
    pending: Math.max(0, critical?.count || 0)
  });
});

// GET /api/analytics/trends — weekly disruption trends
router.get('/trends', auth, (req, res) => {
  const userId = req.user.id;

  // Generate last 7 days trend data from actual events
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().slice(0, 10);
    const dayLabel = date.toLocaleDateString('en-US', { weekday: 'short' });

    const dayEvents = prepare(
      "SELECT COUNT(*) as count FROM alert_events WHERE user_id = ? AND DATE(created_at) = ?"
    ).get(userId, dateStr);

    const dayResolved = prepare(
      "SELECT COUNT(*) as count FROM alert_events WHERE user_id = ? AND DATE(created_at) = ? AND level = 'success'"
    ).get(userId, dateStr);

    days.push({
      date: dateStr,
      label: dayLabel,
      disruptions: dayEvents?.count || 0,
      resolutions: dayResolved?.count || 0
    });
  }

  // Top destinations (simulated for prototype)
  const destinations = [
    { code: 'LHR', city: 'London Heathrow', journeys: 12, percentage: 35 },
    { code: 'DXB', city: 'Dubai International', journeys: 8, percentage: 23 },
    { code: 'DOH', city: 'Doha Hamad', journeys: 6, percentage: 18 },
    { code: 'SIN', city: 'Singapore Changi', journeys: 5, percentage: 14 },
    { code: 'JFK', city: 'New York JFK', journeys: 3, percentage: 10 }
  ];

  // Agent performance (simulated for prototype)
  const agentPerformance = [
    { agent: 'Flight Intel', efficiency: 97, tasks_completed: 342 },
    { agent: 'Weather', efficiency: 95, tasks_completed: 218 },
    { agent: 'Hotel', efficiency: 99, tasks_completed: 156 },
    { agent: 'Finance', efficiency: 94, tasks_completed: 289 },
    { agent: 'Calendar', efficiency: 98, tasks_completed: 178 },
    { agent: 'Compensation', efficiency: 92, tasks_completed: 94 },
    { agent: 'Safety', efficiency: 100, tasks_completed: 312 },
    { agent: 'Negotiation', efficiency: 96, tasks_completed: 124 }
  ];

  res.json({ days, destinations, agentPerformance });
});

module.exports = router;
