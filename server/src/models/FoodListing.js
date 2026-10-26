import mongoose from 'mongoose';
import {
  FOOD_CATEGORIES,
  FOOD_UNITS,
  STORAGE_REQUIREMENTS,
  LISTING_STATUS,
  LISTING_STATUS_LIST,
  ALLERGENS,
  DIETARY_TAGS
} from '../constants/listingConstants.js';

const foodListingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Listing title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [140, 'Title cannot exceed 140 characters'],
      index: true
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    category: {
      type: String,
      enum: {
        values: FOOD_CATEGORIES,
        message: '{VALUE} is not a valid food category'
      },
      required: [true, 'Food category is required'],
      index: true
    },
    quantity: {
      type: Number,
      required: [true, 'Initial quantity is required'],
      min: [1, 'Quantity must be at least 1']
    },
    quantityRemaining: {
      type: Number,
      required: true,
      min: [0, 'Remaining quantity cannot be negative'],
      index: true
    },
    unit: {
      type: String,
      enum: {
        values: FOOD_UNITS,
        message: '{VALUE} is not a valid unit'
      },
      required: [true, 'Unit of measure is required']
    },
    preparationTime: {
      type: Date,
      default: Date.now
    },
    pickupWindow: {
      startTime: {
        type: Date,
        required: [true, 'Pickup window start time is required']
      },
      endTime: {
        type: Date,
        required: [true, 'Pickup window end time is required'],
        index: true
      }
    },
    storageRequirements: {
      type: String,
      enum: {
        values: STORAGE_REQUIREMENTS,
        message: '{VALUE} is not a valid storage requirement'
      },
      required: [true, 'Storage requirement is required'],
      index: true
    },
    allergens: [
      {
        type: String,
        enum: ALLERGENS
      }
    ],
    dietaryInfo: [
      {
        type: String,
        enum: DIETARY_TAGS
      }
    ],
    images: [
      {
        url: { type: String, required: true },
        publicId: { type: String, default: '' }
      }
    ],
    donorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Donor user reference is required'],
      index: true
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      default: null,
      index: true
    },
    donorName: {
      type: String,
      trim: true,
      default: ''
    },
    address: {
      street: { type: String, trim: true, default: '' },
      city: { type: String, trim: true, default: '' },
      state: { type: String, trim: true, default: '' },
      postalCode: { type: String, trim: true, default: '' },
      country: { type: String, trim: true, default: 'USA' }
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: [true, 'GeoJSON coordinates are required']
      }
    },
    status: {
      type: String,
      enum: {
        values: LISTING_STATUS_LIST,
        message: '{VALUE} is not a valid listing status'
      },
      default: LISTING_STATUS.AVAILABLE,
      index: true
    },
    requiresVolunteer: {
      type: Boolean,
      default: false
    },
    expiresAt: {
      type: Date,
      required: [true, 'Expiration timestamp is required'],
      index: true
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

// GeoJSON 2dsphere index for proximity discovery queries
foodListingSchema.index({ location: '2dsphere' });
foodListingSchema.index({ status: 1, expiresAt: 1 });
foodListingSchema.index({ donorId: 1, createdAt: -1 });

export const FoodListing = mongoose.model('FoodListing', foodListingSchema);
