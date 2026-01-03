/**
 * CORS Configuration Middleware
 * Implements precise Cross-Origin Resource Sharing controls
 */

import cors from 'cors';
import type { Request } from 'express';

/**
 * Allowed origins based on environment
 */
const getAllowedOrigins = (): string[] => {
  const env = process.env.NODE_ENV || 'development';
  
  const origins: Record<string, string[]> = {
    production: [
      'https://haderos.com',
      'https://www.haderos.com',
      'https://app.haderos.com',
      'https://api.haderos.com',
    ],
    staging: [
      'https://staging.haderos.com',
      'https://staging-app.haderos.com',
      'https://staging-api.haderos.com',
    ],
    development: [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173',
    ],
  };

  // Add custom origins from environment variable
  const customOrigins = process.env.CORS_ALLOWED_ORIGINS?.split(',') || [];
  
  return [...(origins[env] || origins.development), ...customOrigins];
};

/**
 * CORS options configuration
 */
export const corsOptions: cors.CorsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    const allowedOrigins = getAllowedOrigins();
    
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) {
      return callback(null, true);
    }

    // Check if origin is allowed
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`[SECURITY] Blocked CORS request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },

  // Allowed HTTP methods
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],

  // Allowed headers
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-API-Key',
    'X-CSRF-Token',
    'Accept',
    'Accept-Language',
    'Content-Language',
  ],

  // Exposed headers
  exposedHeaders: [
    'X-Total-Count',
    'X-Page-Count',
    'X-Current-Page',
    'X-Per-Page',
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset',
  ],

  // Allow credentials (cookies, authorization headers)
  credentials: true,

  // Preflight cache duration (24 hours)
  maxAge: 86400,

  // Success status for legacy browsers
  optionsSuccessStatus: 204,

  // Don't pass CORS preflight response to next handler
  preflightContinue: false,
};

/**
 * Strict CORS for sensitive endpoints
 */
export const strictCorsOptions: cors.CorsOptions = {
  ...corsOptions,
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    const allowedOrigins = getAllowedOrigins();
    
    // Don't allow requests with no origin for sensitive endpoints
    if (!origin) {
      return callback(new Error('Origin required for this endpoint'));
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.error(`[SECURITY] Blocked sensitive CORS request from: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['POST', 'PUT', 'PATCH', 'DELETE'], // No GET for sensitive operations
  credentials: true, // Always require credentials
};

/**
 * Public CORS for public APIs
 */
export const publicCorsOptions: cors.CorsOptions = {
  origin: '*', // Allow all origins
  methods: ['GET', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept'],
  credentials: false,
  maxAge: 86400,
};

/**
 * CORS middleware factory
 */
export const createCorsMiddleware = (options: cors.CorsOptions = corsOptions) => {
  return cors(options);
};

/**
 * Default CORS middleware
 */
export const corsMiddleware = createCorsMiddleware(corsOptions);

/**
 * Strict CORS middleware for sensitive endpoints
 */
export const strictCorsMiddleware = createCorsMiddleware(strictCorsOptions);

/**
 * Public CORS middleware for public APIs
 */
export const publicCorsMiddleware = createCorsMiddleware(publicCorsOptions);

export default {
  corsOptions,
  strictCorsOptions,
  publicCorsOptions,
  corsMiddleware,
  strictCorsMiddleware,
  publicCorsMiddleware,
  createCorsMiddleware,
};
