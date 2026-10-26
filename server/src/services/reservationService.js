import crypto from 'crypto';
import { FoodListing } from '../models/FoodListing.js';
import { Reservation } from '../models/Reservation.js';
import { Organization } from '../models/Organization.js';
import { AppError } from '../utils/appError.js';
import {
  LISTING_STATUS,
  RESERVATION_STATUS
} from '../constants/listingConstants.js';
import { VERIFICATION_STATUS } from '../constants/orgStatus.js';
import { ROLES } from '../constants/roles.js';
import { spawnPickupTask } from './taskService.js';

// Helper to generate secure 6-character verification code e.g. "RB-7492"
export const generateVerificationCode = () => {
  const digits = crypto.randomInt(1000, 9999);
  return `RB-${digits}`;
};

/**
 * Atomic Reservation Creation with Idempotency & Concurrency Safety
 */
export const createReservationAtomic = async ({
  listingId,
  recipientUser,
  quantityReserved,
  recipientNotes = '',
  idempotencyKey = null
}) => {
  const qty = Number(quantityReserved);
  if (!qty || qty <= 0) {
    throw new AppError('Reservation quantity must be at least 1', 400);
  }

  // 1. Idempotency Check: Safe retry protection
  if (idempotencyKey) {
    const existing = await Reservation.findOne({
      recipientId: recipientUser._id,
      idempotencyKey
    });
    if (existing) {
      return { reservation: existing, isDuplicate: true };
    }
  }

  // 2. Organization Verification Check
  let org = null;
  if (recipientUser.organizationId) {
    org = await Organization.findById(recipientUser.organizationId);
  }
  if (!org) {
    org = await Organization.findOne({ ownerId: recipientUser._id });
  }

  if (!org) {
    throw new AppError('You must register an organization profile before claiming surplus food.', 400);
  }

  if (org.verificationStatus !== VERIFICATION_STATUS.APPROVED) {
    throw new AppError(
      `Your organization '${org.name}' is currently '${org.verificationStatus}'. Only verified organizations may reserve food.`,
      403
    );
  }

  // 3. Atomic Conditional Inventory Decrement
  // This MongoDB atomic conditional operation guarantees no overbooking even with concurrent requests!
  const now = new Date();
  const updatedListing = await FoodListing.findOneAndUpdate(
    {
      _id: listingId,
      quantityRemaining: { $gte: qty },
      status: { $in: [LISTING_STATUS.AVAILABLE, LISTING_STATUS.PARTIALLY_RESERVED] },
      expiresAt: { $gt: now }
    },
    {
      $inc: { quantityRemaining: -qty }
    },
    { returnDocument: 'after' }
  );

  if (!updatedListing) {
    // Check why it failed to provide clear message
    const checkListing = await FoodListing.findById(listingId);
    if (!checkListing) {
      throw new AppError('Food listing not found.', 404);
    }
    if (checkListing.expiresAt <= now || checkListing.status === LISTING_STATUS.EXPIRED) {
      throw new AppError('This food listing has already expired and is no longer available.', 400);
    }
    if (checkListing.quantityRemaining < qty) {
      throw new AppError(
        `Insufficient surplus inventory. Only ${checkListing.quantityRemaining} ${checkListing.unit} remain available.`,
        409
      );
    }
    throw new AppError('Listing is currently unavailable or fully reserved.', 409);
  }

  // 4. Update listing status based on remaining count
  const newListingStatus =
    updatedListing.quantityRemaining === 0
      ? LISTING_STATUS.FULLY_RESERVED
      : LISTING_STATUS.PARTIALLY_RESERVED;

  if (updatedListing.status !== newListingStatus) {
    await FoodListing.findByIdAndUpdate(listingId, { status: newListingStatus });
  }

  // 5. Generate secure handoff codes
  const pickupCode = generateVerificationCode();
  const deliveryCode = generateVerificationCode();

  // 6. Create Reservation Record
  const reservation = await Reservation.create({
    listingId: updatedListing._id,
    listingTitle: updatedListing.title,
    donorId: updatedListing.donorId,
    donorName: updatedListing.donorName,
    recipientId: recipientUser._id,
    organizationId: org._id,
    organizationName: org.name,
    quantityReserved: qty,
    unit: updatedListing.unit,
    status: RESERVATION_STATUS.PENDING_APPROVAL,
    pickupDeadline: updatedListing.pickupWindow.endTime,
    pickupCode,
    deliveryCode,
    recipientNotes: recipientNotes || '',
    idempotencyKey: idempotencyKey || null,
    inventoryReleased: false
  });

  return { reservation, isDuplicate: false };
};

/**
 * Donor Approves Reservation
 */
export const approveReservationDecision = async (reservationId, donorUser, notes = '') => {
  const reservation = await Reservation.findById(reservationId);
  if (!reservation) {
    throw new AppError('Reservation not found', 404);
  }

  // Ownership check: must be the donor of the listing
  if (!reservation.donorId.equals(donorUser._id) && donorUser.role !== ROLES.ADMIN) {
    throw new AppError('Forbidden: Only the donor of this food listing may approve this reservation.', 403);
  }

  if (reservation.status !== RESERVATION_STATUS.PENDING_APPROVAL) {
    throw new AppError(`Cannot approve reservation with current status '${reservation.status}'.`, 400);
  }

  reservation.status = RESERVATION_STATUS.APPROVED;
  reservation.approvedAt = new Date();
  if (notes) reservation.donorNotes = notes;
  await reservation.save();

  try {
    const listing = await FoodListing.findById(reservation.listingId);
    if (listing) {
      await spawnPickupTask({ reservation, listing });
    }
  } catch (err) {
    console.warn('[PickupTask Spawning]', err.message);
  }

  return reservation;
};

