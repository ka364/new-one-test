
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { liveCommerceRouter } from '../routers/live-commerce';
import type { User } from '../db';

// Mock DB functions with state
let mockStatus = 'scheduled';

vi.mock('../db', async () => {
    return {
        getDb: vi.fn(),
        createLiveStream: vi.fn().mockImplementation(async () => {
            mockStatus = 'scheduled'; // Reset on creation
            return {
                id: 1,
                title: 'Test Stream',
                status: 'scheduled',
                streamerId: 1,
                playbackId: 'mock-playback-id',
            };
        }),
        getLiveStreamById: vi.fn().mockImplementation(async (id) => {
            if (id === 1) {
                return {
                    id: 1,
                    title: 'Test Stream',
                    status: mockStatus,
                    streamerId: 1,
                    playbackId: 'mock-playback-id',
                    externalStreamId: 'mock-ext-id',
                };
            }
            return undefined;
        }),
        getAllLiveStreams: vi.fn().mockResolvedValue([]),
        updateLiveStreamStatus: vi.fn().mockImplementation(async (id, status) => {
            mockStatus = status;
        }),
        getStreamProducts: vi.fn().mockResolvedValue([]),
        saveStreamChatMessage: vi.fn().mockResolvedValue(undefined),
        getStreamMessages: vi.fn().mockResolvedValue([]),
        addProductToStream: vi.fn().mockResolvedValue(undefined),
    };
});

describe('Live Commerce Router', () => {
    const mockCtx = {
        user: {
            id: 1,
            role: 'admin',
            name: 'Test User',
        } as User,
        req: {} as any,
        res: {} as any,
    };

    const caller = liveCommerceRouter.createCaller(mockCtx);

    // Reset state before tests
    beforeEach(() => {
        mockStatus = 'scheduled';
    });

    it('should create a live stream', async () => {
        const result = await caller.createStream({
            title: 'My First Live Sale',
            description: 'Selling awesome products',
        });

        expect(result).toBeDefined();
        expect(result.title).toBe('Test Stream');
        expect(result.status).toBe('scheduled');
    });

    it('should start a stream', async () => {
        // mockStatus is 'scheduled' initially
        const result = await caller.startStream({ streamId: 1 });
        // After startStream, it calls updateLiveStreamStatus which updates mockStatus to 'live'
        // The router returns the stream object with the NEW status manually merged or fetched?
        // In live-stream.service.ts: return { ...stream, status: 'live' };
        expect(result.status).toBe('live');
        expect(mockStatus).toBe('live'); // Verify DB was updated
    });

    it('should end a stream', async () => {
        // Setup: Stream must be live first
        mockStatus = 'live';

        const result = await caller.endStream({ streamId: 1 });
        expect(result.status).toBe('ended');
        expect(mockStatus).toBe('ended');
    });

    it('should pin a product', async () => {
        const result = await caller.pinProduct({ streamId: 1, productId: 101 });
        expect(result.success).toBe(true);
    });

    it('should send a message', async () => {
        const result = await caller.sendMessage({ streamId: 1, message: 'Hello World' });
        expect(result.success).toBe(true);
    });
});
