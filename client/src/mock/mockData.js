// Realistic Mock Dataset for RescueBite (Phase 1 Frontend Foundation)
// Clearly labeled as simulated demo data

export const MOCK_USERS = [
  {
    id: 'usr_donor_1',
    name: 'Chef Marco Bellini',
    email: 'marco@artisanbistro.com',
    role: 'donor',
    organizationName: 'Artisan Bistro & Bakery',
    phone: '+1 (555) 234-5678',
    avatar: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=150&q=80',
    status: 'active',
    location: { type: 'Point', coordinates: [-73.9851, 40.7484], address: '350 5th Ave, New York, NY 10001' }
  },
  {
    id: 'usr_recip_1',
    name: 'Sarah Jenkins',
    email: 'sarah@hopehaven.org',
    role: 'recipient',
    organizationName: 'Hope Haven Community Shelter',
    orgType: 'shelter',
    verificationStatus: 'approved',
    phone: '+1 (555) 876-5432',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
    status: 'active',
    location: { type: 'Point', coordinates: [-73.9925, 40.7350], address: '120 E 12th St, New York, NY 10003' }
  },
  {
    id: 'usr_vol_1',
    name: 'David Chen',
    email: 'david.chen@greenexpress.io',
    role: 'volunteer',
    organizationName: 'City Green Couriers',
    phone: '+1 (555) 345-6789',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    status: 'active',
    deliveriesCompleted: 42,
    location: { type: 'Point', coordinates: [-73.9780, 40.7580], address: '600 Lexington Ave, New York, NY 10022' }
  },
  {
    id: 'usr_admin_1',
    name: 'Elena Rostova',
    email: 'elena.admin@rescuebite.org',
    role: 'admin',
    organizationName: 'RescueBite Operations Council',
    phone: '+1 (555) 999-0000',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    status: 'active',
    location: { type: 'Point', coordinates: [-73.9850, 40.7480], address: 'RescueBite HQ, New York, NY' }
  }
];

