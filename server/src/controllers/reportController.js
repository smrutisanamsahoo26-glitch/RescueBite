import { Report } from '../models/Report.js';
import { AppError } from '../utils/appError.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { recordAuditLog } from '../utils/auditLogger.js';

export const submitReport = async (req, res, next) => {
  try {
    const { targetType, targetId, targetTitle, reason, description, severity = 'medium' } = req.body || {};

    if (!targetType || !targetId || !reason || !description) {
      return next(new AppError('Target type, target ID, reason, and description are required', 400));
    }

    const report = await Report.create({
      reporterId: req.user._id,
      reporterName: req.user.name,
      targetType,
      targetId,
      targetTitle: targetTitle || 'Reported Incident',
      reason,
      description,
      severity
    });

    await recordAuditLog({
      action: 'SAFETY_REPORT_FILED',
      performedBy: req.user._id,
      performedByRole: req.user.role,
      entityType: 'Report',
      entityId: report._id,
      details: { reason, targetType, severity },
      req
    });

    return sendSuccess(res, {
      statusCode: 201,
      message: 'Incident report filed successfully and queued for administrative inspection',
      data: { report }
    });
  } catch (err) {
    next(err);
  }
};

export const getMyReports = async (req, res, next) => {
  try {
    const reports = await Report.find({ reporterId: req.user._id })
      .sort({ createdAt: -1 });

    return sendSuccess(res, {
      statusCode: 200,
      message: 'User filed reports retrieved',
      data: { reports }
    });
  } catch (err) {
    next(err);
  }
};
