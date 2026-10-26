import { User } from '../models/User.js';
import { Organization } from '../models/Organization.js';
import { AppError } from '../utils/appError.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { generateToken, setAuthCookie, clearAuthCookie } from '../utils/token.js';
import { recordAuditLog } from '../utils/auditLogger.js';
import { ROLES } from '../constants/roles.js';

export const register = async (req, res, next) => {
  try {
    const { name, email, password, phone, role, organizationName, address, location } = req.body;

    // 1. Check if email already registered
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new AppError('An account with this email address already exists.', 409));
    }

    // 2. Hash password
    const passwordHash = await User.hashPassword(password);

    // 3. Prevent self-registration as admin
    const assignedRole = role === ROLES.ADMIN ? ROLES.RECIPIENT : (role || ROLES.RECIPIENT);

    // 4. Create User
    const user = await User.create({
      name,
      email,
      passwordHash,
      phone,
      role: assignedRole,
      address: address || {},
      location: location || { type: 'Point', coordinates: [-73.9851, 40.7484] }
    });

    // 5. If organizationName provided, bootstrap organization entry
    if (organizationName && (assignedRole === ROLES.DONOR || assignedRole === ROLES.RECIPIENT)) {
      const org = await Organization.create({
        name: organizationName,
        type: assignedRole === ROLES.DONOR ? 'restaurant' : 'community_pantry',
        registrationNumber: `PENDING-REG-${Date.now()}`,
        contactEmail: email,
        contactPhone: phone,
        address: address || {},
        location: location || { type: 'Point', coordinates: [-73.9851, 40.7484] },
        ownerId: user._id,
        verificationStatus: 'unverified'
      });

      user.organizationId = org._id;
      await user.save();
    }

    // 6. Generate Token & set HttpOnly Cookie
    const token = generateToken({ id: user._id, role: user.role });
    setAuthCookie(res, token);

    // 7. Audit Log
    await recordAuditLog({
      action: 'USER_REGISTERED',
      performedBy: user._id,
      performedByRole: user.role,
      entityType: 'User',
      entityId: user._id,
      details: { email: user.email, role: user.role },
      req
    });

    // 8. Populate org details if exists
    const populatedUser = await User.findById(user._id).populate('organizationId');

    return sendSuccess(res, {
      statusCode: 201,
      message: 'Registration successful',
      data: {
        user: populatedUser,
        token // Provided for client convenience / API testing alongside the secure cookie
      }
    });
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 1. Find user by email including passwordHash
    const user = await User.findOne({ email }).select('+passwordHash').populate('organizationId');
    if (!user) {
      return next(new AppError('Invalid email or password.', 401));
    }

    // 2. Check if account is suspended
    if (user.status === 'suspended') {
      return next(new AppError('This account is suspended. Please contact platform administration.', 403));
    }

    // 3. Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return next(new AppError('Invalid email or password.', 401));
    }

    // 4. Generate Token & set HttpOnly Cookie
    const token = generateToken({ id: user._id, role: user.role });
    setAuthCookie(res, token);

    // 5. Audit Log
    await recordAuditLog({
      action: 'USER_LOGIN',
      performedBy: user._id,
      performedByRole: user.role,
      entityType: 'User',
      entityId: user._id,
      details: { email: user.email },
      req
    });

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Login successful',
      data: {
        user,
        token
      }
    });
  } catch (err) {
    next(err);
  }
};

export const logout = async (req, res, next) => {
  try {
    clearAuthCookie(res);

    if (req.user) {
      await recordAuditLog({
        action: 'USER_LOGOUT',
        performedBy: req.user._id,
        performedByRole: req.user.role,
        entityType: 'User',
        entityId: req.user._id,
        details: {},
        req
      });
    }

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Logout successful'
    });
  } catch (err) {
    next(err);
  }
};

export const getCurrentUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('organizationId');
    return sendSuccess(res, {
      statusCode: 200,
      message: 'User profile retrieved',
      data: { user }
    });
  } catch (err) {
    next(err);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, avatar, address, location } = req.body;

    const updates = {};
    if (name) updates.name = name;
    if (phone) updates.phone = phone;
    if (avatar) updates.avatar = avatar;
    if (address) updates.address = address;
    if (location) updates.location = location;

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { returnDocument: 'after', runValidators: true }
    ).populate('organizationId');

    await recordAuditLog({
      action: 'USER_PROFILE_UPDATED',
      performedBy: req.user._id,
      performedByRole: req.user.role,
      entityType: 'User',
      entityId: req.user._id,
      details: updates,
      req
    });

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Profile updated successfully',
      data: { user: updatedUser }
    });
  } catch (err) {
    next(err);
  }
};
