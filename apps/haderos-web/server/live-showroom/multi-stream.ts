/**
 * Multi-Platform Streaming System
 * نظام البث المتعدد على وسائل التواصل الاجتماعي
 * 
 * This system enables factories to broadcast simultaneously to:
 * - Facebook Live
 * - YouTube Live
 * - Instagram Live
 * - TikTok Live
 * - HADEROS Platform
 */

export interface SocialPlatform {
  id: 'facebook' | 'youtube' | 'instagram' | 'tiktok' | 'haderos';
  name: string;
  nameAr: string;
  icon: string;
  color: string;
  isEnabled: boolean;
  rtmpUrl?: string;
  streamKey?: string;
  status: 'connected' | 'disconnected' | 'streaming' | 'error';
  viewerCount: number;
  errorMessage?: string;
}

export interface MultiStreamConfig {
  streamId: string;
  factoryId: string;
  platforms: SocialPlatform[];
  primarySource: 'camera' | 'screen' | 'mixed';
  quality: '720p' | '1080p' | '4k';
  bitrate: number; // kbps
  fps: number;
  audioEnabled: boolean;
  autoStart: boolean;
}

export interface StreamComment {
  id: string;
  streamId: string;
  platform: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  message: string;
  timestamp: Date;
  isQuestion: boolean;
  isHighlighted: boolean;
}

export interface StreamStats {
  streamId: string;
  totalViewers: number;
  viewersByPlatform: Record<string, number>;
  totalComments: number;
  commentsByPlatform: Record<string, number>;
  totalOrders: number;
  totalRevenue: number;
  peakViewers: number;
  averageWatchTime: number; // seconds
  engagementRate: number; // percentage
}

/**
 * Multi-Stream Manager
 */
export class MultiStreamManager {
  private configs: Map<string, MultiStreamConfig> = new Map();
  private comments: Map<string, StreamComment[]> = new Map();
  private stats: Map<string, StreamStats> = new Map();

  /**
   * Initialize multi-stream configuration
   */
  initializeStream(
    streamId: string,
    factoryId: string,
    enabledPlatforms: Array<'facebook' | 'youtube' | 'instagram' | 'tiktok' | 'haderos'>
  ): MultiStreamConfig {
    const platforms: SocialPlatform[] = [
      {
        id: 'facebook',
        name: 'Facebook Live',
        nameAr: 'فيسبوك لايف',
        icon: '📘',
        color: '#1877F2',
        isEnabled: enabledPlatforms.includes('facebook'),
        status: 'disconnected',
        viewerCount: 0,
      },
      {
        id: 'youtube',
        name: 'YouTube Live',
        nameAr: 'يوتيوب لايف',
        icon: '📺',
        color: '#FF0000',
        isEnabled: enabledPlatforms.includes('youtube'),
        status: 'disconnected',
        viewerCount: 0,
      },
      {
        id: 'instagram',
        name: 'Instagram Live',
        nameAr: 'انستجرام لايف',
        icon: '📷',
        color: '#E4405F',
        isEnabled: enabledPlatforms.includes('instagram'),
        status: 'disconnected',
        viewerCount: 0,
      },
      {
        id: 'tiktok',
        name: 'TikTok Live',
        nameAr: 'تيك توك لايف',
        icon: '🎵',
        color: '#000000',
        isEnabled: enabledPlatforms.includes('tiktok'),
        status: 'disconnected',
        viewerCount: 0,
      },
      {
        id: 'haderos',
        name: 'HADEROS Platform',
        nameAr: 'منصة هاديروس',
        icon: '🏭',
        color: '#4F46E5',
        isEnabled: true, // Always enabled
        status: 'connected',
        viewerCount: 0,
      },
    ];

    const config: MultiStreamConfig = {
      streamId,
      factoryId,
      platforms,
      primarySource: 'camera',
      quality: '1080p',
      bitrate: 4500,
      fps: 30,
      audioEnabled: true,
      autoStart: false,
    };

    this.configs.set(streamId, config);
    this.comments.set(streamId, []);
    this.stats.set(streamId, {
      streamId,
      totalViewers: 0,
      viewersByPlatform: {},
      totalComments: 0,
      commentsByPlatform: {},
      totalOrders: 0,
      totalRevenue: 0,
      peakViewers: 0,
      averageWatchTime: 0,
      engagementRate: 0,
    });

    console.log(`🌐 Initialized multi-stream for: ${streamId}`);
    return config;
  }

  /**
   * Connect to a social platform
   */
  connectPlatform(
    streamId: string,
    platformId: 'facebook' | 'youtube' | 'instagram' | 'tiktok',
    credentials: {
      rtmpUrl: string;
      streamKey: string;
    }
  ): void {
    const config = this.configs.get(streamId);
    if (!config) {
      throw new Error(`Stream ${streamId} not found`);
    }

    const platform = config.platforms.find(p => p.id === platformId);
    if (!platform) {
      throw new Error(`Platform ${platformId} not found`);
    }

    platform.rtmpUrl = credentials.rtmpUrl;
    platform.streamKey = credentials.streamKey;
    platform.status = 'connected';

    console.log(`✅ Connected to ${platform.name} for stream ${streamId}`);
  }

