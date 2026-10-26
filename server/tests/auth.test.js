import request from 'supertest';
import { describe, it, expect } from 'vitest';
import app from '../src/app.js';
import { User } from '../src/models/User.js';
import { COOKIE_NAME } from '../src/utils/token.js';

describe('Auth API Endpoints (/api/auth)', () => {
  const validUserPayload = {
    name: 'Chef Marco Bellini',
    email: 'marco@artisanbistro.com',
    password: 'Password123!',
    phone: '+1 (555) 234-5678',
    role: 'donor',
    organizationName: 'Artisan Bistro & Bakery'
  };

  describe('POST /api/auth/register', () => {
    it('should register a new donor user, create linked organization, and return 201 with cookie', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(validUserPayload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(validUserPayload.email);
      expect(res.body.data.user.role).toBe('donor');
      expect(res.body.data.user.passwordHash).toBeUndefined(); // Sensitive field must never be exposed
      expect(res.body.data.user.organizationId).toBeDefined();

      // Verify HttpOnly cookie was set
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      const authCookie = cookies.find(c => c.startsWith(`${COOKIE_NAME}=`));
      expect(authCookie).toBeDefined();
      expect(authCookie).toContain('HttpOnly');
    });

    it('should reject registration when required fields are missing with 400', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'incomplete@example.com'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toBeDefined();
      expect(res.body.errors.length).toBeGreaterThan(0);
    });

    it('should reject registration when password is shorter than 8 characters', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          ...validUserPayload,
          email: 'weakpass@example.com',
          password: '123'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors.some(e => e.field === 'password')).toBe(true);
    });

    it('should return 409 conflict when registering with already existing email', async () => {
      // First registration
      await request(app).post('/api/auth/register').send(validUserPayload);

      // Duplicate registration
      const res = await request(app).post('/api/auth/register').send(validUserPayload);

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('already exists');
    });

    it('should prevent privilege escalation: cannot self-register as admin', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          ...validUserPayload,
          email: 'hacker@example.com',
          role: 'admin'
        });

      // Role validator rejects admin as a self-registration role
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors.some(e => e.field === 'role')).toBe(true);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should authenticate valid credentials with 200 and set HttpOnly cookie', async () => {
      // Create user first
      await request(app).post('/api/auth/register').send(validUserPayload);

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: validUserPayload.email,
          password: validUserPayload.password
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(validUserPayload.email);

      const cookies = res.headers['set-cookie'];
      expect(cookies.some(c => c.startsWith(`${COOKIE_NAME}=`))).toBe(true);
    });

    it('should reject login with wrong password with 401', async () => {
      await request(app).post('/api/auth/register').send(validUserPayload);

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: validUserPayload.email,
          password: 'WrongPassword999!'
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Invalid email or password');
    });

    it('should reject login with non-existent email with 401', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'doesnotexist@example.com',
          password: 'Password123!'
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject login when user account status is suspended with 403', async () => {
      const reg = await request(app).post('/api/auth/register').send(validUserPayload);
      const userId = reg.body.data.user._id;

      // Suspend user
      await User.findByIdAndUpdate(userId, { status: 'suspended' });

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: validUserPayload.email,
          password: validUserPayload.password
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('suspended');
    });
  });

  describe('GET /api/auth/me & PUT /api/auth/profile', () => {
    it('should return 401 unauthenticated when accessing /api/auth/me without token/cookie', async () => {
      const res = await request(app).get('/api/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Authentication required');
    });

    it('should return authenticated user profile when valid cookie is provided', async () => {
      const loginRes = await request(app)
        .post('/api/auth/register')
        .send(validUserPayload);

      const cookie = loginRes.headers['set-cookie'];

      const res = await request(app)
        .get('/api/auth/me')
        .set('Cookie', cookie);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(validUserPayload.email);
    });

    it('should update user profile successfully with 200', async () => {
      const loginRes = await request(app)
        .post('/api/auth/register')
        .send(validUserPayload);

      const cookie = loginRes.headers['set-cookie'];

      const res = await request(app)
        .put('/api/auth/profile')
        .set('Cookie', cookie)
        .send({
          name: 'Marco Antonio Bellini',
          phone: '+1 (555) 999-8888'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.user.name).toBe('Marco Antonio Bellini');
      expect(res.body.data.user.phone).toBe('+1 (555) 999-8888');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should clear authentication cookie on logout', async () => {
      const loginRes = await request(app)
        .post('/api/auth/register')
        .send(validUserPayload);

      const cookie = loginRes.headers['set-cookie'];

      const res = await request(app)
        .post('/api/auth/logout')
        .set('Cookie', cookie);

      expect(res.status).toBe(200);
      const clearedCookies = res.headers['set-cookie'];
      expect(clearedCookies.some(c => c.includes(`${COOKIE_NAME}=;`))).toBe(true);
    });
  });
});
