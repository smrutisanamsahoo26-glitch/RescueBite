import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: [true, 'Action identifier is required'],
      index: true
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Actor user ID is required'],
      index: true
    },
    performedByRole: {
      type: String,
      default: ''
    },
    entityType: {
      type: String,
      required: [true, 'Entity type is required'],
      index: true
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      index: true,
      default: null
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    ipAddress: {
      type: String,
      default: '127.0.0.1'
    },
    userAgent: {
      type: String,
      default: ''
    },
    createdAt: {
      type: Date,
      default: Date.now,
      immutable: true,
      index: -1
    }
  },
  {
    timestamps: false,
    versionKey: false
  }
);

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
