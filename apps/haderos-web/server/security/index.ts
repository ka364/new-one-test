/**
 * Security Module - Main Export
 * Central export for all security features
 */

// Middleware
export * from './middleware/helmet-config';
export * from './middleware/rate-limit';
export * from './middleware/cors-config';

// Validators
export * from './validators/input-validation';

// Services
export * from './services/two-factor-auth';

// Configuration
export * from './config/security-config';

// Re-export for convenience
import { helmetConfig, customSecurityHeaders, apiSecurityHeaders } from './middleware/helmet-config';
import {
  apiRateLimiter,
  authRateLimiter,
  passwordResetRateLimiter,
  uploadRateLimiter,
  aiAssistantRateLimiter,
  publicRateLimiter,
  ddosProtection,
} from './middleware/rate-limit';
import {
  corsMiddleware,
  strictCorsMiddleware,
  publicCorsMiddleware,
} from './middleware/cors-config';
import {
  validateBody,
  validateQuery,
  validateParams,
  sanitizeRequest,
  commonSchemas,
} from './validators/input-validation';
import twoFactorAuthService from './services/two-factor-auth';
import securityConfig from './config/security-config';

/**
 * Security middleware bundle for Express app
 */
export const securityMiddleware = {
  // Helmet
  helmet: helmetConfig,
  customHeaders: customSecurityHeaders,
  apiHeaders: apiSecurityHeaders,
  
  // Rate Limiting
  rateLimit: {
    api: apiRateLimiter,
    auth: authRateLimiter,
    passwordReset: passwordResetRateLimiter,
    upload: uploadRateLimiter,
    ai: aiAssistantRateLimiter,
    public: publicRateLimiter,
    ddos: ddosProtection,
  },
  
  // CORS
  cors: {
    default: corsMiddleware,
    strict: strictCorsMiddleware,
    public: publicCorsMiddleware,
  },
  
  // Validation
  validate: {
    body: validateBody,
    query: validateQuery,
    params: validateParams,
    sanitize: sanitizeRequest,
    schemas: commonSchemas,
  },
};

/**
 * Security services bundle
 */
export const securityServices = {
  twoFactor: twoFactorAuthService,
};

/**
 * Security configuration
 */
export { securityConfig };

/**
 * Default export
 */
export default {
  middleware: securityMiddleware,
  services: securityServices,
  config: securityConfig,
};
