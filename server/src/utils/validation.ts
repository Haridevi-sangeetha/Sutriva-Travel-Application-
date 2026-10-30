import { z } from 'zod';

// Strong Password Requirements: Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special character
const passwordSchema = z.string()
  .min(8, { message: 'Password must be at least 8 characters long' })
  .max(128, { message: 'Password cannot exceed 128 characters' })
  .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
  .regex(/[a-z]/, { message: 'Password must contain at least one lowercase letter' })
  .regex(/[0-9]/, { message: 'Password must contain at least one number' })
  .regex(/[^A-Za-z0-9]/, { message: 'Password must contain at least one special character' });

// Email Schema with strict lowercasing and trimming
const emailSchema = z.string()
  .email({ message: 'Invalid email address format' })
  .max(255)
  .transform(val => val.toLowerCase().trim());

// Mobile Schema (E.164 format compliance)
const mobileSchema = z.string()
  .regex(/^\+?[1-9]\d{9,14}$/, { message: 'Invalid mobile phone number format' })
  .transform(val => val.trim());

export const RegisterSchema = z.object({
  email: emailSchema,
  mobile: mobileSchema.optional(),
  password: passwordSchema,
  firstName: z.string().min(1, 'First name is required').max(50).trim(),
  lastName: z.string().min(1, 'Last name is required').max(50).trim()
});

export const LoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required')
});

export const OtpRequestSchema = z.object({
  identifier: z.string().min(3, 'Email or Mobile number is required').trim()
});

export const OtpVerifySchema = z.object({
  identifier: z.string().min(3, 'Email or Mobile number is required').trim(),
  otp: z.string().length(6, 'OTP must be exactly 6 digits').regex(/^\d{6}$/, 'OTP must contain only digits')
});

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().optional() // Can be passed in body or httpOnly cookie
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type OtpRequestInput = z.infer<typeof OtpRequestSchema>;
export type OtpVerifyInput = z.infer<typeof OtpVerifySchema>;