export const INITIAL_LISTINGS = [
  {
    id: 'list_101',
    donorId: 'usr_donor_1',
    donorName: 'Artisan Bistro & Bakery',
    donorVerified: true,
    title: 'Fresh Artisan Sourdough & Croissants Assortment',
    description: 'Surplus morning bake: 18 crusty sourdough loaves and 24 flaky butter croissants. Baked fresh at 5:00 AM, safe and delicious.',
    category: 'bakery',
    quantity: 42,
    quantityRemaining: 26,
    unit: 'packs',
    preparationTime: '2026-10-25T05:00:00Z',
    pickupWindow: {
      startTime: '2026-10-25T14:00:00Z',
      endTime: '2026-10-25T21:00:00Z'
    },
    storageRequirements: 'ambient',
    allergens: ['gluten', 'dairy'],
    dietaryInfo: ['vegetarian'],
    images: [
      'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80'
    ],
    address: '350 5th Ave, New York, NY 10001',
    lat: 40.7484,
    lng: -73.9851,
    status: 'partially_reserved',
    requiresVolunteer: true,
    expiresAt: '2026-10-25T21:00:00Z',
    createdAt: '2026-10-25T07:30:00Z'
  },
  {
    id: 'list_102',
    donorId: 'usr_donor_1',
    donorName: 'Green Leaf Organic Catering',
    donorVerified: true,
    title: 'Steamed Vegetable Medley & Basmati Rice Trays',
    description: 'Three deep steam trays of roasted zucchini, bell peppers, carrots, and saffron basmati rice from corporate lunch event. Chilled immediately in walk-in.',
    category: 'cooked_meals',
    quantity: 35,
    quantityRemaining: 35,
    unit: 'servings',
    preparationTime: '2026-10-25T11:30:00Z',
    pickupWindow: {
      startTime: '2026-10-25T15:00:00Z',
      endTime: '2026-10-25T20:00:00Z'
    },
    storageRequirements: 'refrigerated',
    allergens: ['none'],
    dietaryInfo: ['vegan', 'gluten_free', 'halal'],
    images: [
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80'
    ],
    address: '420 Lexington Ave, New York, NY 10170',
    lat: 40.7516,
    lng: -73.9754,
    status: 'available',
    requiresVolunteer: true,
    expiresAt: '2026-10-25T20:00:00Z',
    createdAt: '2026-10-25T12:00:00Z'
  },
  {
    id: 'list_103',
    donorId: 'usr_donor_2',
    donorName: 'Metro Grocers Market',
    donorVerified: true,
    title: 'Organic Greek Yogurt & Whole Milk Crates',
    description: '14 unopened cases of whole milk and organic plain Greek yogurt. Best by date is in 3 days; commercial cooler stored.',
    category: 'dairy',
    quantity: 28,
    quantityRemaining: 12,
    unit: 'boxes',
    preparationTime: '2026-10-24T18:00:00Z',
    pickupWindow: {
      startTime: '2026-10-25T13:00:00Z',
      endTime: '2026-10-25T19:30:00Z'
    },
    storageRequirements: 'refrigerated',
    allergens: ['dairy'],
    dietaryInfo: ['vegetarian', 'gluten_free'],
    images: [
      'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=800&q=80'
    ],
    address: '88 8th Ave, New York, NY 10011',
    lat: 40.7402,
    lng: -74.0010,
    status: 'partially_reserved',
    requiresVolunteer: false,
    expiresAt: '2026-10-25T19:30:00Z',
    createdAt: '2026-10-25T08:15:00Z'
  },
  {
    id: 'list_104',
    donorId: 'usr_donor_3',
    donorName: 'Sunny Valley Farm Stand',
    donorVerified: true,
    title: 'Crisp Honeycrisp Apples & Heirloom Pears',
    description: 'Bumper harvest surplus: 5 wooden bushel crates of crisp apples and sweet ripe pears. Perfect for family distribution or community snacks.',
    category: 'produce',
    quantity: 50,
    quantityRemaining: 50,
    unit: 'kg',
    preparationTime: '2026-10-24T09:00:00Z',
    pickupWindow: {
      startTime: '2026-10-25T12:00:00Z',
      endTime: '2026-10-25T22:00:00Z'
    },
    storageRequirements: 'ambient',
    allergens: ['none'],
    dietaryInfo: ['vegan', 'kosher', 'halal', 'gluten_free'],
    images: [
      'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=800&q=80'
    ],
    address: '200 Park Ave, New York, NY 10166',
    lat: 40.7538,
    lng: -73.9772,
    status: 'available',
    requiresVolunteer: true,
    expiresAt: '2026-10-25T22:00:00Z',
    createdAt: '2026-10-25T09:00:00Z'
  },
  {
    id: 'list_105',
    donorId: 'usr_donor_1',
    donorName: 'Artisan Bistro & Bakery',
    donorVerified: true,
    title: 'Pre-packaged Gourmet Salad Bowls & Wraps',
    description: '15 Caesar salads with house-made dressing and 10 Mediterranean falafel wraps. Made fresh this morning for catering order cancelled at noon.',
    category: 'packaged_goods',
    quantity: 25,
    quantityRemaining: 25,
    unit: 'packs',
    preparationTime: '2026-10-25T10:00:00Z',
    pickupWindow: {
      startTime: '2026-10-25T14:30:00Z',
      endTime: '2026-10-25T18:30:00Z'
    },
    storageRequirements: 'refrigerated',
    allergens: ['dairy', 'gluten', 'eggs'],
    dietaryInfo: ['vegetarian'],
    images: [
      'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80'
    ],
    address: '350 5th Ave, New York, NY 10001',
    lat: 40.7484,
    lng: -73.9851,
    status: 'available',
    requiresVolunteer: false,
    expiresAt: '2026-10-25T18:30:00Z',
    createdAt: '2026-10-25T12:30:00Z'
  }
];

export const INITIAL_RESERVATIONS = [
  {
    id: 'res_201',
    listingId: 'list_101',
    listingTitle: 'Fresh Artisan Sourdough & Croissants Assortment',
    donorName: 'Artisan Bistro & Bakery',
    donorAddress: '350 5th Ave, New York, NY 10001',
    recipientId: 'usr_recip_1',
    recipientName: 'Sarah Jenkins',
    organizationName: 'Hope Haven Community Shelter',
    recipientAddress: '120 E 12th St, New York, NY 10003',
    quantityReserved: 16,
    unit: 'packs',
    status: 'approved',
    pickupDeadline: '2026-10-25T18:00:00Z',
    pickupCode: 'RB-7492',
    deliveryCode: 'RB-3810',
    taskId: 'task_301',
    createdAt: '2026-10-25T08:00:00Z'
  },
  {
    id: 'res_202',
    listingId: 'list_103',
    listingTitle: 'Organic Greek Yogurt & Whole Milk Crates',
    donorName: 'Metro Grocers Market',
    donorAddress: '88 8th Ave, New York, NY 10011',
    recipientId: 'usr_recip_1',
    recipientName: 'Sarah Jenkins',
    organizationName: 'Hope Haven Community Shelter',
    recipientAddress: '120 E 12th St, New York, NY 10003',
    quantityReserved: 16,
    unit: 'boxes',
    status: 'pending_approval',
    pickupDeadline: '2026-10-25T19:00:00Z',
    pickupCode: 'RB-9104',
    deliveryCode: 'RB-6621',
    taskId: null,
    createdAt: '2026-10-25T11:45:00Z'
  }
];

