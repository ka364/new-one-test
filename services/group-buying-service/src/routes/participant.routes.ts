/**
 * Participant Routes
 */

import { Router } from 'express';

export const participantRoutes = Router();

// GET /api/group-buying/participants/:dealId - Get participants for a deal
participantRoutes.get('/:dealId', (req, res) => {
  // TODO: Fetch from store
  res.json({ participants: [], total: 0 });
});

// GET /api/group-buying/participants/user/:userId - Get user's participations
participantRoutes.get('/user/:userId', (req, res) => {
  // TODO: Fetch all deals user has joined
  res.json({ deals: [] });
});
