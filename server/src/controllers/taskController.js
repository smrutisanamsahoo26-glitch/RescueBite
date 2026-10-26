import { PickupTask, TASK_STATUS } from '../models/PickupTask.js';
import { AppError } from '../utils/appError.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { recordAuditLog } from '../utils/auditLogger.js';
import { claimPickupTaskAtomic, transitionTaskStatus } from '../services/taskService.js';

export const getTaskBoard = async (req, res, next) => {
  try {
    const tasks = await PickupTask.find({ status: TASK_STATUS.UNASSIGNED })
      .sort({ createdAt: -1 })
      .populate('listingId', 'title category storageRequirements');

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Available pickup tasks retrieved',
      data: { tasks }
    });
  } catch (err) {
    next(err);
  }
};

export const getMyTasks = async (req, res, next) => {
  try {
    const tasks = await PickupTask.find({ volunteerId: req.user._id })
      .sort({ createdAt: -1 });

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Volunteer tasks retrieved',
      data: { tasks }
    });
  } catch (err) {
    next(err);
  }
};

export const getTaskById = async (req, res, next) => {
  try {
    const task = await PickupTask.findById(req.params.id)
      .populate('listingId', 'title category storageRequirements')
      .populate('donorId', 'name phone email')
      .populate('recipientId', 'name phone email')
      .populate('volunteerId', 'name phone email');

    if (!task) {
      return next(new AppError('Task not found', 404));
    }

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Task details retrieved',
      data: { task }
    });
  } catch (err) {
    next(err);
  }
};

export const claimTask = async (req, res, next) => {
  try {
    const task = await claimPickupTaskAtomic(req.params.id, req.user);

    await recordAuditLog({
      action: 'TASK_CLAIMED',
      performedBy: req.user._id,
      performedByRole: req.user.role,
      entityType: 'PickupTask',
      entityId: task._id,
      details: { volunteerName: req.user.name },
      req
    });

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Delivery mission claimed successfully',
      data: { task }
    });
  } catch (err) {
    next(err);
  }
};

export const updateTaskStatus = async (req, res, next) => {
  try {
    const { status, newStatus, verificationCode, candidateCode, temperatureCelsius, notes, actualRescuedKg } = req.body || {};
    const targetStatus = newStatus || status;

    if (!targetStatus) {
      return next(new AppError('Status is required', 400));
    }

    const task = await transitionTaskStatus({
      taskId: req.params.id,
      user: req.user,
      newStatus: targetStatus,
      candidateCode: candidateCode || verificationCode,
      temperatureCelsius,
      notes,
      actualRescuedKg
    });

    await recordAuditLog({
      action: `TASK_STATUS_${targetStatus.toUpperCase()}`,
      performedBy: req.user._id,
      performedByRole: req.user.role,
      entityType: 'PickupTask',
      entityId: task._id,
      details: { newStatus: targetStatus, temperatureCelsius },
      req
    });

    return sendSuccess(res, {
      statusCode: 200,
      message: `Task status updated to '${status}'`,
      data: { task }
    });
  } catch (err) {
    next(err);
  }
};

export const logTemperature = async (req, res, next) => {
  try {
    const { temperatureCelsius, stage = 'in_transit', notes = '' } = req.body || {};

    if (temperatureCelsius === undefined || isNaN(Number(temperatureCelsius))) {
      return next(new AppError('Numeric temperature value in Celsius is required', 400));
    }

    const task = await PickupTask.findById(req.params.id);
    if (!task) {
      return next(new AppError('Task not found', 404));
    }

    // Must be assigned volunteer or admin
    if (!task.volunteerId?.equals(req.user._id) && req.user.role !== 'admin') {
      return next(new AppError('Forbidden: Only the assigned courier may log transit temperatures', 403));
    }

    task.tempLogs.push({
      stage,
      temperatureCelsius: Number(temperatureCelsius),
      recordedAt: new Date(),
      notes
    });

    await task.save();

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Temperature check recorded successfully',
      data: { tempLogs: task.tempLogs }
    });
  } catch (err) {
    next(err);
  }
};
