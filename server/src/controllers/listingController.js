import { FoodListing } from '../models/FoodListing.js';
import { Organization } from '../models/Organization.js';
import { Reservation } from '../models/Reservation.js';
import { AppError } from '../utils/appError.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { recordAuditLog } from '../utils/auditLogger.js';
import { matchRecipientsForListing } from '../services/matchingService.js';
import { LISTING_STATUS } from '../constants/listingConstants.js';
import { ROLES } from '../constants/roles.js';

export const createListing = async (req, res, next) => {
  try {
    const {
      title,
      description,
      category,
      quantity,
      unit,
      preparationTime,
      pickupWindow,
      storageRequirements,
      allergens,
      dietaryInfo,
      images,
      address,
      location,
      requiresVolunteer
    } = req.body;

    // Retrieve donor's organization if exists
    let org = null;
    if (req.user.organizationId) {
      org = await Organization.findById(req.user.organizationId);
    }
    if (!org) {
      org = await Organization.findOne({ ownerId: req.user._id });
    }

    const donorName = org ? org.name : req.user.name;
    const expiresAt = new Date(pickupWindow.endTime);

    const listing = await FoodListing.create({
      title,
      description,
      category,
      quantity: Number(quantity),
      quantityRemaining: Number(quantity),
      unit,
      preparationTime: preparationTime ? new Date(preparationTime) : new Date(),
      pickupWindow: {
        startTime: new Date(pickupWindow.startTime),
        endTime: expiresAt
      },
      storageRequirements,
      allergens: allergens || [],
      dietaryInfo: dietaryInfo || [],
      images: images || [],
      donorId: req.user._id,
      organizationId: org ? org._id : null,
      donorName,
      address: address || (org ? org.address : req.user.address) || {},
      location: location || (org ? org.location : req.user.location),
      status: LISTING_STATUS.AVAILABLE,
      requiresVolunteer: Boolean(requiresVolunteer),
      expiresAt
    });

    // Audit Log
    await recordAuditLog({
      action: 'FOOD_LISTING_CREATED',
      performedBy: req.user._id,
      performedByRole: req.user.role,
      entityType: 'FoodListing',
      entityId: listing._id,
      details: { title: listing.title, quantity: listing.quantity, unit: listing.unit },
      req
    });

    return sendSuccess(res, {
      statusCode: 201,
      message: 'Surplus food listing published successfully',
      data: { listing }
    });
  } catch (err) {
    next(err);
  }
};

export const getListings = async (req, res, next) => {
  try {
    const {
      category,
      storageRequirements,
      dietary,
      allergensExclude,
      status,
      search,
      lng,
      lat,
      maxDistance,
      sortBy = 'createdAt',
      order = 'desc',
      page = 1,
      limit = 12
    } = req.query;

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 12));
    const skip = (pageNum - 1) * limitNum;

    const query = {};

    // 1. Status Filter (default: available and partially_reserved)
    if (status && status !== 'all') {
      query.status = status;
    } else {
      query.status = { $in: [LISTING_STATUS.AVAILABLE, LISTING_STATUS.PARTIALLY_RESERVED] };
      query.expiresAt = { $gt: new Date() };
    }

    // 2. Category Filter
    if (category && category !== 'all') {
      query.category = category;
    }

    // 3. Storage Filter
    if (storageRequirements && storageRequirements !== 'all') {
      query.storageRequirements = storageRequirements;
    }

    // 4. Dietary Tag Filtering
    if (dietary) {
      const dietaryArray = Array.isArray(dietary) ? dietary : dietary.split(',');
      query.dietaryInfo = { $all: dietaryArray };
    }

    // 5. Exclude Allergens Filter
    if (allergensExclude) {
      const excludeArray = Array.isArray(allergensExclude) ? allergensExclude : allergensExclude.split(',');
      query.allergens = { $nin: excludeArray };
    }

    // 6. Text Search on Title or Description or Donor Name
    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
        { title: regex },
        { description: regex },
        { donorName: regex }
      ];
    }

    // 7. Geospatial Radius Filter ($geoWithin with $centerSphere)
    if (lng && lat) {
      const longitude = parseFloat(lng);
      const latitude = parseFloat(lat);
      const radiusMeters = parseFloat(maxDistance) || 10000; // default 10km radius
      const radiusRadians = radiusMeters / 6378100; // Earth radius in meters

      query.location = {
        $geoWithin: {
          $centerSphere: [[longitude, latitude], radiusRadians]
        }
      };
    }

    // Sorting
    const sortOptions = {};
    if (sortBy === 'expiresAt') {
      sortOptions.expiresAt = 1; // Nearest deadline first
    } else if (sortBy === 'quantityRemaining') {
      sortOptions.quantityRemaining = -1;
    } else {
      sortOptions[sortBy] = order === 'asc' ? 1 : -1;
    }

    const [total, listings] = await Promise.all([
      FoodListing.countDocuments(query),
      FoodListing.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .populate('donorId', 'name email phone avatar')
        .populate('organizationId', 'name type verificationStatus')
    ]);

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Surplus food listings retrieved',
      data: { listings },
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

