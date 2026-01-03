import Mux from '@mux/mux-node';
import {
    createLiveStream,
    getLiveStreamById,
    updateLiveStreamStatus,
    addProductToStream,
    type InsertLiveStream,
    type InsertStreamProduct,
} from '../db';

// Initialize Mux Client
const muxClient = new Mux({
    tokenId: process.env.MUX_TOKEN_ID,
    tokenSecret: process.env.MUX_TOKEN_SECRET,
});

// Interface for Video Provider (Strategy Pattern)
interface VideoProvider {
    createStream(title: string): Promise<{ playbackId: string; streamKey: string; externalId: string }>;
    startStream(externalId: string): Promise<void>;
    stopStream(externalId: string): Promise<void>;
    getPlaybackUrl(playbackId: string): string | null;
}

// Mux Provider Implementation
class MuxVideoProvider implements VideoProvider {
    async createStream(title: string) {
        console.log(`[MuxProvider] Creating stream: ${title}`);
        try {
            const stream = await muxClient.video.liveStreams.create({
                playback_policy: ['public'],
                new_asset_settings: { playback_policy: ['public'] },
                latency_mode: 'reduced', // Interactve latency for Live Commerce
            });

            return {
                playbackId: stream.playback_ids?.[0]?.id || '',
                streamKey: stream.stream_key || '',
                externalId: stream.id,
            };
        } catch (error) {
            console.error('[MuxProvider] Error creating stream:', error);
            throw new Error('Failed to create Mux stream');
        }
    }

    async startStream(externalId: string) {
        // Mux handles start automatically when RTMP signal is received
        // We can use this to perhaps verify status via API if needed
        console.log(`[MuxProvider] Stream ${externalId} signal expectation.`);
    }

    async stopStream(externalId: string) {
        console.log(`[MuxProvider] Stopping stream: ${externalId}`);
        try {
            await muxClient.video.liveStreams.complete(externalId);
        } catch (error) {
            console.error('[MuxProvider] Error stopping stream:', error);
            // Don't throw here, as stream might already be idle
        }
    }

    getPlaybackUrl(playbackId: string) {
        return `https://stream.mux.com/${playbackId}.m3u8`;
    }
}

// Mock Provider (Fallback if no keys)
class MockVideoProvider implements VideoProvider {
    async createStream(title: string) {
        console.log(`[MockProvider] Creating stream: ${title}`);
        return {
            playbackId: `mock-playback-${Date.now()}`,
            streamKey: `mock-key-${Date.now()}`,
            externalId: `mock-ext-${Date.now()}`,
        };
    }

    async startStream(externalId: string) {
        console.log(`[MockProvider] Starting stream: ${externalId}`);
    }

    async stopStream(externalId: string) {
        console.log(`[MockProvider] Stopping stream: ${externalId}`);
    }

    getPlaybackUrl(playbackId: string) {
        return `https://stream.mux.com/${playbackId}.m3u8`;
    }
}

export class LiveStreamService {
    private provider: VideoProvider;

    constructor() {
        // Use Mux if keys are present, otherwise Mock for dev/test
        if (process.env.MUX_TOKEN_ID && process.env.MUX_TOKEN_SECRET) {
            this.provider = new MuxVideoProvider();
            console.log('[LiveStreamService] Using MUX Video Provider');
        } else {
            this.provider = new MockVideoProvider();
            console.log('[LiveStreamService] Using MOCK Video Provider (Missing Keys)');
        }
    }

    /**
     * Create a new Live Stream
     */
    async createStream(data: { title: string; description?: string; streamerId: number; scheduledAt?: Date }) {
        // 1. Create stream resource in Video Provider
        const videoDetails = await this.provider.createStream(data.title);

        // 2. Save to Database
        const stream = await createLiveStream({
            title: data.title,
            description: data.description,
            streamerId: data.streamerId,
            scheduledAt: data.scheduledAt,
            status: 'scheduled',
            playbackId: videoDetails.playbackId,
            streamKey: videoDetails.streamKey,
            externalStreamId: videoDetails.externalId,
        });

        return stream;
    }

    /**
     * Start broadcast
     */
    async startBroadcast(streamId: number) {
        const stream = await getLiveStreamById(streamId);
        if (!stream) throw new Error('Stream not found');

        if (stream.status === 'live') return stream;

        // Notify provider
        if (stream.externalStreamId) {
            await this.provider.startStream(stream.externalStreamId);
        }

        // Update DB
        await updateLiveStreamStatus(streamId, 'live', { startedAt: new Date() });

        return { ...stream, status: 'live' };
    }

    /**
     * Stop broadcast
     */
    async stopBroadcast(streamId: number) {
        const stream = await getLiveStreamById(streamId);
        if (!stream) throw new Error('Stream not found');

        if (stream.status !== 'live') return stream;

        // Notify provider
        if (stream.externalStreamId) {
            await this.provider.stopStream(stream.externalStreamId);
        }

        // Update DB
        await updateLiveStreamStatus(streamId, 'ended', { endedAt: new Date() });

        return { ...stream, status: 'ended' };
    }

    /**
     * Pin a product to the stream (Live Commerce Feature)
     */
    async pinProduct(streamId: number, productId: number) {
        await addProductToStream({
            streamId,
            productId,
            isPinned: true,
            pinnedAt: new Date(),
        });
    }

    /**
     * Get Playback URL
     */
    async getPlaybackUrl(streamId: number) {
        const stream = await getLiveStreamById(streamId);
        if (!stream || !stream.playbackId) return null;

        return this.provider.getPlaybackUrl(stream.playbackId);
    }
}

export const liveStreamService = new LiveStreamService();
