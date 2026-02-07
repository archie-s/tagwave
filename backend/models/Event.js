const mongoose = require('mongoose');

/**
 * Event Schema
 * Represents an event/campaign that has multiple NFC tags
 */
const eventSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add an event name'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    eventDate: {
      type: Date,
      required: [true, 'Please add an event date'],
    },
    location: {
      type: String,
      trim: true,
    },
    eventType: {
      type: String,
      enum: ['conference', 'workshop', 'seminar', 'exhibition', 'festival', 'campaign', 'other'],
      default: 'other',
    },
    organizerName: {
      type: String,
      trim: true,
    },
    organizerEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    organizerPhone: {
      type: String,
      trim: true,
    },
    expectedAttendees: {
      type: Number,
      min: 0,
    },
    status: {
      type: String,
      enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
      default: 'upcoming',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    tagCount: {
      type: Number,
      default: 0,
    },
    totalScans: {
      type: Number,
      default: 0,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
eventSchema.index({ status: 1, isActive: 1 });
eventSchema.index({ eventDate: -1 });
eventSchema.index({ createdBy: 1 });

module.exports = mongoose.model('Event', eventSchema);
