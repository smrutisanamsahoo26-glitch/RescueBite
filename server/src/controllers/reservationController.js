import { Reservation } from '../models/Reservation.js';
import { FoodListing } from '../models/FoodListing.js';
import { AppError } from '../utils/appError.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { recordAuditLog } from '../utils/auditLogger.js';
import {
  createReservationAtomic,
  approveReservationDecision,
  rejectReservationDecision,
  cancelReservationDecision,
  sweepExpiredListingsAndReservations
} from '../services/reservationService.js';

export const createReservation = async (req, res, next) => {
  try {
    const { listingId, quantityReserved, recipientNotes, idempotencyKey } = req.body;
    const headerIdempotency = req.headers['idempotency-key'] || idempotencyKey;

    const { reservation, isDuplicate } = await createReservationAtomic({
      listingId,
      recipientUser: req.user,
      quantityReserved,
      recipientNotes,
      idempotencyKey: headerIdempotency
    });

    if (!isDuplicate) {
      await recordAuditLog({
        action: 'RESERVATION_CREATED',
        performedBy: req.user._id,
        performedByRole: req.user.role,
        entityType: 'Reservation',
        entityId: reservation._id,
        details: {
          listingId: reservation.listingId,
          quantityReserved: reservation.quantityReserved,
          unit: reservation.unit
        },
        req
      });
    }

    return sendSuccess(res, {
      statusCode: isDuplicate ? 200 : 201,
      message: isDuplicate ? 'Idempotent request: returning existing reservation' : 'Reservation created successfully',
      data: { reservation, isDuplicate }
    });
  } catch (err) {
    next(err);
  }
};

export const getMyReservations = async (req, res, next) => {
  try {
    const { status } = req.query;
    const query = { recipientId: req.user._id };

    if (status && status !== 'all') {
      query.status = status;
    }

    const reservations = await Reservation.find(query)
      .sort({ createdAt: -1 })
      .populate('listingId', 'title category pickupWindow storageRequirements images address location');

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Recipient reservations retrieved',
      data: { reservations }
    });
  } catch (err) {
    next(err);
  }
};

export const getDonorInboundReservations = async (req, res, next) => {
  try {
    const { status } = req.query;
    const query = { donorId: req.user._id };

    if (status && status !== 'all') {
      query.status = status;
    }

    const reservations = await Reservation.find(query)
      .sort({ createdAt: -1 })
      .populate('recipientId', 'name email phone avatar')
      .populate('organizationId', 'name type verificationStatus');

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Inbound donor claims retrieved',
      data: { reservations }
    });
  } catch (err) {
    next(err);
  }
};

export const approveReservation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { donorNotes } = req.body || {};

    const reservation = await approveReservationDecision(id, req.user, donorNotes);

    await recordAuditLog({
      action: 'RESERVATION_APPROVED',
      performedBy: req.user._id,
      performedByRole: req.user.role,
      entityType: 'Reservation',
      entityId: reservation._id,
      details: { pickupCode: reservation.pickupCode },
      req
    });

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Reservation approved. Pickup code generated for courier handoff.',
      data: { reservation }
    });
  } catch (err) {
    next(err);
  }
};

export const rejectReservation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body || {};

    const reservation = await rejectReservationDecision(id, req.user, reason);

    await recordAuditLog({
      action: 'RESERVATION_REJECTED',
      performedBy: req.user._id,
      performedByRole: req.user.role,
      entityType: 'Reservation',
      entityId: reservation._id,
      details: { reason },
      req
    });

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Reservation rejected and surplus inventory safely restored',
      data: { reservation }
    });
  } catch (err) {
    next(err);
  }
};

export const cancelReservation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body || {};

    const reservation = await cancelReservationDecision(id, req.user, reason);

    await recordAuditLog({
      action: 'RESERVATION_CANCELLED',
      performedBy: req.user._id,
      performedByRole: req.user.role,
      entityType: 'Reservation',
      entityId: reservation._id,
      details: { reason },
      req
    });

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Reservation cancelled and surplus inventory released back to marketplace',
      data: { reservation }
    });
  } catch (err) {
    next(err);
  }
};

export const sweepExpired = async (req, res, next) => {
  try {
    const result = await sweepExpiredListingsAndReservations();

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Expired listings and pending claims sweeper executed',
      data: result
    });
  } catch (err) {
    next(err);
  }
};
