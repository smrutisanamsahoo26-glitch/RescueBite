import mongoose from 'mongoose';

export const TASK_STATUS = {
  UNASSIGNED: 'unassigned',
  ASSIGNED: 'assigned',
  EN_ROUTE_PICKUP: 'en_route_pickup',
  PICKED_UP: 'picked_up',
  EN_ROUTE_DELIVERY: 'en_route_delivery',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled'
};

export const TASK_STATUS_LIST = Object.values(TASK_STATUS);

const tempLogSchema = new mongoose.Schema({
  stage: {
    type: String,
    enum: ['pickup', 'in_transit', 'delivery'],
    required: true
  },
  temperatureCelsius: {
    type: Number,
    required: true
  },
  recordedAt: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String,
    default: ''
  }
});

const pickupTaskSchema = new mongoose.Schema(
  {
    reservationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Reservation',
      required: true,
      unique: true,
      index: true
    },
    listingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FoodListing',
      required: true,
      index: true
    },
    listingTitle: {
      type: String,
      default: ''
    },
    donorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    donorName: {
      type: String,
      default: ''
    },
    pickupAddress: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    recipientName: {
      type: String,
      default: ''
    },
    deliveryAddress: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    volunteerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
    },
    volunteerName: {
      type: String,
      default: null
    },
    status: {
      type: String,
      enum: {
        values: TASK_STATUS_LIST,
        message: '{VALUE} is not a valid task status'
      },
      default: TASK_STATUS.UNASSIGNED,
      index: true
    },
    // Secure Code Hashes - select: false so hashes are not returned in normal queries
    pickupCodeHash: {
      type: String,
      required: true,
      select: false
    },
    deliveryCodeHash: {
      type: String,
      required: true,
      select: false
    },
    pickupCodeExpiresAt: {
      type: Date,
      required: true
    },
    deliveryCodeExpiresAt: {
      type: Date,
      required: true
    },
    pickupCodeUsed: {
      type: Boolean,
      default: false
    },
    deliveryCodeUsed: {
      type: Boolean,
      default: false
    },
    tempLogs: [tempLogSchema],
    distanceMiles: {
      type: Number,
      default: 1.5
    },
    quantityText: {
      type: String,
      default: ''
    },
    storageRequirements: {
      type: String,
      default: 'ambient'
    },
    // Verified measurement recorded upon successful delivery (for verified analytics vs estimates)
    actualRescuedKg: {
      type: Number,
      default: null
    },
    pickedUpAt: {
      type: Date,
      default: null
    },
    deliveredAt: {
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
        delete ret.pickupCodeHash;
        delete ret.deliveryCodeHash;
        delete ret.__v;
        return ret;
      }
    }
  }
);

pickupTaskSchema.index({ status: 1, createdAt: -1 });
pickupTaskSchema.index({ volunteerId: 1, status: 1 });

export const PickupTask = mongoose.model('PickupTask', pickupTaskSchema);
