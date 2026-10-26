import mongoose from 'mongoose';

export const REPORT_REASONS = [
  'food_safety_hazard',
  'spoilage',
  'undeclared_allergen',
  'no_show',
  'fraud',
  'inappropriate_behavior',
  'other'
];

export const REPORT_STATUS = {
  OPEN: 'open',
  UNDER_REVIEW: 'under_review',
  RESOLVED: 'resolved',
  DISMISSED: 'dismissed'
};

const reportSchema = new mongoose.Schema(
  {
    reporterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reporter user ID is required'],
      index: true
    },
    reporterName: {
      type: String,
      default: ''
    },
    targetType: {
      type: String,
      enum: ['listing', 'user', 'organization', 'reservation'],
      required: true
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true
    },
    targetTitle: {
      type: String,
      default: ''
    },
    reason: {
      type: String,
      enum: {
        values: REPORT_REASONS,
        message: '{VALUE} is not a valid report reason'
      },
      required: true
    },
    description: {
      type: String,
      required: [true, 'Incident description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters']
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
      index: true
    },
    status: {
      type: String,
      enum: Object.values(REPORT_STATUS),
      default: REPORT_STATUS.OPEN,
      index: true
    },
    adminNotes: {
      type: String,
      trim: true,
      default: ''
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    resolvedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

reportSchema.index({ status: 1, severity: 1, createdAt: -1 });

export const Report = mongoose.model('Report', reportSchema);
