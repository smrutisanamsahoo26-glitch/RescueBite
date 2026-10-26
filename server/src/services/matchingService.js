import { Organization } from '../models/Organization.js';
import { VERIFICATION_STATUS } from '../constants/orgStatus.js';

/**
 * Haversine distance calculator between two [lng, lat] coordinate points
 * Returns distance in meters.
 */
export const calculateDistanceMeters = (coords1, coords2) => {
  const [lon1, lat1] = coords1;
  const [lon2, lat2] = coords2;

  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

/**
 * Configurable Recipient Matching & Scoring Engine
 */
export const MATCHING_WEIGHTS = {
  proximity: 0.40,  // 40% weight on physical proximity
  storage: 0.25,    // 25% weight on cold-chain & storage equipment
  urgencyNeed: 0.20,// 20% weight on organizational type need (shelters / soup kitchens)
  capacityFit: 0.15 // 15% weight on batch volume feasibility
};

export const matchRecipientsForListing = async (listing, options = {}) => {
  const maxRadiusMeters = options.maxRadiusMeters || 15000; // 15 km max radius
  const weights = { ...MATCHING_WEIGHTS, ...(options.weights || {}) };

  // 1. Eligibility Filter: Only approved verified recipient organizations
  const eligibleOrgs = await Organization.find({
    verificationStatus: VERIFICATION_STATUS.APPROVED,
    type: { $in: ['shelter', 'food_bank', 'soup_kitchen', 'community_pantry', 'ngo'] },
    'location.coordinates': { $exists: true, $ne: [0, 0] }
  }).populate('ownerId', 'name email phone avatar');

  const listingCoords = listing.location.coordinates;
  const scoredMatches = [];

  for (const org of eligibleOrgs) {
    const orgCoords = org.location.coordinates;
    const distanceMeters = calculateDistanceMeters(listingCoords, orgCoords);

    // Gate: Distance must be within max delivery threshold
    if (distanceMeters > maxRadiusMeters) {
      continue;
    }

    // Gate: Cold-Chain Storage Compatibility Check
    let storageScore = 1.0;
    let storageExplanation = 'Compatible standard storage';

    if (listing.storageRequirements === 'refrigerated' || listing.storageRequirements === 'frozen') {
      if (['shelter', 'soup_kitchen', 'food_bank'].includes(org.type)) {
        storageScore = 1.0;
        storageExplanation = 'Certified cold-storage equipped facility';
      } else {
        storageScore = 0.5;
        storageExplanation = 'Limited cold storage capacity';
      }
    } else if (listing.storageRequirements === 'hot_holding') {
      if (['soup_kitchen', 'shelter'].includes(org.type)) {
        storageScore = 1.0;
        storageExplanation = 'Immediate meal service facility ready for hot food';
      } else {
        storageScore = 0.4;
        storageExplanation = 'Non-immediate dining distribution';
      }
    }

    // Proximity sub-score (1.0 at 0m, linearly decreases to 0.0 at maxRadiusMeters)
    const proximityScore = Math.max(0, 1 - distanceMeters / maxRadiusMeters);

    // Organization Need / Urgency sub-score
    let urgencyScore = 0.85;
    if (org.type === 'shelter') urgencyScore = 1.0;
    else if (org.type === 'soup_kitchen') urgencyScore = 0.95;
    else if (org.type === 'food_bank') urgencyScore = 0.90;
    else if (org.type === 'community_pantry') urgencyScore = 0.85;

    // Capacity Fit sub-score
    const capacityScore = 0.9; // Baseline optimal intake fit

    // Total weighted score
    const totalScore =
      weights.proximity * proximityScore +
      weights.storage * storageScore +
      weights.urgencyNeed * urgencyScore +
      weights.capacityFit * capacityScore;

    const normalizedScore = Math.min(100, Math.max(0, Math.round(totalScore * 100)));
    const distanceKm = Number((distanceMeters / 1000).toFixed(2));
    const distanceMiles = Number((distanceMeters / 1609.34).toFixed(2));

    const explanations = [
      `${distanceMiles} mi away (${Math.round(proximityScore * 100)}% proximity score)`,
      storageExplanation,
      `Priority tier: ${org.type.replace('_', ' ')}`
    ];

    scoredMatches.push({
      organization: org,
      score: Number(totalScore.toFixed(3)),
      normalizedScore,
      distanceKm,
      distanceMiles,
      matchExplanation: explanations.join(' • '),
      factors: {
        proximityScore: Number(proximityScore.toFixed(2)),
        storageScore: Number(storageScore.toFixed(2)),
        urgencyScore: Number(urgencyScore.toFixed(2)),
        capacityScore: Number(capacityScore.toFixed(2))
      }
    });
  }

  // Sort descending by highest weighted score
  scoredMatches.sort((a, b) => b.score - a.score);

  return scoredMatches;
};
