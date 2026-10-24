const mongoose = require('mongoose');

const SLA_HOURS = { high: 8, medium: 24, low: 72 };
const AUTO_PRIORITY = { plumbing: 'high', electrical: 'high', carpentry: 'medium', cleanliness: 'medium', wifi: 'low', other: 'medium' };

const ticketSchema = new mongoose.Schema(
  {
    code: { type: String, unique: true }, // HH-1042 style, set on create
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    category: { type: String, enum: Object.keys(AUTO_PRIORITY), required: true },
    priority: { type: String, enum: Object.keys(SLA_HOURS), required: true },
    room: { type: String, required: true, trim: true, maxlength: 20 },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 1000 },
    photoPath: { type: String },
    status: { type: String, enum: ['open', 'assigned', 'in-progress', 'resolved', 'escalated', 'reopened'], default: 'open', index: true },
    assignedTo: { type: String, trim: true, maxlength: 80 }, // staff name + trade
    assignedAt: { type: Date },
    slaDeadline: { type: Date, index: true },
    slaNotified: { type: Boolean, default: false },
    resolvedAt: { type: Date },
    resolutionNote: { type: String, trim: true, maxlength: 500 },
    satisfaction: { type: Number, min: 1, max: 5 },
    timeline: [
      {
        actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        actorName: { type: String },
        action: { type: String, required: true },
        note: { type: String, maxlength: 500 },
        at: { type: Date, default: Date.now },
        _id: false,
      },
    ],
  },
  { timestamps: true }
);

ticketSchema.statics.SLA_HOURS = SLA_HOURS;
ticketSchema.statics.AUTO_PRIORITY = AUTO_PRIORITY;

module.exports = mongoose.model('Ticket', ticketSchema);
