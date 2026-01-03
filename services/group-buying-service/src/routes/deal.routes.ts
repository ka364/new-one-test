/**
 * Group Deal Routes
 */

import { Router } from 'express';
import { nanoid } from 'nanoid';
import { GroupDeal, Participant, CreateDealInput, JoinDealInput, PricingTier } from '../models/deal.model';

export const dealRoutes = Router();

// In-memory stores
const deals = new Map<string, GroupDeal>();
const participants = new Map<string, Participant[]>();

// Helper: Calculate current price based on participants
const calculateCurrentPrice = (deal: GroupDeal): { price: number; tierIndex: number } => {
  const participantCount = deal.currentParticipants;

  for (let i = deal.pricingTiers.length - 1; i >= 0; i--) {
    const tier = deal.pricingTiers[i];
    if (participantCount >= tier.minParticipants) {
      return { price: tier.price, tierIndex: i };
    }
  }

  return { price: deal.pricingTiers[0].price, tierIndex: 0 };
};

// Helper: Generate WhatsApp share text
const generateWhatsAppText = (deal: GroupDeal): string => {
  const savings = Math.round(((deal.originalPrice - deal.currentPrice) / deal.originalPrice) * 100);
  return `🎉 عرض جماعي مميز!\n\n` +
    `${deal.productNameAr || deal.productName}\n` +
    `💰 السعر الحالي: ${deal.currentPrice} جنيه (وفر ${savings}%)\n` +
    `👥 المشاركين: ${deal.currentParticipants}/${deal.minParticipants}\n` +
    `⏰ ينتهي: ${new Date(deal.endDate).toLocaleDateString('ar-EG')}\n\n` +
    `شارك الآن: ${deal.shareUrl}`;
};

// GET /api/group-deals - List all active deals
dealRoutes.get('/', (req, res) => {
  const { status, merchantId, page = 1, limit = 20 } = req.query;

  let dealList = Array.from(deals.values());

  if (status) {
    dealList = dealList.filter(d => d.status === status);
  }
  if (merchantId) {
    dealList = dealList.filter(d => d.merchantId === merchantId);
  }

  // Sort by end date (soonest first)
  dealList.sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime());

  const start = (Number(page) - 1) * Number(limit);
  const paginated = dealList.slice(start, start + Number(limit));

  res.json({
    deals: paginated,
    total: dealList.length,
    page: Number(page)
  });
});

// GET /api/group-deals/:id - Get deal details
dealRoutes.get('/:id', (req, res) => {
  const deal = deals.get(req.params.id);
  if (!deal) {
    return res.status(404).json({ error: 'Deal not found', code: 'NOT_FOUND' });
  }

  // Increment view count
  deal.viewCount++;
  deals.set(deal.id, deal);

  const dealParticipants = participants.get(deal.id) || [];

  res.json({
    deal,
    participants: dealParticipants.length,
    progress: Math.round((deal.currentParticipants / deal.minParticipants) * 100),
    timeRemaining: new Date(deal.endDate).getTime() - Date.now(),
    nextTier: deal.pricingTiers[deal.currentTier + 1] || null
  });
});

