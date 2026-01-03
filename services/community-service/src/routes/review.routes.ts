/**
 * Review Routes
 */

import { Router } from 'express';
import { nanoid } from 'nanoid';
import { Review, CreateReviewInput } from '../models/community.model';

export const reviewRoutes = Router();

// In-memory store
const reviews = new Map<string, Review>();
const helpfulVotes = new Map<string, Set<string>>(); // reviewId -> Set of userIds

// GET /api/reviews - List reviews
reviewRoutes.get('/', (req, res) => {
  const { targetType, targetId, userId, rating, sortBy = 'recent', page = 1, limit = 20 } = req.query;

  let reviewList = Array.from(reviews.values()).filter(r => !r.isHidden);

  if (targetType) {
    reviewList = reviewList.filter(r => r.targetType === targetType);
  }
  if (targetId) {
    reviewList = reviewList.filter(r => r.targetId === targetId);
  }
  if (userId) {
    reviewList = reviewList.filter(r => r.userId === userId);
  }
  if (rating) {
    reviewList = reviewList.filter(r => r.rating === Number(rating));
  }

  // Sorting
  switch (sortBy) {
    case 'recent':
      reviewList.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      break;
    case 'helpful':
      reviewList.sort((a, b) => b.helpfulCount - a.helpfulCount);
      break;
    case 'rating_high':
      reviewList.sort((a, b) => b.rating - a.rating);
      break;
    case 'rating_low':
      reviewList.sort((a, b) => a.rating - b.rating);
      break;
  }

  const start = (Number(page) - 1) * Number(limit);
  const paginated = reviewList.slice(start, start + Number(limit));

  // Calculate stats
  const stats = {
    total: reviewList.length,
    average: reviewList.length > 0
      ? Math.round((reviewList.reduce((sum, r) => sum + r.rating, 0) / reviewList.length) * 10) / 10
      : 0,
    distribution: {
      5: reviewList.filter(r => r.rating === 5).length,
      4: reviewList.filter(r => r.rating === 4).length,
      3: reviewList.filter(r => r.rating === 3).length,
      2: reviewList.filter(r => r.rating === 2).length,
      1: reviewList.filter(r => r.rating === 1).length
    }
  };

  res.json({
    reviews: paginated,
    stats,
    page: Number(page),
    totalPages: Math.ceil(reviewList.length / Number(limit))
  });
});

// GET /api/reviews/:id - Get single review
reviewRoutes.get('/:id', (req, res) => {
  const review = reviews.get(req.params.id);
  if (!review || review.isHidden) {
    return res.status(404).json({ error: 'Review not found', code: 'NOT_FOUND' });
  }
  res.json({ review });
});

// POST /api/reviews - Create review
reviewRoutes.post('/', (req, res) => {
  try {
    const input = CreateReviewInput.parse(req.body);

    // Check if user already reviewed this target
    const existingReview = Array.from(reviews.values()).find(
      r => r.userId === input.userId && r.targetId === input.targetId && r.targetType === input.targetType
    );

    if (existingReview) {
      return res.status(409).json({ error: 'Already reviewed', code: 'ALREADY_REVIEWED' });
    }

    const review: Review = {
      id: nanoid(),
      ...input,
      images: input.images || [],
      isVerifiedPurchase: input.isVerifiedPurchase || false,
      helpfulCount: 0,
      reportCount: 0,
      isApproved: true,
      isHidden: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    reviews.set(review.id, review);
    helpfulVotes.set(review.id, new Set());

    console.log('Event: review.created', { reviewId: review.id, targetType: review.targetType });

    res.status(201).json({ review });
  } catch (error: any) {
    res.status(400).json({ error: error.message, code: 'VALIDATION_ERROR' });
  }
});

// PUT /api/reviews/:id - Update review
reviewRoutes.put('/:id', (req, res) => {
  const review = reviews.get(req.params.id);
  if (!review) {
    return res.status(404).json({ error: 'Review not found', code: 'NOT_FOUND' });
  }

  const { userId, rating, title, content, images } = req.body;

  if (review.userId !== userId) {
    return res.status(403).json({ error: 'Not authorized', code: 'FORBIDDEN' });
  }

  if (rating) review.rating = rating;
  if (title !== undefined) review.title = title;
  if (content) review.content = content;
  if (images) review.images = images;
  review.updatedAt = new Date();

  reviews.set(review.id, review);

  res.json({ review });
});

// POST /api/reviews/:id/helpful - Mark review as helpful
reviewRoutes.post('/:id/helpful', (req, res) => {
  const { userId } = req.body;
  const review = reviews.get(req.params.id);

  if (!review) {
    return res.status(404).json({ error: 'Review not found', code: 'NOT_FOUND' });
  }

  const votes = helpfulVotes.get(review.id) || new Set();

  if (votes.has(userId)) {
    // Remove vote
    votes.delete(userId);
    review.helpfulCount--;
  } else {
    // Add vote
    votes.add(userId);
    review.helpfulCount++;
  }

  helpfulVotes.set(review.id, votes);
  reviews.set(review.id, review);

  res.json({ helpfulCount: review.helpfulCount, voted: votes.has(userId) });
});

// POST /api/reviews/:id/report - Report review
reviewRoutes.post('/:id/report', (req, res) => {
  const { userId, reason } = req.body;
  const review = reviews.get(req.params.id);

  if (!review) {
    return res.status(404).json({ error: 'Review not found', code: 'NOT_FOUND' });
  }

  review.reportCount++;
  review.updatedAt = new Date();

  // Auto-hide if too many reports
  if (review.reportCount >= 5) {
    review.isHidden = true;
  }

  reviews.set(review.id, review);

  console.log('Event: review.reported', { reviewId: review.id, userId, reason });

  res.json({ success: true, message: 'Review reported' });
});

// POST /api/reviews/:id/respond - Merchant response
reviewRoutes.post('/:id/respond', (req, res) => {
  const { merchantId, content } = req.body;
  const review = reviews.get(req.params.id);

  if (!review) {
    return res.status(404).json({ error: 'Review not found', code: 'NOT_FOUND' });
  }

  review.merchantResponse = {
    content,
    respondedAt: new Date()
  };
  review.updatedAt = new Date();

  reviews.set(review.id, review);

  console.log('Event: review.responded', { reviewId: review.id, merchantId });

  res.json({ review });
});

// DELETE /api/reviews/:id - Delete review
reviewRoutes.delete('/:id', (req, res) => {
  const { userId } = req.body;
  const review = reviews.get(req.params.id);

  if (!review) {
    return res.status(404).json({ error: 'Review not found', code: 'NOT_FOUND' });
  }

  if (review.userId !== userId) {
    return res.status(403).json({ error: 'Not authorized', code: 'FORBIDDEN' });
  }

  reviews.delete(req.params.id);
  helpfulVotes.delete(req.params.id);

  console.log('Event: review.deleted', { reviewId: req.params.id });

  res.json({ success: true, message: 'Review deleted' });
});
