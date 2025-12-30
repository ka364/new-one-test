/**
 * YouTube API Service
 * Integration with YouTube Live for HaderOS Live Shopping
 */

export interface YouTubeLiveBroadcast {
  id: string;
  snippet: {
    title: string;
    description: string;
    scheduledStartTime: string;
    liveChatId: string;
  };
  status: {
    lifeCycleStatus: 'ready' | 'live' | 'complete';
    privacyStatus: 'public' | 'unlisted' | 'private';
  };
}

export interface YouTubeChatMessage {
  id: string;
  authorDetails: {
    channelId: string;
    displayName: string;
    profileImageUrl: string;
  };
  snippet: {
    displayMessage: string;
    publishedAt: string;
  };
}

export class YouTubeAPIService {
  private apiKey: string;
  private accessToken?: string;

  constructor(apiKey: string, accessToken?: string) {
    this.apiKey = apiKey;
    this.accessToken = accessToken;
  }

  /**
   * Create a live broadcast
   */
  async createBroadcast(title: string, description: string, scheduledStartTime: Date): Promise<YouTubeLiveBroadcast> {
    const response = await fetch('https://www.googleapis.com/youtube/v3/liveBroadcasts?part=snippet,status', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        snippet: {
          title,
          description,
          scheduledStartTime: scheduledStartTime.toISOString(),
        },
        status: {
          privacyStatus: 'public',
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Start a live broadcast
   */
  async startBroadcast(broadcastId: string): Promise<void> {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/liveBroadcasts/transition?broadcastStatus=live&id=${broadcastId}&part=status`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to start broadcast: ${response.statusText}`);
    }
  }

  /**
   * End a live broadcast
   */
  async endBroadcast(broadcastId: string): Promise<void> {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/liveBroadcasts/transition?broadcastStatus=complete&id=${broadcastId}&part=status`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to end broadcast: ${response.statusText}`);
    }
  }

  /**
   * Get live chat messages
   */
  async getChatMessages(liveChatId: string, pageToken?: string): Promise<{
    messages: YouTubeChatMessage[];
    nextPageToken?: string;
    pollingIntervalMillis: number;
  }> {
    const url = new URL('https://www.googleapis.com/youtube/v3/liveChat/messages');
    url.searchParams.append('liveChatId', liveChatId);
    url.searchParams.append('part', 'snippet,authorDetails');
    if (pageToken) {
      url.searchParams.append('pageToken', pageToken);
    }

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get chat messages: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      messages: data.items || [],
      nextPageToken: data.nextPageToken,
      pollingIntervalMillis: data.pollingIntervalMillis || 5000,
    };
  }

  /**
   * Send a chat message
   */
  async sendChatMessage(liveChatId: string, message: string): Promise<void> {
    const response = await fetch('https://www.googleapis.com/youtube/v3/liveChat/messages?part=snippet', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        snippet: {
          liveChatId,
          type: 'textMessageEvent',
          textMessageDetails: {
            messageText: message,
          },
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to send message: ${response.statusText}`);
    }
  }

  /**
   * Get broadcast statistics
   */
  async getBroadcastStats(broadcastId: string): Promise<{
    viewerCount: number;
    likeCount: number;
    chatMessageCount: number;
  }> {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=liveStreamingDetails,statistics&id=${broadcastId}`,
      {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get stats: ${response.statusText}`);
    }

    const data = await response.json();
    const video = data.items?.[0];

    return {
      viewerCount: parseInt(video?.liveStreamingDetails?.concurrentViewers || '0'),
      likeCount: parseInt(video?.statistics?.likeCount || '0'),
      chatMessageCount: parseInt(video?.liveStreamingDetails?.activeLiveChatId ? '1' : '0'),
    };
  }
}
