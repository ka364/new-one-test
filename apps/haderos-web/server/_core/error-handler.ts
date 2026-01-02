/**
 * Error Handler Utilities
 * Apple-Level Error Handling Patterns
 *
 * Provides type-safe error handling utilities for consistent error management
 * across all routers and services.
 */

import { TRPCError } from '@trpc/server';
import { logger } from './logger';

/**
 * Type guard to check if error is an Error instance
 */
export function isError(error: unknown): error is Error {
  return error instanceof Error;
}

/**
 * Type guard to check if error is a TRPCError
 */
export function isTRPCError(error: unknown): error is TRPCError {
  return error instanceof TRPCError;
}

/**
 * Type guard to check if error has a code property (database errors)
 */
export function hasErrorCode(error: unknown): error is Error & { code?: string | number } {
  return isError(error) && 'code' in error;
}

/**
 * Safely convert unknown error to Error instance
 */
export function toError(error: unknown): Error {
  if (isError(error)) {
    return error;
  }
  return new Error(String(error));
}

/**
 * Safely get error message from unknown error
 */
export function getErrorMessage(error: unknown): string {
  if (isError(error)) {
    return error.message;
  }
  return String(error);
}

/**
 * Check if error is a database duplicate key error
 */
export function isDuplicateKeyError(error: unknown): boolean {
  if (!hasErrorCode(error)) {
    return false;
  }
  return error.code === '23505' || error.message?.includes('duplicate') || false;
}

/**
 * Check if error is a database foreign key error
 */
export function isForeignKeyError(error: unknown): boolean {
  if (!hasErrorCode(error)) {
    return false;
  }
  return error.code === '23503' || error.message?.includes('foreign key') || false;
}

/**
 * Check if error is a database not found error
 */
export function isNotFoundError(error: unknown): boolean {
  if (!hasErrorCode(error)) {
    return false;
  }
  // Check for "not found" or "no rows" in error message
  const errorMessage = error.message?.toLowerCase() || '';
  return errorMessage.includes('not found') || errorMessage.includes('no rows') || false;
}

/**
 * Handle error with proper logging and error conversion
 */
export function handleError(
  error: unknown,
  context: {
    operation: string;
    details?: Record<string, unknown>;
    duration?: number;
  }
): TRPCError {
  const { operation, details = {}, duration } = context;

  // If it's already a TRPCError, log and re-throw
  if (isTRPCError(error)) {
    logger.error(`${operation} failed (TRPCError)`, {
      code: error.code,
      message: error.message,
      ...details,
      ...(duration && { duration: `${duration}ms` }),
    });
    return error;
  }

  // Handle database errors
  if (isDuplicateKeyError(error)) {
    logger.warn(`${operation} failed (Duplicate Key)`, {
      error: getErrorMessage(error),
      ...details,
      ...(duration && { duration: `${duration}ms` }),
    });
    return new TRPCError({
      code: 'CONFLICT',
      message: 'السجل موجود مسبقاً. يرجى المحاولة مرة أخرى',
      cause: toError(error),
    });
  }

  if (isForeignKeyError(error)) {
    logger.warn(`${operation} failed (Foreign Key)`, {
      error: getErrorMessage(error),
      ...details,
      ...(duration && { duration: `${duration}ms` }),
    });
    return new TRPCError({
      code: 'BAD_REQUEST',
      message: 'المرجع غير موجود. يرجى التحقق من البيانات',
      cause: toError(error),
    });
  }

  // Handle generic errors
  logger.error(`${operation} failed (Unexpected Error)`, toError(error), {
    ...details,
    ...(duration && { duration: `${duration}ms` }),
  });

  return new TRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message: 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى',
    cause: toError(error),
  });
}

/**
 * Safe error logger that handles unknown errors
 */
export function safeErrorLogger(
  message: string,
  error: unknown,
  context?: Record<string, unknown>
): void {
  logger.error(message, toError(error), context);
}

/**
 * Safe error logger for warnings
 */
export function safeWarnLogger(
  message: string,
  error: unknown,
  context?: Record<string, unknown>
): void {
  logger.warn(message, {
    error: getErrorMessage(error),
    ...context,
  });
}

/**
 * Wrap async function with error handling
 */
export async function withErrorHandling<T>(
  operation: string,
  fn: () => Promise<T>,
  context?: Record<string, unknown>
): Promise<T> {
  const startTime = Date.now();
  try {
    const result = await fn();
    const duration = Date.now() - startTime;
    logger.info(`${operation} completed successfully`, {
      ...context,
      duration: `${duration}ms`,
    });
    return result;
  } catch (error: unknown) {
    const duration = Date.now() - startTime;
    throw handleError(error, {
      operation,
      details: context,
      duration,
    });
  }
}

