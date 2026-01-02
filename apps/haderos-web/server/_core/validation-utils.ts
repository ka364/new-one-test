/**
 * Validation Utilities
 * أدوات التحقق من صحة البيانات
 *
 * Shared validation functions to reduce code duplication
 */

import { TRPCError } from '@trpc/server';

/**
 * Validate Egyptian phone number format
 * @param phone - Phone number to validate
 * @returns true if valid, throws TRPCError if invalid
 */
export function validateEgyptianPhone(phone: string): boolean {
  if (!phone || !/^01[0-9]{9}$/.test(phone)) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'رقم الهاتف غير صحيح. يجب أن يكون رقم مصري (01XXXXXXXXX)',
    });
  }
  return true;
}

/**
 * Validate phone number format (optional)
 * @param phone - Phone number to validate (optional)
 * @returns true if valid or empty, throws TRPCError if invalid
 */
export function validateOptionalEgyptianPhone(phone?: string): boolean {
  if (!phone) {
    return true; // Optional field
  }
  return validateEgyptianPhone(phone);
}

/**
 * Validate positive number
 * @param value - Number to validate
 * @param fieldName - Name of the field (for error message)
 * @returns true if valid, throws TRPCError if invalid
 */
export function validatePositiveNumber(value: number, fieldName: string = 'القيمة'): boolean {
  if (!value || value <= 0 || !Number.isFinite(value)) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: `${fieldName} يجب أن يكون رقماً موجباً`,
    });
  }
  return true;
}

/**
 * Validate non-empty string
 * @param value - String to validate
 * @param fieldName - Name of the field (for error message)
 * @returns true if valid, throws TRPCError if invalid
 */
export function validateNonEmptyString(value: string, fieldName: string = 'الحقل'): boolean {
  if (!value || value.trim().length === 0) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: `${fieldName} مطلوب ولا يمكن أن يكون فارغاً`,
    });
  }
  return true;
}

/**
 * Validate array is not empty
 * @param array - Array to validate
 * @param fieldName - Name of the field (for error message)
 * @returns true if valid, throws TRPCError if invalid
 */
export function validateNonEmptyArray<T>(array: T[] | undefined | null, fieldName: string = 'القائمة'): boolean {
  if (!array || array.length === 0) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: `${fieldName} يجب أن تحتوي على عنصر واحد على الأقل`,
    });
  }
  return true;
}

/**
 * Validate email format (optional)
 * @param email - Email to validate (optional)
 * @returns true if valid or empty, throws TRPCError if invalid
 */
export function validateOptionalEmail(email?: string): boolean {
  if (!email) {
    return true; // Optional field
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'البريد الإلكتروني غير صحيح',
    });
  }
  return true;
}

/**
 * Validate amount matches calculated total
 * @param calculatedTotal - Calculated total from items
 * @param providedTotal - Total provided by user
 * @param tolerance - Allowed tolerance (default: 0.01)
 * @returns true if valid, throws TRPCError if invalid
 */
export function validateAmountMatch(
  calculatedTotal: number,
  providedTotal: number,
  tolerance: number = 0.01
): boolean {
  if (Math.abs(calculatedTotal - providedTotal) > tolerance) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'إجمالي المبلغ غير متطابق مع العناصر',
    });
  }
  return true;
}

/**
 * Validate date range
 * @param startDate - Start date
 * @param endDate - End date
 * @returns true if valid, throws TRPCError if invalid
 */
export function validateDateRange(startDate: Date | string, endDate: Date | string): boolean {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;

  if (isNaN(start.getTime())) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'تاريخ البداية غير صحيح',
    });
  }

  if (isNaN(end.getTime())) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'تاريخ النهاية غير صحيح',
    });
  }

  if (start > end) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'تاريخ البداية يجب أن يكون قبل تاريخ النهاية',
    });
  }

  return true;
}