// POST /api/group-deals - Create new deal
dealRoutes.post('/', (req, res) => {
  try {
    const input = CreateDealInput.parse(req.body);

    const dealId = nanoid();
    const shareUrl = `https://haderos.com/deal/${dealId}`;

    const deal: GroupDeal = {
      id: dealId,
      ...input,
      startDate: new Date(input.startDate),
      endDate: new Date(input.endDate),
      currentPrice: input.pricingTiers[0].price,
      currentTier: 0,
      currentParticipants: 0,
      status: 'active',
      autoClose: true,
      allowOverSubscription: false,
      shareUrl,
      whatsappShareText: '',
      viewCount: 0,
      shareCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    deal.whatsappShareText = generateWhatsAppText(deal);

    deals.set(deal.id, deal);
    participants.set(deal.id, []);

    console.log('Event: deal.created', { dealId: deal.id });

    res.status(201).json({ deal });
  } catch (error: any) {
    res.status(400).json({ error: error.message, code: 'VALIDATION_ERROR' });
  }
});

// POST /api/group-deals/:id/join - Join a deal
dealRoutes.post('/:id/join', (req, res) => {
  try {
    const deal = deals.get(req.params.id);
    if (!deal) {
      return res.status(404).json({ error: 'Deal not found', code: 'NOT_FOUND' });
    }

    if (deal.status !== 'active') {
      return res.status(400).json({ error: 'Deal is not active', code: 'DEAL_NOT_ACTIVE' });
    }

    if (new Date() > deal.endDate) {
      return res.status(400).json({ error: 'Deal has expired', code: 'DEAL_EXPIRED' });
    }

    if (!deal.allowOverSubscription && deal.currentParticipants >= deal.maxParticipants) {
      return res.status(400).json({ error: 'Deal is full', code: 'DEAL_FULL' });
    }

    const input = JoinDealInput.parse({ ...req.body, dealId: req.params.id });

    // Check if user already joined
    const dealParticipants = participants.get(deal.id) || [];
    const existing = dealParticipants.find(p => p.userId === input.userId);
    if (existing) {
      return res.status(409).json({ error: 'Already joined this deal', code: 'ALREADY_JOINED' });
    }

    // Create participant
    const participant: Participant = {
      id: nanoid(),
      dealId: deal.id,
      userId: input.userId,
      userName: input.userName,
      userPhone: input.userPhone,
      quantity: input.quantity,
      priceAtJoin: deal.currentPrice,
      status: 'pending',
      joinedAt: new Date()
    };

    dealParticipants.push(participant);
    participants.set(deal.id, dealParticipants);

    // Update deal
    deal.currentParticipants += input.quantity;
    const { price, tierIndex } = calculateCurrentPrice(deal);
    deal.currentPrice = price;
    deal.currentTier = tierIndex;
    deal.whatsappShareText = generateWhatsAppText(deal);
    deal.updatedAt = new Date();
    deals.set(deal.id, deal);

    // Check if deal should close
    if (deal.autoClose && deal.currentParticipants >= deal.minParticipants) {
      console.log('Event: deal.threshold_reached', { dealId: deal.id });
    }

    console.log('Event: participant.joined', { dealId: deal.id, participantId: participant.id });

    res.status(201).json({
      participant,
      deal: {
        currentPrice: deal.currentPrice,
        currentParticipants: deal.currentParticipants,
        progress: Math.round((deal.currentParticipants / deal.minParticipants) * 100)
      }
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message, code: 'VALIDATION_ERROR' });
  }
});

// POST /api/group-deals/:id/leave - Leave a deal
dealRoutes.post('/:id/leave', (req, res) => {
  const { userId } = req.body;
  const deal = deals.get(req.params.id);

  if (!deal) {
    return res.status(404).json({ error: 'Deal not found', code: 'NOT_FOUND' });
  }

  const dealParticipants = participants.get(deal.id) || [];
  const participantIndex = dealParticipants.findIndex(p => p.userId === userId && p.status === 'pending');

  if (participantIndex === -1) {
    return res.status(404).json({ error: 'Participant not found', code: 'NOT_FOUND' });
  }

  const participant = dealParticipants[participantIndex];
  participant.status = 'cancelled';

  // Update deal
  deal.currentParticipants -= participant.quantity;
  const { price, tierIndex } = calculateCurrentPrice(deal);
  deal.currentPrice = price;
  deal.currentTier = tierIndex;
  deal.whatsappShareText = generateWhatsAppText(deal);
  deal.updatedAt = new Date();
  deals.set(deal.id, deal);

  console.log('Event: participant.left', { dealId: deal.id, userId });

  res.json({ success: true, message: 'Left the deal successfully' });
});

// POST /api/group-deals/:id/close - Manually close a deal
dealRoutes.post('/:id/close', (req, res) => {
  const deal = deals.get(req.params.id);

  if (!deal) {
    return res.status(404).json({ error: 'Deal not found', code: 'NOT_FOUND' });
  }

  if (deal.currentParticipants >= deal.minParticipants) {
    deal.status = 'successful';
    deal.closureDate = new Date();

    // Set final price for all participants
    const dealParticipants = participants.get(deal.id) || [];
    dealParticipants.forEach(p => {
      if (p.status === 'pending') {
        p.finalPrice = deal.currentPrice;
        p.status = 'confirmed';
        p.confirmedAt = new Date();
      }
    });
    participants.set(deal.id, dealParticipants);

    console.log('Event: deal.successful', { dealId: deal.id, finalPrice: deal.currentPrice });
  } else {
    deal.status = 'failed';
    deal.closureDate = new Date();

    // Cancel all participants
    const dealParticipants = participants.get(deal.id) || [];
    dealParticipants.forEach(p => {
      if (p.status === 'pending') {
        p.status = 'cancelled';
      }
    });
    participants.set(deal.id, dealParticipants);

    console.log('Event: deal.failed', { dealId: deal.id });
  }

  deal.updatedAt = new Date();
  deals.set(deal.id, deal);

  res.json({ deal });
});

// GET /api/group-deals/:id/share - Get share info
dealRoutes.get('/:id/share', (req, res) => {
  const deal = deals.get(req.params.id);

  if (!deal) {
    return res.status(404).json({ error: 'Deal not found', code: 'NOT_FOUND' });
  }

  // Increment share count
  deal.shareCount++;
  deals.set(deal.id, deal);

  res.json({
    url: deal.shareUrl,
    whatsappText: deal.whatsappShareText,
    whatsappUrl: `https://wa.me/?text=${encodeURIComponent(deal.whatsappShareText || '')}`,
    facebookUrl: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(deal.shareUrl || '')}`,
    twitterUrl: `https://twitter.com/intent/tweet?url=${encodeURIComponent(deal.shareUrl || '')}&text=${encodeURIComponent(deal.productName)}`
  });
});
