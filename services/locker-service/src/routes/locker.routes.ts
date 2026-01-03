/**
 * Locker Routes
 */

import { Router } from 'express';
import { nanoid } from 'nanoid';
import { Locker, CreateLockerInput } from '../models/locker.model';
import { locations } from './location.routes';

export const lockerRoutes = Router();

// In-memory store
const lockers = new Map<string, Locker>();

// Initialize default lockers for each location
const initializeLockers = () => {
  const sizes = ['small', 'medium', 'large', 'extra_large'] as const;
  const prices = { small: 10, medium: 15, large: 25, extra_large: 40 };

  setTimeout(() => {
    for (const [locationId, location] of locations.entries()) {
      let lockerCount = 0;
      const targetCount = location.totalLockers;

      // Create lockers of different sizes
      const distribution = {
        small: Math.floor(targetCount * 0.4),
        medium: Math.floor(targetCount * 0.3),
        large: Math.floor(targetCount * 0.2),
        extra_large: Math.floor(targetCount * 0.1)
      };

      for (const size of sizes) {
        for (let i = 0; i < distribution[size]; i++) {
          lockerCount++;
          const section = size === 'small' ? 'A' : size === 'medium' ? 'B' : size === 'large' ? 'C' : 'D';
          const lockerId = nanoid();

          lockers.set(lockerId, {
            id: lockerId,
            locationId,
            lockerNumber: `${section}-${String(lockerCount).padStart(2, '0')}`,
            size,
            status: 'available',
            pricePerDay: prices[size],
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
      }
    }
  }, 100);
};

// Initialize on load
initializeLockers();

// GET /api/lockers - List lockers
lockerRoutes.get('/', (req, res) => {
  const { locationId, size, status, available } = req.query;

  let lockerList = Array.from(lockers.values());

  if (locationId) {
    lockerList = lockerList.filter(l => l.locationId === locationId);
  }
  if (size) {
    lockerList = lockerList.filter(l => l.size === size);
  }
  if (status) {
    lockerList = lockerList.filter(l => l.status === status);
  }
  if (available === 'true') {
    lockerList = lockerList.filter(l => l.status === 'available');
  }

  // Sort by locker number
  lockerList.sort((a, b) => a.lockerNumber.localeCompare(b.lockerNumber));

  // Group by size for summary
  const summary = {
    small: { total: 0, available: 0 },
    medium: { total: 0, available: 0 },
    large: { total: 0, available: 0 },
    extra_large: { total: 0, available: 0 }
  };

  lockerList.forEach(l => {
    summary[l.size as keyof typeof summary].total++;
    if (l.status === 'available') {
      summary[l.size as keyof typeof summary].available++;
    }
  });

  res.json({
    lockers: lockerList,
    total: lockerList.length,
    available: lockerList.filter(l => l.status === 'available').length,
    summary
  });
});

// GET /api/lockers/:id - Get locker details
lockerRoutes.get('/:id', (req, res) => {
  const locker = lockers.get(req.params.id);
  if (!locker) {
    return res.status(404).json({ error: 'Locker not found', code: 'NOT_FOUND' });
  }

  const location = locations.get(locker.locationId);

  res.json({
    locker,
    location: location ? {
      id: location.id,
      name: location.name,
      nameAr: location.nameAr,
      address: location.address
    } : null
  });
});

// POST /api/lockers - Create new locker
lockerRoutes.post('/', (req, res) => {
  try {
    const input = CreateLockerInput.parse(req.body);

    const location = locations.get(input.locationId);
    if (!location) {
      return res.status(404).json({ error: 'Location not found', code: 'LOCATION_NOT_FOUND' });
    }

    const locker: Locker = {
      id: nanoid(),
      ...input,
      status: 'available',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    lockers.set(locker.id, locker);

    // Update location counts
    location.totalLockers++;
    location.availableLockers++;
    location.updatedAt = new Date();
    locations.set(location.id, location);

    console.log('Event: locker.created', { lockerId: locker.id, locationId: location.id });

    res.status(201).json({ locker });
  } catch (error: any) {
    res.status(400).json({ error: error.message, code: 'VALIDATION_ERROR' });
  }
});

// PUT /api/lockers/:id/status - Update locker status
lockerRoutes.put('/:id/status', (req, res) => {
  const { status } = req.body;
  const locker = lockers.get(req.params.id);

  if (!locker) {
    return res.status(404).json({ error: 'Locker not found', code: 'NOT_FOUND' });
  }

  const previousStatus = locker.status;
  locker.status = status;
  locker.updatedAt = new Date();
  lockers.set(locker.id, locker);

  // Update location availability count
  const location = locations.get(locker.locationId);
  if (location) {
    if (previousStatus === 'available' && status !== 'available') {
      location.availableLockers--;
    } else if (previousStatus !== 'available' && status === 'available') {
      location.availableLockers++;
    }
    location.updatedAt = new Date();
    locations.set(location.id, location);
  }

  console.log('Event: locker.status_changed', { lockerId: locker.id, from: previousStatus, to: status });

  res.json({ locker });
});

// PUT /api/lockers/:id - Update locker info
lockerRoutes.put('/:id', (req, res) => {
  const locker = lockers.get(req.params.id);
  if (!locker) {
    return res.status(404).json({ error: 'Locker not found', code: 'NOT_FOUND' });
  }

  const updates = req.body;
  const updatedLocker: Locker = {
    ...locker,
    ...updates,
    id: locker.id,
    locationId: locker.locationId, // Prevent changing location
    updatedAt: new Date()
  };

  lockers.set(locker.id, updatedLocker);

  res.json({ locker: updatedLocker });
});

// DELETE /api/lockers/:id - Remove locker
lockerRoutes.delete('/:id', (req, res) => {
  const locker = lockers.get(req.params.id);
  if (!locker) {
    return res.status(404).json({ error: 'Locker not found', code: 'NOT_FOUND' });
  }

  if (locker.status === 'occupied' || locker.status === 'reserved') {
    return res.status(400).json({ error: 'Cannot delete occupied or reserved locker', code: 'LOCKER_IN_USE' });
  }

  lockers.delete(req.params.id);

  // Update location counts
  const location = locations.get(locker.locationId);
  if (location) {
    location.totalLockers--;
    if (locker.status === 'available') {
      location.availableLockers--;
    }
    location.updatedAt = new Date();
    locations.set(location.id, location);
  }

  console.log('Event: locker.deleted', { lockerId: req.params.id });

  res.json({ success: true, message: 'Locker removed' });
});

// Export lockers map for booking routes
export { lockers };
