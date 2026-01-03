/**
 * Group Deal Model
 * Based on PRD specifications for Group Buying feature
 */

import { z } from 'zod';

export const DealStatus = z.enum([
  'draft',
  'active',
  'pending_closure',
  'successful',
  'failed',
  'cancelled'
]);

// Dynamic pricing tier
export const PricingTierSchema = z.object({
  minParticipants: z.number().int().positive(),
  maxParticipants: z.number().int().positive().optional(),
  price: z.number().positive(),
  discountPercentage: z.number().min(0).max(100)
});

export const GroupDealSchema = z.object({
  id: z.string(),

  // Product info
  productId: z.string(),
  productName: z.string(),
  productNameAr: z.string().optional(),
  productImage: z.string().optional(),
  originalPrice: z.number().positive(),

  // Dynamic pricing tiers
  pricingTiers: z.array(PricingTierSchema),
  currentPrice: z.number().positive(),
  currentTier: z.number().int().min(0),

  // Participants
  minParticipants: z.number().int().positive(),
  maxParticipants: z.number().int().positive(),
  currentParticipants: z.number().int().min(0).default(0),

  // Timing
  startDate: z.date(),
  endDate: z.date(),
  closureDate: z.date().optional(),

  // Settings
  autoClose: z.boolean().default(true),
  allowOverSubscription: z.boolean().default(false),

  // Merchant
  merchantId: z.string(),
  merchantName: z.string(),

  // Status
  status: DealStatus.default('draft'),

  // Sharing
  shareUrl: z.string().optional(),
  whatsappShareText: z.string().optional(),

  // Statistics
  viewCount: z.number().int().min(0).default(0),
  shareCount: z.number().int().min(0).default(0),

  // Timestamps
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date())
});

export type GroupDeal = z.infer<typeof GroupDealSchema>;
export type PricingTier = z.infer<typeof PricingTierSchema>;

// Participant schema
export const ParticipantSchema = z.object({
  id: z.string(),
  dealId: z.string(),
  userId: z.string(),
  userName: z.string(),
  userPhone: z.string(),
  quantity: z.number().int().positive().default(1),
  priceAtJoin: z.number().positive(),
  finalPrice: z.number().positive().optional(),
  status: z.enum(['pending', 'confirmed', 'paid', 'cancelled', 'refunded']).default('pending'),
  paymentId: z.string().optional(),
  joinedAt: z.date().default(() => new Date()),
  confirmedAt: z.date().optional()
});

export type Participant = z.infer<typeof ParticipantSchema>;

// Input schemas
export const CreateDealInput = z.object({
  productId: z.string(),
  productName: z.string(),
  productNameAr: z.string().optional(),
  productImage: z.string().optional(),
  originalPrice: z.number().positive(),
  pricingTiers: z.array(PricingTierSchema).min(1),
  minParticipants: z.number().int().positive(),
  maxParticipants: z.number().int().positive(),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()),
  merchantId: z.string(),
  merchantName: z.string()
});

export const JoinDealInput = z.object({
  dealId: z.string(),
  userId: z.string(),
  userName: z.string(),
  userPhone: z.string(),
  quantity: z.number().int().positive().default(1)
});
