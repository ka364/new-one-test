/**
 * Pricing Routes - Dynamic Pricing Engine
 */

import { Router } from 'express';

export const pricingRoutes = Router();

// POST /api/group-buying/pricing/calculate - Calculate price for participants
pricingRoutes.post('/calculate', (req, res) => {
  const { originalPrice, pricingTiers, participantCount } = req.body;

  if (!pricingTiers || !Array.isArray(pricingTiers)) {
    return res.status(400).json({ error: 'Invalid pricing tiers' });
  }

  // Find applicable tier
  let applicableTier = pricingTiers[0];
  for (let i = pricingTiers.length - 1; i >= 0; i--) {
    if (participantCount >= pricingTiers[i].minParticipants) {
      applicableTier = pricingTiers[i];
      break;
    }
  }

  const savings = originalPrice - applicableTier.price;
  const savingsPercentage = Math.round((savings / originalPrice) * 100);

  res.json({
    originalPrice,
    currentPrice: applicableTier.price,
    savings,
    savingsPercentage,
    currentTier: applicableTier,
    participantCount
  });
});

// POST /api/group-buying/pricing/simulate - Simulate pricing for different participant counts
pricingRoutes.post('/simulate', (req, res) => {
  const { originalPrice, pricingTiers } = req.body;

  if (!pricingTiers || !Array.isArray(pricingTiers)) {
    return res.status(400).json({ error: 'Invalid pricing tiers' });
  }

  const simulation = pricingTiers.map((tier: any, index: number) => ({
    tier: index + 1,
    minParticipants: tier.minParticipants,
    maxParticipants: tier.maxParticipants,
    price: tier.price,
    savings: originalPrice - tier.price,
    savingsPercentage: Math.round(((originalPrice - tier.price) / originalPrice) * 100)
  }));

  res.json({ simulation });
});
