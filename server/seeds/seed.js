import mongoose from 'mongoose';
import { User } from '../src/models/User.js';
import { Organization } from '../src/models/Organization.js';
import { AuditLog } from '../src/models/AuditLog.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { ROLES } from '../src/constants/roles.js';
import { VERIFICATION_STATUS } from '../src/constants/orgStatus.js';

const DEMO_PASSWORD = 'DemoPassword123!';

const seedDatabase = async () => {
  try {
    console.log('[Seed] Connecting to MongoDB...');
    await connectDB();

    console.log('[Seed] Clearing existing collections (User, Organization, AuditLog)...');
    await Promise.all([
      User.deleteMany({}),
      Organization.deleteMany({}),
      AuditLog.deleteMany({})
    ]);

    const passwordHash = await User.hashPassword(DEMO_PASSWORD);

    // 1. Seed Administrator
    console.log('[Seed] Creating Administrator...');
    const admin = await User.create({
      name: 'Elena Rostova',
      email: 'admin.elena@rescuebite.local',
      passwordHash,
      role: ROLES.ADMIN,
      phone: '+1 (555) 000-9999',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      status: 'active',
      location: { type: 'Point', coordinates: [-73.9850, 40.7480] }
    });

    // 2. Seed Donor & Organization
    console.log('[Seed] Creating Verified Donor...');
    const donor = await User.create({
      name: 'Chef Marco Bellini',
      email: 'marco.donor@artisanbistro.local',
      passwordHash,
      role: ROLES.DONOR,
      phone: '+1 (555) 234-5678',
      avatar: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=150&q=80',
      status: 'active',
      location: { type: 'Point', coordinates: [-73.9851, 40.7484] }
    });

    const donorOrg = await Organization.create({
      name: 'Artisan Bistro & Bakery',
      type: 'restaurant',
      registrationNumber: 'NYC-BIZ-89104',
      taxId: 'EIN-11-2233445',
      contactEmail: 'marco.donor@artisanbistro.local',
      contactPhone: '+1 (555) 234-5678',
      address: {
        street: '350 5th Ave',
        city: 'New York',
        state: 'NY',
        postalCode: '10001'
      },
      location: { type: 'Point', coordinates: [-73.9851, 40.7484] },
      ownerId: donor._id,
      verificationStatus: VERIFICATION_STATUS.APPROVED,
      verificationDocuments: [
        {
          title: 'NYC Commercial Food Handler Permit',
          url: 'https://storage.rescuebite.local/docs/food_permit_artisan.pdf',
          documentType: 'food_facility_license'
        }
      ],
      reviewedBy: admin._id,
      reviewNotes: 'Verified commercial kitchen and NYC health permit.',
      reviewedAt: new Date()
    });

    donor.organizationId = donorOrg._id;
    await donor.save();

    // 3. Seed Verified Recipient & Organization
    console.log('[Seed] Creating Verified Recipient Organization...');
    const recipient = await User.create({
      name: 'Sarah Jenkins',
      email: 'sarah.recipient@hopehaven.local',
      passwordHash,
      role: ROLES.RECIPIENT,
      phone: '+1 (555) 876-5432',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
      status: 'active',
      location: { type: 'Point', coordinates: [-73.9925, 40.7350] }
    });

    const recipientOrg = await Organization.create({
      name: 'Hope Haven Community Shelter',
      type: 'shelter',
      registrationNumber: 'EIN-84-9281742',
      taxId: 'EIN-84-9281742',
      contactEmail: 'contact@hopehaven.local',
      contactPhone: '+1 (555) 876-5432',
      address: {
        street: '120 E 12th St',
        city: 'New York',
        state: 'NY',
        postalCode: '10003'
      },
      location: { type: 'Point', coordinates: [-73.9925, 40.7350] },
      ownerId: recipient._id,
      verificationStatus: VERIFICATION_STATUS.APPROVED,
      verificationDocuments: [
        {
          title: '501(c)(3) IRS Tax Exemption Letter',
          url: 'https://storage.rescuebite.local/docs/501c3_hope_haven.pdf',
          documentType: 'tax_exempt_letter'
        }
      ],
      reviewedBy: admin._id,
      reviewNotes: 'Verified 501(c)(3) determination letter with IRS non-profit registry.',
      reviewedAt: new Date()
    });

    recipient.organizationId = recipientOrg._id;
    await recipient.save();

    // 4. Seed Pending Recipient Organization (for testing admin verification queue)
    console.log('[Seed] Creating Pending Recipient Application...');
    const pendingRecipient = await User.create({
      name: 'Marcus Brody',
      email: 'marcus@downtowneast.local',
      passwordHash,
      role: ROLES.RECIPIENT,
      phone: '+1 (555) 332-9011',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
      status: 'active',
      location: { type: 'Point', coordinates: [-73.9800, 40.7250] }
    });

    const pendingOrg = await Organization.create({
      name: 'Downtown East Community Food Pantry',
      type: 'community_pantry',
      registrationNumber: 'EIN-12-3498102',
      taxId: 'EIN-12-3498102',
      contactEmail: 'pantry@downtowneast.local',
      contactPhone: '+1 (555) 332-9011',
      address: {
        street: '45 Avenue B',
        city: 'New York',
        state: 'NY',
        postalCode: '10009'
      },
      location: { type: 'Point', coordinates: [-73.9800, 40.7250] },
      ownerId: pendingRecipient._id,
      verificationStatus: VERIFICATION_STATUS.PENDING,
      verificationDocuments: [
        {
          title: 'Certificate of Incorporation.pdf',
          url: 'https://storage.rescuebite.local/docs/incorp_downtown.pdf',
          documentType: 'incorporation_cert'
        }
      ]
    });

    pendingRecipient.organizationId = pendingOrg._id;
    await pendingRecipient.save();

    // 5. Seed Volunteer
    console.log('[Seed] Creating Volunteer Courier...');
    const volunteer = await User.create({
      name: 'David Chen',
      email: 'david.volunteer@greenexpress.local',
      passwordHash,
      role: ROLES.VOLUNTEER,
      phone: '+1 (555) 345-6789',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
      status: 'active',
      location: { type: 'Point', coordinates: [-73.9780, 40.7580] }
    });

    // 6. Record Initial Audit Logs
    await AuditLog.create([
      {
        action: 'SYSTEM_INITIALIZED',
        performedBy: admin._id,
        performedByRole: admin.role,
        entityType: 'System',
        entityId: admin._id,
        details: { message: 'Database seeded with baseline accounts and verified organizations.' },
        ipAddress: '127.0.0.1',
        userAgent: 'RescueBite-Seeder/1.0'
      },
      {
        action: 'ORGANIZATION_APPROVED',
        performedBy: admin._id,
        performedByRole: admin.role,
        entityType: 'Organization',
        entityId: recipientOrg._id,
        details: { organizationName: recipientOrg.name, decision: 'approved' },
        ipAddress: '127.0.0.1',
        userAgent: 'RescueBite-Seeder/1.0'
      }
    ]);

    console.log('\n======================================================');
    console.log('✅ RescueBite Database Seeded Successfully!');
    console.log('======================================================');
    console.log('Default Password for all seeded accounts:', DEMO_PASSWORD);
    console.log('\nSeeded Accounts:');
    console.log(`1. Administrator:   ${admin.email}`);
    console.log(`2. Verified Donor:  ${donor.email} (${donorOrg.name})`);
    console.log(`3. Verified Pantry: ${recipient.email} (${recipientOrg.name})`);
    console.log(`4. Pending Pantry:  ${pendingRecipient.email} (${pendingOrg.name})`);
    console.log(`5. Volunteer:       ${volunteer.email}`);
    console.log('======================================================\n');
  } catch (err) {
    console.error('[Seed] Error seeding database:', err);
    process.exit(1);
  } finally {
    await disconnectDB();
  }
};

seedDatabase();