  /**
   * Start streaming to all enabled platforms
   */
  startMultiStream(streamId: string): void {
    const config = this.configs.get(streamId);
    if (!config) {
      throw new Error(`Stream ${streamId} not found`);
    }

    for (const platform of config.platforms) {
      if (platform.isEnabled && platform.status === 'connected') {
        platform.status = 'streaming';
        console.log(`▶️ Started streaming to ${platform.name}`);
      }
    }

    console.log(`🎬 Multi-stream started for: ${streamId}`);
  }

  /**
   * Stop streaming to all platforms
   */
  stopMultiStream(streamId: string): void {
    const config = this.configs.get(streamId);
    if (!config) {
      throw new Error(`Stream ${streamId} not found`);
    }

    for (const platform of config.platforms) {
      if (platform.status === 'streaming') {
        platform.status = 'connected';
        console.log(`⏹️ Stopped streaming to ${platform.name}`);
      }
    }

    console.log(`🛑 Multi-stream stopped for: ${streamId}`);
  }

  /**
   * Add a comment from any platform
   */
  addComment(
    streamId: string,
    platform: string,
    userId: string,
    userName: string,
    message: string,
    userAvatar?: string
  ): StreamComment {
    const comments = this.comments.get(streamId);
    if (!comments) {
      throw new Error(`Stream ${streamId} not found`);
    }

    const comment: StreamComment = {
      id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      streamId,
      platform,
      userId,
      userName,
      userAvatar,
      message,
      timestamp: new Date(),
      isQuestion: message.includes('?') || message.includes('؟'),
      isHighlighted: false,
    };

    comments.push(comment);

    // Update stats
    const stats = this.stats.get(streamId);
    if (stats) {
      stats.totalComments += 1;
      stats.commentsByPlatform[platform] = (stats.commentsByPlatform[platform] || 0) + 1;
    }

    return comment;
  }

  /**
   * Highlight a comment (pin it)
   */
  highlightComment(streamId: string, commentId: string): void {
    const comments = this.comments.get(streamId);
    if (!comments) {
      throw new Error(`Stream ${streamId} not found`);
    }

    // Remove highlight from all comments
    comments.forEach(c => c.isHighlighted = false);

    // Highlight the selected comment
    const comment = comments.find(c => c.id === commentId);
    if (comment) {
      comment.isHighlighted = true;
      console.log(`📌 Highlighted comment: ${comment.message}`);
    }
  }

  /**
   * Update viewer count for a platform
   */
  updateViewerCount(
    streamId: string,
    platformId: string,
    count: number
  ): void {
    const config = this.configs.get(streamId);
    if (!config) return;

    const platform = config.platforms.find(p => p.id === platformId);
    if (platform) {
      platform.viewerCount = count;
    }

    // Update total stats
    const stats = this.stats.get(streamId);
    if (stats) {
      stats.viewersByPlatform[platformId] = count;
      stats.totalViewers = Object.values(stats.viewersByPlatform).reduce((a, b) => a + b, 0);
      stats.peakViewers = Math.max(stats.peakViewers, stats.totalViewers);
    }
  }

  /**
   * Get stream configuration
   */
  getConfig(streamId: string): MultiStreamConfig | undefined {
    return this.configs.get(streamId);
  }

  /**
   * Get all comments for a stream
   */
  getComments(streamId: string, limit?: number): StreamComment[] {
    const comments = this.comments.get(streamId) || [];
    if (limit) {
      return comments.slice(-limit);
    }
    return comments;
  }

  /**
   * Get stream statistics
   */
  getStats(streamId: string): StreamStats | undefined {
    return this.stats.get(streamId);
  }

  /**
   * Get RTMP ingest URL for the factory
   */
  getRTMPIngestUrl(streamId: string): string {
    // This would be the HADEROS RTMP server that redistributes to all platforms
    return `rtmp://stream.haderos.com/live/${streamId}`;
  }

  /**
   * Generate streaming instructions for factory
   */
  getStreamingInstructions(streamId: string): {
    rtmpUrl: string;
    streamKey: string;
    settings: {
      quality: string;
      bitrate: number;
      fps: number;
    };
    platforms: string[];
  } {
    const config = this.configs.get(streamId);
    if (!config) {
      throw new Error(`Stream ${streamId} not found`);
    }

    const enabledPlatforms = config.platforms
      .filter(p => p.isEnabled)
      .map(p => p.name);

    return {
      rtmpUrl: this.getRTMPIngestUrl(streamId),
      streamKey: streamId,
      settings: {
        quality: config.quality,
        bitrate: config.bitrate,
        fps: config.fps,
      },
      platforms: enabledPlatforms,
    };
  }
}

// Singleton instance
let multiStreamManager: MultiStreamManager | null = null;

/**
 * Get the multi-stream manager instance
 */
export function getMultiStreamManager(): MultiStreamManager {
  if (!multiStreamManager) {
    multiStreamManager = new MultiStreamManager();
  }
  return multiStreamManager;
}
