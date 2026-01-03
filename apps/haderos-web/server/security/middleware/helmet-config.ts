/**
 * Helmet.js Security Middleware Configuration
 * Implements comprehensive HTTP security headers
 */

import helmet from 'helmet';
import type { Request, Response, NextFunction } from 'express';

/**
 * Helmet Security Configuration
 * Protects against common web vulnerabilities
 */
export const helmetConfig = helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.jsdelivr.net"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "https://api.haderos.com", "wss://api.haderos.com"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },

  // DNS Prefetch Control
  dnsPrefetchControl: {
    allow: false,
  },

  // Frameguard - Prevent clickjacking
  frameguard: {
    action: 'deny',
  },

  // Hide Powered-By header
  hidePoweredBy: true,

  // HTTP Strict Transport Security
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },

  // IE No Open
  ieNoOpen: true,

  // Don't Sniff Mimetype
  noSniff: true,

  // Referrer Policy
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin',
  },

  // XSS Filter
  xssFilter: true,
});

/**
 * Custom security headers middleware
 */
export const customSecurityHeaders = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Permissions Policy (formerly Feature Policy)
  res.setHeader(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=(), payment=()'
  );

  // X-Content-Type-Options
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // X-Frame-Options
  res.setHeader('X-Frame-Options', 'DENY');

  // X-XSS-Protection
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Expect-CT
  res.setHeader('Expect-CT', 'max-age=86400, enforce');

  // Cross-Origin-Embedder-Policy
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');

  // Cross-Origin-Opener-Policy
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');

  // Cross-Origin-Resource-Policy
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');

  next();
};

/**
 * Security headers for API responses
 */
export const apiSecurityHeaders = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Cache control for sensitive data
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  next();
};

export default {
  helmetConfig,
  customSecurityHeaders,
  apiSecurityHeaders,
};
