/**
 * SendGrid Integration Tests
 * Tests email sending functionality
 */

import { describe, it, expect } from 'vitest';
import { testSendGridConnection, sendOTPEmail } from './_core/email';

describe('SendGrid Integration', () => {
  it('should have SendGrid API key configured', () => {
    expect(process.env.SENDGRID_API_KEY).toBeDefined();
    expect(process.env.SENDGRID_API_KEY).not.toBe('');
  });

  it('should have FROM email configured', () => {
    expect(process.env.SENDGRID_FROM_EMAIL).toBeDefined();
    expect(process.env.SENDGRID_FROM_EMAIL).not.toBe('');
  });

  it('should test SendGrid connection successfully', async () => {
    const result = await testSendGridConnection();
    
    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.message).toBe('SendGrid connection successful');
  }, 15000); // 15 second timeout for API call

  it('should send OTP email successfully', async () => {
    const testEmail = process.env.SENDGRID_FROM_EMAIL || 'test@example.com';
    const testOTP = '123456';
    const testName = 'Test User';

    const result = await sendOTPEmail(testEmail, testOTP, testName);
    
    expect(result).toBe(true);
  }, 15000); // 15 second timeout for API call
});
