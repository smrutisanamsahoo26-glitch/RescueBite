import request from 'supertest';
import { describe, it, expect, beforeEach } from 'vitest';
import app from '../src/app.js';
import { User } from '../src/models/User.js';
import { Organization } from '../src/models/Organization.js';
import { FoodListing } from '../src/models/FoodListing.js';
import { ROLES } from '../src/constants/roles.js';
import { VERIFICATION_STATUS } from '../src/constants/orgStatus.js';

describe('Food Listing API Endpoints (/api/listings)', () => {
  let donorCookie;
  let otherDonorCookie;
  let recipientCookie;
  let donorUser;
  let donorOrg;

  const validListingPayload = {
    title: 'Fresh Artisan Sourdough Loaves',
    description: 'Freshly baked sourdough boules and baguettes from morning bake.',
    category: 'bakery',
    quantity: 30,
    unit: 'packs',
    pickupWindow: {
      startTime: new Date(Date.now() + 3600 * 1000).toISOString(),
      endTime: new Date(Date.now() + 8 * 3600 * 1000).toISOString()
    },
    storageRequirements: 'ambient',
    allergens: ['gluten'],
    dietaryInfo: ['vegan'],
    images: [{ url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff' }],
    location: {
      type: 'Point',
      coordinates: [-73.9851, 40.7484] // Midtown Manhattan
    }
  };

  beforeEach(async () => {
    // 1. Donor User & Org
    const regRes = await request(app).post('/api/auth/register').send({
      name: 'Chef Marco Bellini',
      email: 'marco@artisanbistro.com',
      password: 'Password123!',
      phone: '+1 (555) 234-5678',
      role: 'donor',
      organizationName: 'Artisan Bistro & Bakery'
    });
    donorCookie = regRes.headers['set-cookie'];
    donorUser = regRes.body.data.user;

    // 2. Second Donor User
    const regOther = await request(app).post('/api/auth/register').send({
      name: 'Chef Pierre',
      email: 'pierre@patisserie.com',
      password: 'Password123!',
      phone: '+1 (555) 333-4444',
      role: 'donor',
      organizationName: 'Pierre Bakery'
    });
    otherDonorCookie = regOther.headers['set-cookie'];

    // 3. Recipient User
    const regRecip = await request(app).post('/api/auth/register').send({
      name: 'Sarah Jenkins',
      email: 'sarah@hopehaven.org',
      password: 'Password123!',
      phone: '+1 (555) 876-5432',
      role: 'recipient'
    });
    recipientCookie = regRecip.headers['set-cookie'];
  });

  describe('POST /api/listings', () => {
    it('should allow donor to publish food listing with 201', async () => {
      const res = await request(app)
        .post('/api/listings')
        .set('Cookie', donorCookie)
        .send(validListingPayload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.listing.title).toBe(validListingPayload.title);
      expect(res.body.data.listing.quantityRemaining).toBe(validListingPayload.quantity);
      expect(res.body.data.listing.status).toBe('available');
    });

    it('should reject listing when pickupWindow endTime is in the past', async () => {
      const pastTime = new Date(Date.now() - 3600 * 1000).toISOString();
      const res = await request(app)
        .post('/api/listings')
        .set('Cookie', donorCookie)
        .send({
          ...validListingPayload,
          pickupWindow: {
            startTime: new Date(Date.now() - 7200 * 1000).toISOString(),
            endTime: pastTime
          }
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors.some(e => e.field.includes('endTime'))).toBe(true);
    });

    it('should reject non-donor role (recipient) from posting food listings with 403', async () => {
      const res = await request(app)
        .post('/api/listings')
        .set('Cookie', recipientCookie)
        .send(validListingPayload);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Forbidden');
    });
  });

  describe('GET /api/listings (Spatial Discovery & Filters)', () => {
    it('should discover listings filtered by category and coordinates within radius', async () => {
      // 1. Create Manhattan listing
      await request(app)
        .post('/api/listings')
        .set('Cookie', donorCookie)
        .send(validListingPayload);

      // 2. Query nearby in Manhattan (within 5km)
      const res = await request(app).get(
        '/api/listings?lng=-73.9851&lat=40.7484&maxDistance=5000&category=bakery'
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.listings.length).toBe(1);
      expect(res.body.data.listings[0].title).toBe(validListingPayload.title);

      // 3. Query far away (e.g. Philadelphia ~150km away) with 5km radius -> should return 0
      const farRes = await request(app).get(
        '/api/listings?lng=-75.1652&lat=39.9526&maxDistance=5000'
      );
      expect(farRes.status).toBe(200);
      expect(farRes.body.data.listings.length).toBe(0);
    });
  });

  describe('GET /api/listings/:id/recipient-matches', () => {
    it('should rank verified recipient organizations with weighted scoring and match explanations', async () => {
      // 1. Create Listing
      const createRes = await request(app)
        .post('/api/listings')
        .set('Cookie', donorCookie)
        .send(validListingPayload);

      const listingId = createRes.body.data.listing._id;

      // 2. Create verified recipient shelter in DB
      const verifiedRecipientUser = await User.create({
        name: 'Shelter Director',
        email: 'director@nycshelter.org',
        passwordHash: 'hash',
        role: ROLES.RECIPIENT,
        phone: '+1 (555) 111-2222',
        status: 'active'
      });

      await Organization.create({
        name: 'Downtown Emergency Shelter',
        type: 'shelter',
        registrationNumber: 'EIN-99-8877665',
        contactEmail: 'director@nycshelter.org',
        contactPhone: '+1 (555) 111-2222',
        ownerId: verifiedRecipientUser._id,
        verificationStatus: 'approved',
        location: {
          type: 'Point',
          coordinates: [-73.9900, 40.7400] // ~1 km from donor
        }
      });

      // 3. Query recipient matching recommendations
      const res = await request(app)
        .get(`/api/listings/${listingId}/recipient-matches`)
        .set('Cookie', donorCookie);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.matches.length).toBeGreaterThan(0);

      const topMatch = res.body.data.matches[0];
      expect(topMatch.organization.name).toBe('Downtown Emergency Shelter');
      expect(topMatch.score).toBeGreaterThan(0.7);
      expect(topMatch.normalizedScore).toBeGreaterThanOrEqual(70);
      expect(topMatch.matchExplanation).toBeDefined();
    });
  });

  describe('PUT & DELETE /api/listings/:id (Ownership Security)', () => {
    it('should prevent unauthorized donor from modifying another donor\'s listing with 403', async () => {
      const createRes = await request(app)
        .post('/api/listings')
        .set('Cookie', donorCookie)
        .send(validListingPayload);

      const listingId = createRes.body.data.listing._id;

      const res = await request(app)
        .put(`/api/listings/${listingId}`)
        .set('Cookie', otherDonorCookie) // Different donor!
        .send({ title: 'Hacked Title' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Forbidden');
    });

    it('should allow legitimate donor to edit and delete their listing', async () => {
      const createRes = await request(app)
        .post('/api/listings')
        .set('Cookie', donorCookie)
        .send(validListingPayload);

      const listingId = createRes.body.data.listing._id;

      // Update
      const updateRes = await request(app)
        .put(`/api/listings/${listingId}`)
        .set('Cookie', donorCookie)
        .send({ title: 'Updated Sourdough Boules' });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.listing.title).toBe('Updated Sourdough Boules');

      // Delete
      const deleteRes = await request(app)
        .delete(`/api/listings/${listingId}`)
        .set('Cookie', donorCookie);

      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body.data.listing.status).toBe('cancelled');
    });
  });
});
