import { PickupTask, TASK_STATUS } from '../models/PickupTask.js';
import { Reservation } from '../models/Reservation.js';
import { AppError } from '../utils/appError.js';
import { generatePlainCode, hashVerificationCode, verifyConfirmationCode } from '../utils/codeHasher.js';
import { notifyUser, notifyRole } from '../sockets/socketManager.js';
import { RESERVATION_STATUS } from '../constants/listingConstants.js';
import { ROLES } from '../constants/roles.js';

/**
 * Valid State Machine Transitions for Delivery Tasks
 */
const ALLOWED_TRANSITIONS = {
  [TASK_STATUS.UNASSIGNED]: [TASK_STATUS.ASSIGNED, TASK_STATUS.CANCELLED],
  [TASK_STATUS.ASSIGNED]: [TASK_STATUS.EN_ROUTE_PICKUP, TASK_STATUS.CANCELLED],
  [TASK_STATUS.EN_ROUTE_PICKUP]: [TASK_STATUS.PICKED_UP, TASK_STATUS.CANCELLED],
  [TASK_STATUS.PICKED_UP]: [TASK_STATUS.EN_ROUTE_DELIVERY, TASK_STATUS.CANCELLED],
  [TASK_STATUS.EN_ROUTE_DELIVERY]: [TASK_STATUS.DELIVERED, TASK_STATUS.CANCELLED],
  [TASK_STATUS.DELIVERED]: [],
  [TASK_STATUS.CANCELLED]: []
};

/**
 * Spawn a PickupTask for an approved reservation with hashed verification codes.
 * Returns the plaintext codes ONLY once so caller can communicate them to donor/recipient.
 */
export const spawnPickupTask = async ({ reservation, listing }) => {
  const existing = await PickupTask.findOne({ reservationId: reservation._id });
  if (existing) {
    return {
      task: existing,
      plainPickupCode: reservation.pickupCode,
      plainDeliveryCode: reservation.deliveryCode
    };
  }

  const plainPickupCode = reservation.pickupCode || generatePlainCode();
  const plainDeliveryCode = reservation.deliveryCode || generatePlainCode();

  const pickupCodeHash = hashVerificationCode(plainPickupCode);
  const deliveryCodeHash = hashVerificationCode(plainDeliveryCode);

  const expiresAt = new Date(reservation.pickupDeadline || Date.now() + 8 * 3600 * 1000);

  const task = await PickupTask.create({
    reservationId: reservation._id,
    listingId: listing._id,
    listingTitle: listing.title,
    donorId: listing.donorId,
    donorName: listing.donorName,
    pickupAddress: listing.address,
    recipientId: reservation.recipientId,
    recipientName: reservation.organizationName,
    deliveryAddress: reservation.recipientAddress || listing.address,
    status: TASK_STATUS.UNASSIGNED,
    pickupCodeHash,
    deliveryCodeHash,
    pickupCodeExpiresAt: expiresAt,
    deliveryCodeExpiresAt: expiresAt,
    quantityText: `${reservation.quantityReserved} ${reservation.unit}`,
    storageRequirements: listing.storageRequirements,
    distanceMiles: 1.8
  });

  // Notify volunteer pool
  notifyRole(ROLES.VOLUNTEER, 'new_task_available', {
    taskId: task._id,
    listingTitle: listing.title,
    distanceMiles: task.distanceMiles
  });

  return {
    task,
    plainPickupCode,
    plainDeliveryCode
  };
};

/**
 * Atomic Task Claiming with Concurrency Protection
 */
export const claimPickupTaskAtomic = async (taskId, volunteerUser) => {
  const task = await PickupTask.findOneAndUpdate(
    {
      _id: taskId,
      status: TASK_STATUS.UNASSIGNED,
      volunteerId: null
    },
    {
      $set: {
        status: TASK_STATUS.ASSIGNED,
        volunteerId: volunteerUser._id,
        volunteerName: volunteerUser.name
      }
    },
    { returnDocument: 'after' }
  );

  if (!task) {
    const check = await PickupTask.findById(taskId);
    if (!check) {
      throw new AppError('Pickup task not found', 404);
    }
    throw new AppError(
      'This courier task has already been claimed by another volunteer or is no longer unassigned.',
      409
    );
  }

  // Notify participants
  notifyUser(task.donorId, 'courier_assigned', {
    taskId: task._id,
    volunteerName: volunteerUser.name
  });
  notifyUser(task.recipientId, 'courier_assigned', {
    taskId: task._id,
    volunteerName: volunteerUser.name
  });

  return task;
};

