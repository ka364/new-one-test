
import {
    createLiveStream,
    getLiveStreamById,
    updateLiveStreamStatus,
    addProductToStream,
    type InsertLiveStream,
    type InsertStreamProduct,
} from '../db';

// Interface for Video Provider (Strategy Pattern)
interface VideoProvider {
    createStream(title: string): Promise<{ playbackId: string; streamKey: string; externalId: string }>;
    startStream(externalId: string): Promise<void>;
    stopStream(externalId: string): Promise<void>;
    getPlaybackUrl(playbackId: string): string;
}

// Mock Provider (Default until Mux/AWS is configured)
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
        // We can swap this with MuxVideoProvider later based on ENV variables
        this.provider = new MockVideoProvider();
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
