const fetch = require('node-fetch');
const { prepare } = require('../db');
const { getAirport } = require('../utils/airports');

let monitorInterval = null;

async function checkJourneyLiveWeather(journey) {
  const codes = [journey.origin_code, journey.transit_code, journey.destination_code].filter(Boolean);

  try {
    for (const code of codes) {
      const airport = getAirport(code);
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${airport.lat}&longitude=${airport.lon}&current=temperature_2m,wind_speed_10m,wind_gusts_10m,precipitation,weather_code&wind_speed_unit=kmh&timezone=auto`;

      const res = await fetch(url, { timeout: 5000 });
      if (!res.ok) continue;

      const data = await res.json();
      const c = data.current;

      // Check if severe weather detected
      const isThunderstorm = c.weather_code >= 95;
      const isHighWind = c.wind_gusts_10m > 60;

      if (isThunderstorm || isHighWind) {
        const hazardType = isThunderstorm ? 'Severe Thunderstorm' : 'High Wind Gusts';
        const msg = `[REAL-TIME ALERT] ${code} (${airport.city}): ${hazardType} detected. Wind: ${c.wind_gusts_10m} km/h, Temp: ${c.temperature_2m}°C. Backup travel plan activated.`;

        // Check if alert already logged recently to avoid duplicate spam
        const existing = prepare(
          "SELECT COUNT(*) as count FROM alert_events WHERE user_id = ? AND message LIKE ? AND created_at > datetime('now', '-30 minutes')"
        ).get(journey.user_id, `%${code}%`);

        if (!existing || existing.count === 0) {
          prepare(
            "INSERT INTO alert_events (user_id, event_type, level, message, journey, resolution) VALUES (?, 'REALTIME_WEATHER_HAZARD', 'warn', ?, ?, 'Dynamic Backup Rerouting Engine active')"
          ).run(journey.user_id, msg, journey.title);

          prepare(
            "INSERT INTO notifications (user_id, type, title, message) VALUES (?, 'disruption', ?, ?)"
          ).run(journey.user_id, `Live Weather Alert: ${code}`, msg);

          console.log(`[Realtime Monitor] Hazard flagged for ${code}:`, msg);
        }
      }
    }
  } catch (err) {
    // Silent fail background monitor error
  }
}

async function runRealtimeMonitoringCycle() {
  try {
    const activeJourneys = prepare('SELECT * FROM journeys WHERE is_active = 1').all();
    for (const j of activeJourneys) {
      await checkJourneyLiveWeather(j);
    }
  } catch (e) {
    // Database or background loop silent error catching
  }
}

function startRealtimeMonitor(intervalMs = 45000) {
  if (monitorInterval) clearInterval(monitorInterval);

  console.log('[Realtime Monitor] Starting live background weather & journey poller (interval: 45s)...');
  // Initial run after 5 seconds
  setTimeout(runRealtimeMonitoringCycle, 5000);
  monitorInterval = setInterval(runRealtimeMonitoringCycle, intervalMs);
}

module.exports = { startRealtimeMonitor, runRealtimeMonitoringCycle };
