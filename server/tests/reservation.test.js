import request from 'supertest';
import { describe, it, expect, beforeEach } from 'vitest';
import app from '../src/app.js';
import { User } from '../src/models/User.js';
import { Organization } from '../src/models/Organization.js';
import { FoodListing } from '../src/models/FoodListing.js';
import { Reservation } from '../src/models/Reservation.js';
import { ROLES } from '../src/constants/roles.js';
import { VERIFICATION_STATUS } from '../src/constants/orgStatus.js';

describe('Reservation & Concurrency Safety Endpoints (/api/reservations)', () => {
  let donorCookie;
  let verifiedRecipientCookie;
  let unverifiedRecipientCookie;
  let adminCookie;
  let listing;

  beforeEach(async () => {
    // 1. Donor User & Org
    const donorRes = await request(app).post('/api/auth/register').send({
      name: 'Chef Marco Bellini',
      email: 'marco@artisanbistro.com',
      password: 'Password123!',
      phone: '+1 (555) 234-5678',
      role: 'donor',
      organizationName: 'Artisan Bistro & Bakery'
    });
    donorCookie = donorRes.headers['set-cookie'];

    // 2. Verified Recipient User & Org
    const recipRes = await request(app).post('/api/auth/register').send({
      name: 'Sarah Jenkins',
      email: 'sarah@hopehaven.org',
      password: 'Password123!',
      phone: '+1 (555) 876-5432',
      role: 'recipient',
      organizationName: 'Hope Haven Shelter'
    });
    verifiedRecipientCookie = recipRes.headers['set-cookie'];

    // Mark recipient organization as approved directly in DB
    const recipUser = recipRes.body.data.user;
    await Organization.findByIdAndUpdate(recipUser.organizationId, {
      verificationStatus: VERIFICATION_STATUS.APPROVED
    });

    // 3. Unverified Recipient User
    const unverifiedRes = await request(app).post('/api/auth/register').send({
      name: 'Unverified Director',
      email: 'unverified@shelter.org',
      password: 'Password123!',
      phone: '+1 (555) 000-1111',
      role: 'recipient',
      organizationName: 'Unverified Shelter'
    });
    unverifiedRecipientCookie = unverifiedRes.headers['set-cookie'];

    // 4. Admin User
    const adminHash = await User.hashPassword('AdminPass123!');
    const admin = await User.create({
      name: 'Admin Elena',
      email: 'admin@rescuebite.org',
      passwordHash: adminHash,
      role: ROLES.ADMIN,
      phone: '+1 (555) 999-0000',
      status: 'active'
    });
    const adminLogin = await request(app).post('/api/auth/login').send({
      email: 'admin@rescuebite.org',
      password: 'AdminPass123!'
    });
    adminCookie = adminLogin.headers['set-cookie'];

    // 5. Create Baseline Food Listing (10 units available)
    const listRes = await request(app)
      .post('/api/listings')
      .set('Cookie', donorCookie)
      .send({
        title: 'Artisan Bread Assortment',
        description: 'Fresh surplus sourdough and baguettes.',
        category: 'bakery',
        quantity: 10,
        unit: 'packs',
        pickupWindow: {
          startTime: new Date(Date.now() + 3600 * 1000).toISOString(),
          endTime: new Date(Date.now() + 10 * 3600 * 1000).toISOString()
        },
        storageRequirements: 'ambient',
        location: {
          type: 'Point',
          coordinates: [-73.9851, 40.7484]
        }
      });

    listing = listRes.body.data.listing;
  });

  describe('Atomic Reservation & Insufficient Inventory', () => {
    it('should reject reservation request when requested quantity exceeds available inventory with 409', async () => {
      const res = await request(app)
        .post('/api/reservations')
        .set('Cookie', verifiedRecipientCookie)
        .send({
          listingId: listing._id,
          quantityReserved: 15 // Only 10 available!
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Insufficient surplus inventory');
    });

    it('should prevent unverified organization from reserving food with 403', async () => {
      const res = await request(app)
        .post('/api/reservations')
        .set('Cookie', unverifiedRecipientCookie)
        .send({
          listingId: listing._id,
          quantityReserved: 2
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Only verified organizations');
    });
  });

  describe('Concurrent Reservations (No Overbooking)', () => {
    it('should handle concurrent requests safely without overbooking inventory', async () => {
      // 10 units available total.
      // We launch 4 concurrent requests trying to claim 5 units each (total demand = 20 units).
      // Exactly 2 requests must succeed (10 units claimed), and 2 must fail with 409!
      const requests = [
        request(app).post('/api/reservations').set('Cookie', verifiedRecipientCookie).send({ listingId: listing._id, quantityReserved: 5 }),
        request(app).post('/api/reservations').set('Cookie', verifiedRecipientCookie).send({ listingId: listing._id, quantityReserved: 5 }),
        request(app).post('/api/reservations').set('Cookie', verifiedRecipientCookie).send({ listingId: listing._id, quantityReserved: 5 }),
        request(app).post('/api/reservations').set('Cookie', verifiedRecipientCookie).send({ listingId: listing._id, quantityReserved: 5 })
      ];

      const responses = await Promise.all(requests);

      const successCount = responses.filter(r => r.status === 201).length;
      const conflictCount = responses.filter(r => r.status === 409).length;

      expect(successCount).toBe(2);
      expect(conflictCount).toBe(2);

      // Verify listing inventory is exactly 0 and status is fully_reserved
      const updatedListing = await FoodListing.findById(listing._id);
      expect(updatedListing.quantityRemaining).toBe(0);
      expect(updatedListing.status).toBe('fully_reserved');
    });
  });

  describe('Duplicate-Request Safety & Idempotency', () => {
    it('should safely return existing reservation without deducting inventory twice on duplicate idempotency key', async () => {
      const idempotencyKey = 'unique-req-uuid-12345';

      // First Request
      const firstRes = await request(app)
        .post('/api/reservations')
        .set('Cookie', verifiedRecipientCookie)
        .set('Idempotency-Key', idempotencyKey)
        .send({
          listingId: listing._id,
          quantityReserved: 3
        });

      expect(firstRes.status).toBe(201);
      expect(firstRes.body.data.isDuplicate).toBe(false);
      const reservationId = firstRes.body.data.reservation._id;

      // Second identical Request (replay / network retry)
      const secondRes = await request(app)
        .post('/api/reservations')
        .set('Cookie', verifiedRecipientCookie)
        .set('Idempotency-Key', idempotencyKey)
        .send({
          listingId: listing._id,
          quantityReserved: 3
        });

      expect(secondRes.status).toBe(200);
      expect(secondRes.body.data.isDuplicate).toBe(true);
      expect(secondRes.body.data.reservation._id).toBe(reservationId);

      // Verify inventory was only deducted ONCE (10 - 3 = 7, not 10 - 6 = 4)
      const checkListing = await FoodListing.findById(listing._id);
      expect(checkListing.quantityRemaining).toBe(7);
    });
  });

  describe('Donor Decision: Approve & Reject (Exactly-Once Inventory Release)', () => {
    it('should allow donor to approve pending reservation and generate verification codes', async () => {
      const resClaim = await request(app)
        .post('/api/reservations')
        .set('Cookie', verifiedRecipientCookie)
        .send({
          listingId: listing._id,
          quantityReserved: 4
        });

      const resId = resClaim.body.data.reservation._id;

      const approveRes = await request(app)
        .patch(`/api/reservations/${resId}/approve`)
        .set('Cookie', donorCookie)
        .send({ donorNotes: 'Ready for loading bay pickup.' });

      expect(approveRes.status).toBe(200);
      expect(approveRes.body.data.reservation.status).toBe('approved');
      expect(approveRes.body.data.reservation.pickupCode).toBeDefined();
    });

    it('should release inventory exactly once when donor rejects reservation', async () => {
      const resClaim = await request(app)
        .post('/api/reservations')
        .set('Cookie', verifiedRecipientCookie)
        .send({
          listingId: listing._id,
          quantityReserved: 4
        });

      const resId = resClaim.body.data.reservation._id;

      // Inventory should currently be 6
      let checkListing = await FoodListing.findById(listing._id);
      expect(checkListing.quantityRemaining).toBe(6);

      // Donor Rejects
      const rejectRes = await request(app)
        .patch(`/api/reservations/${resId}/reject`)
        .set('Cookie', donorCookie)
        .send({ reason: 'Kitchen closing early.' });

      expect(rejectRes.status).toBe(200);
      expect(rejectRes.body.data.reservation.status).toBe('rejected');

      // Inventory should be restored back to 10
      checkListing = await FoodListing.findById(listing._id);
      expect(checkListing.quantityRemaining).toBe(10);
    });
  });

  describe('Cancellation (Exactly-Once Release & Idempotence)', () => {
    it('should restore inventory when recipient cancels reservation', async () => {
      const resClaim = await request(app)
        .post('/api/reservations')
        .set('Cookie', verifiedRecipientCookie)
        .send({
          listingId: listing._id,
          quantityReserved: 5
        });

      const resId = resClaim.body.data.reservation._id;

      // Recipient Cancels
      const cancelRes = await request(app)
        .patch(`/api/reservations/${resId}/cancel`)
        .set('Cookie', verifiedRecipientCookie)
        .send({ reason: 'Found alternative donation.' });

      expect(cancelRes.status).toBe(200);
      expect(cancelRes.body.data.reservation.status).toBe('cancelled');

      // Inventory restored
      const checkListing = await FoodListing.findById(listing._id);
      expect(checkListing.quantityRemaining).toBe(10);
      expect(checkListing.status).toBe('available');

      // Second attempt to cancel already cancelled reservation should return 400 and not restore inventory again
      const repeatCancel = await request(app)
        .patch(`/api/reservations/${resId}/cancel`)
        .set('Cookie', verifiedRecipientCookie);

      expect(repeatCancel.status).toBe(400);

      // Inventory remains 10 (not 15!)
      const recheckListing = await FoodListing.findById(listing._id);
      expect(recheckListing.quantityRemaining).toBe(10);
    });

    it('should reject unauthorized user from cancelling someone else\'s reservation with 403', async () => {
      const resClaim = await request(app)
        .post('/api/reservations')
        .set('Cookie', verifiedRecipientCookie)
        .send({
          listingId: listing._id,
          quantityReserved: 2
        });

      const resId = resClaim.body.data.reservation._id;

      // Unverified stranger attempts to cancel
      const res = await request(app)
        .patch(`/api/reservations/${resId}/cancel`)
        .set('Cookie', unverifiedRecipientCookie);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Expired Listings Sweep', () => {
    it('should mark past-deadline listings and unapproved reservations as expired', async () => {
      // 1. Create expired listing in DB
      const past = new Date(Date.now() - 3600 * 1000);
      const expiredListing = await FoodListing.create({
        title: 'Past Batch Bread',
        description: 'Past food',
        category: 'bakery',
        quantity: 5,
        quantityRemaining: 5,
        unit: 'packs',
        pickupWindow: {
          startTime: new Date(Date.now() - 7200 * 1000),
          endTime: past
        },
        storageRequirements: 'ambient',
        donorId: listing.donorId,
        location: listing.location,
        status: 'available',
        expiresAt: past
      });

      // 2. Run sweep endpoint (Admin)
      const res = await request(app)
        .post('/api/reservations/sweep-expired')
        .set('Cookie', adminCookie);

      expect(res.status).toBe(200);
      expect(res.body.data.expiredListingsCount).toBeGreaterThanOrEqual(1);

      // Verify status in DB
      const check = await FoodListing.findById(expiredListing._id);
      expect(check.status).toBe('expired');
    });
  });
});
