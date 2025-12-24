/**
 * Webhook Monitoring Router
 * APIs for monitoring Shopify webhooks and recent orders
 */

import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { sql } from "drizzle-orm";

export const webhooksRouter = router({
  /**
   * Get webhook statistics
   */
  getStats: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");

    // Get total webhooks
    const [totalResult]: any = await db.execute(
      sql`SELECT COUNT(*) as total FROM shopify_webhook_logs`
    );
    const total = totalResult[0]?.total || 0;

    // Get successful webhooks
    const [successResult]: any = await db.execute(
      sql`SELECT COUNT(*) as success FROM shopify_webhook_logs WHERE processed = 1`
    );
    const success = successResult[0]?.success || 0;

    // Get failed webhooks
    const [failedResult]: any = await db.execute(
      sql`SELECT COUNT(*) as failed FROM shopify_webhook_logs WHERE processed = 0`
    );
    const failed = failedResult[0]?.failed || 0;

    // Get webhooks in last 24 hours
    const [last24hResult]: any = await db.execute(
      sql`SELECT COUNT(*) as count FROM shopify_webhook_logs 
          WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)`
    );
    const last24h = last24hResult[0]?.count || 0;

    // Get webhooks by topic
    const [topicStats]: any = await db.execute(
      sql`SELECT topic, COUNT(*) as count 
          FROM shopify_webhook_logs 
          GROUP BY topic 
          ORDER BY count DESC`
    );

    return {
      total,
      success,
      failed,
      successRate: total > 0 ? ((success / total) * 100).toFixed(1) : "0",
      last24h,
      topicStats: topicStats || [],
    };
  }),

  /**
   * Get recent webhook logs
   */
  getRecentLogs: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        topic: z.string().optional(),
      })
    )
    .query(async ({ input }: any) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      let query = sql`
        SELECT 
          id, topic, shopify_id, processed, error, 
          created_at, retry_count
        FROM shopify_webhook_logs
      `;

      if (input.topic) {
        query = sql`${query} WHERE topic = ${input.topic}`;
      }

      query = sql`${query} ORDER BY created_at DESC LIMIT ${input.limit}`;

      const [logs]: any = await db.execute(query);

      return logs || [];
    }),

  /**
   * Get recent Shopify orders
   */
  getRecentOrders: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(10),
      })
    )
    .query(async ({ input }: any) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      const [orders]: any = await db.execute(sql`
        SELECT 
          id, shopify_order_id, order_number, order_name,
          email, phone, total_price, currency,
          financial_status, fulfillment_status,
          created_at, updated_at
        FROM shopify_orders
        ORDER BY created_at DESC
        LIMIT ${input.limit}
      `);

      return orders || [];
    }),

  /**
   * Get webhook activity timeline (last 7 days)
   */
  getActivityTimeline: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");

    const [timeline]: any = await db.execute(sql`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as total,
        SUM(CASE WHEN processed = 1 THEN 1 ELSE 0 END) as success,
        SUM(CASE WHEN processed = 0 THEN 1 ELSE 0 END) as failed
      FROM shopify_webhook_logs
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `);

    return timeline || [];
  }),

  /**
   * Get order statistics
   */
  getOrderStats: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");

    // Total orders
    const [totalResult]: any = await db.execute(
      sql`SELECT COUNT(*) as total FROM shopify_orders`
    );
    const total = totalResult[0]?.total || 0;

    // Orders today
    const [todayResult]: any = await db.execute(
      sql`SELECT COUNT(*) as count FROM shopify_orders 
          WHERE DATE(created_at) = CURDATE()`
    );
    const today = todayResult[0]?.count || 0;

    // Total revenue
    const [revenueResult]: any = await db.execute(
      sql`SELECT SUM(total_price) as revenue FROM shopify_orders 
          WHERE financial_status = 'paid'`
    );
    const revenue = revenueResult[0]?.revenue || 0;

    // Orders by status
    const [statusStats]: any = await db.execute(
      sql`SELECT financial_status, COUNT(*) as count 
          FROM shopify_orders 
          GROUP BY financial_status`
    );

    return {
      total,
      today,
      revenue: parseFloat(revenue).toFixed(2),
      statusStats: statusStats || [],
    };
  }),
});
