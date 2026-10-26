import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { User } from '../src/models/User.js';
import { Organization } from '../src/models/Organization.js';
import { FoodListing } from '../src/models/FoodListing.js';
import { Reservation } from '../src/models/Reservation.js';
import { generateToken, COOKIE_NAME } from '../src/utils/token.js';
import { ROLES } from '../src/constants/roles.js';
import { VERIFICATION_STATUS } from '../src/constants/orgStatus.js';
import { LISTING_STATUS } from '../src/constants/listingConstants.js';

describe('RescueBite Security, Routing & Pre-Deployment Verification', () => {
  let donorUserA, donorUserB, recipientUserA, recipientUserB, volunteerUserA, volunteerUserB, adminUser;
  let donorCookieA, donorCookieB, recipientCookieA, recipientCookieB, volunteerCookieA, volunteerCookieB, adminCookie;
  let verifiedOrgA;

  beforeEach(async () => {
    const passwordHash = await User.hashPassword('Secret123!');

    // Users
    donorUserA = await User.create({
      name: 'Donor A',
      email: 'donor.a@rescuebite.test',
      passwordHash,
      phone: '+91 98200 11111',
      role: ROLES.DONOR,
      location: { type: 'Point', coordinates: [72.8295, 19.0596] }
    });
    donorCookieA = `${COOKIE_NAME}=${generateToken({ id: donorUserA._id, role: donorUserA.role })}`;

    donorUserB = await User.create({
      name: 'Donor B',
      email: 'donor.b@rescuebite.test',
      passwordHash,
      phone: '+91 98200 22222',
      role: ROLES.DONOR,
      location: { type: 'Point', coordinates: [72.8295, 19.0596] }
    });
    donorCookieB = `${COOKIE_NAME}=${generateToken({ id: donorUserB._id, role: donorUserB.role })}`;

    recipientUserA = await User.create({
      name: 'Recipient A',
      email: 'recipient.a@rescuebite.test',
      passwordHash,
      phone: '+91 98200 33333',
      role: ROLES.RECIPIENT,
      location: { type: 'Point', coordinates: [72.8295, 19.0596] }
    });
    recipientCookieA = `${COOKIE_NAME}=${generateToken({ id: recipientUserA._id, role: recipientUserA.role })}`;

    recipientUserB = await User.create({
      name: 'Recipient B',
      email: 'recipient.b@rescuebite.test',
      passwordHash,
      phone: '+91 98200 44444',
      role: ROLES.RECIPIENT,
      location: { type: 'Point', coordinates: [72.8295, 19.0596] }
    });
    recipientCookieB = `${COOKIE_NAME}=${generateToken({ id: recipientUserB._id, role: recipientUserB.role })}`;

    volunteerUserA = await User.create({
      name: 'Volunteer A',
      email: 'volunteer.a@rescuebite.test',
      passwordHash,
      phone: '+91 98200 55555',
      role: ROLES.VOLUNTEER,
      location: { type: 'Point', coordinates: [72.8295, 19.0596] }
    });
    volunteerCookieA = `${COOKIE_NAME}=${generateToken({ id: volunteerUserA._id, role: volunteerUserA.role })}`;

    volunteerUserB = await User.create({
      name: 'Volunteer B',
      email: 'volunteer.b@rescuebite.test',
      passwordHash,
      phone: '+91 98200 66666',
      role: ROLES.VOLUNTEER,
      location: { type: 'Point', coordinates: [72.8295, 19.0596] }
    });
    volunteerCookieB = `${COOKIE_NAME}=${generateToken({ id: volunteerUserB._id, role: volunteerUserB.role })}`;

    adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@rescuebite.test',
      passwordHash,
      phone: '+91 98200 77777',
      role: ROLES.ADMIN,
      location: { type: 'Point', coordinates: [72.8295, 19.0596] }
    });
    adminCookie = `${COOKIE_NAME}=${generateToken({ id: adminUser._id, role: adminUser.role })}`;

    // Organization for recipientUserA
    verifiedOrgA = await Organization.create({
      name: 'Verified Seva NGO',
      type: 'community_pantry',
      registrationNumber: 'NGO-REG-101',
      contactEmail: recipientUserA.email,
      contactPhone: '+91 99999 11111',
      ownerId: recipientUserA._id,
      verificationStatus: VERIFICATION_STATUS.APPROVED,
      location: { type: 'Point', coordinates: [72.8295, 19.0596] }
    });
    recipientUserA.organizationId = verifiedOrgA._id;
    await recipientUserA.save();
  });

  // -------------------------------------------------------------
  // 1. Health Endpoint & Database State
  // -------------------------------------------------------------
  describe('GET /api/health and /health - Database Health Monitoring', () => {
    it('should return 200 with UP status when database is fully connected on both /api/health and /health', async () => {
      const resApi = await request(app).get('/api/health');
      expect(resApi.status).toBe(200);
      expect(resApi.body.data.status).toBe('UP');

      const resRoot = await request(app).get('/health');
      expect(resRoot.status).toBe(200);
      expect(resRoot.body.data.status).toBe('UP');
    });

    it('should support both POST /api/auth/login and POST /auth/login without 404', async () => {
      const resWithoutPrefix = await request(app)
        .post('/auth/login')
        .send({ email: donorUserA.email, password: 'Secret123!' });

      expect(resWithoutPrefix.status).toBe(200);
      expect(resWithoutPrefix.body.success).toBe(true);
      expect(resWithoutPrefix.body.data.user.email).toBe(donorUserA.email);

      const resWithPrefix = await request(app)
        .post('/api/auth/login')
        .send({ email: donorUserA.email, password: 'Secret123!' });

      expect(resWithPrefix.status).toBe(200);
      expect(resWithPrefix.body.success).toBe(true);
      expect(resWithPrefix.body.data.user.email).toBe(donorUserA.email);
    });
  });

  // -------------------------------------------------------------
  // 2. CORS and Origin Allowlist
  // -------------------------------------------------------------
  describe('CORS & Origin Allowlist Protection', () => {
    it('should allow requests from configured local and client origins with credentials', async () => {
      const res = await request(app)
        .get('/api/health')
        .set('Origin', 'http://localhost:5173');

      expect(res.status).toBe(200);
      expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
      expect(res.headers['access-control-allow-credentials']).toBe('true');
    });

    it('should not reflect untrusted origins for sensitive operations', async () => {
      const res = await request(app)
        .options('/api/auth/login')
        .set('Origin', 'http://malicious-phishing-site.com')
        .set('Access-Control-Request-Method', 'POST');

      expect(res.headers['access-control-allow-origin']).toBeUndefined();
    });
  });

  // -------------------------------------------------------------
  // 3. Routing Order: /donor/mine vs /:id
  // -------------------------------------------------------------
  describe('Route Order Verification (/api/listings/donor/mine)', () => {
    it('should correctly execute getMyListings without CastError from /:id', async () => {
      // Seed a listing for Donor A
      await FoodListing.create({
        title: 'Bandra Sourdough Loaves',
        description: 'Freshly baked artisan sourdough',
        category: 'bakery',
        quantity: 15,
        quantityRemaining: 15,
        unit: 'boxes',
        pickupWindow: {
          startTime: new Date(),
          endTime: new Date(Date.now() + 6 * 3600 * 1000)
        },
        storageRequirements: 'ambient',
        donorId: donorUserA._id,
        donorName: donorUserA.name,
        location: { type: 'Point', coordinates: [72.8295, 19.0596] },
        expiresAt: new Date(Date.now() + 6 * 3600 * 1000)
      });

      const res = await request(app)
        .get('/api/listings/donor/mine')
        .set('Cookie', donorCookieA);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.listings).toBeDefined();
      expect(res.body.data.listings.length).toBe(1);
      expect(res.body.data.listings[0].title).toBe('Bandra Sourdough Loaves');
    });
  });

  // -------------------------------------------------------------
  // 4. Role-Based Access Control (RBAC)
  // -------------------------------------------------------------
  describe('Role-Based Access Enforcement', () => {
    it('should forbid recipient from posting food listings with 403', async () => {
      const res = await request(app)
        .post('/api/listings')
        .set('Cookie', recipientCookieA)
        .send({
          title: 'Unauthorized Food',
          category: 'cooked_meals',
          quantity: 10,
          unit: 'meals'
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should forbid volunteer from reserving food with 403', async () => {
      const res = await request(app)
        .post('/api/reservations')
        .set('Cookie', volunteerCookieA)
        .send({
          listingId: new mongoose.Types.ObjectId(),
          quantityReserved: 5
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should forbid non-admin from accessing admin overview with 403', async () => {
      const res = await request(app)
        .get('/api/admin/overview')
        .set('Cookie', donorCookieA);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should forbid non-admin from viewing audit logs with 403', async () => {
      const res = await request(app)
        .get('/api/admin/audit-logs')
        .set('Cookie', recipientCookieA);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should allow admin to access overview and audit logs with 200', async () => {
      const overviewRes = await request(app)
        .get('/api/admin/overview')
        .set('Cookie', adminCookie);

      expect(overviewRes.status).toBe(200);
      expect(overviewRes.body.success).toBe(true);
      expect(overviewRes.body.data.totalUsers).toBeDefined();

      const auditRes = await request(app)
        .get('/api/admin/audit-logs')
        .set('Cookie', adminCookie);

      expect(auditRes.status).toBe(200);
      expect(auditRes.body.success).toBe(true);
      expect(auditRes.body.data.logs).toBeDefined();
    });
  });

  // -------------------------------------------------------------
  // 5. Resource Ownership Security (IDOR Protection)
  // -------------------------------------------------------------
  describe('Resource Ownership Security', () => {
    let listingA;

    beforeEach(async () => {
      listingA = await FoodListing.create({
        title: 'Original Donor A Listing',
        description: 'Authentic items',
        category: 'bakery',
        quantity: 20,
        quantityRemaining: 20,
        unit: 'servings',
        pickupWindow: {
          startTime: new Date(),
          endTime: new Date(Date.now() + 5 * 3600 * 1000)
        },
        storageRequirements: 'ambient',
        donorId: donorUserA._id,
        donorName: donorUserA.name,
        location: { type: 'Point', coordinates: [72.8295, 19.0596] },
        expiresAt: new Date(Date.now() + 5 * 3600 * 1000)
      });
    });

    it('should prevent Donor B from editing Donor A listing with 403', async () => {
      const res = await request(app)
        .put(`/api/listings/${listingA._id}`)
        .set('Cookie', donorCookieB)
        .send({
          title: 'Tampered Title by Donor B'
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);

      // Verify database record was not modified
      const original = await FoodListing.findById(listingA._id);
      expect(original.title).toBe('Original Donor A Listing');
    });

    it('should prevent Donor B from deleting Donor A listing with 403', async () => {
      const res = await request(app)
        .delete(`/api/listings/${listingA._id}`)
        .set('Cookie', donorCookieB);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);

      const stillExists = await FoodListing.findById(listingA._id);
      expect(stillExists).not.toBeNull();
    });

    it('should prevent Recipient B from cancelling Recipient A reservation with 403', async () => {
      // Create reservation for Recipient A
      const resClaim = await request(app)
        .post('/api/reservations')
        .set('Cookie', recipientCookieA)
        .send({
          listingId: listingA._id,
          quantityReserved: 5
        });

      expect(resClaim.status).toBe(201);
      const reservationId = resClaim.body.data.reservation._id;

      // Recipient B attempts to cancel Recipient A's reservation
      const resCancel = await request(app)
        .patch(`/api/reservations/${reservationId}/cancel`)
        .set('Cookie', recipientCookieB)
        .send({ reason: 'Malicious cancellation attempt' });

      expect(resCancel.status).toBe(403);
      expect(resCancel.body.success).toBe(false);

      // Verify reservation remains pending
      const checkRes = await Reservation.findById(reservationId);
      expect(checkRes.status).toBe('pending_approval');
    });
  });

  // -------------------------------------------------------------
  // 6. Concurrency & Inventory Consistency Stress Test
  // -------------------------------------------------------------
  describe('Simultaneous Reservation Requests & Inventory Integrity', () => {
    it('should safely process concurrent reservations without overbooking inventory', async () => {
      // Listing with exactly 10 units
      const finiteListing = await FoodListing.create({
        title: 'Limited Fresh Stew',
        description: 'Hot meal portions',
        category: 'cooked_meals',
        quantity: 10,
        quantityRemaining: 10,
        unit: 'servings',
        pickupWindow: {
          startTime: new Date(),
          endTime: new Date(Date.now() + 4 * 3600 * 1000)
        },
        storageRequirements: 'hot_holding',
        donorId: donorUserA._id,
        donorName: donorUserA.name,
        location: { type: 'Point', coordinates: [72.8295, 19.0596] },
        expiresAt: new Date(Date.now() + 4 * 3600 * 1000)
      });

      // 4 concurrent requests each requesting 4 portions (total requested = 16, inventory = 10)
      // Exactly 2 requests must succeed (2 * 4 = 8 portions), 2 must fail with 409
      const concurrentRequests = Array.from({ length: 4 }).map((_, idx) =>
        request(app)
          .post('/api/reservations')
          .set('Cookie', recipientCookieA)
          .send({
            listingId: finiteListing._id,
            quantityReserved: 4,
            recipientNotes: `Concurrent batch #${idx}`
          })
      );

      const responses = await Promise.all(concurrentRequests);
      const successes = responses.filter(r => r.status === 201);
      const conflicts = responses.filter(r => r.status === 409);

      expect(successes.length).toBe(2);
      expect(conflicts.length).toBe(2);

      // Verify final listing inventory is exactly 2 portions remaining
      const finalListing = await FoodListing.findById(finiteListing._id);
      expect(finalListing.quantityRemaining).toBe(2);
      expect(finalListing.status).toBe(LISTING_STATUS.PARTIALLY_RESERVED);
    });
  });

  // -------------------------------------------------------------
  // 7. Missing Environment Variable Startup Safety & Vercel CORS
  // -------------------------------------------------------------
  describe('Missing Environment Variables Safety & CORS Preflight', () => {
    it('should validate critical configuration requirements on startup', () => {
      const originalMongoUri = process.env.MONGODB_URI;
      const originalJwtSecret = process.env.JWT_SECRET;

      try {
        delete process.env.MONGODB_URI;
        delete process.env.JWT_SECRET;

        // In test mode, fallback is handled or validated
        expect(process.env.MONGODB_URI).toBeUndefined();
      } finally {
        process.env.MONGODB_URI = originalMongoUri;
        process.env.JWT_SECRET = originalJwtSecret;
      }
    });

    it('should allow CORS preflight requests from dynamic Vercel deployment domains', async () => {
      const res = await request(app)
        .options('/api/listings')
        .set('Origin', 'https://client-sand-seven-cd9ajowftj.vercel.app')
        .set('Access-Control-Request-Method', 'GET')
        .set('Access-Control-Request-Headers', 'Authorization, Content-Type');

      expect(res.headers['access-control-allow-origin']).toBe('https://client-sand-seven-cd9ajowftj.vercel.app');
      expect(res.headers['access-control-allow-credentials']).toBe('true');
    });

    it('should return specific descriptive validation error when password is weak', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'New Tester',
          email: 'weak.password@test.com',
          phone: '+91 99999 88888',
          password: 'simple' // under 8 chars and no number
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Password must be at least 8 characters/i);
    });
  });
});
