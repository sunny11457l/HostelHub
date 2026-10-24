const bcrypt = require('bcryptjs');
const User = require('../models/User.model');
const Ticket = require('../models/Ticket.model');
const Notification = require('../models/Notification.model');

const DEMO_PASSWORD = 'Demo@1234';

async function seed() {
  const hash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const [dev, ananya, rohit, warden, admin] = await User.create(
    { name: 'Dev Patel', email: 'dev@demo.com', passwordHash: hash, role: 'student', room: 'B-204' },
    { name: 'Ananya Das', email: 'ananya@demo.com', passwordHash: hash, role: 'student', room: 'A-110' },
    { name: 'Rohit Verma', email: 'rohit@demo.com', passwordHash: hash, role: 'student', room: 'C-312' },
    { name: 'Warden Sharma', email: 'warden@demo.com', passwordHash: hash, role: 'warden' },
    { name: 'Admin Office', email: 'admin@demo.com', passwordHash: hash, role: 'admin' }
  );

  const hoursAgo = (h) => new Date(Date.now() - h * 3600 * 1000);
  let n = 0;
  const code = () => `HH-${1000 + ++n}`;

  const mk = (student, category, priority, room, title, description, status, extra = {}, timeline = []) =>
    Ticket.create({
      code: code(), student: student._id, category, priority, room, title, description, status,
      timeline: [{ actor: student._id, actorName: student.name, action: 'ticket created' }, ...timeline],
      ...extra,
    });

  // 1. Open — auto priority high (plumbing)
  await mk(dev, 'plumbing', 'high', 'B-204', 'Bathroom tap leaking badly', 'The geyser tap has been dripping non-stop since last night; floor is always wet.');

  // 2. Assigned with live SLA clock
  await mk(ananya, 'electrical', 'high', 'A-110', 'Ceiling fan sparking slightly', 'Small spark when switching to speed 3.', 'assigned',
    { assignedTo: 'Ramesh (Electrician)', assignedAt: hoursAgo(3), slaDeadline: new Date(Date.now() + 5 * 3600 * 1000) },
    [{ actor: warden._id, actorName: 'Warden Sharma', action: 'assigned to Ramesh (Electrician)', note: 'SLA: 8h (high priority)' }]);

  // 3. In-progress
  await mk(rohit, 'carpentry', 'medium', 'C-312', 'Cupboard door off its hinge', 'The top hinge came off completely.', 'in-progress',
    { assignedTo: 'Suresh (Carpenter)', assignedAt: hoursAgo(20), slaDeadline: new Date(Date.now() + 4 * 3600 * 1000) },
    [{ actor: warden._id, actorName: 'Warden Sharma', action: 'assigned to Suresh (Carpenter)', note: 'SLA: 24h (medium priority)' }]);

  // 4. Escalated — SLA breached long ago
  await mk(dev, 'wifi', 'low', 'B-204', 'Hostel wifi drops every evening', 'Connection dies around 9pm daily for hours.', 'escalated',
    { assignedTo: 'ISP Support', assignedAt: hoursAgo(80), slaDeadline: hoursAgo(8) },
    [{ actor: warden._id, actorName: 'Warden Sharma', action: 'assigned to ISP Support', note: 'SLA: 72h (low priority)' },
     { actor: dev._id, actorName: 'SLA engine', action: 'escalated — SLA deadline breached' }]);

  // 5. Resolved awaiting feedback
  await mk(ananya, 'cleanliness', 'medium', 'A-110', 'Corridor bin overflowing for days', 'Smell spreading to rooms.', 'resolved',
    { assignedTo: 'Housekeeping', assignedAt: hoursAgo(30), resolvedAt: hoursAgo(4), resolutionNote: 'Bins cleared and deep-cleaned; schedule fixed.' },
    [{ actor: warden._id, actorName: 'Warden Sharma', action: 'assigned to Housekeeping' },
     { actor: warden._id, actorName: 'Warden Sharma', action: 'resolved', note: 'Bins cleared and deep-cleaned; schedule fixed.' }]);

  // 6. Resolved just now — reopen window open
  const reopenable = await mk(rohit, 'plumbing', 'high', 'C-312', 'Geyser not heating at all', 'Cold showers for two days.', 'resolved',
    { assignedTo: 'Ramesh (Plumber)', assignedAt: hoursAgo(10), resolvedAt: hoursAgo(1), resolutionNote: 'Heating element replaced.' },
    [{ actor: warden._id, actorName: 'Warden Sharma', action: 'assigned to Ramesh (Plumber)' }]);

  // 7. Resolved 4 days ago — reopen window closed
  await mk(dev, 'carpentry', 'medium', 'B-204', 'Window latch broken', 'Window will not lock.', 'resolved',
    { assignedTo: 'Suresh (Carpenter)', assignedAt: hoursAgo(120), resolvedAt: hoursAgo(96), resolutionNote: 'Latch replaced.' });

  // 8. Resolved + rated 5
  await mk(ananya, 'other', 'medium', 'A-110', 'Study-room lights flickering', 'Flicker distracts during night study.', 'resolved',
    { assignedTo: 'Ramesh (Electrician)', assignedAt: hoursAgo(50), resolvedAt: hoursAgo(26), satisfaction: 5, resolutionNote: 'Tube light replaced.' },
    [{ actor: ananya._id, actorName: 'Ananya Das', action: 'rated 5/5' }]);

  await Notification.create({ user: dev._id, type: 'sla-breached', message: 'Your wifi ticket breached its SLA and was escalated.' });
  await Notification.create({ user: ananya._id, type: 'resolved', message: 'Your cleanliness ticket was resolved.' });

  return { dev, ananya, rohit, warden, admin, reopenable };
}

module.exports = seed;
module.exports.DEMO_PASSWORD = DEMO_PASSWORD;
