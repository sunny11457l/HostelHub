const cron = require('node-cron');
const Ticket = require('../models/Ticket.model');
const Notification = require('../models/Notification.model');
const User = require('../models/User.model');

// SLA policy: resolution targets by priority.
const SLA_HOURS = { high: 8, medium: 24, low: 72 };
const APPROACHING_WINDOW_HOURS = 2;

// The scan itself is exported so tests and the manual demo endpoint can run
// it on demand; node-cron simply calls the same function every 5 minutes.
async function runSLAScan(now = new Date()) {
  const active = { $in: ['assigned', 'in-progress', 'reopened'] };
  let escalated = 0;
  let approaching = 0;

  // 1. Breached: past the deadline → escalate + notify every warden
  const breached = await Ticket.find({ status: active, slaDeadline: { $lt: now } });
  for (const t of breached) {
    t.status = 'escalated';
    t.timeline.push({ actor: t.student, actorName: 'SLA engine', action: 'escalated — SLA deadline breached', at: now });
    await t.save();
    escalated += 1;
    const wardens = await User.find({ role: 'warden' }).select('_id');
    await Notification.insertMany(
      wardens.map((w) => ({
        user: w._id,
        ticket: t._id,
        type: 'sla-breached',
        message: `${t.code} (${t.category}) breached its SLA — room ${t.room}, "${t.title}"`,
      }))
    );
  }

  // 2. Approaching: deadline within 2h and not yet notified
  const horizon = new Date(now.getTime() + APPROACHING_WINDOW_HOURS * 60 * 60 * 1000);
  const near = await Ticket.find({
    status: active,
    slaNotified: false,
    slaDeadline: { $gte: now, $lte: horizon },
  });
  for (const t of near) {
    t.slaNotified = true;
    await t.save();
    approaching += 1;
    const mins = Math.round((t.slaDeadline - now) / 60000);
    await Notification.create({
      user: t.student,
      ticket: t._id,
      type: 'sla-approaching',
      message: `${t.code} is due in ~${mins} min — the warden has been reminded.`,
    });
  }

  return { escalated, approaching };
}

function startScheduler() {
  // every 5 minutes
  return cron.schedule('*/5 * * * *', () => {
    runSLAScan().catch((err) => console.error('SLA scan failed:', err.message));
  });
}

module.exports = { runSLAScan, startScheduler, SLA_HOURS, APPROACHING_WINDOW_HOURS };
