/**
 * Security Middleware and Utilities
 * Implements comprehensive security measures for HADEROS AI CLOUD
 */

import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';
import { createHash, randomBytes } from 'crypto';

// ============================================
// 1. HELMET SECURITY HEADERS
// ============================================

export const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "https://api.deepseek.com", "https://api.openai.com"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  frameguard: {
    action: 'deny',
  },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin',
  },
});

// ============================================
// 2. CORS CONFIGURATION
// ============================================

export const corsConfig = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'https://haderos.ai',
      'https://www.haderos.ai',
      'https://app.haderos.ai',
      process.env.FRONTEND_URL,
    ].filter(Boolean);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
  maxAge: 86400, // 24 hours
};

// ============================================
// 3. RATE LIMITING
// ============================================

// General API rate limit
export const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
});

// Strict rate limit for authentication endpoints
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
});

// API endpoint rate limit
export const apiRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // limit each IP to 30 requests per minute
  message: 'Too many API requests, please slow down.',
  standardHeaders: true,
  legacyHeaders: false,
});

// File upload rate limit
export const uploadRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // limit each IP to 20 uploads per hour
  message: 'Too many file uploads, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// ============================================
// 4. INPUT SANITIZATION
// ============================================

/**
 * Sanitize string input to prevent XSS attacks
 */
export function sanitizeString(input: string): string {
  if (!input) return '';

  return input
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers like onclick=
    .trim();
}

/**
 * Sanitize object recursively
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized = { ...obj };

  for (const key in sanitized) {
    if (typeof sanitized[key] === 'string') {
      sanitized[key] = sanitizeString(sanitized[key]) as any;
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeObject(sanitized[key]);
    }
  }

  return sanitized;
}

// ============================================
// 5. CSRF PROTECTION
// ============================================

/**
 * Generate CSRF token
 */
export function generateCSRFToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Verify CSRF token
 */
export function verifyCSRFToken(token: string, sessionToken: string): boolean {
  if (!token || !sessionToken) return false;
  return token === sessionToken;
}

/**
 * CSRF middleware
 */
export function csrfProtection(req: Request, res: Response, next: NextFunction) {
  // Skip CSRF for GET requests
  if (req.method === 'GET') {
    return next();
  }

  const token = req.headers['x-csrf-token'] as string;
  const sessionToken = (req as any).session?.csrfToken;

  if (!verifyCSRFToken(token, sessionToken)) {
    return res.status(403).json({
      error: 'Invalid CSRF token',
      code: 'CSRF_TOKEN_INVALID',
    });
  }

  next();
}

// ============================================
// 6. SQL INJECTION PREVENTION
// ============================================

/**
 * Validate SQL-safe string (basic check)
 */
export function isSQLSafe(input: string): boolean {
  const dangerousPatterns = [
    /('|(\\')|(;)|(--)|(\*)|(\bOR\b)|(\bAND\b)|(\bUNION\b)|(\bSELECT\b)|(\bINSERT\b)|(\bUPDATE\b)|(\bDELETE\b)|(\bDROP\b)|(\bCREATE\b))/gi,
  ];

  return !dangerousPatterns.some(pattern => pattern.test(input));
}

// ============================================
// 7. SENSITIVE DATA MASKING
// ============================================

/**
 * Mask sensitive data in logs
 */
export function maskSensitiveData(data: any): any {
  const sensitiveFields = [
    'password',
    'token',
    'secret',
    'apiKey',
    'creditCard',
    'ssn',
    'pin',
  ];

  if (typeof data !== 'object' || data === null) {
    return data;
  }

  const masked = Array.isArray(data) ? [...data] : { ...data };

  for (const key in masked) {
    const lowerKey = key.toLowerCase();

    if (sensitiveFields.some(field => lowerKey.includes(field))) {
      masked[key] = '***REDACTED***';
    } else if (typeof masked[key] === 'object' && masked[key] !== null) {
      masked[key] = maskSensitiveData(masked[key]);
    }
  }

  return masked;
}

// ============================================
// 8. PASSWORD HASHING UTILITIES
// ============================================

import bcrypt from 'bcryptjs';

/**
 * Hash password with bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
}

/**
 * Verify password against hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Validate password strength
 */
export function validatePasswordStrength(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================
// 9. ENCRYPTION UTILITIES (AES-256)
// ============================================

import { createCipheriv, createDecipheriv, scryptSync } from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-key-change-in-production';
const IV_LENGTH = 16;

/**
 * Encrypt sensitive data
 */
export function encrypt(text: string): string {
  const key = scryptSync(ENCRYPTION_KEY, 'salt', 32);
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv('aes-256-cbc', key, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  return iv.toString('hex') + ':' + encrypted;
}

/**
 * Decrypt sensitive data
 */
export function decrypt(encryptedText: string): string {
  const key = scryptSync(ENCRYPTION_KEY, 'salt', 32);
  const parts = encryptedText.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];

  const decipher = createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

// ============================================
// 10. SECURITY AUDIT LOGGING
// ============================================

export interface SecurityEvent {
  type: 'auth' | 'access' | 'change' | 'error';
  action: string;
  userId?: string;
  ip?: string;
  userAgent?: string;
  details?: any;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

const securityEvents: SecurityEvent[] = [];

/**
 * Log security event
 */
export function logSecurityEvent(event: Omit<SecurityEvent, 'timestamp'>): void {
  const fullEvent: SecurityEvent = {
    ...event,
    timestamp: new Date(),
  };

  securityEvents.push(fullEvent);

  // In production, send to logging service (e.g., Sentry, LogDNA)
  if (event.severity === 'critical' || event.severity === 'high') {
    console.error('[SECURITY]', maskSensitiveData(fullEvent));
  } else {
    console.log('[SECURITY]', maskSensitiveData(fullEvent));
  }
}

/**
 * Get recent security events
 */
export function getSecurityEvents(limit = 100): SecurityEvent[] {
  return securityEvents.slice(-limit);
}

// ============================================
// 11. REQUEST VALIDATION MIDDLEWARE
// ============================================

/**
 * Validate request body against dangerous patterns
 */
export function validateRequestBody(req: Request, res: Response, next: NextFunction) {
  if (!req.body) {
    return next();
  }

  try {
    // Sanitize the body
    req.body = sanitizeObject(req.body);
    next();
  } catch (error) {
    logSecurityEvent({
      type: 'error',
      action: 'request_validation_failed',
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      details: { error: (error as Error).message },
      severity: 'medium',
    });

    return res.status(400).json({
      error: 'Invalid request data',
      code: 'INVALID_REQUEST',
    });
  }
}

// ============================================
// 12. EXPORT ALL SECURITY MIDDLEWARE
// ============================================

export const securityMiddleware = {
  helmet: helmetConfig,
  cors: corsConfig,
  rateLimit: {
    general: generalRateLimit,
    auth: authRateLimit,
    api: apiRateLimit,
    upload: uploadRateLimit,
  },
  csrf: csrfProtection,
  validateBody: validateRequestBody,
};

export default securityMiddleware;
