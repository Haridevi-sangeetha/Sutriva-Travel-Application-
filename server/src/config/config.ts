import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

export const CONFIG = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/Sutriva',
  MONGODB_DB_NAME: process.env.MONGODB_DB_NAME || 'Sutriva',
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'fallback_access_secret_for_dev_environment_only_change_in_prod_32chars',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret_for_dev_environment_only_change_in_prod_32chars',
  JWT_ACCESS_EXPIRY: '15m',
  JWT_REFRESH_EXPIRY_DAYS: 7,
  
  // Account Security
  MAX_FAILED_LOGIN_ATTEMPTS: 5,
  ACCOUNT_LOCKOUT_DURATION_MS: 15 * 60 * 1000, // 15 minutes
  OTP_EXPIRY_MS: 3 * 60 * 1000, // 3 minutes
  MAX_OTP_VERIFY_ATTEMPTS: 3,

  // CORS
  ALLOWED_ORIGINS: (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:8080').split(','),

  // Razorpay Payment Gateway Secrets (Strictly loaded from Environment Variables)
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || 'rzp_test_sutriva_demo_key',
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || 'sutriva_razorpay_secret_dev',
  RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET || 'sutriva_webhook_secret_dev',

  // Google Maps Platform API Key (Optional with automatic OSM/OSRM/Overpass fallback)
  GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY || '',

  // Cookies
  COOKIE_SECRET: process.env.COOKIE_SECRET || 'cookie_secret_dev_mode',
  IS_PRODUCTION: process.env.NODE_ENV === 'production'
};
