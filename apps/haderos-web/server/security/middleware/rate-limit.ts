/**
 * Advanced Rate Limiting Middleware
 * Implements multi-tier rate limiting with Redis support
 */

import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { Redis } from 'ioredis';
import type { Request, Response } from 'express';

// Redis client for rate limiting
const redisClient = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: 1, // Use separate DB for rate limiting
  enableOfflineQueue: false,
  maxRetriesPerRequest: 3,
});

/**
 * Rate limit error handler
 */
const rateLimitHandler = (req: Request, res: Response) => {
  res.status(429).json({
    error: 'Too Many Requests',
    message: 'You have exceeded the rate limit. Please try again later.',
    retryAfter: res.getHeader('Retry-After'),
  });
};

/**
 * Skip rate limiting for certain conditions
 */
const skipRateLimit = (req: Request): boolean => {
  // Skip for health checks
  if (req.path === '/health' || req.path === '/ping') {
    return true;
  }

  // Skip for whitelisted IPs (admin, monitoring)
  const whitelist = (process.env.RATE_LIMIT_WHITELIST || '').split(',');
  const clientIp = req.ip || req.socket.remoteAddress || '';
  
  return whitelist.includes(clientIp);
};

/**
 * General API Rate Limiter
 * 100 requests per 15 minutes per IP
 */
export const apiRateLimiter = rateLimit({
  store: new RedisStore({
    // @ts-ignore
    client: redisClient,
    prefix: 'rl:api:',
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipRateLimit,
  handler: rateLimitHandler,
});

/**
 * Strict Rate Limiter for Authentication
 * 5 requests per 15 minutes per IP
 */
export const authRateLimiter = rateLimit({
  store: new RedisStore({
    // @ts-ignore
    client: redisClient,
    prefix: 'rl:auth:',
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful logins
  handler: rateLimitHandler,
});

/**
 * Strict Rate Limiter for Password Reset
 * 3 requests per hour per IP
 */
export const passwordResetRateLimiter = rateLimit({
  store: new RedisStore({
    // @ts-ignore
    client: redisClient,
    prefix: 'rl:reset:',
  }),
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: 'Too many password reset attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

/**
 * Rate Limiter for File Uploads
 * 20 requests per hour per IP
 */
export const uploadRateLimiter = rateLimit({
  store: new RedisStore({
    // @ts-ignore
    client: redisClient,
    prefix: 'rl:upload:',
  }),
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  message: 'Too many file uploads, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

/**
 * Rate Limiter for AI Assistant
 * 50 requests per hour per user
 */
export const aiAssistantRateLimiter = rateLimit({
  store: new RedisStore({
    // @ts-ignore
    client: redisClient,
    prefix: 'rl:ai:',
  }),
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50,
  message: 'AI Assistant rate limit exceeded, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    // Rate limit by user ID instead of IP for authenticated requests
    return (req as any).user?.id || req.ip || 'anonymous';
  },
  handler: rateLimitHandler,
});

/**
 * Aggressive Rate Limiter for Public Endpoints
 * 30 requests per 15 minutes per IP
 */
export const publicRateLimiter = rateLimit({
  store: new RedisStore({
    // @ts-ignore
    client: redisClient,
    prefix: 'rl:public:',
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,
  message: 'Too many requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipRateLimit,
  handler: rateLimitHandler,
});

/**
 * DDoS Protection - Very strict rate limiter
 * 200 requests per minute per IP
 */
export const ddosProtection = rateLimit({
  store: new RedisStore({
    // @ts-ignore
    client: redisClient,
    prefix: 'rl:ddos:',
  }),
  windowMs: 60 * 1000, // 1 minute
  max: 200,
  message: 'Potential DDoS attack detected. Access temporarily blocked.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipRateLimit,
  handler: (req: Request, res: Response) => {
    // Log potential DDoS attack
    console.error(`[SECURITY] Potential DDoS from IP: ${req.ip}`);
    
    res.status(429).json({
      error: 'Too Many Requests',
      message: 'Access temporarily blocked due to suspicious activity.',
    });
  },
});

export default {
  apiRateLimiter,
  authRateLimiter,
  passwordResetRateLimiter,
  uploadRateLimiter,
  aiAssistantRateLimiter,
  publicRateLimiter,
  ddosProtection,
  redisClient,
};
