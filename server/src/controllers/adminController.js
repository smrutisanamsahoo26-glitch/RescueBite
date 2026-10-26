import { User } from '../models/User.js';
import { Organization } from '../models/Organization.js';
import { FoodListing } from '../models/FoodListing.js';
import { Reservation } from '../models/Reservation.js';
import { PickupTask } from '../models/PickupTask.js';
import { Report } from '../models/Report.js';
import { AuditLog } from '../models/AuditLog.js';
import { AppError } from '../utils/appError.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { recordAuditLog } from '../utils/auditLogger.js';

export const getAdminOverview = async (req, res, next) => {
  try {
    const [
      totalUsers,
      usersByRole,
      verifiedOrgsCount,
      pendingOrgsCount,
      activeListingsCount,
      openReportsCount,
      completedTasksCount,
      totalAuditLogsCount
    ] = await Promise.all([
      User.countDocuments(),
      User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
      Organization.countDocuments({ verificationStatus: 'approved' }),
      Organization.countDocuments({ verificationStatus: 'pending' }),
      FoodListing.countDocuments({ status: { $in: ['available', 'partially_reserved'] } }),
      Report.countDocuments({ status: 'open' }),
      PickupTask.countDocuments({ status: 'delivered' }),
      AuditLog.countDocuments()
    ]);

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Admin overview telemetry retrieved',
      data: {
        totalUsers,
        usersByRole: usersByRole.reduce((acc, curr) => ({ ...acc, [curr._id]: curr.count }), {}),
        organizations: {
          verified: verifiedOrgsCount,
          pending: pendingOrgsCount
        },
        activeListingsCount,
        openReportsCount,
        completedDeliveries: completedTasksCount,
        auditLogsCount: totalAuditLogsCount
      }
    });
  } catch (err) {
    next(err);
  }
};

export const getReports = async (req, res, next) => {
  try {
    const { status, severity, page = 1, limit = 10 } = req.query;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 10));
    const skip = (pageNum - 1) * limitNum;

    const filter = {};
    if (status && status !== 'all') filter.status = status;
    if (severity && severity !== 'all') filter.severity = severity;

    const [total, reports] = await Promise.all([
      Report.countDocuments(filter),
      Report.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('reporterId', 'name email role')
        .populate('resolvedBy', 'name email')
    ]);

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Moderation reports retrieved',
      data: { reports },
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (err) {
    next(err);
  }
};

export const resolveReport = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status = 'resolved', adminNotes = '' } = req.body || {};

    const report = await Report.findById(id);
    if (!report) {
      return next(new AppError('Report not found', 404));
    }

    report.status = status;
    report.adminNotes = adminNotes;
    report.resolvedBy = req.user._id;
    report.resolvedAt = new Date();
    await report.save();

    await recordAuditLog({
      action: `REPORT_${status.toUpperCase()}`,
      performedBy: req.user._id,
      performedByRole: req.user.role,
      entityType: 'Report',
      entityId: report._id,
      details: { decision: status, notes: adminNotes },
      req
    });

    return sendSuccess(res, {
      statusCode: 200,
      message: `Report status updated to '${status}'`,
      data: { report }
    });
  } catch (err) {
    next(err);
  }
};

export const updateUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, reason = '' } = req.body || {};

    if (!['active', 'suspended'].includes(status)) {
      return next(new AppError("Status must be either 'active' or 'suspended'", 400));
    }

    const user = await User.findById(id);
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    // Prevent suspending fellow administrators without root authority
    if (user.role === 'admin' && !user._id.equals(req.user._id)) {
      return next(new AppError('Cannot suspend an administrator account', 403));
    }

    user.status = status;
    await user.save();

    await recordAuditLog({
      action: `USER_ACCOUNT_${status.toUpperCase()}`,
      performedBy: req.user._id,
      performedByRole: req.user.role,
      entityType: 'User',
      entityId: user._id,
      details: { targetEmail: user.email, status, reason },
      req
    });

    return sendSuccess(res, {
      statusCode: 200,
      message: `User account '${user.email}' is now ${status}`,
      data: { user }
    });
  } catch (err) {
    next(err);
  }
};

export const getAuditLogs = async (req, res, next) => {
  try {
    const { action, entityType, page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
    const skip = (pageNum - 1) * limitNum;

    const filter = {};
    if (action) filter.action = action;
    if (entityType) filter.entityType = entityType;

    const [total, logs] = await Promise.all([
      AuditLog.countDocuments(filter),
      AuditLog.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('performedBy', 'name email role')
    ]);

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Immutable audit logs retrieved',
      data: { logs },
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (err) {
    next(err);
  }
};
