import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { RegisterSchema, LoginSchema, OtpRequestSchema, OtpVerifySchema } from '../utils/validation';
import { CONFIG } from '../config/config';

export class AuthController {

  /**
   * HTTP POST /api/v1/auth/register
   */
  async register(req: Request, res: Response): Promise<void> {
    try {
      const validationResult = RegisterSchema.safeParse(req.body);
      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Invalid input data.',
          details: validationResult.error.flatten().fieldErrors
        });
        return;
      }

      const { user, tokens } = await authService.register(validationResult.data);
      
      this.setAuthCookies(res, tokens.refreshToken, tokens.accessToken);

      res.status(201).json({
        success: true,
        message: 'Account created successfully.',
        data: {
          user,
          accessToken: tokens.accessToken,
          expiresInSeconds: tokens.expiresInSeconds
        }
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: 'REGISTRATION_FAILED',
        message: err.message || 'Registration failed. Please check your details.'
      });
    }
  }

  /**
   * HTTP POST /api/v1/auth/login
   */
  async login(req: Request, res: Response): Promise<void> {
    try {
      const validationResult = LoginSchema.safeParse(req.body);
      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Invalid email or password format.'
        });
        return;
      }

      const userAgent = req.headers['user-agent'] || 'Unknown';
      const ipAddress = req.ip || req.socket.remoteAddress || '0.0.0.0';

      const { user, tokens } = await authService.login(validationResult.data, userAgent, ipAddress);

      this.setAuthCookies(res, tokens.refreshToken, tokens.accessToken);

      res.status(200).json({
        success: true,
        message: 'Login successful.',
        data: {
          user,
          accessToken: tokens.accessToken,
          expiresInSeconds: tokens.expiresInSeconds
        }
      });
    } catch (err: any) {
      const status = err.message.startsWith('ACCOUNT_LOCKED') ? 423 : 401;
      res.status(status).json({
        success: false,
        error: 'AUTH_FAILED',
        message: err.message || 'Invalid email or password.'
      });
    }
  }

  /**
   * HTTP POST /api/v1/auth/otp/request
   */
  async requestOtp(req: Request, res: Response): Promise<void> {
    try {
      const validationResult = OtpRequestSchema.safeParse(req.body);
      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Valid email or mobile number is required.'
        });
        return;
      }

      const result = await authService.requestOtp(validationResult.data.identifier);

      res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: 'OTP_REQUEST_FAILED',
        message: 'Unable to process OTP request.'
      });
    }
  }

  /**
   * HTTP POST /api/v1/auth/otp/verify
   */
  async verifyOtp(req: Request, res: Response): Promise<void> {
    try {
      const validationResult = OtpVerifySchema.safeParse(req.body);
      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Valid identifier and 6-digit OTP code are required.'
        });
        return;
      }

      const userAgent = req.headers['user-agent'] || 'Unknown';
      const ipAddress = req.ip || req.socket.remoteAddress || '0.0.0.0';

      const { user, tokens } = await authService.verifyOtp(
        validationResult.data.identifier,
        validationResult.data.otp,
        userAgent,
        ipAddress
      );

      this.setAuthCookies(res, tokens.refreshToken, tokens.accessToken);

      res.status(200).json({
        success: true,
        message: 'OTP verification successful.',
        data: {
          user,
          accessToken: tokens.accessToken,
          expiresInSeconds: tokens.expiresInSeconds
        }
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: 'OTP_FAILED',
        message: err.message || 'OTP verification failed.'
      });
    }
  }

  /**
   * HTTP POST /api/v1/auth/refresh
   */
  async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const rawRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

      if (!rawRefreshToken) {
        res.status(401).json({
          success: false,
          error: 'REFRESH_TOKEN_REQUIRED',
          message: 'Refresh token is missing.'
        });
        return;
      }

      const userAgent = req.headers['user-agent'] || 'Unknown';
      const ipAddress = req.ip || req.socket.remoteAddress || '0.0.0.0';

      const tokens = await authService.refreshSession(rawRefreshToken, userAgent, ipAddress);

      this.setAuthCookies(res, tokens.refreshToken, tokens.accessToken);

      res.status(200).json({
        success: true,
        message: 'Session refreshed successfully.',
        data: {
          accessToken: tokens.accessToken,
          expiresInSeconds: tokens.expiresInSeconds
        }
      });
    } catch (err: any) {
      this.clearAuthCookies(res);
      res.status(401).json({
        success: false,
        error: 'REFRESH_FAILED',
        message: err.message || 'Failed to refresh session.'
      });
    }
  }

  /**
   * HTTP POST /api/v1/auth/logout
   */
  async logout(req: Request, res: Response): Promise<void> {
    const rawRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    if (rawRefreshToken) {
      await authService.logout(rawRefreshToken);
    }

    this.clearAuthCookies(res);

    res.status(200).json({
      success: true,
      message: 'Logged out successfully.'
    });
  }

  /**
   * HTTP POST /api/v1/auth/logout-all (Protected)
   */
  async logoutAllDevices(req: Request, res: Response): Promise<void> {
    if (req.user) {
      await authService.logoutAllDevices(req.user.userId);
    }
    this.clearAuthCookies(res);

    res.status(200).json({
      success: true,
      message: 'Logged out from all active devices successfully.'
    });
  }

  private setAuthCookies(res: Response, refreshToken: string, accessToken: string): void {
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: CONFIG.IS_PRODUCTION,
      sameSite: 'strict',
      path: '/api/v1/auth',
      maxAge: CONFIG.JWT_REFRESH_EXPIRY_DAYS * 24 * 60 * 60 * 1000
    });

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: CONFIG.IS_PRODUCTION,
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000
    });
  }

  private clearAuthCookies(res: Response): void {
    res.clearCookie('refreshToken', { path: '/api/v1/auth' });
    res.clearCookie('accessToken');
  }
}

export const authController = new AuthController();
