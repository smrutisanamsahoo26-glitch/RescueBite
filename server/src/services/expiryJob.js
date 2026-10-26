import { FoodListing } from '../models/FoodListing.js';
import { Reservation } from '../models/Reservation.js';
import { PickupTask, TASK_STATUS } from '../models/PickupTask.js';
import { LISTING_STATUS, RESERVATION_STATUS } from '../constants/listingConstants.js';
import { notifyUser, broadcastLiveUpdate } from '../sockets/socketManager.js';

let expiryIntervalTimer = null;

/**
 * Idempotent Expiry Processing Engine
 * - Safely transitions expired listings
 * - Expires overdue unapproved reservations and releases inventory exactly once
 * - Cancels overdue unassigned delivery tasks
 * - Sends realtime notifications safely
 * - Safe for repeated/concurrent runs without duplicate state changes
 */
export const runExpiryJob = async () => {
  const now = new Date();

  // 1. Expire unapproved pending reservations past deadline & safely release inventory
  const pendingExpired = await Reservation.find({
    pickupDeadline: { $lte: now },
    status: RESERVATION_STATUS.PENDING_APPROVAL,
    inventoryReleased: false
  });

  let expiredReservationsCount = 0;
  for (const res of pendingExpired) {
    const updated = await Reservation.findOneAndUpdate(
      {
        _id: res._id,
        status: RESERVATION_STATUS.PENDING_APPROVAL,
        inventoryReleased: false
      },
      {
        $set: {
          status: RESERVATION_STATUS.EXPIRED,
          inventoryReleased: true,
          cancelledAt: now
        }
      },
      { returnDocument: 'after' }
    );

    if (updated) {
      expiredReservationsCount++;
      // Release quantity back to listing if listing itself is not expired
      const listing = await FoodListing.findById(updated.listingId);
      if (listing && listing.expiresAt > now && listing.status !== LISTING_STATUS.EXPIRED) {
        const restoredQty = listing.quantityRemaining + updated.quantityReserved;
        const newStatus = restoredQty >= listing.quantity ? LISTING_STATUS.AVAILABLE : LISTING_STATUS.PARTIALLY_RESERVED;
        await FoodListing.findByIdAndUpdate(listing._id, {
          quantityRemaining: restoredQty,
          status: newStatus
        });
      }

      // Realtime notification to recipient and donor
      notifyUser(updated.recipientId, 'reservation_expired', {
        reservationId: updated._id,
        listingTitle: updated.listingTitle
      });
      notifyUser(updated.donorId, 'reservation_expired', {
        reservationId: updated._id,
        listingTitle: updated.listingTitle
      });
    }
  }

  // 2. Expire listings past pickup window end time
  const expiredListingsResult = await FoodListing.updateMany(
    {
      expiresAt: { $lte: now },
      status: { $in: [LISTING_STATUS.AVAILABLE, LISTING_STATUS.PARTIALLY_RESERVED, LISTING_STATUS.FULLY_RESERVED] }
    },
    {
      $set: { status: LISTING_STATUS.EXPIRED }
    }
  );

  if (expiredListingsResult.modifiedCount > 0) {
    broadcastLiveUpdate('listings_expired_update', {
      count: expiredListingsResult.modifiedCount,
      timestamp: now.toISOString()
    });
  }

  // 3. Cancel unassigned pickup tasks past pickup deadline
  const expiredTasks = await PickupTask.find({
    status: TASK_STATUS.UNASSIGNED,
    pickupCodeExpiresAt: { $lte: now }
  });

  let expiredTasksCount = 0;
  for (const task of expiredTasks) {
    const cancelledTask = await PickupTask.findOneAndUpdate(
      {
        _id: task._id,
        status: TASK_STATUS.UNASSIGNED
      },
      {
        $set: {
          status: TASK_STATUS.CANCELLED
        }
      },
      { returnDocument: 'after' }
    );

    if (cancelledTask) {
      expiredTasksCount++;
      notifyUser(cancelledTask.donorId, 'task_cancelled', {
        taskId: cancelledTask._id,
        reason: 'Pickup deadline passed with no courier claim'
      });
      notifyUser(cancelledTask.recipientId, 'task_cancelled', {
        taskId: cancelledTask._id,
        reason: 'Pickup deadline passed with no courier claim'
      });
    }
  }

  return {
    timestamp: now.toISOString(),
    expiredListingsCount: expiredListingsResult.modifiedCount,
    expiredReservationsCount,
    expiredTasksCount
  };
};

/**
 * Start the Scheduled Background Expiry Worker
 */
export const startExpiryScheduler = (intervalMs = 60 * 1000) => {
  if (expiryIntervalTimer) {
    clearInterval(expiryIntervalTimer);
  }

  // Run initial sweep
  runExpiryJob().catch(err => {
    console.error('[Expiry Job] Initial sweep failed:', err.message);
  });

  // Schedule recurring interval
  expiryIntervalTimer = setInterval(async () => {
    try {
      const stats = await runExpiryJob();
      if (stats.expiredListingsCount > 0 || stats.expiredReservationsCount > 0 || stats.expiredTasksCount > 0) {
        console.log(`[Expiry Job] Swept: ${stats.expiredListingsCount} listings, ${stats.expiredReservationsCount} reservations, ${stats.expiredTasksCount} tasks.`);
      }
    } catch (err) {
      console.error('[Expiry Job] Periodic sweep error:', err.message);
    }
  }, intervalMs);

  return expiryIntervalTimer;
};

/**
 * Gracefully Stop Scheduler
 */
export const stopExpiryScheduler = () => {
  if (expiryIntervalTimer) {
    clearInterval(expiryIntervalTimer);
    expiryIntervalTimer = null;
  }
};
