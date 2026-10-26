import mongoose from 'mongoose';
import { ORG_TYPES, VERIFICATION_STATUS, VERIFICATION_STATUS_LIST } from '../constants/orgStatus.js';

const verificationDocumentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  url: {
    type: String,
    required: true,
    trim: true
  },
  documentType: {
    type: String,
    enum: ['tax_exempt_letter', 'incorporation_cert', 'health_permit', 'food_facility_license', 'other'],
    default: 'tax_exempt_letter'
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
});

const organizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Organization name is required'],
      trim: true,
      index: true
    },
    type: {
      type: String,
      enum: {
        values: ORG_TYPES,
        message: '{VALUE} is not a valid organization type'
      },
      required: [true, 'Organization type is required']
    },
    registrationNumber: {
      type: String,
      required: [true, 'Official non-profit or commercial registration number is required'],
      trim: true
    },
    taxId: {
      type: String,
      trim: true,
      default: ''
    },
    contactEmail: {
      type: String,
      required: [true, 'Contact email is required'],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid contact email']
    },
    contactPhone: {
      type: String,
      required: [true, 'Contact phone number is required'],
      trim: true
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
        default: [-73.9851, 40.7484]
      }
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    verificationStatus: {
      type: String,
      enum: {
        values: VERIFICATION_STATUS_LIST,
        message: '{VALUE} is not a valid verification status'
      },
      default: VERIFICATION_STATUS.UNVERIFIED,
      index: true
    },
    verificationDocuments: [verificationDocumentSchema],
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    reviewNotes: {
      type: String,
      trim: true,
      default: ''
    },
    reviewedAt: {
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

organizationSchema.index({ location: '2dsphere' });
organizationSchema.index({ ownerId: 1, verificationStatus: 1 });

export const Organization = mongoose.model('Organization', organizationSchema);
