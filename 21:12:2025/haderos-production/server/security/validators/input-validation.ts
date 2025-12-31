/**
 * Input Validation Middleware using Zod
 * Implements comprehensive input sanitization and validation
 */

import { z, ZodSchema, ZodError } from 'zod';
import type { Request, Response, NextFunction } from 'express';
import DOMPurify from 'isomorphic-dompurify';

/**
 * Validation error response
 */
interface ValidationError {
  field: string;
  message: string;
}

/**
 * Format Zod errors for API response
 */
const formatZodErrors = (error: ZodError): ValidationError[] => {
  return error.errors.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
  }));
};

/**
 * Sanitize string input to prevent XSS
 */
export const sanitizeString = (input: string): string => {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [], // Strip all HTML tags
    ALLOWED_ATTR: [],
  });
};

/**
 * Sanitize object recursively
 */
export const sanitizeObject = (obj: any): any => {
  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }
  
  if (obj && typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value);
    }
    return sanitized;
  }
  
  return obj;
};

/**
 * Validate request body middleware factory
 */
export const validateBody = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Sanitize input first
      const sanitizedBody = sanitizeObject(req.body);
      
      // Validate with Zod
      const validated = await schema.parseAsync(sanitizedBody);
      
      // Replace request body with validated data
      req.body = validated;
      
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Invalid input data',
          details: formatZodErrors(error),
        });
      }
      
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'An error occurred during validation',
      });
    }
  };
};

/**
 * Validate query parameters middleware factory
 */
export const validateQuery = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const sanitizedQuery = sanitizeObject(req.query);
      const validated = await schema.parseAsync(sanitizedQuery);
      req.query = validated;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Invalid query parameters',
          details: formatZodErrors(error),
        });
      }
      
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'An error occurred during validation',
      });
    }
  };
};

/**
 * Validate route parameters middleware factory
 */
export const validateParams = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = await schema.parseAsync(req.params);
      req.params = validated;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Invalid route parameters',
          details: formatZodErrors(error),
        });
      }
      
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'An error occurred during validation',
      });
    }
  };
};

/**
 * Common validation schemas
 */
export const commonSchemas = {
  // Email validation
  email: z.string().email('Invalid email address').toLowerCase(),
  
  // Password validation (min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char)
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  
  // UUID validation
  uuid: z.string().uuid('Invalid UUID format'),
  
  // Phone number validation (international format)
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format'),
  
  // URL validation
  url: z.string().url('Invalid URL format'),
  
  // Date validation
  date: z.string().datetime('Invalid date format'),
  
  // Pagination
  pagination: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
  }),
  
  // ID parameter
  idParam: z.object({
    id: z.string().uuid('Invalid ID format'),
  }),
};

/**
 * SQL Injection prevention
 */
export const preventSqlInjection = (input: string): boolean => {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/gi,
    /(--|\#|\/\*|\*\/)/gi,
    /(\bOR\b.*=.*|1=1|'=')/gi,
  ];
  
  return !sqlPatterns.some((pattern) => pattern.test(input));
};

/**
 * NoSQL Injection prevention
 */
export const preventNoSqlInjection = (obj: any): boolean => {
  const dangerousKeys = ['$where', '$regex', '$ne', '$gt', '$lt', '$gte', '$lte', '$in', '$nin'];
  
  const checkObject = (o: any): boolean => {
    if (typeof o !== 'object' || o === null) return true;
    
    for (const key in o) {
      if (dangerousKeys.includes(key)) return false;
      if (!checkObject(o[key])) return false;
    }
    
    return true;
  };
  
  return checkObject(obj);
};

/**
 * Sanitization middleware for all requests
 */
export const sanitizeRequest = (req: Request, res: Response, next: NextFunction) => {
  // Sanitize body
  if (req.body) {
    req.body = sanitizeObject(req.body);
    
    // Check for SQL/NoSQL injection
    if (!preventNoSqlInjection(req.body)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Potentially malicious input detected',
      });
    }
  }
  
  // Sanitize query
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  
  next();
};

export default {
  validateBody,
  validateQuery,
  validateParams,
  sanitizeString,
  sanitizeObject,
  sanitizeRequest,
  commonSchemas,
  preventSqlInjection,
  preventNoSqlInjection,
};
