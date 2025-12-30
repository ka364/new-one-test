/**
 * Facebook API Service
 * Integration with Facebook Live for HaderOS Live Shopping
 */

export interface FacebookLiveVideo {
  id: string;
  stream_url: string;
  secure_stream_url: string;
  status: 'UNPUBLISHED' | 'LIVE' | 'SCHEDULED_UNPUBLISHED' | 'SCHEDULED_LIVE';
  title: string;
  description: string;
  permalink_url: string;
}

export interface FacebookComment {
  id: string;
  from: {
    id: string;
    name: string;
  };
  message: string;
  created_time: string;
}

export class FacebookAPIService {
  private accessToken: string;
  private apiVersion: string = 'v18.0';

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  /**
   * Create a live video
   */
  async createLiveVideo(title: string, description: string): Promise<FacebookLiveVideo> {
    const response = await fetch(
      `https://graph.facebook.com/${this.apiVersion}/me/live_videos`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          access_token: this.accessToken,
          title,
          description,
          status: 'UNPUBLISHED',
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Facebook API error: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Start a live video
   */
  async startLiveVideo(videoId: string): Promise<void> {
    const response = await fetch(
      `https://graph.facebook.com/${this.apiVersion}/${videoId}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          access_token: this.accessToken,
          status: 'LIVE',
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to start live video: ${response.statusText}`);
    }
  }

  /**
   * End a live video
   */
  async endLiveVideo(videoId: string): Promise<void> {
    const response = await fetch(
      `https://graph.facebook.com/${this.apiVersion}/${videoId}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          access_token: this.accessToken,
          end_live_video: true,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to end live video: ${response.statusText}`);
    }
  }

  /**
   * Get comments
   */
  async getComments(videoId: string, after?: string): Promise<{
    comments: FacebookComment[];
    paging?: {
      cursors: {
        after: string;
        before: string;
      };
      next?: string;
    };
  }> {
    const url = new URL(`https://graph.facebook.com/${this.apiVersion}/${videoId}/comments`);
    url.searchParams.append('access_token', this.accessToken);
    url.searchParams.append('fields', 'id,from,message,created_time');
    if (after) {
      url.searchParams.append('after', after);
    }

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`Failed to get comments: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      comments: data.data || [],
      paging: data.paging,
    };
  }

  /**
   * Post a comment
   */
  async postComment(videoId: string, message: string): Promise<void> {
    const response = await fetch(
      `https://graph.facebook.com/${this.apiVersion}/${videoId}/comments`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          access_token: this.accessToken,
          message,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to post comment: ${response.statusText}`);
    }
  }

  /**
   * Get live video statistics
   */
  async getLiveVideoStats(videoId: string): Promise<{
    liveViews: number;
    reactions: number;
    comments: number;
  }> {
    const response = await fetch(
      `https://graph.facebook.com/${this.apiVersion}/${videoId}?fields=live_views,reactions.summary(true),comments.summary(true)&access_token=${this.accessToken}`
    );

    if (!response.ok) {
      throw new Error(`Failed to get stats: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      liveViews: data.live_views || 0,
      reactions: data.reactions?.summary?.total_count || 0,
      comments: data.comments?.summary?.total_count || 0,
    };
  }

  /**
   * Get reactions
   */
  async getReactions(videoId: string): Promise<{
    type: string;
    count: number;
  }[]> {
    const response = await fetch(
      `https://graph.facebook.com/${this.apiVersion}/${videoId}/reactions?summary=true&access_token=${this.accessToken}`
    );

    if (!response.ok) {
      throw new Error(`Failed to get reactions: ${response.statusText}`);
    }

    const data = await response.json();
    return data.summary?.reaction_types || [];
  }
}
