const express = require('express');
const PDFDocument = require('pdfkit');
const auth = require('../middleware/auth');
const { prepare } = require('../db');

const router = express.Router();

// GET /api/export/pdf — generate journey report PDF
router.get('/pdf', auth, (req, res) => {
  try {
    const profile = prepare('SELECT * FROM traveler_profiles WHERE user_id = ?').get(req.user.id);
    const events = prepare(
      'SELECT * FROM alert_events WHERE user_id = ? ORDER BY created_at DESC LIMIT 20'
    ).all(req.user.id);
    const activeJourney = prepare(
      'SELECT * FROM journeys WHERE user_id = ? AND is_active = 1 LIMIT 1'
    ).get(req.user.id);

    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="ATLAS_Journey_Report_${new Date().toISOString().slice(0,10)}.pdf"`
    );

    doc.pipe(res);

    // ── Header ─────────────────────────────────────────────────────────────
    doc.rect(0, 0, doc.page.width, 90).fill('#002D72');

    doc.fillColor('white')
       .fontSize(28).font('Helvetica-Bold')
       .text('ATLAS', 50, 22);

    doc.fontSize(10).font('Helvetica')
       .text('American Express · Predictive Autonomous Travel AI', 50, 56);

    doc.fontSize(8).fillColor('#A0B4D0')
       .text(`Report generated: ${new Date().toLocaleString()}`, 50, 72);

    // ── Active Journey Summary ──────────────────────────────────────────────
    let y = 110;
    doc.fillColor('#002D72').fontSize(14).font('Helvetica-Bold')
       .text('Active Itinerary Overview', 50, y);
    y += 18;
    doc.moveTo(50, y).lineTo(545, y).lineWidth(1).strokeColor('#D4E4F7').stroke();
    y += 12;

    const jTitle = activeJourney?.title || 'DEL → DXB → LHR (Delhi to London)';
    const jOrigin = `${activeJourney?.origin_city || 'New Delhi'} (${activeJourney?.origin_code || 'DEL'})`;
    const jTransit = activeJourney?.transit_code ? `${activeJourney?.transit_city} (${activeJourney?.transit_code})` : 'Direct Flight';
    const jDest = `${activeJourney?.destination_city || 'London Heathrow'} (${activeJourney?.destination_code || 'LHR'})`;

    doc.fillColor('#111').font('Helvetica-Bold').fontSize(11).text(jTitle, 55, y);
    y += 16;

    const journeyMeta = [
      ['Route', `${jOrigin}  ➔  ${jTransit}  ➔  ${jDest}`],
      ['Flight Leg 1', activeJourney?.flight_leg1 || 'EK-513 · Airborne'],
      ['Flight Leg 2', activeJourney?.flight_leg2 || 'EK-007 · Scheduled'],
      ['Hotel', activeJourney?.hotel_name || 'Marriott Park Lane'],
      ['Ground Transfer', activeJourney?.ground_transport || 'Addison Lee Executive'],
      ['Activity / Meeting', activeJourney?.meeting_title || 'Global Leadership Board Meeting'],
    ];

    journeyMeta.forEach(([lbl, val]) => {
      doc.fillColor('#555').font('Helvetica').fontSize(9).text(lbl + ':', 55, y);
      doc.fillColor('#111').font('Helvetica-Bold').fontSize(9).text(String(val), 180, y);
      y += 16;
    });

    // ── Traveler Profile ────────────────────────────────────────────────────
    y += 10;
    doc.fillColor('#002D72').fontSize(14).font('Helvetica-Bold')
       .text('Traveler Profile & Preferences', 50, y);
    y += 18;
    doc.moveTo(50, y).lineTo(545, y).lineWidth(1).strokeColor('#D4E4F7').stroke();
    y += 12;

    const travelerName = profile?.traveler_name || req.user.name || 'Atlas Traveler';
    const profileData = [
      ['Traveler Name', travelerName],
      ['AMEX Card', profile?.amex_card || 'Platinum Business'],
      ['Preferred Airline', profile?.preferred_airline || 'Emirates (Skywards Gold)'],
      ['Preferred Hotel', profile?.preferred_hotel || 'Marriott (Bonvoy Elite)'],
      ['Dietary Preference', profile?.dietary || 'Vegetarian'],
      ['Seat Preference', profile?.seat_preference || 'Window / Aisle (row ≤15)'],
      ['Employer', profile?.employer || 'Delta Corp International'],
    ];

    profileData.forEach(([label, value]) => {
      doc.fillColor('#555').font('Helvetica').fontSize(9).text(label + ':', 55, y);
      doc.fillColor('#111').font('Helvetica-Bold').fontSize(9).text(String(value), 180, y);
      y += 16;
    });

    // ── AI Decision Settings ─────────────────────────────────────────────────
    y += 10;
    doc.fillColor('#002D72').fontSize(14).font('Helvetica-Bold')
       .text('AI Decision Model Settings', 50, y);
    y += 18;
    doc.moveTo(50, y).lineTo(545, y).lineWidth(1).strokeColor('#D4E4F7').stroke();
    y += 12;

    const sliders = [
      ['Cost vs Delay Avoidance', profile?.cost_vs_delay ?? 85],
      ['Airline Loyalty Weight', profile?.loyalty_weight ?? 60],
      ['Layover Tolerance', profile?.layover_tolerance ?? 75],
      ['Hotel Comfort Level', profile?.hotel_comfort ?? 90],
    ];

    sliders.forEach(([label, val]) => {
      doc.fillColor('#555').font('Helvetica').fontSize(9).text(label + ':', 55, y);

      const barX = 230, barY = y + 2, barW = 200, barH = 7;
      doc.rect(barX, barY, barW, barH).fill('#E8F0FB');
      doc.rect(barX, barY, (barW * Math.min(100, Math.max(0, val))) / 100, barH).fill('#006FCF');

      doc.fillColor('#111').font('Helvetica-Bold').fontSize(9)
         .text(`${val}%`, barX + barW + 8, y);
      y += 18;
    });

    // ── Alert History ───────────────────────────────────────────────────────
    y += 15;
    if (y > 680) {
      doc.addPage();
      y = 50;
    }

    doc.fillColor('#002D72').fontSize(14).font('Helvetica-Bold')
       .text('Alert & Autonomous Resolution History', 50, y);
    y += 18;
    doc.moveTo(50, y).lineTo(545, y).lineWidth(1).strokeColor('#D4E4F7').stroke();
    y += 12;

    if (!events || events.length === 0) {
      doc.fillColor('#999').font('Helvetica').fontSize(9)
         .text('No simulation events recorded yet.', 55, y);
    } else {
      events.forEach((ev) => {
        if (y > 730) {
          doc.addPage();
          y = 50;
        }

        const levelColors = { info: '#006FCF', warn: '#F59E0B', err: '#C41E3A', success: '#00A650' };
        const evLevel = String(ev.level || 'info').toLowerCase();
        const color = levelColors[evLevel] || '#555';
        const msg = String(ev.message || 'System Notification');
        const evType = String(ev.event_type || 'SYSTEM');

        doc.rect(50, y, 4, 28).fill(color);

        doc.fillColor(color).font('Helvetica-Bold').fontSize(8)
           .text(evLevel.toUpperCase(), 62, y + 2);
        doc.fillColor('#111').font('Helvetica-Bold').fontSize(9)
           .text(evType, 62, y + 11);
        doc.fillColor('#555').font('Helvetica').fontSize(8)
           .text(msg.slice(0, 95) + (msg.length > 95 ? '...' : ''), 62, y + 20);

        if (ev.created_at) {
          doc.fillColor('#999').font('Helvetica').fontSize(7)
             .text(new Date(ev.created_at).toLocaleString(), 380, y + 2, { align: 'right', width: 160 });
        }

        y += 34;
      });
    }

    // ── Footer ──────────────────────────────────────────────────────────────
    const footerY = doc.page.height - 35;
    doc.moveTo(50, footerY - 8).lineTo(545, footerY - 8).lineWidth(0.5).strokeColor('#D4E4F7').stroke();
    doc.fillColor('#999').font('Helvetica').fontSize(7)
       .text(
         'ATLAS by American Express · Confidential · Autonomous Travel Intelligence Report',
         50, footerY,
         { align: 'center', width: 495 }
       );

    doc.end();
  } catch (err) {
    console.error('PDF export error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to generate PDF report' });
    }
  }
});

module.exports = router;
