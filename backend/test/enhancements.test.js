const { test, before, after } = require('node:test');
const assert = require('node:assert');
const { startTest, stopTest, api, login } = require('./helpers');

let ctx, warden, admin, student;

before(async () => {
  ctx = await startTest();
  warden = await login(ctx, 'warden@demo.com');
  admin = await login(ctx, 'admin@demo.com');
  student = await login(ctx, 'dev@demo.com');
});

after(async () => stopTest(ctx));

test('wardens post announcements; students see them pinned-first', async () => {
  const r = await api(ctx, 'POST', '/announcements', { token: warden.token, body: { title: 'Water supply maintenance', body: 'No water 10am-1pm Saturday in Blocks A-C.', pinned: true } });
  assert.equal(r.status, 201);
  const denied = await api(ctx, 'POST', '/announcements', { token: student.token, body: { title: 'Fake', body: 'nope' } });
  assert.equal(denied.status, 403);
  const list = await api(ctx, 'GET', '/announcements', { token: student.token });
  assert.equal(list.body[0].title, 'Water supply maintenance');
  assert.ok(list.body[0].pinned);
});

test('ticket CSV export works for wardens, blocked for students', async () => {
  const res = await fetch(`${ctx.base}/admin/tickets.csv`, { headers: { Authorization: `Bearer ${warden.token}` } });
  assert.equal(res.status, 200);
  const csv = await res.text();
  assert.ok(csv.includes('HH-'));
  assert.ok(csv.includes('Ceiling fan sparking slightly'));
  const denied = await api(ctx, 'GET', '/admin/tickets.csv', { token: student.token });
  assert.equal(denied.status, 403);
});

test('satisfaction analytics aggregate by category', async () => {
  const r = await api(ctx, 'GET', '/admin/satisfaction', { token: admin.token });
  assert.equal(r.status, 200);
  assert.ok(r.body.ratedCount >= 1, `seed has at least 1 rated ticket, got ${r.body.ratedCount}`);
  assert.ok(r.body.avgSatisfaction >= 1);
});
