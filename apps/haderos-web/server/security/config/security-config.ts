/**
 * Security Configuration
 * Central configuration for all security settings
 */

export const securityConfig = {
  /**
   * Rate Limiting Configuration
   */
  rateLimit: {
    // General API rate limit
    api: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // requests per window
    },
    
    // Authentication rate limit
    auth: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5, // attempts per window
    },
    
    // Password reset rate limit
    passwordReset: {
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 3, // attempts per window
    },
    
    // File upload rate limit
    upload: {
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 20, // uploads per window
    },
    
    // AI Assistant rate limit
    ai: {
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 50, // requests per window
    },
    
    // DDoS protection
    ddos: {
      windowMs: 60 * 1000, // 1 minute
      max: 200, // requests per window
    },
  },

  /**
   * CORS Configuration
   */
  cors: {
    production: [
      'https://haderos.com',
      'https://www.haderos.com',
      'https://app.haderos.com',
    ],
    staging: [
      'https://staging.haderos.com',
      'https://staging-app.haderos.com',
    ],
    development: [
      'http://localhost:3000',
      'http://localhost:5173',
    ],
  },

  /**
   * Session Configuration
   */
  session: {
    secret: process.env.SESSION_SECRET || 'haderos-session-secret-change-in-production',
    name: 'haderos.sid',
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
    resave: false,
    saveUninitialized: false,
  },

  /**
   * JWT Configuration
   */
  jwt: {
    secret: process.env.JWT_SECRET || 'haderos-jwt-secret-change-in-production',
    accessTokenExpiry: '15m',
    refreshTokenExpiry: '7d',
    algorithm: 'HS256' as const,
  },

  /**
   * Password Configuration
   */
  password: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    bcryptRounds: 12,
  },

  /**
   * 2FA Configuration
   */
  twoFactor: {
    issuer: 'HADEROS',
    window: 1, // Allow 1 step before/after for clock skew
    backupCodesCount: 10,
  },

  /**
   * File Upload Configuration
   */
  upload: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ],
    allowedExtensions: [
      '.jpg',
      '.jpeg',
      '.png',
      '.gif',
      '.webp',
      '.pdf',
      '.doc',
      '.docx',
      '.xls',
      '.xlsx',
    ],
  },

  /**
   * Encryption Configuration
   */
  encryption: {
    algorithm: 'aes-256-gcm',
    keyLength: 32,
    ivLength: 16,
    saltLength: 64,
    tagLength: 16,
  },

  /**
   * Redis Configuration
   */
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    db: {
      session: 0,
      rateLimit: 1,
      cache: 2,
    },
  },

  /**
   * Security Headers Configuration
   */
  headers: {
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },
    csp: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },

  /**
   * IP Whitelist for Admin/Monitoring
   */
  ipWhitelist: (process.env.IP_WHITELIST || '').split(',').filter(Boolean),

  /**
   * Security Monitoring
   */
  monitoring: {
    enableSecurityLogs: true,
    enableAuditLogs: true,
    logFailedAttempts: true,
    alertOnSuspiciousActivity: true,
  },

  /**
   * Account Protection
   */
  accountProtection: {
    maxFailedLoginAttempts: 5,
    lockoutDuration: 15 * 60 * 1000, // 15 minutes
    requireEmailVerification: true,
    requirePhoneVerification: false,
  },
};

export default securityConfig;
