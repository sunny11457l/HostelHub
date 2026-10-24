const { test, before, after } = require('node:test');
const assert = require('node:assert');
const { startTest, stopTest, api, login } = require('./helpers');
const { runSLAScan } = require('../jobs/scheduler');

let ctx, dev, ananya, rohit, warden, admin;

before(async () => {
  ctx = await startTest();
  dev = await login(ctx, 'dev@demo.com');
  ananya = await login(ctx, 'ananya@demo.com');
  rohit = await login(ctx, 'rohit@demo.com');
  warden = await login(ctx, 'warden@demo.com');
  admin = await login(ctx, 'admin@demo.com');
});

after(async () => stopTest(ctx));

// ---- health & auth ------------------------------------------------------
test('health endpoint responds ok', async () => {
  const r = await api(ctx, 'GET', '/health');
  assert.equal(r.status, 200);
});

test('register defaults to the student role', async () => {
  const r = await api(ctx, 'POST', '/auth/register', { body: { name: 'New Kid', email: 'kid@example.com', password: 'Kid@12345', room: 'D-001' } });
  assert.equal(r.status, 201);
  assert.equal(r.body.role, 'student');
});

test('login rejects wrong password with 401', async () => {
  const r = await api(ctx, 'POST', '/auth/login', { body: { email: 'dev@demo.com', password: 'nope@1234' } });
  assert.equal(r.status, 401);
});

test('tickets require auth (401)', async () => {
  const r = await api(ctx, 'GET', '/tickets');
  assert.equal(r.status, 401);
});

// ---- ticket creation ----------------------------------------------------
test('student raises a ticket; priority auto-set by category', async () => {
  const r = await api(ctx, 'POST', '/tickets', { token: rohit.token, body: { category: 'plumbing', room: 'C-312', title: 'Sink blocked completely', description: 'Water not draining.' } });
  assert.equal(r.status, 201);
  assert.equal(r.body.priority, 'high');
  assert.ok(r.body.code.startsWith('HH-'));
  ctx.raised = r.body;
});

test('ticket without a room is rejected (400)', async () => {
  const r = await api(ctx, 'POST', '/tickets', { token: rohit.token, body: { category: 'other', title: 'No room given' } });
  assert.equal(r.status, 400);
});

test('wardens cannot raise tickets (403)', async () => {
  const r = await api(ctx, 'POST', '/tickets', { token: warden.token, body: { category: 'other', room: 'X', title: 'Warden tries' } });
  assert.equal(r.status, 403);
});

test('students see only their own tickets; wardens see all', async () => {
  const mine = await api(ctx, 'GET', '/tickets', { token: dev.token });
  assert.ok(mine.body.every((t) => t.student.name === 'Dev Patel'));
  const all = await api(ctx, 'GET', '/tickets', { token: warden.token });
  assert.ok(all.body.length > mine.body.length);
});

test('student cannot open another student\'s ticket (403)', async () => {
  const all = await api(ctx, 'GET', '/tickets', { token: warden.token });
  const ananyas = all.body.find((t) => t.student.name === 'Ananya Das');
  const r = await api(ctx, 'GET', `/tickets/${ananyas._id}`, { token: dev.token });
  assert.equal(r.status, 403);
});

// ---- triage & SLA -------------------------------------------------------
test('assignment starts the SLA clock by priority', async () => {
  const r = await api(ctx, 'PATCH', `/tickets/${ctx.raised._id}/assign`, { token: warden.token, body: { assignedTo: 'Ramesh (Plumber)' } });
  assert.equal(r.status, 200);
  assert.equal(r.body.status, 'assigned');
  const hours = (new Date(r.body.slaDeadline) - Date.now()) / 3600000;
  assert.ok(hours > 7 && hours <= 8, `high priority SLA should be ~8h, got ${hours}`);
});

test('students cannot assign tickets (403)', async () => {
  const r = await api(ctx, 'PATCH', `/tickets/${ctx.raised._id}/assign`, { token: rohit.token, body: { assignedTo: 'Someone' } });
  assert.equal(r.status, 403);
});

test('SLA scan escalates breached tickets and notifies wardens', async () => {
  // Fabricate a fresh breach: take an active ticket and put its deadline in the past.
  const Ticket = require('../models/Ticket.model');
  const all = await api(ctx, 'GET', '/tickets', { token: warden.token });
  const victim = all.body.find((t) => ['assigned', 'in-progress'].includes(t.status));
  await Ticket.findByIdAndUpdate(victim._id, { slaDeadline: new Date(Date.now() - 2 * 3600 * 1000) });

  const before = await api(ctx, 'GET', '/tickets?status=escalated', { token: warden.token });
  const result = await runSLAScan();
  assert.ok(result.escalated >= 1, 'the fabricated breach must escalate');
  const after = await api(ctx, 'GET', '/tickets?status=escalated', { token: warden.token });
  assert.equal(after.body.length, before.body.length + result.escalated);
  const notes = await api(ctx, 'GET', '/notifications', { token: warden.token });
  assert.ok(notes.body.some((nn) => nn.type === 'sla-breached' && nn.message.includes(victim.code)));
});

