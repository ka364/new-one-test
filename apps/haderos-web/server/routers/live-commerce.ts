
import { z } from 'zod';
import { protectedProcedure, publicProcedure, router } from '../_core/trpc';
import { liveStreamService } from '../services/live-stream.service';
import {
    getAllLiveStreams,
    getLiveStreamById,
    getStreamMessages,
    getStreamProducts,
    saveStreamChatMessage,
} from '../db';
import { TRPCError } from '@trpc/server';

export const liveCommerceRouter = router({
    createStream: protectedProcedure
        .input(
            z.object({
                title: z.string().min(3),
                description: z.string().optional(),
                scheduledAt: z.string().optional(),
            })
        )
        .mutation(async ({ input, ctx }) => {
            // Logic: Only factories/admins can create streams
            // For now, we allow any protected user
            return await liveStreamService.createStream({
                title: input.title,
                description: input.description,
                streamerId: ctx.user.id,
                scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : undefined,
            });
        }),

    listStreams: publicProcedure
        .input(z.object({ limit: z.number().default(20) }))
        .query(async ({ input }) => {
            return await getAllLiveStreams(input.limit);
        }),

    getStream: publicProcedure
        .input(z.object({ streamId: z.number() }))
        .query(async ({ input }) => {
            const stream = await getLiveStreamById(input.streamId);
            if (!stream) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Stream not found' });
            }

            // Get Playback URL if live
            const playbackUrl = await liveStreamService.getPlaybackUrl(input.streamId);

            // Get Products
            const products = await getStreamProducts(input.streamId);

            return {
                ...stream,
                playbackUrl,
                products,
            };
        }),

    startStream: protectedProcedure
        .input(z.object({ streamId: z.number() }))
        .mutation(async ({ input, ctx }) => {
            const stream = await getLiveStreamById(input.streamId);
            if (!stream) throw new TRPCError({ code: 'NOT_FOUND', message: 'Stream not found' });
            if (stream.streamerId !== ctx.user.id) {
                throw new TRPCError({ code: 'FORBIDDEN', message: 'You do not own this stream' });
            }

            return await liveStreamService.startBroadcast(input.streamId);
        }),

    endStream: protectedProcedure
        .input(z.object({ streamId: z.number() }))
        .mutation(async ({ input, ctx }) => {
            const stream = await getLiveStreamById(input.streamId);
            if (!stream) throw new TRPCError({ code: 'NOT_FOUND', message: 'Stream not found' });
            if (stream.streamerId !== ctx.user.id) {
                throw new TRPCError({ code: 'FORBIDDEN', message: 'You do not own this stream' });
            }

            return await liveStreamService.stopBroadcast(input.streamId);
        }),

    sendMessage: protectedProcedure
        .input(
            z.object({
                streamId: z.number(),
                message: z.string().min(1),
            })
        )
        .mutation(async ({ input, ctx }) => {
            await saveStreamChatMessage({
                streamId: input.streamId,
                userId: ctx.user.id,
                message: input.message,
            });
            return { success: true };
        }),

    getMessages: publicProcedure
        .input(z.object({ streamId: z.number(), limit: z.number().default(50) }))
        .query(async ({ input }) => {
            return await getStreamMessages(input.streamId, input.limit);
        }),

    pinProduct: protectedProcedure
        .input(z.object({ streamId: z.number(), productId: z.number() }))
        .mutation(async ({ input, ctx }) => {
            const stream = await getLiveStreamById(input.streamId);
            if (!stream) throw new TRPCError({ code: 'NOT_FOUND', message: 'Stream not found' });
            if (stream.streamerId !== ctx.user.id) {
                throw new TRPCError({ code: 'FORBIDDEN', message: 'You do not own this stream' });
            }

            await liveStreamService.pinProduct(input.streamId, input.productId);
            return { success: true };
        })
});
