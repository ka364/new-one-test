/**
 * Referral Routes
 */

import { Router } from 'express';
import { nanoid } from 'nanoid';
import { Referral, CreateReferralInput } from '../models/community.model';

export const referralRoutes = Router();

// In-memory store
const referrals = new Map<string, Referral>();
const referralCodes = new Map<string, string>(); // code -> referrerId

// Generate unique referral code
const generateCode = (name: string): string => {
  const prefix = name.substring(0, 3).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}${random}`;
};

// GET /api/referrals - List referrals
referralRoutes.get('/', (req, res) => {
  const { referrerId, status, page = 1, limit = 20 } = req.query;

  let referralList = Array.from(referrals.values());

  if (referrerId) {
    referralList = referralList.filter(r => r.referrerId === referrerId);
  }
  if (status) {
    referralList = referralList.filter(r => r.status === status);
  }

  // Sort by creation date
  referralList.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const start = (Number(page) - 1) * Number(limit);
  const paginated = referralList.slice(start, start + Number(limit));

  res.json({
    referrals: paginated,
    total: referralList.length,
    page: Number(page)
  });
});

// GET /api/referrals/stats/:userId - Get referral stats
referralRoutes.get('/stats/:userId', (req, res) => {
  const userReferrals = Array.from(referrals.values()).filter(r => r.referrerId === req.params.userId);

  const stats = {
    totalReferrals: userReferrals.length,
    pending: userReferrals.filter(r => r.status === 'pending').length,
    registered: userReferrals.filter(r => r.status === 'registered').length,
    qualified: userReferrals.filter(r => r.status === 'qualified').length,
    rewarded: userReferrals.filter(r => r.status === 'rewarded').length,
    totalEarned: userReferrals
      .filter(r => r.status === 'rewarded')
      .reduce((sum, r) => sum + r.referrerReward, 0)
  };

  res.json(stats);
});

// GET /api/referrals/code/:userId - Get or create referral code
referralRoutes.get('/code/:userId', (req, res) => {
  const { userId } = req.params;
  const { userName } = req.query;

  // Check if user already has a code
  let existingCode: string | undefined;
  for (const [code, rId] of referralCodes.entries()) {
    if (rId === userId) {
      existingCode = code;
      break;
    }
  }

  if (existingCode) {
    res.json({
      code: existingCode,
      shareUrl: `https://haderos.com/join?ref=${existingCode}`,
      whatsappUrl: `https://wa.me/?text=${encodeURIComponent(`انضم لهاديروس واحصل على خصم! استخدم كود: ${existingCode}\nhttps://haderos.com/join?ref=${existingCode}`)}`
    });
  } else {
    // Generate new code
    const code = generateCode(userName as string || 'HAD');
    referralCodes.set(code, userId);

    res.json({
      code,
      shareUrl: `https://haderos.com/join?ref=${code}`,
      whatsappUrl: `https://wa.me/?text=${encodeURIComponent(`انضم لهاديروس واحصل على خصم! استخدم كود: ${code}\nhttps://haderos.com/join?ref=${code}`)}`
    });
  }
});

// POST /api/referrals - Create referral (when user shares)
referralRoutes.post('/', (req, res) => {
  try {
    const input = CreateReferralInput.parse(req.body);

    // Get or create referral code
    let code: string | undefined;
    for (const [c, rId] of referralCodes.entries()) {
      if (rId === input.referrerId) {
        code = c;
        break;
      }
    }

    if (!code) {
      code = generateCode(input.referrerName);
      referralCodes.set(code, input.referrerId);
    }

    const referral: Referral = {
      id: nanoid(),
      ...input,
      referralCode: code,
      status: 'pending',
      referrerReward: 50, // Default rewards
      referredReward: 25,
      rewardType: 'points',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    };

    referrals.set(referral.id, referral);

    console.log('Event: referral.created', { referralId: referral.id, code });

    res.status(201).json({ referral });
  } catch (error: any) {
    res.status(400).json({ error: error.message, code: 'VALIDATION_ERROR' });
  }
});

