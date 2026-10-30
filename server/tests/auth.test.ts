import request from 'supertest';
import app from '../src/app';
import { userRepository } from '../src/models/user.model';
import { sessionRepository } from '../src/models/session.model';
import { otpRepository } from '../src/models/otp.model';

describe('Sutriva Auth Security Suite', () => {

  beforeEach(async () => {
    await userRepository.clearAll();
    await sessionRepository.clearAll();
    await otpRepository.clearAll();
  });

  describe('1. Registration Security & Input Validation', () => {
    it('should register a new user securely with strong password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'secure.user@sutriva.com',
          password: 'Password123!',
          firstName: 'John',
          lastName: 'Doe'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('secure.user@sutriva.com');
      expect(res.body.data.user.passwordHash).toBeUndefined(); // Never expose password hash!
      expect(res.body.data.accessToken).toBeDefined();
    });

    it('should reject weak passwords failing OWASP complexity rules', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'weak.user@sutriva.com',
          password: 'weakpassword',
          firstName: 'John',
          lastName: 'Doe'
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('VALIDATION_ERROR');
    });
  });

  describe('2. Account Lockout & Brute-Force Protection', () => {
    it('should lock out account after 5 consecutive failed password attempts', async () => {
      // 1. Register User
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'lockout.target@sutriva.com',
          password: 'Password123!',
          firstName: 'Target',
          lastName: 'User'
        });

      // 2. Perform 5 Failed Login Attempts
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/v1/auth/login')
          .send({
            email: 'lockout.target@sutriva.com',
            password: 'WrongPassword99!'
          });
      }

      // 3. 6th Attempt must trigger Account Lockout (423 Locked status)
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'lockout.target@sutriva.com',
          password: 'Password123!' // Even correct password must be blocked during lockout!
        });

      expect(res.status).toBe(423);
      expect(res.body.message).toContain('Account is temporarily locked');
    });
  });

  describe('3. Token Refresh & Reuse Detection', () => {
    it('should detect refresh token reuse and revoke token family', async () => {
      // 1. Login
      const regRes = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'reuse.test@sutriva.com',
          password: 'Password123!',
          firstName: 'Reuse',
          lastName: 'Tester'
        });

      const cookies: string[] = (regRes.headers['set-cookie'] as any) || [];
      const cookieHeader = cookies.find((c: string) => c.startsWith('refreshToken='));
      const originalRefreshToken = cookieHeader ? cookieHeader.split(';')[0].split('=')[1] : '';




      // 2. Rotate Refresh Token (1st valid refresh)
      const refreshRes1 = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Cookie', [`refreshToken=${originalRefreshToken}`]);

      expect(refreshRes1.status).toBe(200);

      // 3. Attempt to REUSE original refresh token (Attacker scenario)
      const reuseRes = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Cookie', [`refreshToken=${originalRefreshToken}`]);

      expect(reuseRes.status).toBe(401);
      expect(reuseRes.body.error).toBe('REFRESH_FAILED');
    });
  });

  describe('4. RBAC & IDOR Enforcement', () => {
    it('should prevent unauthorized access to Admin Dashboard for regular USER role', async () => {
      const regRes = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'normal.user@sutriva.com',
          password: 'Password123!',
          firstName: 'Normal',
          lastName: 'User'
        });

      const accessToken = regRes.body.data.accessToken;

      const adminRes = await request(app)
        .get('/api/v1/users/admin/dashboard')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(adminRes.status).toBe(403);
      expect(adminRes.body.error).toBe('FORBIDDEN');
    });
  });

});
