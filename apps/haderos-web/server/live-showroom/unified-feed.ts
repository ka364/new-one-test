/**
 * Unified Interaction Feed for Live Showroom
 * 
 * This system aggregates comments, reactions, and interactions from all
 * social media platforms into a single, real-time feed for the broadcaster.
 */

import { eventBus } from "../events/eventBus";

export type InteractionPlatform = 
  | "facebook"
  | "youtube"
  | "tiktok"
  | "instagram"
  | "haderos";

export type InteractionType =
  | "comment"
  | "reaction"
  | "share"
  | "gift"
  | "order"
  | "question";

export interface Interaction {
  id: string;
  streamId: string;
  platform: InteractionPlatform;
  type: InteractionType;
  userId?: string;
  username: string;
  userAvatar?: string;
  content: string;
  timestamp: Date;
  metadata?: {
    isVerified?: boolean;
    isVIP?: boolean;
    orderValue?: number;
    giftValue?: number;
    reactionType?: string;
  };
}

export interface InteractionStats {
  streamId: string;
  totalInteractions: number;
  byPlatform: Record<InteractionPlatform, number>;
  byType: Record<InteractionType, number>;
  engagementRate: number;
  topQuestions: string[];
}

export class UnifiedFeed {
  private activeFeeds: Map<string, Interaction[]> = new Map();
  private stats: Map<string, InteractionStats> = new Map();

  constructor() {
    this.setupPlatformListeners();
  }

  private setupPlatformListeners() {
    // Listen for interactions from all platforms
    eventBus.on("interaction.facebook", (data) => this.handleInteraction({ ...data, platform: "facebook" }));
    eventBus.on("interaction.youtube", (data) => this.handleInteraction({ ...data, platform: "youtube" }));
    eventBus.on("interaction.tiktok", (data) => this.handleInteraction({ ...data, platform: "tiktok" }));
    eventBus.on("interaction.instagram", (data) => this.handleInteraction({ ...data, platform: "instagram" }));
    eventBus.on("interaction.haderos", (data) => this.handleInteraction({ ...data, platform: "haderos" }));

    // Stream lifecycle
    eventBus.on("stream.started", this.initializeFeed.bind(this));
    eventBus.on("stream.ended", this.finalizeFeed.bind(this));
  }

  /**
   * Initialize feed for a new stream
   */
  private initializeFeed(data: { streamId: string }) {
    this.activeFeeds.set(data.streamId, []);
    this.stats.set(data.streamId, {
      streamId: data.streamId,
      totalInteractions: 0,
      byPlatform: {} as Record<InteractionPlatform, number>,
      byType: {} as Record<InteractionType, number>,
      engagementRate: 0,
      topQuestions: [],
    });
  }

  /**
   * Handle incoming interaction from any platform
   */
  private async handleInteraction(interaction: Interaction) {
    const feed = this.activeFeeds.get(interaction.streamId);
    const stats = this.stats.get(interaction.streamId);

    if (!feed || !stats) {
      console.error(`No active feed found for stream: ${interaction.streamId}`);
      return;
    }

    // Add to feed (keep last 100 interactions for performance)
    feed.unshift(interaction);
    if (feed.length > 100) {
      feed.pop();
    }

    // Update statistics
    stats.totalInteractions++;
    stats.byPlatform[interaction.platform] = (stats.byPlatform[interaction.platform] || 0) + 1;
    stats.byType[interaction.type] = (stats.byType[interaction.type] || 0) + 1;

    // Track questions for AI assistance
    if (interaction.type === "question") {
      stats.topQuestions.push(interaction.content);
      if (stats.topQuestions.length > 10) {
        stats.topQuestions.shift();
      }
    }

    // Emit real-time update to broadcaster dashboard
    eventBus.emit("feed.updated", {
      streamId: interaction.streamId,
      interaction,
      stats,
    });

    // Check for important interactions that need immediate attention
    if (this.isHighPriority(interaction)) {
      eventBus.emit("feed.priority", {
        streamId: interaction.streamId,
        interaction,
      });
    }
  }

  /**
   * Determine if an interaction needs immediate attention
   */
  private isHighPriority(interaction: Interaction): boolean {
    // Orders are always high priority
    if (interaction.type === "order") return true;

    // High-value gifts
    if (interaction.type === "gift" && interaction.metadata?.giftValue && interaction.metadata.giftValue > 100) {
      return true;
    }

    // VIP users
    if (interaction.metadata?.isVIP) return true;

    // Questions from verified users
    if (interaction.type === "question" && interaction.metadata?.isVerified) {
      return true;
    }

    return false;
  }

  /**
   * Get current feed for a stream
   */
  public getFeed(streamId: string): Interaction[] {
    return this.activeFeeds.get(streamId) || [];
  }

  /**
   * Get statistics for a stream
   */
  public getStats(streamId: string): InteractionStats | null {
    return this.stats.get(streamId) || null;
  }

  /**
   * Filter feed by platform
   */
  public getFilteredFeed(streamId: string, platform?: InteractionPlatform, type?: InteractionType): Interaction[] {
    const feed = this.getFeed(streamId);
    
    return feed.filter(interaction => {
      if (platform && interaction.platform !== platform) return false;
      if (type && interaction.type !== type) return false;
      return true;
    });
  }

  /**
   * Finalize feed when stream ends
   */
  private finalizeFeed(data: { streamId: string }) {
    const feed = this.activeFeeds.get(data.streamId);
    const stats = this.stats.get(data.streamId);

    if (feed && stats) {
      // Emit final report
      eventBus.emit("feed.finalized", {
        streamId: data.streamId,
        totalInteractions: feed.length,
        stats,
      });
    }

    // Clean up
    this.activeFeeds.delete(data.streamId);
    this.stats.delete(data.streamId);
  }
}

// Export singleton instance
export const unifiedFeed = new UnifiedFeed();