// POST /api/referrals/apply - Apply referral code (when new user signs up)
referralRoutes.post('/apply', (req, res) => {
  const { code, userId, userName, userPhone } = req.body;

  const referrerId = referralCodes.get(code.toUpperCase());
  if (!referrerId) {
    return res.status(404).json({ error: 'Invalid referral code', code: 'INVALID_CODE' });
  }

  // Check if user already used a referral
  const existingReferral = Array.from(referrals.values()).find(r => r.referredId === userId);
  if (existingReferral) {
    return res.status(409).json({ error: 'Already used a referral', code: 'ALREADY_REFERRED' });
  }

  // Find pending referral or create new one
  let referral = Array.from(referrals.values()).find(
    r => r.referralCode === code.toUpperCase() && r.status === 'pending' && !r.referredId
  );

  if (referral) {
    referral.referredId = userId;
    referral.referredName = userName;
    referral.referredPhone = userPhone;
    referral.status = 'registered';
    referrals.set(referral.id, referral);
  } else {
    // Create new referral record
    referral = {
      id: nanoid(),
      referrerId,
      referrerName: '', // Will be filled later
      referralCode: code.toUpperCase(),
      referredId: userId,
      referredName: userName,
      referredPhone: userPhone,
      status: 'registered',
      referrerReward: 50,
      referredReward: 25,
      rewardType: 'points',
      createdAt: new Date()
    };
    referrals.set(referral.id, referral);
  }

  console.log('Event: referral.applied', { referralId: referral.id, referredId: userId });

  res.json({
    success: true,
    referral,
    reward: {
      type: referral.rewardType,
      amount: referral.referredReward
    }
  });
});

// POST /api/referrals/:id/qualify - Mark referral as qualified
referralRoutes.post('/:id/qualify', (req, res) => {
  const referral = referrals.get(req.params.id);

  if (!referral) {
    return res.status(404).json({ error: 'Referral not found', code: 'NOT_FOUND' });
  }

  if (referral.status !== 'registered') {
    return res.status(400).json({ error: 'Referral not in registered status', code: 'INVALID_STATUS' });
  }

  referral.status = 'qualified';
  referral.qualifiedAt = new Date();
  referrals.set(referral.id, referral);

  console.log('Event: referral.qualified', { referralId: referral.id });

  res.json({ referral });
});

// POST /api/referrals/:id/reward - Process rewards
referralRoutes.post('/:id/reward', (req, res) => {
  const referral = referrals.get(req.params.id);

  if (!referral) {
    return res.status(404).json({ error: 'Referral not found', code: 'NOT_FOUND' });
  }

  if (referral.status !== 'qualified') {
    return res.status(400).json({ error: 'Referral not qualified', code: 'NOT_QUALIFIED' });
  }

  referral.status = 'rewarded';
  referral.rewardedAt = new Date();
  referrals.set(referral.id, referral);

  console.log('Event: referral.rewarded', {
    referralId: referral.id,
    referrerReward: referral.referrerReward,
    referredReward: referral.referredReward
  });

  // In production, this would trigger actual reward distribution

  res.json({
    referral,
    message: 'Rewards processed successfully'
  });
});

// GET /api/referrals/leaderboard - Get referral leaderboard
referralRoutes.get('/leaderboard/top', (req, res) => {
  const { limit = 10 } = req.query;

  // Group referrals by referrer
  const referrerStats = new Map<string, { count: number; earned: number; name: string }>();

  for (const referral of referrals.values()) {
    const stats = referrerStats.get(referral.referrerId) || { count: 0, earned: 0, name: referral.referrerName };
    stats.count++;
    if (referral.status === 'rewarded') {
      stats.earned += referral.referrerReward;
    }
    referrerStats.set(referral.referrerId, stats);
  }

  // Convert to array and sort
  const leaderboard = Array.from(referrerStats.entries())
    .map(([userId, stats]) => ({
      userId,
      name: stats.name,
      referralCount: stats.count,
      totalEarned: stats.earned
    }))
    .sort((a, b) => b.referralCount - a.referralCount)
    .slice(0, Number(limit));

  res.json({ leaderboard });
});
