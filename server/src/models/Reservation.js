import mongoose from 'mongoose';
import { RESERVATION_STATUS, RESERVATION_STATUS_LIST } from '../constants/listingConstants.js';

const reservationSchema = new mongoose.Schema(
  {
    listingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FoodListing',
      required: [true, 'Food listing reference is required'],
      index: true
    },
    listingTitle: {
      type: String,
      default: ''
    },
    donorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Donor user reference is required'],
      index: true
    },
    donorName: {
      type: String,
      default: ''
    },
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Recipient user reference is required'],
      index: true
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'Recipient organization reference is required'],
      index: true
    },
    organizationName: {
      type: String,
      default: ''
    },
    quantityReserved: {
      type: Number,
      required: [true, 'Quantity to reserve is required'],
      min: [1, 'Reserved quantity must be at least 1']
    },
    unit: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: {
        values: RESERVATION_STATUS_LIST,
        message: '{VALUE} is not a valid reservation status'
      },
      default: RESERVATION_STATUS.PENDING_APPROVAL,
      index: true
    },
    pickupDeadline: {
      type: Date,
      required: true
    },
    pickupCode: {
      type: String,
      required: true
    },
    deliveryCode: {
      type: String,
      required: true
    },
    donorNotes: {
      type: String,
      default: ''
    },
    recipientNotes: {
      type: String,
      default: ''
    },
    idempotencyKey: {
      type: String,
      sparse: true,
      index: true
    },
    inventoryReleased: {
      type: Boolean,
      default: false,
      index: true
    },
    approvedAt: {
      type: Date,
      default: null
    },
    cancelledAt: {
      type: Date,
      default: null
    },
    isDemo: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Compound index for querying user claims
reservationSchema.index({ recipientId: 1, status: 1 });
reservationSchema.index({ donorId: 1, status: 1 });
reservationSchema.index({ listingId: 1, status: 1 });

export const Reservation = mongoose.model('Reservation', reservationSchema);
