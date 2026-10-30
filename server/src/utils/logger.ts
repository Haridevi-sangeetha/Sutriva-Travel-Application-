/**
 * Secure Logger with automatic redaction of PII, Credentials, and Secrets
 */
const SENSITIVE_KEYS = [
  'password',
  'confirmPassword',
  'token',
  'accessToken',
  'refreshToken',
  'otp',
  'secret',
  'cardNumber',
  'cvv',
  'pin',
  'jwt'
];

function sanitizeObject(obj: any): any {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    const isSensitive = SENSITIVE_KEYS.some(sKey => key.toLowerCase().includes(sKey.toLowerCase()));
    if (isSensitive) {
      sanitized[key] = '[REDACTED_SECURITY_DATA]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

export const logger = {
  info: (message: string, meta?: any) => {
    const time = new Date().toISOString();
    const cleanMeta = meta ? JSON.stringify(sanitizeObject(meta)) : '';
    console.log(`[INFO] [${time}] ${message} ${cleanMeta}`);
  },

  warn: (message: string, meta?: any) => {
    const time = new Date().toISOString();
    const cleanMeta = meta ? JSON.stringify(sanitizeObject(meta)) : '';
    console.warn(`[WARN] [${time}] ${message} ${cleanMeta}`);
  },

  error: (message: string, error?: any) => {
    const time = new Date().toISOString();
    const cleanErr = error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : sanitizeObject(error);
    console.error(`[ERROR] [${time}] ${message} ${JSON.stringify(cleanErr)}`);
  },

  securityEvent: (eventType: string, details: any) => {
    const time = new Date().toISOString();
    console.warn(`[SECURITY_EVENT] [${time}] Event: ${eventType} Details: ${JSON.stringify(sanitizeObject(details))}`);
  }
};
