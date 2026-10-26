export const FOOD_CATEGORIES = [
  'cooked_meals',
  'bakery',
  'produce',
  'dairy',
  'packaged_goods',
  'beverages',
  'canned'
];

export const FOOD_UNITS = [
  'kg',
  'servings',
  'boxes',
  'liters',
  'packs'
];

export const STORAGE_REQUIREMENTS = [
  'ambient',
  'refrigerated',
  'frozen',
  'hot_holding'
];

export const LISTING_STATUS = {
  AVAILABLE: 'available',
  PARTIALLY_RESERVED: 'partially_reserved',
  FULLY_RESERVED: 'fully_reserved',
  COMPLETED: 'completed',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled'
};

export const LISTING_STATUS_LIST = Object.values(LISTING_STATUS);

export const RESERVATION_STATUS = {
  PENDING_APPROVAL: 'pending_approval',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
  NO_SHOW: 'no_show',
  EXPIRED: 'expired'
};

export const RESERVATION_STATUS_LIST = Object.values(RESERVATION_STATUS);

export const ALLERGENS = [
  'nuts',
  'dairy',
  'gluten',
  'soy',
  'eggs',
  'fish',
  'shellfish',
  'none'
];

export const DIETARY_TAGS = [
  'vegetarian',
  'vegan',
  'halal',
  'kosher',
  'gluten_free',
  'dairy_free'
];
