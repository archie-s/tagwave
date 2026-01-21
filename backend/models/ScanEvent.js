const mongoose = require('mongoose');

/**
 * Scan Event Schema
 * Logs every scan of an NFC tag for analytics
 */
const scanEventSchema = new mongoose.Schema(
  {
    tag: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'NFCTag',
      required: true,
    },
    tagId: {
      type: String,
      required: true,
    },
    scannedAt: {
      type: Date,
      default: Date.now,
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
    location: {
      country: String,
      city: String,
      coordinates: {
        latitude: Number,
        longitude: Number,
      },
    },
    deviceType: {
      type: String,
      enum: ['mobile', 'tablet', 'desktop', 'unknown'],
      default: 'unknown',
    },
    browser: {
      type: String,
    },
    os: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for analytics queries
scanEventSchema.index({ tag: 1, scannedAt: -1 });
scanEventSchema.index({ tagId: 1 });
scanEventSchema.index({ scannedAt: -1 });

module.exports = mongoose.model('ScanEvent', scanEventSchema);