export const INITIAL_TASKS = [
  {
    id: 'task_301',
    reservationId: 'res_201',
    listingTitle: 'Fresh Artisan Sourdough & Croissants Assortment',
    donorName: 'Artisan Bistro & Bakery',
    pickupAddress: '350 5th Ave, New York, NY 10001',
    recipientName: 'Hope Haven Community Shelter',
    deliveryAddress: '120 E 12th St, New York, NY 10003',
    distanceMiles: 1.4,
    quantityText: '16 packs (approx. 18 kg)',
    storageRequirements: 'ambient',
    assignedVolunteerId: 'usr_vol_1',
    volunteerName: 'David Chen',
    status: 'assigned', // 'unassigned', 'assigned', 'en_route_pickup', 'picked_up', 'delivered'
    pickupVerificationCode: 'RB-7492',
    deliveryVerificationCode: 'RB-3810',
    tempLogs: [],
    createdAt: '2026-10-25T08:15:00Z'
  },
  {
    id: 'task_302',
    reservationId: 'res_temp_1',
    listingTitle: 'Steamed Vegetable Medley & Basmati Rice Trays',
    donorName: 'Green Leaf Organic Catering',
    pickupAddress: '420 Lexington Ave, New York, NY 10170',
    recipientName: 'Bowery Mission Dining Hall',
    deliveryAddress: '227 Bowery, New York, NY 10002',
    distanceMiles: 2.3,
    quantityText: '35 servings (cold-chain insulated box)',
    storageRequirements: 'refrigerated',
    assignedVolunteerId: null,
    volunteerName: null,
    status: 'unassigned',
    pickupVerificationCode: 'RB-4418',
    deliveryVerificationCode: 'RB-9023',
    tempLogs: [],
    createdAt: '2026-10-25T12:10:00Z'
  }
];

export const INITIAL_ORGANIZATIONS = [
  {
    id: 'org_1',
    name: 'Hope Haven Community Shelter',
    type: 'shelter',
    registrationNumber: 'EIN-84-9281742',
    contactEmail: 'contact@hopehaven.org',
    contactPhone: '+1 (555) 876-5432',
    address: '120 E 12th St, New York, NY 10003',
    verificationStatus: 'approved',
    verificationDocuments: [
      { title: '501(c)(3) IRS Determination Letter', url: '#', uploadedAt: '2026-09-12' },
      { title: 'NYC Food Facility Permit', url: '#', uploadedAt: '2026-09-12' }
    ],
    submittedAt: '2026-09-12T10:00:00Z',
    reviewedAt: '2026-09-13T14:30:00Z',
    reviewNotes: 'Verified with state non-profit registry and health board.'
  },
  {
    id: 'org_2',
    name: 'Downtown East Community Pantry',
    type: 'community_pantry',
    registrationNumber: 'EIN-12-3498102',
    contactEmail: 'pantry@downtowneast.org',
    contactPhone: '+1 (555) 332-9011',
    address: '45 Avenue B, New York, NY 10009',
    verificationStatus: 'pending',
    verificationDocuments: [
      { title: 'Certificate of Incorporation.pdf', url: '#', uploadedAt: '2026-10-23' },
      { title: 'Warehouse Sanitation Certificate.pdf', url: '#', uploadedAt: '2026-10-23' }
    ],
    submittedAt: '2026-10-23T16:20:00Z',
    reviewedAt: null,
    reviewNotes: ''
  },
  {
    id: 'org_3',
    name: 'Harbor Light Youth Center & Kitchen',
    type: 'soup_kitchen',
    registrationNumber: 'EIN-99-1029384',
    contactEmail: 'kitchen@harborlight.org',
    contactPhone: '+1 (555) 674-8890',
    address: '312 W 14th St, New York, NY 10014',
    verificationStatus: 'pending',
    verificationDocuments: [
      { title: 'Tax_Exempt_Status_Notice.pdf', url: '#', uploadedAt: '2026-10-24' }
    ],
    submittedAt: '2026-10-24T09:15:00Z',
    reviewedAt: null,
    reviewNotes: ''
  }
];

