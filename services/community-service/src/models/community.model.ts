/**
 * Community Model
 * Social Features, Reviews & Referrals
 */

import { z } from 'zod';

// Review schema
export const ReviewSchema = z.object({
  id: z.string(),

  // Target
  targetType: z.enum(['product', 'merchant', 'driver', 'deal']),
  targetId: z.string(),

  // Author
  userId: z.string(),
  userName: z.string(),
  userAvatar: z.string().optional(),

  // Content
  rating: z.number().min(1).max(5),
  title: z.string().optional(),
  content: z.string(),
  images: z.array(z.string()).default([]),

  // Engagement
  helpfulCount: z.number().int().min(0).default(0),
  reportCount: z.number().int().min(0).default(0),

  // Status
  isVerifiedPurchase: z.boolean().default(false),
  isApproved: z.boolean().default(true),
  isHidden: z.boolean().default(false),

  // Merchant response
  merchantResponse: z.object({
    content: z.string(),
    respondedAt: z.date()
  }).optional(),

  // Timestamps
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date())
});

export type Review = z.infer<typeof ReviewSchema>;

// Referral schema
export const ReferralSchema = z.object({
  id: z.string(),

  // Referrer
  referrerId: z.string(),
  referrerName: z.string(),
  referralCode: z.string(),

  // Referred
  referredId: z.string().optional(),
  referredName: z.string().optional(),
  referredPhone: z.string().optional(),

  // Status
  status: z.enum(['pending', 'registered', 'qualified', 'rewarded', 'expired']).default('pending'),

  // Rewards
  referrerReward: z.number().min(0).default(0),
  referredReward: z.number().min(0).default(0),
  rewardType: z.enum(['cash', 'points', 'discount', 'credit']).default('points'),

  // Qualification
  qualificationCriteria: z.string().optional(),
  qualifiedAt: z.date().optional(),
  rewardedAt: z.date().optional(),

  // Timestamps
  createdAt: z.date().default(() => new Date()),
  expiresAt: z.date().optional()
});

export type Referral = z.infer<typeof ReferralSchema>;

// Community Post schema (for social features)
export const PostSchema = z.object({
  id: z.string(),

  // Author
  userId: z.string(),
  userName: z.string(),
  userAvatar: z.string().optional(),

  // Content
  type: z.enum(['text', 'image', 'deal_share', 'product_share', 'review']),
  content: z.string(),
  images: z.array(z.string()).default([]),

  // Links
  linkedProductId: z.string().optional(),
  linkedDealId: z.string().optional(),
  linkedReviewId: z.string().optional(),

  // Engagement
  likeCount: z.number().int().min(0).default(0),
  commentCount: z.number().int().min(0).default(0),
  shareCount: z.number().int().min(0).default(0),

  // Status
  isPublic: z.boolean().default(true),
  isPinned: z.boolean().default(false),
  isHidden: z.boolean().default(false),

  // Timestamps
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date())
});

export type Post = z.infer<typeof PostSchema>;

// Comment schema
export const CommentSchema = z.object({
  id: z.string(),
  postId: z.string(),

  // Author
  userId: z.string(),
  userName: z.string(),
  userAvatar: z.string().optional(),

  // Content
  content: z.string(),

  // Parent comment (for replies)
  parentId: z.string().optional(),

  // Engagement
  likeCount: z.number().int().min(0).default(0),

  // Status
  isHidden: z.boolean().default(false),

  // Timestamps
  createdAt: z.date().default(() => new Date())
});

export type Comment = z.infer<typeof CommentSchema>;

// Loyalty Points schema
export const LoyaltySchema = z.object({
  userId: z.string(),
  totalPoints: z.number().int().min(0).default(0),
  availablePoints: z.number().int().min(0).default(0),
  lifetimePoints: z.number().int().min(0).default(0),
  tier: z.enum(['bronze', 'silver', 'gold', 'platinum']).default('bronze'),
  transactions: z.array(z.object({
    id: z.string(),
    type: z.enum(['earn', 'redeem', 'expire', 'bonus']),
    points: z.number().int(),
    description: z.string(),
    orderId: z.string().optional(),
    createdAt: z.date()
  })).default([]),
  updatedAt: z.date().default(() => new Date())
});

export type Loyalty = z.infer<typeof LoyaltySchema>;

// Input schemas
export const CreateReviewInput = z.object({
  targetType: z.enum(['product', 'merchant', 'driver', 'deal']),
  targetId: z.string(),
  userId: z.string(),
  userName: z.string(),
  rating: z.number().min(1).max(5),
  title: z.string().optional(),
  content: z.string(),
  images: z.array(z.string()).optional(),
  isVerifiedPurchase: z.boolean().optional()
});

export const CreatePostInput = z.object({
  userId: z.string(),
  userName: z.string(),
  type: z.enum(['text', 'image', 'deal_share', 'product_share', 'review']),
  content: z.string(),
  images: z.array(z.string()).optional(),
  linkedProductId: z.string().optional(),
  linkedDealId: z.string().optional()
});

export const CreateReferralInput = z.object({
  referrerId: z.string(),
  referrerName: z.string(),
  referredPhone: z.string().optional()
});
