import mongoose from 'mongoose';
import { User } from '../src/models/User.js';
import { Organization } from '../src/models/Organization.js';
import { FoodListing } from '../src/models/FoodListing.js';
import { Reservation } from '../src/models/Reservation.js';
import { PickupTask, TASK_STATUS } from '../src/models/PickupTask.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { ENV } from '../src/config/env.js';
import { ROLES } from '../src/constants/roles.js';
import { VERIFICATION_STATUS } from '../src/constants/orgStatus.js';
import { LISTING_STATUS, RESERVATION_STATUS } from '../src/constants/listingConstants.js';
import { hashVerificationCode } from '../src/utils/codeHasher.js';

const DEMO_PASSWORD = process.env.DEMO_USER_PASSWORD || 'DemoPassword123!';

export const seedDemoData = async () => {
  const stats = {
    users: { inserted: 0, updated: 0 },
    organizations: { inserted: 0, updated: 0 },
    listings: { inserted: 0, updated: 0 },
    reservations: { inserted: 0, updated: 0 },
    tasks: { inserted: 0, updated: 0 }
  };

  try {
    console.log('[RescueBite Demo Seeder] Initializing database connection...');
    const conn = await connectDB();

    const dbName = conn.connection.name;
    const expectedDbName = ENV.MONGODB_DB_NAME || 'rescuebite';
    if (dbName !== expectedDbName && !dbName.includes('rescuebite')) {
      console.warn(`[Safety Check] Active database is '${dbName}', expected '${expectedDbName}'. Proceeding with non-destructive upsert.`);
    }

    console.log(`[RescueBite Demo Seeder] Targeting database '${dbName}'. Non-destructive upsert mode active (zero data will be deleted).`);

    const passwordHash = await User.hashPassword(DEMO_PASSWORD);

    // -------------------------------------------------------------
    // 1. Seed Demo Donors (Indian Cities)
    // -------------------------------------------------------------
    const demoDonors = [
      {
        name: 'Chef Rajesh Khanna',
        email: 'rajesh.mumbai@demo-rescuebite.org',
        phone: '+91 98200 11223',
        city: 'Mumbai',
        state: 'Maharashtra',
        street: 'Hill Road, Bandra West',
        coordinates: [72.8295, 19.0596],
        orgName: 'Bandra Artisanal Bakery & Patisserie',
        orgType: 'restaurant',
        orgReg: 'MH-MUM-2023-BAKERY'
      },
      {
        name: 'Simran Walia',
        email: 'simran.delhi@demo-rescuebite.org',
        phone: '+91 98111 22334',
        city: 'New Delhi',
        state: 'Delhi',
        street: 'Barakhamba Road, Connaught Place',
        coordinates: [77.2167, 28.6315],
        orgName: 'Connaught Place Community Kitchen',
        orgType: 'caterer',
        orgReg: 'DL-CP-2022-KITCHEN'
      },
      {
        name: 'Karthik Raman',
        email: 'karthik.blr@demo-rescuebite.org',
        phone: '+91 98450 33445',
        city: 'Bengaluru',
        state: 'Karnataka',
        street: '100ft Road, Indiranagar',
        coordinates: [77.6412, 12.9784],
        orgName: 'Indiranagar Harvest Bistro',
        orgType: 'restaurant',
        orgReg: 'KA-BLR-2021-BISTRO'
      },
      {
        name: 'Meenakshi Sundaram',
        email: 'meenakshi.chennai@demo-rescuebite.org',
        phone: '+91 98400 44556',
        city: 'Chennai',
        state: 'Tamil Nadu',
        street: '2nd Avenue, Anna Nagar',
        coordinates: [80.2101, 13.0850],
        orgName: 'Anna Nagar Feast Caterers',
        orgType: 'caterer',
        orgReg: 'TN-CHN-2023-FEAST'
      },
      {
        name: 'Anand Deshmukh',
        email: 'anand.pune@demo-rescuebite.org',
        phone: '+91 98900 55667',
        city: 'Pune',
        state: 'Maharashtra',
        street: 'East Avenue, Kalyani Nagar',
        coordinates: [73.9022, 18.5482],
        orgName: 'Kalyani Nagar Organic Mart',
        orgType: 'grocery',
        orgReg: 'MH-PUN-2024-ORGANIC'
      }
    ];

    const seededDonorUsers = [];
    const seededDonorOrgs = [];

    for (const d of demoDonors) {
      let user = await User.findOne({ email: d.email });
      if (user) {
        user.name = d.name;
        user.phone = d.phone;
        user.status = 'active';
        user.role = ROLES.DONOR;
        user.isDemo = true;
        user.location = { type: 'Point', coordinates: d.coordinates };
        await user.save();
        stats.users.updated++;
      } else {
        user = await User.create({
          name: d.name,
          email: d.email,
          passwordHash,
          phone: d.phone,
          role: ROLES.DONOR,
          status: 'active',
          isDemo: true,
          location: { type: 'Point', coordinates: d.coordinates },
          address: { street: d.street, city: d.city, state: d.state, postalCode: '400050' }
        });
        stats.users.inserted++;
      }
      seededDonorUsers.push(user);

      // Org Upsert
      let org = await Organization.findOne({ name: d.orgName });
      if (org) {
        org.ownerId = user._id;
        org.verificationStatus = VERIFICATION_STATUS.APPROVED;
        org.isDemo = true;
        org.location = { type: 'Point', coordinates: d.coordinates };
        await org.save();
        stats.organizations.updated++;
      } else {
        org = await Organization.create({
          name: d.orgName,
          type: d.orgType,
          registrationNumber: d.orgReg,
          contactEmail: d.email,
          contactPhone: d.phone,
          address: { street: d.street, city: d.city, state: d.state, postalCode: '400050' },
          location: { type: 'Point', coordinates: d.coordinates },
          ownerId: user._id,
          verificationStatus: VERIFICATION_STATUS.APPROVED,
          isDemo: true
        });
        stats.organizations.inserted++;
      }
      user.organizationId = org._id;
      await user.save();
      seededDonorOrgs.push(org);
    }

    // -------------------------------------------------------------
    // 2. Seed Demo Recipient Organizations (Indian NGOs)
    // -------------------------------------------------------------
    const demoRecipients = [
      {
        name: 'Sunita Patil',
        email: 'sunita.seva@demo-rescuebite.org',
        phone: '+91 98205 66778',
        city: 'Mumbai',
        state: 'Maharashtra',
        street: 'Dadar East, Near Railway Station',
        coordinates: [72.8420, 19.0200],
        orgName: 'Seva Food Relief Foundation',
        orgType: 'food_bank',
        orgReg: 'NGO-MH-2019-SEVA'
      },
      {
        name: 'Arjun Mehra',
        email: 'arjun.robin@demo-rescuebite.org',
        phone: '+91 98115 77889',
        city: 'New Delhi',
        state: 'Delhi',
        street: 'Ring Road, Lajpat Nagar',
        coordinates: [77.2400, 28.5700],
        orgName: 'Robin Compassion Food Network',
        orgType: 'soup_kitchen',
        orgReg: 'NGO-DL-2020-ROBIN'
      },
      {
        name: 'Lakshmi Narayan',
        email: 'lakshmi.feed@demo-rescuebite.org',
        phone: '+91 98455 88990',
        city: 'Bengaluru',
        state: 'Karnataka',
        street: '80ft Road, Koramangala 4th Block',
        coordinates: [77.6250, 12.9350],
        orgName: 'FeedTheNeedy Karnataka Trust',
        orgType: 'shelter',
        orgReg: 'NGO-KA-2018-FEED'
      },
      {
        name: 'Fatima Begum',
        email: 'fatima.relief@demo-rescuebite.org',
        phone: '+91 98495 99001',
        city: 'Hyderabad',
        state: 'Telangana',
        street: 'Charminar Road, Old City',
        coordinates: [78.4744, 17.3616],
        orgName: 'Akshaya Shelter Foundation Hyderabad',
        orgType: 'community_pantry',
        orgReg: 'NGO-TS-2021-AKSHAYA'
      }
    ];

    const seededRecipientUsers = [];
    const seededRecipientOrgs = [];

    for (const r of demoRecipients) {
      let user = await User.findOne({ email: r.email });
      if (user) {
        user.name = r.name;
        user.phone = r.phone;
        user.status = 'active';
        user.role = ROLES.RECIPIENT;
        user.isDemo = true;
        user.location = { type: 'Point', coordinates: r.coordinates };
        await user.save();
        stats.users.updated++;
      } else {
        user = await User.create({
          name: r.name,
          email: r.email,
          passwordHash,
          phone: r.phone,
          role: ROLES.RECIPIENT,
          status: 'active',
          isDemo: true,
          location: { type: 'Point', coordinates: r.coordinates },
          address: { street: r.street, city: r.city, state: r.state, postalCode: '110024' }
        });
        stats.users.inserted++;
      }
      seededRecipientUsers.push(user);

      let org = await Organization.findOne({ name: r.orgName });
      if (org) {
        org.ownerId = user._id;
        org.verificationStatus = VERIFICATION_STATUS.APPROVED;
        org.isDemo = true;
        org.location = { type: 'Point', coordinates: r.coordinates };
        await org.save();
        stats.organizations.updated++;
      } else {
        org = await Organization.create({
          name: r.orgName,
          type: r.orgType,
          registrationNumber: r.orgReg,
          contactEmail: r.email,
          contactPhone: r.phone,
          address: { street: r.street, city: r.city, state: r.state, postalCode: '110024' },
          location: { type: 'Point', coordinates: r.coordinates },
          ownerId: user._id,
          verificationStatus: VERIFICATION_STATUS.APPROVED,
          isDemo: true
        });
        stats.organizations.inserted++;
      }
      user.organizationId = org._id;
      await user.save();
      seededRecipientOrgs.push(org);
    }

    // -------------------------------------------------------------
    // 3. Seed Demo Volunteers
    // -------------------------------------------------------------
    const demoVolunteers = [
      {
        name: 'Rohan Sharma',
        email: 'rohan.volunteer@demo-rescuebite.org',
        phone: '+91 98209 11002',
        coordinates: [72.8350, 19.0500]
      },
      {
        name: 'Priya Nair',
        email: 'priya.volunteer@demo-rescuebite.org',
        phone: '+91 98459 22003',
        coordinates: [77.6300, 12.9700]
      },
      {
        name: 'Amit Verma',
        email: 'amit.volunteer@demo-rescuebite.org',
        phone: '+91 98119 33004',
        coordinates: [77.2100, 28.6200]
      }
    ];

    const seededVolunteers = [];
    for (const v of demoVolunteers) {
      let vol = await User.findOne({ email: v.email });
      if (vol) {
        vol.name = v.name;
        vol.phone = v.phone;
        vol.role = ROLES.VOLUNTEER;
        vol.status = 'active';
        vol.isDemo = true;
        vol.location = { type: 'Point', coordinates: v.coordinates };
        await vol.save();
        stats.users.updated++;
      } else {
        vol = await User.create({
          name: v.name,
          email: v.email,
          passwordHash,
          phone: v.phone,
          role: ROLES.VOLUNTEER,
          status: 'active',
          isDemo: true,
          location: { type: 'Point', coordinates: v.coordinates }
        });
        stats.users.inserted++;
      }
      seededVolunteers.push(vol);
    }

    // -------------------------------------------------------------
    // 3b. Seed Platform Administrator
    // -------------------------------------------------------------
    let adminUser = await User.findOne({ email: 'superadmin@rescuebite.org' });
    if (adminUser) {
      adminUser.name = 'Platform Admin';
      adminUser.role = ROLES.ADMIN;
      adminUser.status = 'active';
      adminUser.passwordHash = passwordHash;
      adminUser.isDemo = true;
      await adminUser.save();
      stats.users.updated++;
    } else {
      adminUser = await User.create({
        name: 'Platform Admin',
        email: 'superadmin@rescuebite.org',
        passwordHash,
        phone: '+91 99999 00000',
        role: ROLES.ADMIN,
        status: 'active',
        isDemo: true
      });
      stats.users.inserted++;
    }
    // 4. Seed Surplus Food Listings (GeoJSON across India)
    // -------------------------------------------------------------
    const now = Date.now();
    const demoListingsData = [
      {
        donorIndex: 0, // Mumbai Bakery
        title: 'Freshly Baked Whole Wheat Loaves & Croissants',
        description: 'Surplus artisanal sourdough loaves and freshly baked butter croissants from today morning shift.',
        category: 'bakery',
        quantity: 35,
        unit: 'packs',
        storageRequirements: 'ambient',
        allergens: ['gluten', 'dairy'],
        dietaryInfo: ['vegetarian'],
        coordinates: [72.8295, 19.0596],
        images: [{ url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80' }]
      },
      {
        donorIndex: 1, // Delhi CP Kitchen
        title: 'Nutritious Vegetable Biryani & Dal Makhani Trays',
        description: 'Hot holding nutritious vegetable biryani and slow-cooked dal makhani prepared for corporate event lunch.',
        category: 'cooked_meals',
        quantity: 50,
        unit: 'servings',
        storageRequirements: 'hot_holding',
        allergens: ['dairy'],
        dietaryInfo: ['vegetarian', 'halal'],
        coordinates: [77.2167, 28.6315],
        images: [{ url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80' }]
      },
      {
        donorIndex: 2, // Bengaluru Bistro
        title: 'Organic Fresh Spinach & Farm Vegetable Crates',
        description: 'Hydroponic crisp spinach leaves, carrots, and sweet bell peppers from local Karnataka farmer collective.',
        category: 'produce',
        quantity: 40,
        unit: 'kg',
        storageRequirements: 'ambient',
        allergens: ['none'],
        dietaryInfo: ['vegan', 'gluten_free'],
        coordinates: [77.6412, 12.9784],
        images: [{ url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80' }]
      },
      {
        donorIndex: 3, // Chennai Caterers
        title: 'Traditional Sambar, Rice & Steamed Idli Breakfast Sets',
        description: 'Hygienically packed breakfast meals with fresh coconut chutney and piping hot drumstick sambar.',
        category: 'cooked_meals',
        quantity: 45,
        unit: 'servings',
        storageRequirements: 'hot_holding',
        allergens: ['none'],
        dietaryInfo: ['vegan', 'halal'],
        coordinates: [80.2101, 13.0850],
        images: [{ url: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80' }]
      },
      {
        donorIndex: 4, // Pune Organic Mart
        title: 'Chilled Artisanal Paneer & Dairy Packets',
        description: 'Vacuum-sealed pure malai paneer blocks and certified pasteurized milk packets stored under 4°C.',
        category: 'dairy',
        quantity: 25,
        unit: 'kg',
        storageRequirements: 'refrigerated',
        allergens: ['dairy'],
        dietaryInfo: ['vegetarian', 'gluten_free'],
        coordinates: [73.9022, 18.5482],
        images: [{ url: 'https://images.unsplash.com/photo-1528750997573-59b89d56f4f7?auto=format&fit=crop&w=600&q=80' }]
      }
    ];

    const seededListings = [];
    for (const item of demoListingsData) {
      const donorUser = seededDonorUsers[item.donorIndex];
      const donorOrg = seededDonorOrgs[item.donorIndex];

      let listing = await FoodListing.findOne({ title: item.title, isDemo: true });
      const expiresAt = new Date(now + 12 * 3600 * 1000); // 12 hours from now

      if (listing) {
        listing.quantityRemaining = item.quantity;
        listing.status = LISTING_STATUS.AVAILABLE;
        listing.expiresAt = expiresAt;
        listing.location = { type: 'Point', coordinates: item.coordinates };
        await listing.save();
        stats.listings.updated++;
      } else {
        listing = await FoodListing.create({
          title: item.title,
          description: item.description,
          category: item.category,
          quantity: item.quantity,
          quantityRemaining: item.quantity,
          unit: item.unit,
          preparationTime: new Date(now - 2 * 3600 * 1000),
          pickupWindow: {
            startTime: new Date(now + 3600 * 1000),
            endTime: expiresAt
          },
          storageRequirements: item.storageRequirements,
          allergens: item.allergens,
          dietaryInfo: item.dietaryInfo,
          images: item.images,
          donorId: donorUser._id,
          organizationId: donorOrg._id,
          donorName: donorOrg.name,
          address: donorOrg.address,
          location: { type: 'Point', coordinates: item.coordinates },
          status: LISTING_STATUS.AVAILABLE,
          expiresAt,
          isDemo: true
        });
        stats.listings.inserted++;
      }
      seededListings.push(listing);
    }

    // -------------------------------------------------------------
    // 5. Seed Demo Reservations & Verified Completed Workflows (Analytics)
    // -------------------------------------------------------------
    // Case A: Completed reservation with delivered task (Produces verified scale analytics)
    const mumbaiListing = seededListings[0];
    const mumbaiRecipient = seededRecipientUsers[0];
    const mumbaiOrg = seededRecipientOrgs[0];
    const mumbaiVol = seededVolunteers[0];

    let completedRes = await Reservation.findOne({
      listingId: mumbaiListing._id,
      recipientId: mumbaiRecipient._id,
      isDemo: true
    });

    if (!completedRes) {
      completedRes = await Reservation.create({
        listingId: mumbaiListing._id,
        listingTitle: mumbaiListing.title,
        donorId: mumbaiListing.donorId,
        donorName: mumbaiListing.donorName,
        recipientId: mumbaiRecipient._id,
        organizationId: mumbaiOrg._id,
        organizationName: mumbaiOrg.name,
        quantityReserved: 15,
        unit: mumbaiListing.unit,
        status: RESERVATION_STATUS.COMPLETED,
        pickupDeadline: new Date(now - 1 * 3600 * 1000),
        pickupCode: 'RB-1001',
        deliveryCode: 'RB-1002',
        recipientNotes: 'Delivered to Bandra community shelter distribution drive',
        isDemo: true
      });
      stats.reservations.inserted++;

      // Create linked completed PickupTask with verified actualRescuedKg
      let task = await PickupTask.findOne({ reservationId: completedRes._id, isDemo: true });
      if (!task) {
        await PickupTask.create({
          reservationId: completedRes._id,
          listingId: mumbaiListing._id,
          listingTitle: mumbaiListing.title,
          donorId: mumbaiListing.donorId,
          donorName: mumbaiListing.donorName,
          pickupAddress: mumbaiListing.address,
          recipientId: mumbaiRecipient._id,
          recipientName: mumbaiOrg.name,
          deliveryAddress: mumbaiOrg.address,
          volunteerId: mumbaiVol._id,
          volunteerName: mumbaiVol.name,
          status: TASK_STATUS.DELIVERED,
          pickupCodeHash: hashVerificationCode('RB-1001'),
          deliveryCodeHash: hashVerificationCode('RB-1002'),
          pickupCodeExpiresAt: new Date(now + 8 * 3600 * 1000),
          deliveryCodeExpiresAt: new Date(now + 8 * 3600 * 1000),
          pickupCodeUsed: true,
          deliveryCodeUsed: true,
          actualRescuedKg: 14.8, // Verified scale measurement!
          distanceMiles: 2.1,
          quantityText: '15 packs',
          storageRequirements: 'ambient',
          tempLogs: [{ stage: 'pickup', temperatureCelsius: 22.0, recordedAt: new Date(now - 2 * 3600 * 1000), notes: 'Good condition' }],
          pickedUpAt: new Date(now - 2 * 3600 * 1000),
          deliveredAt: new Date(now - 1 * 3600 * 1000),
          isDemo: true
        });
        stats.tasks.inserted++;
      }
    }

    // Case B: Active approved reservation with courier task in transit
    const delhiListing = seededListings[1];
    const delhiRecipient = seededRecipientUsers[1];
    const delhiOrg = seededRecipientOrgs[1];
    const delhiVol = seededVolunteers[2];

    let activeRes = await Reservation.findOne({
      listingId: delhiListing._id,
      recipientId: delhiRecipient._id,
      isDemo: true
    });

    if (!activeRes) {
      activeRes = await Reservation.create({
        listingId: delhiListing._id,
        listingTitle: delhiListing.title,
        donorId: delhiListing.donorId,
        donorName: delhiListing.donorName,
        recipientId: delhiRecipient._id,
        organizationId: delhiOrg._id,
        organizationName: delhiOrg.name,
        quantityReserved: 20,
        unit: delhiListing.unit,
        status: RESERVATION_STATUS.APPROVED,
        pickupDeadline: new Date(now + 4 * 3600 * 1000),
        pickupCode: 'RB-2001',
        deliveryCode: 'RB-2002',
        recipientNotes: 'Lajpat Nagar community meal distribution program',
        isDemo: true
      });
      stats.reservations.inserted++;

      let activeTask = await PickupTask.findOne({ reservationId: activeRes._id, isDemo: true });
      if (!activeTask) {
        await PickupTask.create({
          reservationId: activeRes._id,
          listingId: delhiListing._id,
          listingTitle: delhiListing.title,
          donorId: delhiListing.donorId,
          donorName: delhiListing.donorName,
          pickupAddress: delhiListing.address,
          recipientId: delhiRecipient._id,
          recipientName: delhiOrg.name,
          deliveryAddress: delhiOrg.address,
          volunteerId: delhiVol._id,
          volunteerName: delhiVol.name,
          status: TASK_STATUS.ASSIGNED,
          pickupCodeHash: hashVerificationCode('RB-2001'),
          deliveryCodeHash: hashVerificationCode('RB-2002'),
          pickupCodeExpiresAt: new Date(now + 6 * 3600 * 1000),
          deliveryCodeExpiresAt: new Date(now + 6 * 3600 * 1000),
          distanceMiles: 3.4,
          quantityText: '20 servings',
          storageRequirements: 'hot_holding',
          isDemo: true
        });
        stats.tasks.inserted++;
      }
    }

    console.log('\n=============================================================');
    console.log('   RESCUEBITE DEMO DATA SEEDED SAFELY (INDIA REGION)');
    console.log('=============================================================');
    console.log(`Users:         ${stats.users.inserted} inserted, ${stats.users.updated} updated`);
    console.log(`Organizations: ${stats.organizations.inserted} inserted, ${stats.organizations.updated} updated`);
    console.log(`Food Listings: ${stats.listings.inserted} inserted, ${stats.listings.updated} updated`);
    console.log(`Reservations:  ${stats.reservations.inserted} inserted, ${stats.reservations.updated} updated`);
    console.log(`Pickup Tasks:  ${stats.tasks.inserted} inserted, ${stats.tasks.updated} updated`);
    console.log('Note: Zero non-demo data was removed. All records marked isDemo: true.');
    console.log('Demo Account Password for all seeded users: ' + DEMO_PASSWORD);
    console.log('=============================================================\n');

    return stats;
  } catch (err) {
    console.error('[RescueBite Demo Seeder] Error during seed:', err.message);
    throw err;
  } finally {
    if (process.env.NODE_ENV !== 'test') {
      await disconnectDB();
    }
  }
};

// Standalone execution check
if (process.argv[1]?.endsWith('seedDemoIndia.js') || process.argv[1]?.endsWith('seed.js')) {
  seedDemoData()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
