import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getDb } from '../db';
import {
  trackUserBehavior,
  analyzeUserPatterns,
  getUserDynamicIcons,
  getPendingSuggestions,
  acceptSuggestion,
  rejectSuggestion,
  incrementIconUsage,
} from './adaptiveLearning';
import {
  userBehavior,
  taskPatterns,
  dynamicIcons,
  aiSuggestions,
} from '../../drizzle/schema-adaptive';
import { users } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

describe('Adaptive Learning System', () => {
  let testUserId: number;

  beforeAll(async () => {
    // Create test user
    const db = await getDb();
    if (!db) throw new Error('Database not available');
    const result = await db.insert(users).values({
      openId: `test-adaptive-${Date.now()}`,
      name: 'Test User',
      email: 'test@adaptive.com',
      loginMethod: 'test',
    });
    testUserId = result[0].insertId;
  });

  afterAll(async () => {
    // Cleanup
    const db = await getDb();
    if (!db) return;
    await db.delete(userBehavior).where(eq(userBehavior.userId, testUserId));
    await db.delete(taskPatterns).where(eq(taskPatterns.userId, testUserId));
    await db.delete(dynamicIcons).where(eq(dynamicIcons.userId, testUserId));
    await db.delete(aiSuggestions).where(eq(aiSuggestions.userId, testUserId));
    await db.delete(users).where(eq(users.id, testUserId));
  });

  describe('trackUserBehavior', () => {
    it('should track user behavior successfully', async () => {
      await trackUserBehavior(
        testUserId,
        'create_invoice',
        { invoiceNumber: 'INV-001' },
        { page: 'chat' }
      );

      const db = await getDb();
      if (!db) throw new Error('Database not available');
      const behaviors = await db
        .select()
        .from(userBehavior)
        .where(eq(userBehavior.userId, testUserId));

      expect(behaviors.length).toBeGreaterThan(0);
      expect(behaviors[0].actionType).toBe('create_invoice');
    });

    it('should create task pattern after multiple actions', async () => {
      // Track same action multiple times
      for (let i = 0; i < 5; i++) {
        await trackUserBehavior(testUserId, 'create_report', {
          reportType: 'daily',
        });
      }

      const db = await getDb();
      if (!db) throw new Error('Database not available');
      const patterns = await db
        .select()
        .from(taskPatterns)
        .where(eq(taskPatterns.userId, testUserId));

      const reportPattern = patterns.find((p) => p.taskType === 'create_report');
      expect(reportPattern).toBeDefined();
      expect(reportPattern?.frequency).toBeGreaterThanOrEqual(5);
    });
  });

  describe('analyzeUserPatterns', () => {
    it('should analyze patterns and create suggestions', async () => {
      // Create a high-frequency pattern
      for (let i = 0; i < 10; i++) {
        await trackUserBehavior(testUserId, 'request_images', {
          productId: i,
        });
      }

      // Analyze patterns
      await analyzeUserPatterns(testUserId);

      const db = await getDb();
      if (!db) throw new Error('Database not available');
      const suggestions = await db
        .select()
        .from(aiSuggestions)
        .where(eq(aiSuggestions.userId, testUserId));

      expect(suggestions.length).toBeGreaterThan(0);
    });
  });

  describe('getUserDynamicIcons', () => {
    it("should return user's dynamic icons", async () => {
      // Create a dynamic icon
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      await db.insert(dynamicIcons).values({
        userId: testUserId,
        iconName: 'Create Invoice',
        iconNameAr: 'إنشاء فاتورة',
        iconEmoji: '📄',
        taskType: 'create_invoice',
        actionConfig: { action: 'create_invoice' },
        isVisible: true,
      });

      const icons = await getUserDynamicIcons(testUserId);

      expect(icons.length).toBeGreaterThan(0);
      expect(icons[0].taskType).toBe('create_invoice');
    });
  });

  describe('getPendingSuggestions', () => {
    it('should return pending suggestions for user', async () => {
      // Create a suggestion
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      await db.insert(aiSuggestions).values({
        userId: testUserId,
        suggestionType: 'new_icon',
        title: 'Add Invoice Icon',
        titleAr: 'إضافة أيقونة الفاتورة',
        description: 'You create invoices frequently',
        descriptionAr: 'تقوم بإنشاء الفواتير بشكل متكرر',
        suggestionData: { taskType: 'create_invoice' },
        confidence: '85.50',
        status: 'pending',
      });

      const suggestions = await getPendingSuggestions(testUserId);

      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions[0].status).toBe('pending');
    });
  });

  describe('acceptSuggestion', () => {
    it('should accept suggestion and create dynamic icon', async () => {
      // Create a suggestion
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      const result = await db.insert(aiSuggestions).values({
        userId: testUserId,
        suggestionType: 'new_icon',
        title: 'Add Report Icon',
        titleAr: 'إضافة أيقونة التقرير',
        description: 'Create daily reports faster',
        descriptionAr: 'إنشاء التقارير اليومية بشكل أسرع',
        suggestionData: {
          taskType: 'create_report',
          iconName: 'Daily Report',
          iconNameAr: 'تقرير يومي',
          iconEmoji: '📊',
        },
        confidence: '90.00',
        status: 'pending',
      });

      const suggestionId = result[0].insertId;

      // Accept suggestion
      await acceptSuggestion(suggestionId, testUserId);

      // Check suggestion status
      const [suggestion] = await db
        .select()
        .from(aiSuggestions)
        .where(eq(aiSuggestions.id, suggestionId));

      expect(suggestion.status).toBe('accepted');

      // Check if icon was created
      const icons = await db.select().from(dynamicIcons).where(eq(dynamicIcons.userId, testUserId));

      const reportIcon = icons.find((i) => i.taskType === 'create_report');
      expect(reportIcon).toBeDefined();
    });
  });

  describe('rejectSuggestion', () => {
    it('should reject suggestion with feedback', async () => {
      // Create a suggestion
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      const result = await db.insert(aiSuggestions).values({
        userId: testUserId,
        suggestionType: 'new_icon',
        title: 'Add Campaign Icon',
        titleAr: 'إضافة أيقونة الحملة',
        description: 'Manage campaigns',
        descriptionAr: 'إدارة الحملات',
        suggestionData: { taskType: 'manage_campaign' },
        confidence: '75.00',
        status: 'pending',
      });

      const suggestionId = result[0].insertId;

      // Reject suggestion
      await rejectSuggestion(suggestionId, testUserId, 'Not needed');

      // Check suggestion status
      const [suggestion] = await db
        .select()
        .from(aiSuggestions)
        .where(eq(aiSuggestions.id, suggestionId));

      expect(suggestion.status).toBe('rejected');
      expect(suggestion.userFeedback).toBe('Not needed');
    });
  });

  describe('incrementIconUsage', () => {
    it('should increment icon usage count', async () => {
      // Create an icon
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      const result = await db.insert(dynamicIcons).values({
        userId: testUserId,
        iconName: 'Test Icon',
        iconNameAr: 'أيقونة اختبار',
        iconEmoji: '🧪',
        taskType: 'test_task',
        actionConfig: { action: 'test' },
        usageCount: 0,
      });

      const iconId = result[0].insertId;

      // Increment usage
      await incrementIconUsage(iconId, testUserId);
      await incrementIconUsage(iconId, testUserId);

      // Check usage count
      const [icon] = await db.select().from(dynamicIcons).where(eq(dynamicIcons.id, iconId));

      expect(icon.usageCount).toBe(2);
    });
  });

  describe('Pattern Recognition', () => {
    it('should recognize patterns and suggest icons automatically', async () => {
      // Simulate user creating invoices 15 times
      for (let i = 0; i < 15; i++) {
        await trackUserBehavior(testUserId, 'create_invoice_pattern', {
          invoiceNumber: `INV-${i}`,
        });
      }

      // Wait a bit for pattern analysis
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Analyze patterns
      await analyzeUserPatterns(testUserId);

      // Check if suggestion was created
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      const suggestions = await db
        .select()
        .from(aiSuggestions)
        .where(eq(aiSuggestions.userId, testUserId));

      const invoiceSuggestion = suggestions.find(
        (s) =>
          s.suggestionType === 'new_icon' &&
          JSON.stringify(s.suggestionData).includes('create_invoice_pattern')
      );

      expect(invoiceSuggestion).toBeDefined();
      if (invoiceSuggestion) {
        expect(parseFloat(invoiceSuggestion.confidence)).toBeGreaterThan(50);
      }
    });
  });
});
