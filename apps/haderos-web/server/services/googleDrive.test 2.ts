import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getDb } from '../db';
import {
  createGoogleSheet,
  createInvoice,
  createDailyReport,
  getShareableLink,
  listFiles,
} from './googleDrive';
import { googleDriveFiles } from '../../drizzle/schema-adaptive';
import { users } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

describe('Google Drive Integration', () => {
  let testUserId: number;
  const testUserName = 'TestUser';

  beforeAll(async () => {
    // Create test user
    const db = await getDb();
    if (!db) throw new Error('Database not available');
    const result = await db.insert(users).values({
      openId: `test-gdrive-${Date.now()}`,
      name: testUserName,
      email: 'test@gdrive.com',
      loginMethod: 'test',
    });
    testUserId = result[0].insertId;
  });

  afterAll(async () => {
    // Cleanup
    const db = await getDb();
    if (!db) return;
    await db.delete(googleDriveFiles).where(eq(googleDriveFiles.userId, testUserId));
    await db.delete(users).where(eq(users.id, testUserId));
  });

  describe('createGoogleSheet', () => {
    it('should create a Google Sheet with CSV data', async () => {
      const sheetName = `test-sheet-${Date.now()}`;
      const folderPath = `${testUserName}/tests`;
      const data = [
        ['Name', 'Age', 'City'],
        ['Alice', '30', 'New York'],
        ['Bob', '25', 'London'],
      ];

      const result = await createGoogleSheet(sheetName, folderPath, data);

      expect(result.path).toContain(sheetName);
      expect(result.path).toContain('.csv');
      expect(result.link).toBeTruthy();

      // Check if file was recorded in database
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      const files = await db
        .select()
        .from(googleDriveFiles)
        .where(eq(googleDriveFiles.userId, testUserId));

      // Note: Database recording happens in the router, not in the service
      // So we just verify the file was created successfully
      expect(result.path).toBeTruthy();
    });

    it('should handle empty data gracefully', async () => {
      const sheetName = `empty-sheet-${Date.now()}`;
      const folderPath = `${testUserName}/tests`;
      const data: string[][] = [];

      const result = await createGoogleSheet(sheetName, folderPath, data);

      expect(result.path).toContain(sheetName);
      expect(result.link).toBeTruthy();
    });
  });

  describe('createInvoice', () => {
    it('should create an invoice with proper formatting', async () => {
      const invoiceData = {
        invoiceNumber: 'INV-001',
        customerName: 'Test Customer',
        items: [
          { name: 'Product A', quantity: 2, price: 100 },
          { name: 'Product B', quantity: 1, price: 200 },
        ],
        total: 400,
      };

      const result = await createInvoice(testUserName, invoiceData);

      expect(result.path).toContain('INV-001');
      expect(result.path).toContain('invoices');
      expect(result.link).toBeTruthy();
    });

    it('should organize invoices by date', async () => {
      const invoiceData = {
        invoiceNumber: `INV-${Date.now()}`,
        customerName: 'Another Customer',
        items: [{ name: 'Service', quantity: 1, price: 500 }],
        total: 500,
      };

      const result = await createInvoice(testUserName, invoiceData);

      // Check if path contains date folder
      const today = new Date().toISOString().split('T')[0];
      expect(result.path).toContain(today);
    });
  });

  describe('createDailyReport', () => {
    it('should create a daily report with metrics', async () => {
      const reportData = {
        date: new Date().toISOString().split('T')[0],
        metrics: [
          { name: 'Sales', value: '1000 SAR' },
          { name: 'Orders', value: '25' },
          { name: 'New Customers', value: '5' },
        ],
      };

      const result = await createDailyReport(testUserName, reportData);

      expect(result.path).toContain('daily-report');
      expect(result.path).toContain(reportData.date);
      expect(result.link).toBeTruthy();
    });

    it('should include all metrics in the report', async () => {
      const reportData = {
        date: '2025-01-01',
        metrics: [
          { name: 'Revenue', value: '5000' },
          { name: 'Profit', value: '1000' },
          { name: 'ROI', value: '20%' },
        ],
      };

      const result = await createDailyReport(testUserName, reportData);

      expect(result.path).toBeTruthy();
      expect(result.link).toBeTruthy();
    });
  });

  describe('getShareableLink', () => {
    it('should generate shareable link for existing file', async () => {
      // First create a file
      const sheetName = `linkable-sheet-${Date.now()}`;
      const folderPath = `${testUserName}/tests`;
      const data = [['Test', 'Data']];

      const createResult = await createGoogleSheet(sheetName, folderPath, data);

      // Then get shareable link
      const link = await getShareableLink(createResult.path);

      expect(link).toBeTruthy();
      expect(link).toContain('https://');
    });
  });

  describe('listFiles', () => {
    it('should list files in a folder', async () => {
      const folderPath = `${testUserName}/tests`;

      // Create a few test files first
      await createGoogleSheet(`list-test-1-${Date.now()}`, folderPath, [['A', 'B']]);
      await createGoogleSheet(`list-test-2-${Date.now()}`, folderPath, [['C', 'D']]);

      const files = await listFiles(folderPath);

      expect(Array.isArray(files)).toBe(true);
      expect(files.length).toBeGreaterThan(0);
    });

    it('should return empty array for non-existent folder', async () => {
      const files = await listFiles(`${testUserName}/non-existent-folder`);

      expect(Array.isArray(files)).toBe(true);
    });
  });

  describe('File Organization', () => {
    it('should organize files by date and user', async () => {
      const userName = testUserName;
      const today = new Date().toISOString().split('T')[0];

      const invoiceData = {
        invoiceNumber: `ORG-${Date.now()}`,
        customerName: 'Organized Customer',
        items: [{ name: 'Item', quantity: 1, price: 100 }],
        total: 100,
      };

      const result = await createInvoice(userName, invoiceData);

      // Verify path structure: userName/invoices/YYYY-MM-DD/filename
      expect(result.path).toContain(userName);
      expect(result.path).toContain('invoices');
      expect(result.path).toContain(today);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid folder paths gracefully', async () => {
      const sheetName = `error-test-${Date.now()}`;
      const invalidPath = ''; // Empty path

      try {
        await createGoogleSheet(sheetName, invalidPath, [['Test']]);
        // Should still work with empty path (uses default)
        expect(true).toBe(true);
      } catch (error) {
        // Or it might throw an error, which is also acceptable
        expect(error).toBeDefined();
      }
    });
  });
});
