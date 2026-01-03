/**
 * Loyalty Routes - Points & Rewards
 */

import { Router } from 'express';
import { nanoid } from 'nanoid';
import { Loyalty } from '../models/community.model';

export const loyaltyRoutes = Router();

// In-memory store
const loyaltyAccounts = new Map<string, Loyalty>();

// Tier thresholds
const TIER_THRESHOLDS = {
  bronze: 0,
  silver: 500,
  gold: 2000,
  platinum: 5000
};

// Points earning rates
const EARNING_RATES = {
  purchase: 1, // 1 point per EGP spent
  review: 50,
  referral: 100,
  groupBuy: 25
};

// Calculate tier based on lifetime points
const calculateTier = (lifetimePoints: number): 'bronze' | 'silver' | 'gold' | 'platinum' => {
  if (lifetimePoints >= TIER_THRESHOLDS.platinum) return 'platinum';
  if (lifetimePoints >= TIER_THRESHOLDS.gold) return 'gold';
  if (lifetimePoints >= TIER_THRESHOLDS.silver) return 'silver';
  return 'bronze';
};

// GET /api/loyalty/:userId - Get user's loyalty account
loyaltyRoutes.get('/:userId', (req, res) => {
  let account = loyaltyAccounts.get(req.params.userId);

  if (!account) {
    // Create new account
    account = {
      userId: req.params.userId,
      totalPoints: 0,
      availablePoints: 0,
      lifetimePoints: 0,
      tier: 'bronze',
      transactions: [],
      updatedAt: new Date()
    };
    loyaltyAccounts.set(req.params.userId, account);
  }

  const nextTier = account.tier === 'platinum' ? null : {
    tier: account.tier === 'bronze' ? 'silver' : account.tier === 'silver' ? 'gold' : 'platinum',
    pointsNeeded: account.tier === 'bronze'
      ? TIER_THRESHOLDS.silver - account.lifetimePoints
      : account.tier === 'silver'
        ? TIER_THRESHOLDS.gold - account.lifetimePoints
        : TIER_THRESHOLDS.platinum - account.lifetimePoints
  };

  res.json({
    account,
    nextTier,
    tierBenefits: getTierBenefits(account.tier)
  });
});

// Helper: Get tier benefits
const getTierBenefits = (tier: string) => {
  const benefits = {
    bronze: {
      pointsMultiplier: 1,
      freeDelivery: false,
      prioritySupport: false,
      exclusiveDeals: false
    },
    silver: {
      pointsMultiplier: 1.25,
      freeDelivery: false,
      prioritySupport: false,
      exclusiveDeals: true
    },
    gold: {
      pointsMultiplier: 1.5,
      freeDelivery: true,
      prioritySupport: true,
      exclusiveDeals: true
    },
    platinum: {
      pointsMultiplier: 2,
      freeDelivery: true,
      prioritySupport: true,
      exclusiveDeals: true
    }
  };
  return benefits[tier as keyof typeof benefits] || benefits.bronze;
};

// POST /api/loyalty/:userId/earn - Earn points
loyaltyRoutes.post('/:userId/earn', (req, res) => {
  const { type, amount, orderId, description } = req.body;

  let account = loyaltyAccounts.get(req.params.userId);

  if (!account) {
    account = {
      userId: req.params.userId,
      totalPoints: 0,
      availablePoints: 0,
      lifetimePoints: 0,
      tier: 'bronze',
      transactions: [],
      updatedAt: new Date()
    };
  }

  // Calculate points based on type
  let pointsEarned = 0;
  switch (type) {
    case 'purchase':
      pointsEarned = Math.floor(amount * EARNING_RATES.purchase);
      break;
    case 'review':
      pointsEarned = EARNING_RATES.review;
      break;
    case 'referral':
      pointsEarned = EARNING_RATES.referral;
      break;
    case 'groupBuy':
      pointsEarned = EARNING_RATES.groupBuy;
      break;
    case 'bonus':
      pointsEarned = amount;
      break;
    default:
      pointsEarned = amount || 0;
  }

  // Apply tier multiplier
  const benefits = getTierBenefits(account.tier);
  pointsEarned = Math.floor(pointsEarned * benefits.pointsMultiplier);

  // Update account
  account.totalPoints += pointsEarned;
  account.availablePoints += pointsEarned;
  account.lifetimePoints += pointsEarned;
  account.tier = calculateTier(account.lifetimePoints);
  account.updatedAt = new Date();

  // Add transaction
  account.transactions.push({
    id: nanoid(),
    type: 'earn',
    points: pointsEarned,
    description: description || `Earned from ${type}`,
    orderId,
    createdAt: new Date()
  });

  loyaltyAccounts.set(req.params.userId, account);

  console.log('Event: points.earned', { userId: req.params.userId, points: pointsEarned, type });

  res.json({
    pointsEarned,
    totalPoints: account.totalPoints,
    availablePoints: account.availablePoints,
    tier: account.tier
  });
});

