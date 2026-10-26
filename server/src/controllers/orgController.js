import { Organization } from '../models/Organization.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/appError.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { recordAuditLog } from '../utils/auditLogger.js';
import { VERIFICATION_STATUS } from '../constants/orgStatus.js';

export const applyVerification = async (req, res, next) => {
  try {
    const { name, type, registrationNumber, taxId, contactEmail, contactPhone, address, location, verificationDocuments } = req.body;

    let org;

    // Check if user already owns an organization
    if (req.user.organizationId) {
      org = await Organization.findById(req.user.organizationId);
    }

    if (!org) {
      // Find by ownerId
      org = await Organization.findOne({ ownerId: req.user._id });
    }

    if (org) {
      // Update existing organization and reset status to pending
      org.name = name || org.name;
      org.type = type || org.type;
      org.registrationNumber = registrationNumber || org.registrationNumber;
      org.taxId = taxId !== undefined ? taxId : org.taxId;
      org.contactEmail = contactEmail || org.contactEmail;
      org.contactPhone = contactPhone || org.contactPhone;
      if (address) org.address = address;
      if (location) org.location = location;
      if (verificationDocuments && Array.isArray(verificationDocuments)) {
        org.verificationDocuments = verificationDocuments;
      }
      org.verificationStatus = VERIFICATION_STATUS.PENDING;
      await org.save();
    } else {
      // Create new Organization
      org = await Organization.create({
        name,
        type,
        registrationNumber,
        taxId: taxId || '',
        contactEmail,
        contactPhone,
        address: address || {},
        location: location || { type: 'Point', coordinates: [-73.9851, 40.7484] },
        ownerId: req.user._id,
        verificationStatus: VERIFICATION_STATUS.PENDING,
        verificationDocuments: verificationDocuments || []
      });

      // Link to User
      await User.findByIdAndUpdate(req.user._id, { organizationId: org._id });
    }

    // Audit Log
    await recordAuditLog({
      action: 'ORGANIZATION_VERIFICATION_SUBMITTED',
      performedBy: req.user._id,
      performedByRole: req.user.role,
      entityType: 'Organization',
      entityId: org._id,
      details: { organizationName: org.name, status: org.verificationStatus },
      req
    });

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Verification application submitted successfully. An administrator will review your credentials.',
      data: { organization: org }
    });
  } catch (err) {
    next(err);
  }
};

export const getMyOrg = async (req, res, next) => {
  try {
    let org = null;
    if (req.user.organizationId) {
      org = await Organization.findById(req.user.organizationId).populate('reviewedBy', 'name email');
    } else {
      org = await Organization.findOne({ ownerId: req.user._id }).populate('reviewedBy', 'name email');
    }

    if (!org) {
      return next(new AppError('No organization profile found for the current user.', 404));
    }

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Organization retrieved',
      data: { organization: org }
    });
  } catch (err) {
    next(err);
  }
};

export const getOrgById = async (req, res, next) => {
  try {
    const org = await Organization.findById(req.params.id)
      .select('-verificationDocuments') // Keep uploaded legal attachments private
      .populate('ownerId', 'name email phone avatar');

    if (!org) {
      return next(new AppError('Organization not found', 404));
    }

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Organization details retrieved',
      data: { organization: org }
    });
  } catch (err) {
    next(err);
  }
};

export const getVerificationQueue = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    const statusFilter = req.query.status || VERIFICATION_STATUS.PENDING;
    const filter = statusFilter === 'all' ? {} : { verificationStatus: statusFilter };

    const [total, organizations] = await Promise.all([
      Organization.countDocuments(filter),
      Organization.find(filter)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('ownerId', 'name email phone')
        .populate('reviewedBy', 'name email')
    ]);

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Organization verification queue retrieved',
      data: { organizations },
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    next(err);
  }
};

export const verifyOrganization = async (req, res, next) => {
  try {
    const { status, reviewNotes } = req.body;
    const { id } = req.params;

    const org = await Organization.findById(id);
    if (!org) {
      return next(new AppError('Organization not found', 404));
    }

    org.verificationStatus = status;
    org.reviewNotes = reviewNotes || '';
    org.reviewedBy = req.user._id;
    org.reviewedAt = new Date();
    await org.save();

    // Audit Log
    await recordAuditLog({
      action: `ORGANIZATION_${status.toUpperCase()}`,
      performedBy: req.user._id,
      performedByRole: req.user.role,
      entityType: 'Organization',
      entityId: org._id,
      details: {
        organizationName: org.name,
        decision: status,
        notes: reviewNotes
      },
      req
    });

    return sendSuccess(res, {
      statusCode: 200,
      message: `Organization verification status updated to '${status}'`,
      data: { organization: org }
    });
  } catch (err) {
    next(err);
  }
};
