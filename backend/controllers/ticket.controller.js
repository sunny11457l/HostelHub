const { z } = require('zod');
const Ticket = require('../models/Ticket.model');
const Notification = require('../models/Notification.model');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { SLA_HOURS } = require('../jobs/scheduler');
const { AUTO_PRIORITY, SLA_HOURS: MODEL_SLA } = require('../models/Ticket.model');

const createSchema = z.object({
  category: z.enum(Object.keys(AUTO_PRIORITY)),
  room: z.string().trim().min(1, 'Add your room number').max(20),
  title: z.string().trim().min(4, 'Summarise the problem in the title').max(120),
  description: z.string().trim().max(1000).optional(),
  priority: z.enum(['high', 'medium', 'low']).optional(),
});

const assignSchema = z.object({
  assignedTo: z.string().trim().min(2, 'Name the staff member/trade').max(80),
  priority: z.enum(['high', 'medium', 'low']).optional(),
});

const commentSchema = z.object({ note: z.string().trim().min(1, 'Write a comment').max(500) });
const resolveSchema = z.object({ note: z.string().trim().min(3, 'Describe what was done').max(500) });
const reopenSchema = z.object({ reason: z.string().trim().min(3, 'Say why it reopened').max(500) });
const feedbackSchema = z.object({ satisfaction: z.coerce.number().int().min(1).max(5) });

const REOPEN_WINDOW_MS = 72 * 60 * 60 * 1000;

async function addEvent(ticket, actor, action, note) {
  ticket.timeline.push({ actor: actor.id, actorName: actor.name, action, note });
}

exports.create = asyncHandler(async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) throw new AppError(400, parsed.error.issues[0].message, parsed.error.issues);
  if (req.user.role !== 'student') throw new AppError(403, 'Only students raise tickets');

  const count = await Ticket.countDocuments();
  const ticket = await Ticket.create({
    ...parsed.data,
    priority: parsed.data.priority || AUTO_PRIORITY[parsed.data.category],
    student: req.user.id,
    code: `HH-${1000 + count + 1}`,
    timeline: [{ actor: req.user.id, actorName: req.user.name, action: 'ticket created' }],
  });
  res.status(201).json(ticket);
});

exports.list = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.user.role === 'student') filter.student = req.user.id;
  const { status, category } = req.query;
  if (status) filter.status = status;
  if (category) filter.category = category;
  const tickets = await Ticket.find(filter).populate('student', 'name room').sort('-createdAt').limit(200);
  res.json(tickets);
});

exports.getOne = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findById(req.params.id).populate('student', 'name room email');
  if (!ticket) throw new AppError(404, 'Ticket not found');
  if (req.user.role === 'student' && String(ticket.student._id) !== String(req.user.id)) {
    throw new AppError(403, 'This ticket belongs to another student');
  }
  res.json(ticket);
});

exports.assign = asyncHandler(async (req, res) => {
  if (!['warden', 'admin'].includes(req.user.role)) throw new AppError(403, 'Only wardens can triage tickets');
  const parsed = assignSchema.safeParse(req.body);
  if (!parsed.success) throw new AppError(400, parsed.error.issues[0].message, parsed.error.issues);
  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) throw new AppError(404, 'Ticket not found');
  if (!['open', 'assigned', 'escalated'].includes(ticket.status)) {
    throw new AppError(409, `Cannot assign a ticket that is ${ticket.status}`);
  }

  ticket.assignedTo = parsed.data.assignedTo;
  if (parsed.data.priority) ticket.priority = parsed.data.priority;
  ticket.assignedAt = new Date();
  ticket.status = 'assigned';
  ticket.slaNotified = false;
  // Assignment starts the SLA clock
  ticket.slaDeadline = new Date(Date.now() + SLA_HOURS[ticket.priority] * 60 * 60 * 1000);
  await addEvent(ticket, req.user, `assigned to ${ticket.assignedTo}`, `SLA: ${SLA_HOURS[ticket.priority]}h (${ticket.priority} priority)`);
  await Notification.create({
    user: ticket.student, ticket: ticket._id, type: 'assigned',
    message: `${ticket.code} assigned to ${ticket.assignedTo} — due in ${SLA_HOURS[ticket.priority]}h`,
  });
  await ticket.save();
  res.json(ticket);
});

