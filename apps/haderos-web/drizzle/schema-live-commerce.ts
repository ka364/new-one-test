
import { pgTable, text, timestamp, integer, boolean, jsonb, serial, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users, products } from './schema';

// Enums
export const streamStatusEnum = pgEnum('stream_status', ['scheduled', 'live', 'ended', 'cancelled']);

// Live Streams Table
export const liveStreams = pgTable('live_streams', {
    id: serial('id').primaryKey(),
    title: text('title').notNull(),
    description: text('description'),
    streamerId: integer('streamer_id').references(() => users.id).notNull(),
    thumbnailUrl: text('thumbnail_url'),

    // Mux / Video Provider Details
    playbackId: text('playback_id'),
    streamKey: text('stream_key'),
    externalStreamId: text('external_stream_id'),

    status: streamStatusEnum('status').default('scheduled').notNull(),

    scheduledAt: timestamp('scheduled_at'),
    startedAt: timestamp('started_at'),
    endedAt: timestamp('ended_at'),

    viewerCount: integer('viewer_count').default(0),
    likeCount: integer('like_count').default(0),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Products linked to a stream
export const streamProducts = pgTable('stream_products', {
    id: serial('id').primaryKey(),
    streamId: integer('stream_id').references(() => liveStreams.id).notNull(),
    productId: integer('product_id').references(() => products.id).notNull(),
    isPinned: boolean('is_pinned').default(false),
    pinnedAt: timestamp('pinned_at'),
    orderIndex: integer('order_index').default(0),
});

// Chat Messages
export const streamCHATMessages = pgTable('stream_chat_messages', {
    id: serial('id').primaryKey(),
    streamId: integer('stream_id').references(() => liveStreams.id).notNull(),
    userId: integer('user_id').references(() => users.id).notNull(),
    message: text('message').notNull(),
    timestamp: timestamp('timestamp').defaultNow().notNull(),
});

// Relations
export const liveStreamsRelations = relations(liveStreams, ({ one, many }) => ({
    streamer: one(users, {
        fields: [liveStreams.streamerId],
        references: [users.id],
    }),
    products: many(streamProducts),
    messages: many(streamCHATMessages),
}));

export const streamProductsRelations = relations(streamProducts, ({ one }) => ({
    stream: one(liveStreams, {
        fields: [streamProducts.streamId],
        references: [liveStreams.id],
    }),
    product: one(products, {
        fields: [streamProducts.productId],
        references: [products.id],
    }),
}));