export const getListingById = async (req, res, next) => {
  try {
    const listing = await FoodListing.findById(req.params.id)
      .populate('donorId', 'name email phone avatar')
      .populate('organizationId', 'name type verificationStatus address');

    if (!listing) {
      return next(new AppError('Surplus food listing not found', 404));
    }

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Listing retrieved successfully',
      data: { listing }
    });
  } catch (err) {
    next(err);
  }
};

export const updateListing = async (req, res, next) => {
  try {
    const listing = await FoodListing.findById(req.params.id);
    if (!listing) {
      return next(new AppError('Listing not found', 404));
    }

    // Owner check
    if (!listing.donorId.equals(req.user._id) && req.user.role !== ROLES.ADMIN) {
      return next(new AppError('Forbidden: You can only edit your own food listings.', 403));
    }

    // If reservations exist, prevent modifying initial quantity or unit
    const activeReservationsCount = await Reservation.countDocuments({
      listingId: listing._id,
      status: { $in: ['pending_approval', 'approved'] }
    });

    const { title, description, storageRequirements, pickupWindow, images, allergens, dietaryInfo } = req.body;

    if (title) listing.title = title;
    if (description) listing.description = description;
    if (storageRequirements) listing.storageRequirements = storageRequirements;
    if (images) listing.images = images;
    if (allergens) listing.allergens = allergens;
    if (dietaryInfo) listing.dietaryInfo = dietaryInfo;
    if (pickupWindow && pickupWindow.endTime) {
      listing.pickupWindow.endTime = new Date(pickupWindow.endTime);
      listing.expiresAt = new Date(pickupWindow.endTime);
    }

    await listing.save();

    await recordAuditLog({
      action: 'FOOD_LISTING_UPDATED',
      performedBy: req.user._id,
      performedByRole: req.user.role,
      entityType: 'FoodListing',
      entityId: listing._id,
      details: { title: listing.title },
      req
    });

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Listing updated successfully',
      data: { listing }
    });
  } catch (err) {
    next(err);
  }
};

export const deleteListing = async (req, res, next) => {
  try {
    const listing = await FoodListing.findById(req.params.id);
    if (!listing) {
      return next(new AppError('Listing not found', 404));
    }

    if (!listing.donorId.equals(req.user._id) && req.user.role !== ROLES.ADMIN) {
      return next(new AppError('Forbidden: You can only delete your own food listings.', 403));
    }

    // Cancel listing and release/cancel any pending claims
    listing.status = LISTING_STATUS.CANCELLED;
    await listing.save();

    // Mark pending reservations as cancelled
    await Reservation.updateMany(
      {
        listingId: listing._id,
        status: 'pending_approval'
      },
      {
        $set: {
          status: 'cancelled',
          cancelledAt: new Date(),
          donorNotes: 'Listing withdrawn by donor'
        }
      }
    );

    await recordAuditLog({
      action: 'FOOD_LISTING_CANCELLED',
      performedBy: req.user._id,
      performedByRole: req.user.role,
      entityType: 'FoodListing',
      entityId: listing._id,
      details: { title: listing.title },
      req
    });

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Surplus food listing withdrawn successfully',
      data: { listing }
    });
  } catch (err) {
    next(err);
  }
};

export const getMyListings = async (req, res, next) => {
  try {
    const listings = await FoodListing.find({ donorId: req.user._id })
      .sort({ createdAt: -1 })
      .populate('organizationId', 'name type');

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Donor listings retrieved',
      data: { listings }
    });
  } catch (err) {
    next(err);
  }
};

export const getMatchedRecipients = async (req, res, next) => {
  try {
    const listing = await FoodListing.findById(req.params.id);
    if (!listing) {
      return next(new AppError('Listing not found', 404));
    }

    // Only donor owner or admin can view ranked recipient recommendations
    if (!listing.donorId.equals(req.user._id) && req.user.role !== ROLES.ADMIN) {
      return next(new AppError('Forbidden: Only the food donor may view recipient matching recommendations.', 403));
    }

    const maxRadius = parseFloat(req.query.maxRadiusMeters) || 15000;
    const matches = await matchRecipientsForListing(listing, { maxRadiusMeters: maxRadius });

    return sendSuccess(res, {
      statusCode: 200,
      message: `Found ${matches.length} eligible recipient organizations ranked by proximity and cold-chain capacity`,
      data: {
        listingId: listing._id,
        listingTitle: listing.title,
        matches
      }
    });
  } catch (err) {
    next(err);
  }
};
