const { z } = require('zod');
const Announcement = require('../models/Announcement.model');
const Ticket = require('../models/Ticket.model');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

// ── Announcements: wardens broadcast to all students.
const announceSchema = z.object({
  title: z.string().trim().min(3, 'Give the announcement a title').max(120),
  body: z.string().trim().min(3, 'Write the announcement').max(1000),
  pinned: z.boolean().default(false),
});

exports.announce = asyncHandler(async (req, res) => {
  if (!['warden', 'admin'].includes(req.user.role)) throw new AppError(403, 'Wardens only');
  const parsed = announceSchema.safeParse(req.body);
  if (!parsed.success) throw new AppError(400, parsed.error.issues[0].message, parsed.error.issues);
  const announcement = await Announcement.create({ ...parsed.data, by: req.user.id, byName: req.user.name });
  res.status(201).json(announcement);
});

exports.listAnnouncements = asyncHandler(async (_req, res) => {
  const announcements = await Announcement.find().sort('-pinned -createdAt').limit(20);
  res.json(announcements);
});

exports.removeAnnouncement = asyncHandler(async (req, res) => {
  if (!['warden', 'admin'].includes(req.user.role)) throw new AppError(403, 'Wardens only');
  const announcement = await Announcement.findById(req.params.id);
  if (!announcement) throw new AppError(404, 'Announcement not found');
  await announcement.deleteOne();
  res.json({ deleted: true });
});

// ── Ticket CSV export (warden/admin).
exports.ticketsCsv = asyncHandler(async (req, res) => {
  if (!['warden', 'admin'].includes(req.user.role)) throw new AppError(403, 'Wardens only');
  const tickets = await Ticket.find().populate('student', 'name room').sort('-createdAt');
  const rows = [['code', 'title', 'category', 'priority', 'status', 'student', 'room', 'assignedTo', 'created', 'resolved']];
  for (const t of tickets) {
    rows.push([t.code, t.title, t.category, t.priority, t.status, t.student?.name || '', t.room || '', t.assignedTo || '',
      new Date(t.createdAt).toISOString().slice(0, 10), t.resolvedAt ? new Date(t.resolvedAt).toISOString().slice(0, 10) : '']);
  }
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="hostelhub-tickets.csv"');
  res.send(csv);
});

// ── Satisfaction analytics: avg rating by category + resolution speed vs rating.
exports.satisfaction = asyncHandler(async (req, res) => {
  if (!['warden', 'admin'].includes(req.user.role)) throw new AppError(403, 'Wardens only');
  const rated = await Ticket.find({ satisfaction: { $ne: null } });
  const byCategory = {};
  for (const t of rated) {
    (byCategory[t.category] ||= []).push(t.satisfaction);
  }
  const satisfactionByCategory = Object.fromEntries(
    Object.entries(byCategory).map(([cat, arr]) => [cat, Math.round((arr.reduce((s, r) => s + r, 0) / arr.length) * 10) / 10])
  );
  const avg = rated.length ? Math.round((rated.reduce((s, t) => s + t.satisfaction, 0) / rated.length) * 10) / 10 : null;
  res.json({ ratedCount: rated.length, avgSatisfaction: avg, satisfactionByCategory });
});