export const INITIAL_NOTIFICATIONS = [
  {
    id: 'notif_1',
    targetUserId: 'usr_donor_1',
    title: 'New Reservation Request',
    message: 'Hope Haven Community Shelter requested 16 packs of Fresh Artisan Sourdough.',
    time: '2 hours ago',
    read: false,
    link: '/donor/reservations'
  },
  {
    id: 'notif_2',
    targetUserId: 'usr_recip_1',
    title: 'Reservation Approved!',
    message: 'Artisan Bistro approved your reservation for 16 packs. Pickup code: RB-7492.',
    time: '3 hours ago',
    read: false,
    link: '/recipient/reservations'
  },
  {
    id: 'notif_3',
    targetUserId: 'usr_vol_1',
    title: 'New Volunteer Delivery Available',
    message: 'A nearby delivery from Green Leaf Catering needs a courier (2.3 miles).',
    time: '15 mins ago',
    read: false,
    link: '/volunteer/board'
  },
  {
    id: 'notif_4',
    targetUserId: 'usr_admin_1',
    title: 'New Organization Verification Pending',
    message: 'Downtown East Community Pantry submitted 2 verification documents for review.',
    time: '1 day ago',
    read: false,
    link: '/admin/verifications'
  }
];

export const INITIAL_REPORTS = [
  {
    id: 'rep_501',
    reporterName: 'Hope Haven Community Shelter',
    targetType: 'listing',
    targetTitle: 'Expired Dairy Batch from North Wholesalers',
    reason: 'food_safety_hazard',
    description: 'Milk bottles were discovered at ambient 22°C temperature upon arrival despite being marked refrigerated.',
    status: 'open',
    severity: 'high',
    createdAt: '2026-10-24T14:30:00Z'
  },
  {
    id: 'rep_502',
    reporterName: 'Midtown Bakery Co.',
    targetType: 'user',
    targetTitle: 'No-show by Unregistered Volunteer',
    reason: 'no_show',
    description: 'Volunteer claimed task but failed to show up during the 2-hour pickup window.',
    status: 'resolved',
    severity: 'medium',
    adminNotes: 'Volunteer re-assigned, issued conduct reminder.',
    createdAt: '2026-10-22T19:00:00Z'
  }
];

export const INITIAL_AUDIT_LOGS = [
  {
    id: 'aud_1',
    action: 'ORGANIZATION_APPROVED',
    performedBy: 'Elena Rostova (Admin)',
    entityType: 'Organization',
    entityId: 'org_1',
    details: 'Approved Hope Haven Community Shelter following permit verification.',
    timestamp: '2026-10-24T14:32:00Z',
    ipAddress: '192.168.1.104'
  },
  {
    id: 'aud_2',
    action: 'LISTING_PUBLISHED',
    performedBy: 'Chef Marco Bellini (Donor)',
    entityType: 'FoodListing',
    entityId: 'list_101',
    details: 'Published 42 packs of Fresh Artisan Sourdough & Croissants.',
    timestamp: '2026-10-25T07:30:00Z',
    ipAddress: '192.168.1.205'
  },
  {
    id: 'aud_3',
    action: 'RESERVATION_CONFIRMED',
    performedBy: 'Chef Marco Bellini (Donor)',
    entityType: 'Reservation',
    entityId: 'res_201',
    details: 'Confirmed reservation for 16 packs by Hope Haven Community Shelter.',
    timestamp: '2026-10-25T08:15:00Z',
    ipAddress: '192.168.1.205'
  },
  {
    id: 'aud_4',
    action: 'TASK_CLAIMED',
    performedBy: 'David Chen (Volunteer)',
    entityType: 'PickupTask',
    entityId: 'task_301',
    details: 'Claimed delivery task for Sourdough Assortment.',
    timestamp: '2026-10-25T08:16:00Z',
    ipAddress: '192.168.1.88'
  }
];

// Impact telemetry (Simulated dataset clearly marked as demo)
export const DEMO_IMPACT_METRICS = {
  isSimulatedDemoData: true,
  totalRescuedKg: 3840,
  mealsRedistributed: 9150,
  co2EquivalentSavedKg: 9600,
  participatingDonors: 48,
  recipientOrganizations: 32,
  activeVolunteers: 64,
  monthlyTrend: [
    { month: 'May', rescuedKg: 420, meals: 1000 },
    { month: 'Jun', rescuedKg: 580, meals: 1380 },
    { month: 'Jul', rescuedKg: 710, meals: 1700 },
    { month: 'Aug', rescuedKg: 850, meals: 2020 },
    { month: 'Sep', rescuedKg: 1040, meals: 2480 },
    { month: 'Oct', rescuedKg: 1240, meals: 2950 }
  ],
  categoryBreakdown: [
    { name: 'Cooked Meals', value: 35, color: '#10b981' },
    { name: 'Bakery & Bread', value: 25, color: '#f59e0b' },
    { name: 'Fresh Produce', value: 22, color: '#34d399' },
    { name: 'Dairy Products', value: 12, color: '#06b6d4' },
    { name: 'Packaged Goods', value: 6, color: '#8b5cf6' }
  ]
};
