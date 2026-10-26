import { AuditLog } from '../models/AuditLog.js';

export const recordAuditLog = async ({
  action,
  performedBy,
  performedByRole = '',
  entityType,
  entityId = null,
  details = {},
  req = null
}) => {
  try {
    const ipAddress = req?.ip || req?.connection?.remoteAddress || '127.0.0.1';
    const userAgent = req?.get ? req.get('User-Agent') || '' : '';

    await AuditLog.create({
      action,
      performedBy,
      performedByRole,
      entityType,
      entityId,
      details,
      ipAddress,
      userAgent
    });
  } catch (err) {
    console.error('[AuditLog] Failed to record audit log:', err.message);
  }
};