exports.setStatus = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) throw new AppError(404, 'Ticket not found');
  const { status } = req.body;
  if (status === 'in-progress') {
    if (req.user.role === 'student') throw new AppError(403, 'Only wardens update work status');
    if (!ticket.assignedTo) throw new AppError(409, 'Assign the ticket before starting work');
    ticket.status = 'in-progress';
    await addEvent(ticket, req.user, 'work started');
  } else if (status === 'resolved') {
    if (req.user.role === 'student') throw new AppError(403, 'Only wardens resolve tickets');
    const parsed = resolveSchema.safeParse(req.body);
    if (!parsed.success) throw new AppError(400, parsed.error.issues[0].message, parsed.error.issues);
    ticket.status = 'resolved';
    ticket.resolvedAt = new Date();
    ticket.resolutionNote = parsed.data.note;
    await addEvent(ticket, req.user, 'resolved', parsed.data.note);
    await Notification.create({
      user: ticket.student, ticket: ticket._id, type: 'resolved',
      message: `${ticket.code} resolved — ${parsed.data.note}`,
    });
  } else {
    throw new AppError(400, 'Unsupported status change — use assign, in-progress or resolved');
  }
  await ticket.save();
  res.json(ticket);
});

exports.comment = asyncHandler(async (req, res) => {
  const parsed = commentSchema.safeParse(req.body);
  if (!parsed.success) throw new AppError(400, parsed.error.issues[0].message, parsed.error.issues);
  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) throw new AppError(404, 'Ticket not found');
  const isOwner = String(ticket.student) === String(req.user.id);
  if (!isOwner && req.user.role === 'student') throw new AppError(403, 'This ticket belongs to another student');
  await addEvent(ticket, req.user, 'comment', parsed.data.note);
  await ticket.save();
  res.json(ticket);
});

exports.reopen = asyncHandler(async (req, res) => {
  const parsed = reopenSchema.safeParse(req.body);
  if (!parsed.success) throw new AppError(400, parsed.error.issues[0].message, parsed.error.issues);
  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) throw new AppError(404, 'Ticket not found');
  if (String(ticket.student) !== String(req.user.id)) throw new AppError(403, 'Only the reporter can reopen');
  if (ticket.status !== 'resolved') throw new AppError(409, 'Only resolved tickets can be reopened');
  if (!ticket.resolvedAt || Date.now() - ticket.resolvedAt.getTime() > REOPEN_WINDOW_MS) {
    throw new AppError(409, 'The 72-hour reopen window has closed');
  }
  ticket.status = 'reopened';
  ticket.slaDeadline = new Date(Date.now() + SLA_HOURS.high * 60 * 60 * 1000); // restart short
  ticket.slaNotified = false;
  await addEvent(ticket, req.user, 'reopened', parsed.data.reason);
  await Notification.create({
    user: ticket.student, ticket: ticket._id, type: 'reopened',
    message: `${ticket.code} reopened — due again in ${SLA_HOURS.high}h`,
  });
  await ticket.save();
  res.json(ticket);
});

exports.feedback = asyncHandler(async (req, res) => {
  const parsed = feedbackSchema.safeParse(req.body);
  if (!parsed.success) throw new AppError(400, parsed.error.issues[0].message, parsed.error.issues);
  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) throw new AppError(404, 'Ticket not found');
  if (String(ticket.student) !== String(req.user.id)) throw new AppError(403, 'Only the reporter can rate this');
  if (ticket.status !== 'resolved') throw new AppError(409, 'Rate the ticket after it is resolved');
  if (ticket.satisfaction) throw new AppError(409, 'You already rated this ticket');
  ticket.satisfaction = parsed.data.satisfaction;
  await addEvent(ticket, req.user, `rated ${parsed.data.satisfaction}/5`);
  await ticket.save();
  res.json(ticket);
});

exports.adminStats = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') throw new AppError(403, 'Admin only');
  const tickets = await Ticket.find();
  const byStatus = {};
  const resolutionByCategory = {};
  for (const t of tickets) {
    byStatus[t.status] = (byStatus[t.status] || 0) + 1;
    if (t.resolvedAt && t.assignedAt) {
      const hours = (t.resolvedAt - t.assignedAt) / 3600000;
      (resolutionByCategory[t.category] ||= []).push(hours);
    }
  }
  const avgResolution = Object.fromEntries(
    Object.entries(resolutionByCategory).map(([cat, arr]) => [
      cat,
      Math.round((arr.reduce((s, h) => s + h, 0) / arr.length) * 10) / 10,
    ])
  );
  res.json({ total: tickets.length, byStatus, avgResolutionHours: avgResolution, breached: byStatus.escalated || 0 });
});
