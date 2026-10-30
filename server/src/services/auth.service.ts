import jwt, { SignOptions } from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { CONFIG } from '../config/config';
import { User, userRepository } from '../models/user.model';
import { RefreshSession, sessionRepository } from '../models/session.model';
import { OtpRecord, otpRepository } from '../models/otp.model';
import { hashPassword, verifyPassword, generateSecureOtp, hashToken, timingSafeCompare } from '../utils/crypto';
import { logger } from '../utils/logger';
import { RegisterInput, LoginInput } from '../utils/validation';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number;
}

export class AuthService {

  /**
   * Registers a new user with hashed password
   */
  async register(input: RegisterInput): Promise<{ user: Omit<User, 'passwordHash'>; tokens: AuthTokens }> {
    const existingEmail = await userRepository.findByEmail(input.email);
    if (existingEmail) {
      // OWASP: Generic error message to prevent account enumeration
      throw new Error('AUTH_FAILED: Invalid registration details or account already exists.');
    }

    if (input.mobile) {
      const existingMobile = await userRepository.findByMobile(input.mobile);
      if (existingMobile) {
        throw new Error('AUTH_FAILED: Invalid registration details or account already exists.');
      }
    }

    const passwordHash = await hashPassword(input.password);
    const userId = `usr_${randomUUID().replace(/-/g, '')}`;

    const newUser: User = {
      id: userId,
      email: input.email,
      mobile: input.mobile,
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
      role: 'USER', // Default role
      isVerified: true,
      failedLoginAttempts: 0,
      lockoutUntil: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await userRepository.save(newUser);
    logger.info('User successfully registered', { userId: newUser.id, email: newUser.email });

    const tokens = await this.createSessionAndTokens(newUser, 'web-client', '0.0.0.0');

    const { passwordHash: _, ...safeUser } = newUser;
    return { user: safeUser, tokens };
  }

  /**
   * Logins user with password verification & account lockout protection
   */
  async login(input: LoginInput, userAgent: string, ipAddress: string): Promise<{ user: Omit<User, 'passwordHash'>; tokens: AuthTokens }> {
    const user = await userRepository.findByEmail(input.email);
    
    // OWASP: Consistent response timing and generic error message to prevent enumeration
    if (!user) {
      // Perform dummy password verification to neutralize timing attack
      await verifyPassword(input.password, '$2a$12$eImiTXuWVxfM37uY4JANjO5E/0.0.0.0.0.0.0.0.0.0.0.0.0.0');
      throw new Error('AUTH_FAILED: Invalid credentials provided.');
    }

    // Check Account Lockout
    if (user.lockoutUntil && user.lockoutUntil > new Date()) {
      const remainingMinutes = Math.ceil((user.lockoutUntil.getTime() - Date.now()) / 60000);
      logger.securityEvent('ACCOUNT_LOCKOUT_ATTEMPT', { userId: user.id, email: user.email, ipAddress });
      throw new Error(`ACCOUNT_LOCKED: Account is temporarily locked due to excessive failed attempts. Try again in ${remainingMinutes} minutes.`);
    }

    // Verify Password
    const isPasswordValid = await verifyPassword(input.password, user.passwordHash);
    if (!isPasswordValid) {
      const newAttempts = user.failedLoginAttempts + 1;
      let lockoutTime: Date | null = null;

      if (newAttempts >= CONFIG.MAX_FAILED_LOGIN_ATTEMPTS) {
        lockoutTime = new Date(Date.now() + CONFIG.ACCOUNT_LOCKOUT_DURATION_MS);
        logger.securityEvent('ACCOUNT_LOCKED', { userId: user.id, email: user.email, ipAddress });
      }

      await userRepository.updateLockoutStatus(user.id, newAttempts, lockoutTime);
      throw new Error('AUTH_FAILED: Invalid credentials provided.');
    }

    // Reset failed login attempts on successful login
    if (user.failedLoginAttempts > 0 || user.lockoutUntil !== null) {
      await userRepository.updateLockoutStatus(user.id, 0, null);
    }

    const tokens = await this.createSessionAndTokens(user, userAgent, ipAddress);

    logger.info('User logged in successfully', { userId: user.id, email: user.email });
    const { passwordHash: _, ...safeUser } = user;
    return { user: safeUser, tokens };
  }

  /**
   * Generates and dispatches a cryptographically secure 6-digit OTP
   */
  async requestOtp(identifier: string): Promise<{ message: string }> {
    const rawOtp = generateSecureOtp();
    const otpHash = hashToken(rawOtp);
    const expiresAt = new Date(Date.now() + CONFIG.OTP_EXPIRY_MS);

    const record: OtpRecord = {
      id: randomUUID(),
      identifier: identifier.toLowerCase(),
      otpHash,
      verifyAttempts: 0,
      expiresAt,
      isUsed: false,
      createdAt: new Date()
    };

    await otpRepository.save(record);
    logger.info('OTP generated and saved for verification', { identifier: record.identifier });

    // In production, dispatch OTP via SMS / Email provider (e.g. Twilio / SendGrid)
    // OWASP: Never log raw OTP or return raw OTP in API response
    return { message: 'If the provided detail is registered, a secure 6-digit verification code has been dispatched.' };
  }

  /**
   * Verifies OTP and logs in / registers user
   */
  async verifyOtp(identifier: string, rawOtp: string, userAgent: string, ipAddress: string): Promise<{ user: Omit<User, 'passwordHash'>; tokens: AuthTokens }> {
    const record = await otpRepository.findByIdentifier(identifier);

    if (!record || record.isUsed || record.expiresAt < new Date()) {
      throw new Error('OTP_INVALID: OTP has expired or is invalid.');
    }

    if (record.verifyAttempts >= CONFIG.MAX_OTP_VERIFY_ATTEMPTS) {
      await otpRepository.markUsed(identifier);
      logger.securityEvent('OTP_MAX_ATTEMPTS_EXCEEDED', { identifier });
      throw new Error('OTP_EXCEEDED: Maximum OTP verification attempts exceeded. Please request a new OTP.');
    }

    const inputHash = hashToken(rawOtp);
    const isMatch = timingSafeCompare(inputHash, record.otpHash);

    if (!isMatch) {
      await otpRepository.incrementAttempts(identifier);
      throw new Error('OTP_INVALID: Invalid OTP code provided.');
    }

    await otpRepository.markUsed(identifier);

    // Find existing user or auto-provision
    let user = await userRepository.findByEmail(identifier) || await userRepository.findByMobile(identifier);

    if (!user) {
      const dummyPasswordHash = await hashPassword(generateSecureOtp() + 'SutrivaSecure123!');
      const isEmail = identifier.includes('@');
      user = {
        id: `usr_${randomUUID().replace(/-/g, '')}`,
        email: isEmail ? identifier.toLowerCase() : `${identifier.replace(/\D/g, '')}@mobile.sutriva.com`,
        mobile: isEmail ? undefined : identifier,
        passwordHash: dummyPasswordHash,
        firstName: 'Traveler',
        lastName: 'User',
        role: 'USER',
        isVerified: true,
        failedLoginAttempts: 0,
        lockoutUntil: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      await userRepository.save(user);
    }

    const tokens = await this.createSessionAndTokens(user, userAgent, ipAddress);
    const { passwordHash: _, ...safeUser } = user;
    return { user: safeUser, tokens };
  }

  /**
   * Refreshes access token with Refresh Token Rotation & Family Reuse Detection
   */
  async refreshSession(rawRefreshToken: string, userAgent: string, ipAddress: string): Promise<AuthTokens> {
    try {
      const decoded = jwt.verify(rawRefreshToken, CONFIG.JWT_REFRESH_SECRET) as { sessionId: string; familyId: string; userId: string };
      const incomingHash = hashToken(rawRefreshToken);
      
      const session = await sessionRepository.findByTokenHash(incomingHash);

      // SECURITY CRITICAL: Refresh Token Reuse Detection
      // If session not found or already revoked, potential token theft occurred!
      if (!session || session.isRevoked) {
        if (decoded.familyId) {
          logger.securityEvent('TOKEN_REUSE_DETECTED', { familyId: decoded.familyId, userId: decoded.userId, ipAddress });
          // Revoke ALL tokens in the family to protect account!
          await sessionRepository.revokeFamily(decoded.familyId);
        }
        throw new Error('TOKEN_REVOKED: Security alert. Session invalidated due to token reuse.');
      }

      // Check session expiry
      if (session.expiresAt < new Date()) {
        await sessionRepository.revokeSession(session.id);
        throw new Error('SESSION_EXPIRED: Refresh session expired. Please log in again.');
      }

      const user = await userRepository.findById(session.userId);
      if (!user) {
        throw new Error('USER_NOT_FOUND: User account does not exist.');
      }

      // Revoke current session (Rotate)
      await sessionRepository.revokeSession(session.id);

      // Issue NEW Refresh Token & Access Token in the SAME family
      return await this.createSessionAndTokens(user, userAgent, ipAddress, session.familyId);
    } catch (err: any) {
      if (err.name === 'TokenExpiredError') {
        throw new Error('SESSION_EXPIRED: Session expired. Please log in again.');
      }
      throw err;
    }
  }

  /**
   * Single Device Logout
   */
  async logout(rawRefreshToken: string): Promise<void> {
    try {
      const tokenHash = hashToken(rawRefreshToken);
      const session = await sessionRepository.findByTokenHash(tokenHash);
      if (session) {
        await sessionRepository.revokeSession(session.id);
        logger.info('User logged out from device', { userId: session.userId, sessionId: session.id });
      }
    } catch (err) {
      // Silent catch to prevent leaking logout details
    }
  }

  /**
   * Logout From All Devices
   */
  async logoutAllDevices(userId: string): Promise<void> {
    await sessionRepository.revokeAllUserSessions(userId);
    logger.securityEvent('LOGOUT_ALL_DEVICES', { userId });
  }

  /**
   * Helper: Creates short-lived access token + long-lived refresh token session
   */
  private async createSessionAndTokens(user: User, userAgent: string, ipAddress: string, existingFamilyId?: string): Promise<AuthTokens> {
    const sessionId = randomUUID();
    const familyId = existingFamilyId || randomUUID();

    const accessOptions: SignOptions = { expiresIn: '15m' };
    const refreshOptions: SignOptions = { expiresIn: '7d' };

    // 1. Generate Short-Lived Access Token (15 Minutes)
    const accessToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        sessionId
      },
      CONFIG.JWT_ACCESS_SECRET,
      accessOptions
    );

    // 2. Generate Long-Lived Refresh Token (7 Days)
    const refreshToken = jwt.sign(
      {
        sessionId,
        familyId,
        userId: user.id
      },
      CONFIG.JWT_REFRESH_SECRET,
      refreshOptions
    );

    const refreshTokenHash = hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + CONFIG.JWT_REFRESH_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

    // 3. Persist Refresh Session
    const session: RefreshSession = {
      id: sessionId,
      userId: user.id,
      tokenHash: refreshTokenHash,
      familyId,
      isRevoked: false,
      userAgent,
      ipAddress,
      expiresAt,
      createdAt: new Date()
    };

    await sessionRepository.create(session);

    return {
      accessToken,
      refreshToken,
      expiresInSeconds: 15 * 60
    };
  }
}

export const authService = new AuthService();