/**
 * State Machine Transition with Hashed Code Validation and Temp Logs
 */
export const transitionTaskStatus = async ({
  taskId,
  user,
  newStatus,
  candidateCode = null,
  temperatureCelsius = null,
  notes = '',
  actualRescuedKg = null
}) => {
  // Query task including hidden code hashes
  const task = await PickupTask.findById(taskId).select('+pickupCodeHash +deliveryCodeHash');
  if (!task) {
    throw new AppError('Pickup task not found', 404);
  }

  // 1. Authorization: Must be assigned volunteer, donor, recipient, or admin
  const isAssignedVolunteer = task.volunteerId && task.volunteerId.equals(user._id);
  const isDonor = task.donorId.equals(user._id);
  const isRecipient = task.recipientId.equals(user._id);
  const isAdmin = user.role === ROLES.ADMIN;

  if (!isAssignedVolunteer && !isDonor && !isRecipient && !isAdmin) {
    throw new AppError('Forbidden: You are not authorized to update this delivery task.', 403);
  }

  // 2. Validate State Transition
  const allowedNext = ALLOWED_TRANSITIONS[task.status] || [];
  if (!allowedNext.includes(newStatus)) {
    throw new AppError(
      `Invalid state transition from '${task.status}' to '${newStatus}'. Allowed next states: [${allowedNext.join(', ')}]`,
      400
    );
  }

  const now = new Date();

  // 3. Validation for Handover to Courier (PICKED_UP)
  if (newStatus === TASK_STATUS.PICKED_UP) {
    if (task.pickupCodeUsed) {
      throw new AppError('Pickup confirmation code has already been used and cannot be reused.', 400);
    }
    if (now > task.pickupCodeExpiresAt) {
      throw new AppError('Pickup confirmation code has expired.', 400);
    }
    if (!candidateCode) {
      throw new AppError('Donor pickup confirmation code is required to complete handover.', 400);
    }

    const isValid = verifyConfirmationCode(candidateCode, task.pickupCodeHash);
    if (!isValid) {
      throw new AppError('Invalid pickup confirmation code. Please obtain the correct code from the donor.', 401);
    }

    task.pickupCodeUsed = true;
    task.pickedUpAt = now;
  }

  // 4. Validation for Final Handover to Recipient (DELIVERED)
  if (newStatus === TASK_STATUS.DELIVERED) {
    if (task.deliveryCodeUsed) {
      throw new AppError('Delivery confirmation code has already been used and cannot be reused.', 400);
    }
    if (now > task.deliveryCodeExpiresAt) {
      throw new AppError('Delivery confirmation code has expired.', 400);
    }
    if (!candidateCode) {
      throw new AppError('Recipient delivery confirmation code is required to complete delivery.', 400);
    }

    const isValid = verifyConfirmationCode(candidateCode, task.deliveryCodeHash);
    if (!isValid) {
      throw new AppError('Invalid delivery confirmation code. Please obtain the correct code from the recipient.', 401);
    }

    task.deliveryCodeUsed = true;
    task.deliveredAt = now;

    // Record verified measurement if provided
    if (actualRescuedKg && !isNaN(Number(actualRescuedKg))) {
      task.actualRescuedKg = Number(actualRescuedKg);
    }

    // Mark associated Reservation as completed
    await Reservation.findByIdAndUpdate(task.reservationId, {
      status: RESERVATION_STATUS.COMPLETED
    });
  }

  // 5. Temperature Logging
  if (temperatureCelsius !== null && temperatureCelsius !== undefined) {
    const tempNum = Number(temperatureCelsius);
    if (!isNaN(tempNum)) {
      task.tempLogs.push({
        stage: newStatus === TASK_STATUS.PICKED_UP ? 'pickup' : newStatus === TASK_STATUS.DELIVERED ? 'delivery' : 'in_transit',
        temperatureCelsius: tempNum,
        recordedAt: now,
        notes: notes || ''
      });
    }
  }

  task.status = newStatus;
  await task.save();

  // Strip sensitive hashes before returning
  const sanitized = task.toJSON();

  // Notify parties of status change
  notifyUser(task.donorId, 'task_status_changed', { taskId: task._id, status: newStatus });
  notifyUser(task.recipientId, 'task_status_changed', { taskId: task._id, status: newStatus });

  return sanitized;
};
