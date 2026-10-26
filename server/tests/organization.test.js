import request from 'supertest';
import { describe, it, expect } from 'vitest';
import app from '../src/app.js';
import { User } from '../src/models/User.js';
import { Organization } from '../src/models/Organization.js';
import { ROLES } from '../src/constants/roles.js';

describe('Organization API Endpoints (/api/organizations)', () => {
  let recipientCookie;
  let volunteerCookie;
  let adminCookie;
  let adminUser;

  const validOrgPayload = {
    name: 'Hope Haven Community Shelter',
    type: 'shelter',
    registrationNumber: 'EIN-84-9281742',
    taxId: 'EIN-84-9281742',
    contactEmail: 'contact@hopehaven.org',
    contactPhone: '+1 (555) 876-5432',
    address: {
      street: '120 E 12th St',
      city: 'New York',
      state: 'NY',
      postalCode: '10003'
    },
    verificationDocuments: [
      {
        title: '501(c)(3) IRS Determination Letter',
        url: 'https://storage.rescuebite.local/docs/501c3.pdf',
        documentType: 'tax_exempt_letter'
      }
    ]
  };

  const setupTestUsers = async () => {
    // 1. Recipient User
    const recipRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Sarah Jenkins',
        email: 'sarah@hopehaven.org',
        password: 'Password123!',
        phone: '+1 (555) 876-5432',
        role: 'recipient'
      });
    recipientCookie = recipRes.headers['set-cookie'];

    // 2. Volunteer User
    const volRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'David Chen',
        email: 'david@courier.org',
        password: 'Password123!',
        phone: '+1 (555) 345-6789',
        role: 'volunteer'
      });
    volunteerCookie = volRes.headers['set-cookie'];

    // 3. Admin User (Created directly in DB for security)
    const adminHash = await User.hashPassword('AdminPass123!');
    adminUser = await User.create({
      name: 'Elena Rostova',
      email: 'admin.elena@rescuebite.org',
      passwordHash: adminHash,
      role: ROLES.ADMIN,
      phone: '+1 (555) 999-0000',
      status: 'active'
    });

    const adminLoginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin.elena@rescuebite.org',
        password: 'AdminPass123!'
      });
    adminCookie = adminLoginRes.headers['set-cookie'];
  };

  describe('POST /api/organizations/apply', () => {
    it('should allow verified recipient role to submit organization verification application', async () => {
      await setupTestUsers();

      const res = await request(app)
        .post('/api/organizations/apply')
        .set('Cookie', recipientCookie)
        .send(validOrgPayload);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.organization.name).toBe(validOrgPayload.name);
      expect(res.body.data.organization.verificationStatus).toBe('pending');
      expect(res.body.data.organization.verificationDocuments.length).toBe(1);
    });

    it('should return 403 forbidden when volunteer role attempts to submit organization verification', async () => {
      await setupTestUsers();

      const res = await request(app)
        .post('/api/organizations/apply')
        .set('Cookie', volunteerCookie)
        .send(validOrgPayload);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Forbidden');
    });

    it('should return 401 unauthenticated when applying without token or cookie', async () => {
      const res = await request(app)
        .post('/api/organizations/apply')
        .send(validOrgPayload);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 when missing required organization type or registration number', async () => {
      await setupTestUsers();

      const res = await request(app)
        .post('/api/organizations/apply')
        .set('Cookie', recipientCookie)
        .send({
          name: 'Incomplete Org',
          contactEmail: 'test@example.com'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors.some(e => e.field === 'type')).toBe(true);
      expect(res.body.errors.some(e => e.field === 'registrationNumber')).toBe(true);
    });
  });

  describe('Admin Verification Workflow (/api/organizations/admin/*)', () => {
    it('should reject non-admin access to admin verification queue with 403', async () => {
      await setupTestUsers();

      const res = await request(app)
        .get('/api/organizations/admin/queue')
        .set('Cookie', recipientCookie);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Forbidden: Access restricted');
    });

    it('should allow admin to retrieve paginated verification queue with 200', async () => {
      await setupTestUsers();

      // Submit an application first
      await request(app)
        .post('/api/organizations/apply')
        .set('Cookie', recipientCookie)
        .send(validOrgPayload);

      const res = await request(app)
        .get('/api/organizations/admin/queue?status=pending')
        .set('Cookie', adminCookie);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.organizations).toBeDefined();
      expect(res.body.data.organizations.length).toBeGreaterThan(0);
      expect(res.body.pagination).toBeDefined();
      expect(res.body.pagination.total).toBeGreaterThanOrEqual(1);
    });

    it('should allow admin to approve organization verification with review notes', async () => {
      await setupTestUsers();

      const applyRes = await request(app)
        .post('/api/organizations/apply')
        .set('Cookie', recipientCookie)
        .send(validOrgPayload);

      const orgId = applyRes.body.data.organization._id;

      const res = await request(app)
        .patch(`/api/organizations/admin/${orgId}/verify`)
        .set('Cookie', adminCookie)
        .send({
          status: 'approved',
          reviewNotes: 'Verified non-profit status with IRS database.'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.organization.verificationStatus).toBe('approved');
      expect(res.body.data.organization.reviewNotes).toBe('Verified non-profit status with IRS database.');
      expect(res.body.data.organization.reviewedBy).toBe(adminUser._id.toString());
    });

    it('should reject verification decision with invalid status with 400', async () => {
      await setupTestUsers();

      const applyRes = await request(app)
        .post('/api/organizations/apply')
        .set('Cookie', recipientCookie)
        .send(validOrgPayload);

      const orgId = applyRes.body.data.organization._id;

      const res = await request(app)
        .patch(`/api/organizations/admin/${orgId}/verify`)
        .set('Cookie', adminCookie)
        .send({
          status: 'invalid_status_value'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors.some(e => e.field === 'status')).toBe(true);
    });
  });

  describe('GET /api/organizations/:id', () => {
    it('should retrieve public organization details while keeping sensitive docs private', async () => {
      await setupTestUsers();

      const applyRes = await request(app)
        .post('/api/organizations/apply')
        .set('Cookie', recipientCookie)
        .send(validOrgPayload);

      const orgId = applyRes.body.data.organization._id;

      const res = await request(app).get(`/api/organizations/${orgId}`);

      expect(res.status).toBe(200);
      expect(res.body.data.organization.name).toBe(validOrgPayload.name);
      expect(res.body.data.organization.verificationDocuments).toBeUndefined(); // Kept private
      expect(res.body.data.organization.ownerId.email).toBe('sarah@hopehaven.org');
    });

    it('should return 400 for malformed organization ID', async () => {
      const res = await request(app).get('/api/organizations/not-a-valid-mongo-id');
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });
});