/**
 * Donor Rejects Reservation (Atomically releases inventory exactly once)
 */
export const rejectReservationDecision = async (reservationId, donorUser, reason = '') => {
  const reservation = await Reservation.findById(reservationId);
  if (!reservation) {
    throw new AppError('Reservation not found', 404);
  }

  if (!reservation.donorId.equals(donorUser._id) && donorUser.role !== ROLES.ADMIN) {
    throw new AppError('Forbidden: Only the donor may reject this reservation.', 403);
  }

  if (reservation.status !== RESERVATION_STATUS.PENDING_APPROVAL) {
    throw new AppError(`Cannot reject reservation with status '${reservation.status}'.`, 400);
  }

  // Atomic release gate: Ensure inventory is released exactly once
  const updatedRes = await Reservation.findOneAndUpdate(
    {
      _id: reservationId,
      status: RESERVATION_STATUS.PENDING_APPROVAL,
      inventoryReleased: false
    },
    {
      $set: {
        status: RESERVATION_STATUS.REJECTED,
        inventoryReleased: true,
        donorNotes: reason || 'Declined by donor'
      }
    },
    { returnDocument: 'after' }
  );

  if (updatedRes) {
    // Restore inventory to listing
    await FoodListing.findByIdAndUpdate(updatedRes.listingId, {
      $inc: { quantityRemaining: updatedRes.quantityReserved },
      $set: { status: LISTING_STATUS.PARTIALLY_RESERVED }
    });
  }

  return updatedRes;
};

/**
 * Cancel Reservation (Recipient or Donor, releases inventory exactly once)
 */
export const cancelReservationDecision = async (reservationId, user, reason = '') => {
  const reservation = await Reservation.findById(reservationId);
  if (!reservation) {
    throw new AppError('Reservation not found', 404);
  }

  const isRecipientOwner = reservation.recipientId.equals(user._id);
  const isDonorOwner = reservation.donorId.equals(user._id);
  const isAdmin = user.role === ROLES.ADMIN;

  if (!isRecipientOwner && !isDonorOwner && !isAdmin) {
    throw new AppError('Forbidden: You do not have permission to cancel this reservation.', 403);
  }

  if (![RESERVATION_STATUS.PENDING_APPROVAL, RESERVATION_STATUS.APPROVED].includes(reservation.status)) {
    throw new AppError(`Cannot cancel reservation with status '${reservation.status}'.`, 400);
  }

  // Exactly-once atomic inventory release gate
  const updatedRes = await Reservation.findOneAndUpdate(
    {
      _id: reservationId,
      status: { $in: [RESERVATION_STATUS.PENDING_APPROVAL, RESERVATION_STATUS.APPROVED] },
      inventoryReleased: false
    },
    {
      $set: {
        status: RESERVATION_STATUS.CANCELLED,
        inventoryReleased: true,
        cancelledAt: new Date(),
        ...(reason ? { donorNotes: reason } : {})
      }
    },
    { returnDocument: 'after' }
  );

  if (updatedRes) {
    // Restore quantity to listing
    const listing = await FoodListing.findById(updatedRes.listingId);
    if (listing && listing.status !== LISTING_STATUS.EXPIRED) {
      const restoredQty = listing.quantityRemaining + updatedRes.quantityReserved;
      const newStatus = restoredQty >= listing.quantity ? LISTING_STATUS.AVAILABLE : LISTING_STATUS.PARTIALLY_RESERVED;
      await FoodListing.findByIdAndUpdate(updatedRes.listingId, {
        quantityRemaining: restoredQty,
        status: newStatus
      });
    }
  }

  return updatedRes;
};

/**
 * Background Expiry Sweeper
 * Marks past-deadline listings as expired and safely resolves unapproved pending claims
 */
export const sweepExpiredListingsAndReservations = async () => {
  const now = new Date();

  // 1. Expire listings past deadline
  const expiredListingsResult = await FoodListing.updateMany(
    {
      expiresAt: { $lte: now },
      status: { $in: [LISTING_STATUS.AVAILABLE, LISTING_STATUS.PARTIALLY_RESERVED, LISTING_STATUS.FULLY_RESERVED] }
    },
    {
      $set: { status: LISTING_STATUS.EXPIRED }
    }
  );

  // 2. Expire unapproved pending reservations past deadline
  const expiredReservationsResult = await Reservation.updateMany(
    {
      pickupDeadline: { $lte: now },
      status: RESERVATION_STATUS.PENDING_APPROVAL,
      inventoryReleased: false
    },
    {
      $set: {
        status: RESERVATION_STATUS.EXPIRED,
        inventoryReleased: true,
        cancelledAt: now
      }
    }
  );

  return {
    expiredListingsCount: expiredListingsResult.modifiedCount,
    expiredReservationsCount: expiredReservationsResult.modifiedCount
  };
};