test('SLA scan notifies students with deadlines inside the 2h window', async () => {
  // rohit's in-progress ticket is due in ~4h (outside window) — ananya's fan at ~5h —
  // but rohit's reopened ticket below will be due in 8h; the escalated ones skip.
  // Force one inside the window:
  const all = await api(ctx, 'GET', '/tickets', { token: warden.token });
  const t = all.body.find((x) => x.status === 'in-progress' && !x.slaNotified);
  const Ticket = require('../models/Ticket.model');
  const doc = await Ticket.findById(t._id);
  doc.slaDeadline = new Date(Date.now() + 60 * 60 * 1000); // 1h from now
  await doc.save();
  const result = await runSLAScan();
  assert.ok(result.approaching >= 1);
  const notes = await api(ctx, 'GET', '/notifications', { token: rohit.token });
  assert.ok(notes.body.some((nn) => nn.type === 'sla-approaching' && nn.message.includes(t.code)));
});

// ---- lifecycle ----------------------------------------------------------
test('resolving requires a note; work status is warden-only', async () => {
  const noNote = await api(ctx, 'PATCH', `/tickets/${ctx.raised._id}/status`, { token: warden.token, body: { status: 'resolved', note: '' } });
  assert.equal(noNote.status, 400);
  const studentTry = await api(ctx, 'PATCH', `/tickets/${ctx.raised._id}/status`, { token: rohit.token, body: { status: 'in-progress' } });
  assert.equal(studentTry.status, 403);
  const start = await api(ctx, 'PATCH', `/tickets/${ctx.raised._id}/status`, { token: warden.token, body: { status: 'in-progress' } });
  assert.equal(start.status, 200);
  const resolve = await api(ctx, 'PATCH', `/tickets/${ctx.raised._id}/status`, { token: warden.token, body: { status: 'resolved', note: 'Drain cleared with pressure jet.' } });
  assert.equal(resolve.status, 200);
  ctx.resolvedTicket = resolve.body;
});

test('comments append to the timeline', async () => {
  const r = await api(ctx, 'POST', `/tickets/${ctx.resolvedTicket._id}/comments`, { token: rohit.token, body: { note: 'Thanks, draining fine now.' } });
  assert.equal(r.status, 200);
  assert.ok(r.body.timeline.some((e) => e.note === 'Thanks, draining fine now.'));
});

test('reopen inside the 72h window works and restarts a short SLA', async () => {
  const reopenable = ctx.data.reopenable;
  const r = await api(ctx, 'POST', `/tickets/${reopenable._id}/reopen`, { token: rohit.token, body: { reason: 'Geyser still cold after the fix.' } });
  assert.equal(r.status, 200);
  assert.equal(r.body.status, 'reopened');
  const hours = (new Date(r.body.slaDeadline) - Date.now()) / 3600000;
  assert.ok(hours > 7 && hours <= 8);
});

test('reopen after the 72h window is rejected (409)', async () => {
  const all = await api(ctx, 'GET', '/tickets', { token: warden.token });
  const old = all.body.find((t) => t.status === 'resolved' && t.title.includes('Window latch'));
  const r = await api(ctx, 'POST', `/tickets/${old._id}/reopen`, { token: dev.token, body: { reason: 'It broke again.' } });
  assert.equal(r.status, 409);
  assert.ok(r.body.error.message.includes('72-hour'));
});

test('feedback after resolution works once', async () => {
  const r = await api(ctx, 'POST', `/tickets/${ctx.resolvedTicket._id}/feedback`, { token: rohit.token, body: { satisfaction: 4 } });
  assert.equal(r.status, 200);
  const again = await api(ctx, 'POST', `/tickets/${ctx.resolvedTicket._id}/feedback`, { token: rohit.token, body: { satisfaction: 5 } });
  assert.equal(again.status, 409);
});

test('admin stats aggregate statuses and average resolution', async () => {
  const r = await api(ctx, 'GET', '/admin/stats', { token: admin.token });
  assert.equal(r.status, 200);
  assert.ok(r.body.total >= 9);
  assert.ok(r.body.breached >= 1);
  const asWarden = await api(ctx, 'GET', '/admin/stats', { token: warden.token });
  assert.equal(asWarden.status, 403);
});

test('unknown ticket returns structured 404', async () => {
  const r = await api(ctx, 'GET', `/tickets/${'0'.repeat(24)}`, { token: warden.token });
  assert.equal(r.status, 404);
});
