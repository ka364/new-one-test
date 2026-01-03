/**
 * Revenue Aggregation System for Live Showroom
 * 
 * This system collects revenue from all social media platforms during live streams
 * and consolidates them into a single, unified revenue tracking system.
 */

import { db } from "../db";
import { eventBus } from "../events/eventBus";

// Revenue source types from different platforms
export type RevenueSource = 
  | "facebook_stars"      // Facebook Stars
  | "youtube_superchat"   // YouTube Super Chat
  | "tiktok_gifts"        // TikTok Gifts
  | "instagram_badges"    // Instagram Badges
  | "haderos_orders";     // Direct orders from HADEROS

export interface RevenueEvent {
  streamId: string;
  platform: RevenueSource;
  amount: number;           // Amount in EGP
  currency: string;         // Original currency
  exchangeRate?: number;    // If conversion was needed
  userId?: string;          // User who sent the gift/donation
  username?: string;        // Display name
  message?: string;         // Attached message
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface StreamRevenue {
  streamId: string;
  totalRevenue: number;     // Total in EGP
  breakdown: {
    [key in RevenueSource]?: number;
  };
  transactionCount: number;
  topDonor?: {
    username: string;
    amount: number;
  };
}

export class RevenueAggregator {
  private activeStreams: Map<string, StreamRevenue> = new Map();

  constructor() {
    this.setupEventListeners();
  }

  private setupEventListeners() {
    // Listen for revenue events from all platforms
    eventBus.on("revenue.received", this.handleRevenueEvent.bind(this));
    eventBus.on("stream.started", this.initializeStream.bind(this));
    eventBus.on("stream.ended", this.finalizeStream.bind(this));
  }

  /**
   * Initialize revenue tracking for a new stream
   */
  private async initializeStream(data: { streamId: string }) {
    const revenue: StreamRevenue = {
      streamId: data.streamId,
      totalRevenue: 0,
      breakdown: {},
      transactionCount: 0,
    };

    this.activeStreams.set(data.streamId, revenue);

    // Store in database
    await db.execute(
      `INSERT INTO stream_revenue (stream_id, total_revenue, breakdown, created_at)
       VALUES (?, ?, ?, NOW())`,
      [data.streamId, 0, JSON.stringify({})]
    );
  }

  /**
   * Handle incoming revenue from any platform
   */
  private async handleRevenueEvent(event: RevenueEvent) {
    const revenue = this.activeStreams.get(event.streamId);
    if (!revenue) {
      console.error(`No active stream found for ID: ${event.streamId}`);
      return;
    }

    // Update totals
    revenue.totalRevenue += event.amount;
    revenue.breakdown[event.platform] = 
      (revenue.breakdown[event.platform] || 0) + event.amount;
    revenue.transactionCount++;

    // Track top donor
    if (!revenue.topDonor || event.amount > revenue.topDonor.amount) {
      revenue.topDonor = {
        username: event.username || "Anonymous",
        amount: event.amount,
      };
    }

    // Store transaction in database
    await db.execute(
      `INSERT INTO revenue_transactions 
       (stream_id, platform, amount, currency, user_id, username, message, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        event.streamId,
        event.platform,
        event.amount,
        event.currency,
        event.userId,
        event.username,
        event.message,
      ]
    );

    // Update stream totals
    await db.execute(
      `UPDATE stream_revenue 
       SET total_revenue = ?, breakdown = ?, transaction_count = ?, updated_at = NOW()
       WHERE stream_id = ?`,
      [
        revenue.totalRevenue,
        JSON.stringify(revenue.breakdown),
        revenue.transactionCount,
        event.streamId,
      ]
    );

    // Emit real-time update for broadcaster dashboard
    eventBus.emit("revenue.updated", {
      streamId: event.streamId,
      revenue: revenue,
      latestTransaction: event,
    });
  }

  /**
   * Finalize revenue tracking when stream ends
   */
  private async finalizeStream(data: { streamId: string }) {
    const revenue = this.activeStreams.get(data.streamId);
    if (!revenue) return;

    // Mark stream as completed
    await db.execute(
      `UPDATE stream_revenue 
       SET completed = TRUE, completed_at = NOW()
       WHERE stream_id = ?`,
      [data.streamId]
    );

    // Generate revenue report
    const report = await this.generateRevenueReport(data.streamId);

    // Emit completion event
    eventBus.emit("revenue.finalized", {
      streamId: data.streamId,
      report,
    });

    // Clean up from active streams
    this.activeStreams.delete(data.streamId);
  }

  /**
   * Get current revenue for an active stream
   */
  public getStreamRevenue(streamId: string): StreamRevenue | null {
    return this.activeStreams.get(streamId) || null;
  }

  /**
   * Generate comprehensive revenue report
   */
  private async generateRevenueReport(streamId: string) {
    const revenue = this.activeStreams.get(streamId);
    if (!revenue) return null;

    return {
      streamId,
      totalRevenue: revenue.totalRevenue,
      breakdown: revenue.breakdown,
      transactionCount: revenue.transactionCount,
      topDonor: revenue.topDonor,
      averageTransaction: revenue.totalRevenue / revenue.transactionCount,
      platformPerformance: Object.entries(revenue.breakdown).map(([platform, amount]) => ({
        platform,
        amount,
        percentage: (amount / revenue.totalRevenue) * 100,
      })),
    };
  }
}

// Export singleton instance
export const revenueAggregator = new RevenueAggregator();
