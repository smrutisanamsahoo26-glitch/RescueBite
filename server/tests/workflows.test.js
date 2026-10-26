import request from 'supertest';
import http from 'http';
import { io as Client } from 'socket.io-client';
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import app from '../src/app.js';
import { initSocket } from '../src/sockets/socketManager.js';
import { User } from '../src/models/User.js';
import { Organization } from '../src/models/Organization.js';
import { FoodListing } from '../src/models/FoodListing.js';
import { Reservation } from '../src/models/Reservation.js';
import { PickupTask, TASK_STATUS } from '../src/models/PickupTask.js';
import { Report } from '../src/models/Report.js';
import { AuditLog } from '../src/models/AuditLog.js';
import { ROLES } from '../src/constants/roles.js';
import { VERIFICATION_STATUS } from '../src/constants/orgStatus.js';
import { runExpiryJob } from '../src/services/expiryJob.js';
import { generateToken } from '../src/utils/token.js';

describe('RescueBite Major Workflows: Volunteer, Realtime, Admin, Analytics & Expiry', () => {
  let donorCookie, donorUser;
  let recipientCookie, recipientUser;
  let volunteer1Cookie, volunteer1User, volunteer1Token;
  let volunteer2Cookie, volunteer2User;
  let adminCookie, adminUser;
  let listing;
  let reservation;
  let testHttpServer;
  let serverPort;

  beforeEach(async () => {
    // 1. Register Donor
    const donorRes = await request(app).post('/api/auth/register').send({
      name: 'Chef Alessandro',
      email: 'alessandro@trattoria.com',
      password: 'Password123!',
      phone: '+1 (555) 111-2222',
      role: 'donor',
      organizationName: 'Trattoria Bella'
    });
    donorCookie = donorRes.headers['set-cookie'];
    donorUser = donorRes.body.data.user;

    // 2. Register Recipient
    const recipRes = await request(app).post('/api/auth/register').send({
      name: 'Maya Lin',
      email: 'maya@citycommunitypantry.org',
      password: 'Password123!',
      phone: '+1 (555) 333-4444',
      role: 'recipient',
      organizationName: 'City Community Pantry'
    });
    recipientCookie = recipRes.headers['set-cookie'];
    recipientUser = recipRes.body.data.user;

    // Verify recipient organization in DB
    await Organization.findByIdAndUpdate(recipientUser.organizationId, {
      verificationStatus: VERIFICATION_STATUS.APPROVED
    });

    // 3. Register Volunteer 1
    const vol1Res = await request(app).post('/api/auth/register').send({
      name: 'Elena Rostova',
      email: 'elena@volunteer.org',
      password: 'Password123!',
      phone: '+1 (555) 555-6666',
      role: 'volunteer'
    });
    volunteer1Cookie = vol1Res.headers['set-cookie'];
    volunteer1User = vol1Res.body.data.user;
    volunteer1Token = vol1Res.body.data.token;

    // 4. Register Volunteer 2
    const vol2Res = await request(app).post('/api/auth/register').send({
      name: 'Liam Chen',
      email: 'liam@volunteer.org',
      password: 'Password123!',
      phone: '+1 (555) 777-8888',
      role: 'volunteer'
    });
    volunteer2Cookie = vol2Res.headers['set-cookie'];
    volunteer2User = vol2Res.body.data.user;

    // 5. Create Admin User
    const adminHash = await User.hashPassword('AdminPass123!');
    adminUser = await User.create({
      name: 'Platform SuperAdmin',
      email: 'superadmin@rescuebite.org',
      passwordHash: adminHash,
      role: ROLES.ADMIN,
      phone: '+1 (555) 999-9999',
      status: 'active'
    });
    const adminLogin = await request(app).post('/api/auth/login').send({
      email: 'superadmin@rescuebite.org',
      password: 'AdminPass123!'
    });
    adminCookie = adminLogin.headers['set-cookie'];

    // 6. Create Food Listing
    const listRes = await request(app)
      .post('/api/listings')
      .set('Cookie', donorCookie)
      .send({
        title: 'Nutritious Pasta & Fresh Sauce',
        description: '20 fresh prepared pasta servings',
        category: 'cooked_meals',
        quantity: 20,
        unit: 'servings',
        pickupWindow: {
          startTime: new Date(Date.now() + 1800 * 1000).toISOString(),
          endTime: new Date(Date.now() + 10800 * 1000).toISOString()
        },
        storageRequirements: 'refrigerated',
        location: {
          type: 'Point',
          coordinates: [-73.9855, 40.7484]
        }
      });
    listing = listRes.body.data.listing;

    // 7. Recipient Claims 10 Meals
    const claimRes = await request(app)
      .post('/api/reservations')
      .set('Cookie', recipientCookie)
      .send({
        listingId: listing._id,
        quantityReserved: 10,
        recipientNotes: 'Pantry evening food drive'
      });
    reservation = claimRes.body.data.reservation;

    // 8. Donor Approves Reservation (this automatically triggers spawnPickupTask)
    const approveRes = await request(app)
      .patch(`/api/reservations/${reservation._id}/approve`)
      .set('Cookie', donorCookie)
      .send({ donorNotes: 'Ready at kitchen side door' });
    reservation = approveRes.body.data.reservation;
  });

  describe('Volunteer System & Concurrency Protection', () => {
    it('should show eligible unassigned tasks on volunteer board', async () => {
      const res = await request(app)
        .get('/api/tasks/board')
        .set('Cookie', volunteer1Cookie);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.tasks).toBeDefined();
      expect(res.body.data.tasks.length).toBeGreaterThanOrEqual(1);

      const task = res.body.data.tasks[0];
      expect(task.status).toBe('unassigned');
      expect(task.listingTitle).toBe('Nutritious Pasta & Fresh Sauce');
      // Verify secure hashing: plaintext codes and code hashes are NEVER leaked to client
      expect(task.pickupCodeHash).toBeUndefined();
      expect(task.deliveryCodeHash).toBeUndefined();
    });

    it('should reject non-volunteers from accessing the task board with 403', async () => {
      const res = await request(app)
        .get('/api/tasks/board')
        .set('Cookie', donorCookie);

      expect(res.status).toBe(403);
    });

    it('should protect against concurrent task claims: exactly 1 volunteer claims, 2nd gets 409', async () => {
      // Find the created task ID
      const tasksRes = await request(app)
        .get('/api/tasks/board')
        .set('Cookie', volunteer1Cookie);
      const taskId = tasksRes.body.data.tasks[0]._id;

      // Two volunteers attempt to claim the exact same unassigned task simultaneously
      const [claim1, claim2] = await Promise.all([
        request(app).post(`/api/tasks/${taskId}/claim`).set('Cookie', volunteer1Cookie),
        request(app).post(`/api/tasks/${taskId}/claim`).set('Cookie', volunteer2Cookie)
      ]);

      const statuses = [claim1.status, claim2.status];
      expect(statuses).toContain(200);
      expect(statuses).toContain(409);

      // Verify DB record has exactly one volunteer assigned
      const taskInDb = await PickupTask.findById(taskId);
      expect(taskInDb.status).toBe('assigned');
      expect(taskInDb.volunteerId).toBeDefined();
    });
  });

  describe('State Machine Transitions, Verification Codes & Temperature Logging', () => {
    let taskId;

    beforeEach(async () => {
      const tasksRes = await request(app)
        .get('/api/tasks/board')
        .set('Cookie', volunteer1Cookie);
      taskId = tasksRes.body.data.tasks[0]._id;

      // Volunteer 1 claims task
      await request(app)
        .post(`/api/tasks/${taskId}/claim`)
        .set('Cookie', volunteer1Cookie);
    });

    it('should reject invalid state transitions that skip stages with 400', async () => {
      // Trying to transition from 'assigned' directly to 'delivered'
      const res = await request(app)
        .patch(`/api/tasks/${taskId}/status`)
        .set('Cookie', volunteer1Cookie)
        .send({ newStatus: 'delivered' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Invalid state transition');
    });

    it('should reject unauthorized users from updating task status with 403', async () => {
      // Unassigned stranger (Volunteer 2) tries to advance Volunteer 1's claimed task
      const res = await request(app)
        .patch(`/api/tasks/${taskId}/status`)
        .set('Cookie', volunteer2Cookie)
        .send({ newStatus: 'en_route_pickup' });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Forbidden');
    });

    it('should require donor pickup verification code for handover and reject wrong codes', async () => {
      // 1. Advance to en_route_pickup
      await request(app)
        .patch(`/api/tasks/${taskId}/status`)
        .set('Cookie', volunteer1Cookie)
        .send({ newStatus: 'en_route_pickup' });

      // 2. Attempt pickup handover without code -> 400
      const missingCodeRes = await request(app)
        .patch(`/api/tasks/${taskId}/status`)
        .set('Cookie', volunteer1Cookie)
        .send({ newStatus: 'picked_up' });
      expect(missingCodeRes.status).toBe(400);
      expect(missingCodeRes.body.message).toContain('pickup confirmation code is required');

      // 3. Attempt pickup handover with incorrect code -> 401
      const wrongCodeRes = await request(app)
        .patch(`/api/tasks/${taskId}/status`)
        .set('Cookie', volunteer1Cookie)
        .send({
          newStatus: 'picked_up',
          candidateCode: 'RB-9999' // Invalid code!
        });
      expect(wrongCodeRes.status).toBe(401);
      expect(wrongCodeRes.body.message).toContain('Invalid pickup confirmation code');
    });

    it('should complete full handover lifecycle: pickup code, temp log, delivery code and verified kg', async () => {
      // Step 1: en_route_pickup
      const step1 = await request(app)
        .patch(`/api/tasks/${taskId}/status`)
        .set('Cookie', volunteer1Cookie)
        .send({ newStatus: 'en_route_pickup' });
      expect(step1.status).toBe(200);

      // Step 2: picked_up with correct donor pickupCode
      const correctPickupCode = reservation.pickupCode;
      const step2 = await request(app)
        .patch(`/api/tasks/${taskId}/status`)
        .set('Cookie', volunteer1Cookie)
        .send({
          newStatus: 'picked_up',
          candidateCode: correctPickupCode,
          temperatureCelsius: 3.8,
          notes: 'Insulated cooler bag verified'
        });
      expect(step2.status).toBe(200);
      expect(step2.body.data.task.status).toBe('picked_up');
      expect(step2.body.data.task.pickupCodeUsed).toBe(true);

      // Verify code reuse protection: cannot reuse the pickup code again
      // We force a test attempt on picked_up
      const reuseAttempt = await request(app)
        .patch(`/api/tasks/${taskId}/status`)
        .set('Cookie', volunteer1Cookie)
        .send({
          newStatus: 'picked_up',
          candidateCode: correctPickupCode
        });
      // Should fail either due to invalid state transition or code already used
      expect(reuseAttempt.status).toBe(400);

      // Step 3: Log transit temperature check
      const tempRes = await request(app)
        .post(`/api/tasks/${taskId}/temp-log`)
        .set('Cookie', volunteer1Cookie)
        .send({
          temperatureCelsius: 4.1,
          notes: 'Mid-route checkpoint'
        });
      expect(tempRes.status).toBe(200);
      expect(tempRes.body.data.tempLogs.length).toBeGreaterThanOrEqual(1);

      // Step 4: en_route_delivery
      const step4 = await request(app)
        .patch(`/api/tasks/${taskId}/status`)
        .set('Cookie', volunteer1Cookie)
        .send({ newStatus: 'en_route_delivery' });
      expect(step4.status).toBe(200);

      // Step 5: delivered with recipient deliveryCode and verified scale weight (actualRescuedKg)
      const correctDeliveryCode = reservation.deliveryCode;
      const step5 = await request(app)
        .patch(`/api/tasks/${taskId}/status`)
        .set('Cookie', volunteer1Cookie)
        .send({
          newStatus: 'delivered',
          candidateCode: correctDeliveryCode,
          actualRescuedKg: 8.5,
          temperatureCelsius: 4.0
        });
      expect(step5.status).toBe(200);
      expect(step5.body.data.task.status).toBe('delivered');
      expect(step5.body.data.task.deliveryCodeUsed).toBe(true);
      expect(step5.body.data.task.actualRescuedKg).toBe(8.5);

      // Verify linked Reservation was automatically marked completed
      const checkReservation = await Reservation.findById(reservation._id);
      expect(checkReservation.status).toBe('completed');
    });

    it('should reject expired verification codes with 400', async () => {
      // Manually set pickupCodeExpiresAt in the past
      await PickupTask.findByIdAndUpdate(taskId, {
        pickupCodeExpiresAt: new Date(Date.now() - 3600 * 1000)
      });

      // Transition to en_route_pickup first
      await request(app)
        .patch(`/api/tasks/${taskId}/status`)
        .set('Cookie', volunteer1Cookie)
        .send({ newStatus: 'en_route_pickup' });

      // Attempt pickup with expired code
      const res = await request(app)
        .patch(`/api/tasks/${taskId}/status`)
        .set('Cookie', volunteer1Cookie)
        .send({
          newStatus: 'picked_up',
          candidateCode: reservation.pickupCode
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('expired');
    });
  });

  describe('Administration: Reports, Moderation & Account Suspension', () => {
    let reportId;

    it('should allow user to file a safety incident report', async () => {
      const res = await request(app)
        .post('/api/reports')
        .set('Cookie', recipientCookie)
        .send({
          targetType: 'listing',
          targetId: listing._id,
          targetTitle: listing.title,
          reason: 'food_safety_hazard',
          description: 'Noticed broken packaging seal during pickup loading inspection',
          severity: 'medium'
        });

      expect(res.status).toBe(201);
      expect(res.body.data.report).toBeDefined();
      reportId = res.body.data.report._id;
    });

    it('should restrict admin endpoints to administrators only', async () => {
      const res = await request(app)
        .get('/api/admin/reports')
        .set('Cookie', recipientCookie);

      expect(res.status).toBe(403);
    });

    it('should allow admin to resolve moderation reports and audit action', async () => {
      // File report first
      const rep = await Report.create({
        reporterId: recipientUser._id,
        reporterName: recipientUser.name,
        targetType: 'listing',
        targetId: listing._id,
        targetTitle: listing.title,
        reason: 'food_safety_hazard',
        description: 'Packaging seal broken during transit loading',
        status: 'open'
      });

      const res = await request(app)
        .patch(`/api/admin/reports/${rep._id}`)
        .set('Cookie', adminCookie)
        .send({
          status: 'resolved',
          adminNotes: 'Investigated and donor coached on packaging guidelines.'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.report.status).toBe('resolved');

      // Check audit log
      const logs = await AuditLog.find({ action: 'REPORT_RESOLVED' });
      expect(logs.length).toBeGreaterThanOrEqual(1);
    });

    it('should allow admin to suspend an account, immediately rejecting login and requests', async () => {
      // 1. Admin suspends donor
      const suspendRes = await request(app)
        .patch(`/api/admin/users/${donorUser._id}/status`)
        .set('Cookie', adminCookie)
        .send({ status: 'suspended', reason: 'Repeated non-compliance with safe transport' });

      expect(suspendRes.status).toBe(200);
      expect(suspendRes.body.data.user.status).toBe('suspended');

      // 2. Suspended donor attempts to perform authenticated action with existing cookie -> 403
      const createListingAttempt = await request(app)
        .post('/api/listings')
        .set('Cookie', donorCookie)
        .send({
          title: 'Unauthorized listing attempt',
          category: 'produce',
          quantity: 5,
          unit: 'kg'
        });
      expect(createListingAttempt.status).toBe(403);
      expect(createListingAttempt.body.message).toContain('suspended');

      // 3. Suspended donor attempts to log in again -> 403
      const loginAttempt = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'alessandro@trattoria.com',
          password: 'Password123!'
        });
      expect(loginAttempt.status).toBe(403);
      expect(loginAttempt.body.message).toContain('suspended');
    });
  });

  describe('Platform Analytics Engine: Verified vs Estimated & No Double-Counting', () => {
    it('should calculate verified rescued kg accurately without double-counting', async () => {
      // Set up a completed task with verified physical scale measurement
      const tasksRes = await request(app)
        .get('/api/tasks/board')
        .set('Cookie', volunteer1Cookie);
      const taskId = tasksRes.body.data.tasks[0]._id;

      await PickupTask.findByIdAndUpdate(taskId, {
        status: 'delivered',
        actualRescuedKg: 12.4,
        deliveredAt: new Date()
      });
      await Reservation.findByIdAndUpdate(reservation._id, {
        status: 'completed'
      });

      // Call public/auth analytics endpoint
      const res = await request(app).get('/api/analytics');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const { summary, operations } = res.body.data;
      expect(summary.verifiedRescuedKg).toBe(12.4);
      expect(summary.totalRescuedKg).toBeGreaterThanOrEqual(12.4);
      expect(summary.metricsIntegrity.isVerifiedMeasurement).toBe(true);
      expect(summary.metricsIntegrity.verifiedPortionPercentage).toBeGreaterThan(0);
      expect(operations.successfulDeliveries).toBe(1);
    });
  });

  describe('Expiry Processing Engine: Safe Release & Repeated Execution Idempotency', () => {
    it('should transition expired listings, release inventory and execute idempotently without side-effects', async () => {
      const past = new Date(Date.now() - 3600 * 1000);

      // Create an expired listing with remaining unreserved units
      const expiredList = await FoodListing.create({
        title: 'Expiring Soup Batch',
        description: 'Nutritious vegetable soup batch ready for redistribution',
        category: 'cooked_meals',
        quantity: 15,
        quantityRemaining: 15,
        unit: 'servings',
        pickupWindow: {
          startTime: new Date(Date.now() - 7200 * 1000),
          endTime: past
        },
        storageRequirements: 'ambient',
        donorId: donorUser._id,
        location: { type: 'Point', coordinates: [-73.98, 40.74] },
        status: 'available',
        expiresAt: past
      });

      // Create an unapproved pending reservation past deadline
      const expiredRes = await Reservation.create({
        listingId: expiredList._id,
        listingTitle: expiredList.title,
        donorId: donorUser._id,
        recipientId: recipientUser._id,
        organizationId: recipientUser.organizationId,
        organizationName: 'Pantry',
        quantityReserved: 5,
        unit: 'bowls',
        status: 'pending_approval',
        pickupDeadline: past,
        pickupCode: 'RB-0001',
        deliveryCode: 'RB-0002',
        inventoryReleased: false
      });

      // FIRST EXECUTION of expiry job
      const statsFirst = await runExpiryJob();
      expect(statsFirst.expiredListingsCount).toBeGreaterThanOrEqual(1);
      expect(statsFirst.expiredReservationsCount).toBeGreaterThanOrEqual(1);

      // Verify DB states after first execution
      const checkList = await FoodListing.findById(expiredList._id);
      expect(checkList.status).toBe('expired');

      const checkRes = await Reservation.findById(expiredRes._id);
      expect(checkRes.status).toBe('expired');
      expect(checkRes.inventoryReleased).toBe(true);

      // SECOND EXECUTION (Immediate repeat / replay test)
      // Must be completely safe, modify 0 additional items, and not alter inventory or fail
      const statsSecond = await runExpiryJob();
      expect(statsSecond.expiredListingsCount).toBe(0);
      expect(statsSecond.expiredReservationsCount).toBe(0);
    });
  });

  describe('Real-Time Socket.IO: Authentication & Authorized Subscriptions', () => {
    let ioServer, testServer;
    let wsPort;

    beforeEach(async () => {
      testServer = http.createServer(app);
      ioServer = initSocket(testServer);
      await new Promise((resolve) => {
        testServer.listen(0, () => {
          wsPort = testServer.address().port;
          resolve();
        });
      });
    });

    afterAll(async () => {
      if (testServer) {
        await new Promise((resolve) => testServer.close(resolve));
      }
    });

    it('should reject socket connection when token is absent or invalid', async () => {
      const err = await new Promise((resolve) => {
        const client = Client(`http://localhost:${wsPort}`, {
          auth: { token: 'invalid_forged_token' },
          transports: ['websocket'],
          reconnection: false
        });
        client.on('connect_error', (error) => {
          client.disconnect();
          resolve(error);
        });
      });

      expect(err).toBeDefined();
      expect(err.message).toContain('Invalid or expired socket authentication token');
    });

    it('should successfully authenticate socket with valid token and allow authorized room subscriptions', async () => {
      const client = Client(`http://localhost:${wsPort}`, {
        auth: { token: volunteer1Token },
        transports: ['websocket'],
        reconnection: false
      });

      await new Promise((resolve, reject) => {
        client.on('connect', () => {
          // Subscribe to live listing inventory room
          client.emit('join_listing', listing._id.toString());
          client.emit('leave_listing', listing._id.toString());
          client.disconnect();
          resolve();
        });
        client.on('connect_error', (error) => {
          client.disconnect();
          reject(error);
        });
      });
    });
  });
});
