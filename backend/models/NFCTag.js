const mongoose = require('mongoose');

/**
 * NFC Tag Schema
 * Represents a physical NFC tag with unique identifier
 */
const nfcTagSchema = new mongoose.Schema(
  {
    tagId: {
      type: String,
      required: [true, 'Please add a tag ID'],
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Please add a tag name'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    destinationUrl: {
      type: String,
      required: [true, 'Please add a destination URL'],
      trim: true,
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
    location: {
      type: String,
      trim: true,
    },
    scanCount: {
      type: Number,
      default: 0,
    },
    lastScannedAt: {
      type: Date,
    },
    assignedTo: {
      name: {
        type: String,
        trim: true,
      },
      email: {
        type: String,
        trim: true,
      },
      phone: {
        type: String,
        trim: true,
      },
    },
    bulkReadGroup: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries (isActive only, tagId already indexed by unique)
nfcTagSchema.index({ isActive: 1 });

module.exports = mongoose.model('NFCTag', nfcTagSchema);