// POST /api/loyalty/:userId/redeem - Redeem points
loyaltyRoutes.post('/:userId/redeem', (req, res) => {
  const { points, description, orderId } = req.body;
  const account = loyaltyAccounts.get(req.params.userId);

  if (!account) {
    return res.status(404).json({ error: 'Loyalty account not found', code: 'NOT_FOUND' });
  }

  if (account.availablePoints < points) {
    return res.status(400).json({
      error: 'Insufficient points',
      code: 'INSUFFICIENT_POINTS',
      available: account.availablePoints,
      requested: points
    });
  }

  // Update account
  account.availablePoints -= points;
  account.totalPoints -= points;
  account.updatedAt = new Date();

  // Add transaction
  account.transactions.push({
    id: nanoid(),
    type: 'redeem',
    points: -points,
    description: description || 'Points redeemed',
    orderId,
    createdAt: new Date()
  });

  loyaltyAccounts.set(req.params.userId, account);

  // Calculate EGP value (10 points = 1 EGP)
  const egpValue = Math.floor(points / 10);

  console.log('Event: points.redeemed', { userId: req.params.userId, points, egpValue });

  res.json({
    pointsRedeemed: points,
    egpValue,
    remainingPoints: account.availablePoints
  });
});

// GET /api/loyalty/:userId/transactions - Get transaction history
loyaltyRoutes.get('/:userId/transactions', (req, res) => {
  const { type, page = 1, limit = 20 } = req.query;
  const account = loyaltyAccounts.get(req.params.userId);

  if (!account) {
    return res.status(404).json({ error: 'Loyalty account not found', code: 'NOT_FOUND' });
  }

  let transactions = [...account.transactions];

  if (type) {
    transactions = transactions.filter(t => t.type === type);
  }

  // Sort by date (newest first)
  transactions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const start = (Number(page) - 1) * Number(limit);
  const paginated = transactions.slice(start, start + Number(limit));

  res.json({
    transactions: paginated,
    total: transactions.length,
    page: Number(page)
  });
});

// GET /api/loyalty/rewards - Get available rewards
loyaltyRoutes.get('/rewards/catalog', (req, res) => {
  const rewards = [
    {
      id: 'reward_1',
      name: 'خصم 10 جنيه',
      nameEn: '10 EGP Discount',
      pointsCost: 100,
      type: 'discount',
      value: 10
    },
    {
      id: 'reward_2',
      name: 'خصم 25 جنيه',
      nameEn: '25 EGP Discount',
      pointsCost: 200,
      type: 'discount',
      value: 25
    },
    {
      id: 'reward_3',
      name: 'توصيل مجاني',
      nameEn: 'Free Delivery',
      pointsCost: 150,
      type: 'free_delivery',
      value: 1
    },
    {
      id: 'reward_4',
      name: 'خصم 50 جنيه',
      nameEn: '50 EGP Discount',
      pointsCost: 400,
      type: 'discount',
      value: 50
    },
    {
      id: 'reward_5',
      name: 'خصم 100 جنيه',
      nameEn: '100 EGP Discount',
      pointsCost: 750,
      type: 'discount',
      value: 100
    }
  ];

  res.json({ rewards });
});

// POST /api/loyalty/:userId/claim - Claim a reward
loyaltyRoutes.post('/:userId/claim', (req, res) => {
  const { rewardId, pointsCost } = req.body;
  const account = loyaltyAccounts.get(req.params.userId);

  if (!account) {
    return res.status(404).json({ error: 'Loyalty account not found', code: 'NOT_FOUND' });
  }

  if (account.availablePoints < pointsCost) {
    return res.status(400).json({
      error: 'Insufficient points',
      code: 'INSUFFICIENT_POINTS'
    });
  }

  // Deduct points
  account.availablePoints -= pointsCost;
  account.totalPoints -= pointsCost;
  account.updatedAt = new Date();

  // Add transaction
  const claimId = nanoid();
  account.transactions.push({
    id: nanoid(),
    type: 'redeem',
    points: -pointsCost,
    description: `Claimed reward: ${rewardId}`,
    createdAt: new Date()
  });

  loyaltyAccounts.set(req.params.userId, account);

  console.log('Event: reward.claimed', { userId: req.params.userId, rewardId, claimId });

  res.json({
    claimId,
    rewardId,
    pointsDeducted: pointsCost,
    remainingPoints: account.availablePoints
  });
});
