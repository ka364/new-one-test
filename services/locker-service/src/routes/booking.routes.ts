/**
 * Booking Routes
 */

import { Router } from 'express';
import { nanoid } from 'nanoid';
import { Booking, CreateBookingInput, Locker } from '../models/locker.model';
import { locations } from './location.routes';
import { lockers } from './locker.routes';

export const bookingRoutes = Router();

// In-memory store
const bookings = new Map<string, Booking>();

// Generate 6-digit access code
const generateAccessCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Calculate price
const calculatePrice = (locker: Locker, startTime: Date, endTime: Date): number => {
  const hours = Math.ceil((endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60));
  const days = Math.ceil(hours / 24);
  return days * locker.pricePerDay;
};

// GET /api/bookings - List bookings
bookingRoutes.get('/', (req, res) => {
  const { userId, locationId, status, page = 1, limit = 20 } = req.query;

  let bookingList = Array.from(bookings.values());

  if (userId) {
    bookingList = bookingList.filter(b => b.userId === userId);
  }
  if (locationId) {
    bookingList = bookingList.filter(b => b.locationId === locationId);
  }
  if (status) {
    bookingList = bookingList.filter(b => b.status === status);
  }

  // Sort by start time (newest first)
  bookingList.sort((a, b) => b.startTime.getTime() - a.startTime.getTime());

  const start = (Number(page) - 1) * Number(limit);
  const paginated = bookingList.slice(start, start + Number(limit));

  res.json({
    bookings: paginated,
    total: bookingList.length,
    page: Number(page)
  });
});

// GET /api/bookings/:id - Get booking details
bookingRoutes.get('/:id', (req, res) => {
  const booking = bookings.get(req.params.id);
  if (!booking) {
    return res.status(404).json({ error: 'Booking not found', code: 'NOT_FOUND' });
  }

  const location = locations.get(booking.locationId);
  const locker = lockers.get(booking.lockerId);

  res.json({
    booking,
    location: location ? {
      id: location.id,
      name: location.name,
      nameAr: location.nameAr,
      address: location.address,
      lat: location.lat,
      lng: location.lng
    } : null,
    locker: locker ? {
      id: locker.id,
      lockerNumber: locker.lockerNumber,
      size: locker.size
    } : null
  });
});

// POST /api/bookings - Create new booking
bookingRoutes.post('/', (req, res) => {
  try {
    const input = CreateBookingInput.parse(req.body);

    const location = locations.get(input.locationId);
    if (!location) {
      return res.status(404).json({ error: 'Location not found', code: 'LOCATION_NOT_FOUND' });
    }

    let locker: Locker | undefined;

    if (input.lockerId) {
      // Specific locker requested
      locker = lockers.get(input.lockerId);
      if (!locker) {
        return res.status(404).json({ error: 'Locker not found', code: 'LOCKER_NOT_FOUND' });
      }
      if (locker.status !== 'available') {
        return res.status(400).json({ error: 'Locker not available', code: 'LOCKER_UNAVAILABLE' });
      }
    } else {
      // Find available locker (optionally by size)
      const availableLockers = Array.from(lockers.values()).filter(l =>
        l.locationId === input.locationId &&
        l.status === 'available' &&
        (!input.size || l.size === input.size)
      );

      if (availableLockers.length === 0) {
        return res.status(400).json({
          error: 'No available lockers',
          code: 'NO_LOCKERS_AVAILABLE'
        });
      }

      // Pick first available
      locker = availableLockers[0];
    }

    const startTime = new Date(input.startTime);
    const endTime = new Date(input.endTime);

    const booking: Booking = {
      id: nanoid(),
      lockerId: locker.id,
      locationId: location.id,
      lockerNumber: locker.lockerNumber,
      userId: input.userId,
      userName: input.userName,
      userPhone: input.userPhone,
      orderId: input.orderId,
      deliveryId: input.deliveryId,
      accessCode: generateAccessCode(),
      status: 'confirmed',
      startTime,
      endTime,
      packageDescription: input.packageDescription,
      totalPrice: calculatePrice(locker, startTime, endTime),
      isPaid: false,
      notificationsSent: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Update locker status
    locker.status = 'reserved';
    locker.currentBookingId = booking.id;
    locker.updatedAt = new Date();
    lockers.set(locker.id, locker);

    // Update location availability
    location.availableLockers--;
    location.updatedAt = new Date();
    locations.set(location.id, location);

    bookings.set(booking.id, booking);

    console.log('Event: booking.created', { bookingId: booking.id, lockerId: locker.id });

    res.status(201).json({
      booking,
      accessCode: booking.accessCode,
      locker: {
        id: locker.id,
        lockerNumber: locker.lockerNumber,
        size: locker.size
      },
      location: {
        name: location.name,
        nameAr: location.nameAr,
        address: location.address
      }
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message, code: 'VALIDATION_ERROR' });
  }
});

// POST /api/bookings/:id/activate - Activate booking (package deposited)
bookingRoutes.post('/:id/activate', (req, res) => {
  const booking = bookings.get(req.params.id);
  if (!booking) {
    return res.status(404).json({ error: 'Booking not found', code: 'NOT_FOUND' });
  }

  if (booking.status !== 'confirmed') {
    return res.status(400).json({ error: 'Booking cannot be activated', code: 'INVALID_STATUS' });
  }

  booking.status = 'active';
  booking.updatedAt = new Date();
  bookings.set(booking.id, booking);

  // Update locker status
  const locker = lockers.get(booking.lockerId);
  if (locker) {
    locker.status = 'occupied';
    locker.updatedAt = new Date();
    lockers.set(locker.id, locker);
  }

  console.log('Event: booking.activated', { bookingId: booking.id });

  res.json({ booking });
});

// POST /api/bookings/:id/complete - Complete booking (package picked up)
bookingRoutes.post('/:id/complete', (req, res) => {
  const booking = bookings.get(req.params.id);
  if (!booking) {
    return res.status(404).json({ error: 'Booking not found', code: 'NOT_FOUND' });
  }

  if (booking.status !== 'active') {
    return res.status(400).json({ error: 'Booking not active', code: 'INVALID_STATUS' });
  }

  booking.status = 'completed';
  booking.actualPickupTime = new Date();
  booking.updatedAt = new Date();
  bookings.set(booking.id, booking);

  // Free up locker
  const locker = lockers.get(booking.lockerId);
  if (locker) {
    locker.status = 'available';
    locker.currentBookingId = undefined;
    locker.updatedAt = new Date();
    lockers.set(locker.id, locker);
  }

  // Update location availability
  const location = locations.get(booking.locationId);
  if (location) {
    location.availableLockers++;
    location.updatedAt = new Date();
    locations.set(location.id, location);
  }

  console.log('Event: booking.completed', { bookingId: booking.id });

  res.json({ booking });
});

// POST /api/bookings/:id/cancel - Cancel booking
bookingRoutes.post('/:id/cancel', (req, res) => {
  const booking = bookings.get(req.params.id);
  if (!booking) {
    return res.status(404).json({ error: 'Booking not found', code: 'NOT_FOUND' });
  }

  if (!['pending', 'confirmed'].includes(booking.status)) {
    return res.status(400).json({ error: 'Booking cannot be cancelled', code: 'INVALID_STATUS' });
  }

  booking.status = 'cancelled';
  booking.updatedAt = new Date();
  bookings.set(booking.id, booking);

  // Free up locker
  const locker = lockers.get(booking.lockerId);
  if (locker) {
    locker.status = 'available';
    locker.currentBookingId = undefined;
    locker.updatedAt = new Date();
    lockers.set(locker.id, locker);
  }

  // Update location availability
  const location = locations.get(booking.locationId);
  if (location) {
    location.availableLockers++;
    location.updatedAt = new Date();
    locations.set(location.id, location);
  }

  console.log('Event: booking.cancelled', { bookingId: booking.id });

  res.json({ booking });
});

// POST /api/bookings/verify - Verify access code
bookingRoutes.post('/verify', (req, res) => {
  const { lockerId, accessCode } = req.body;

  const booking = Array.from(bookings.values()).find(
    b => b.lockerId === lockerId &&
      b.accessCode === accessCode &&
      ['confirmed', 'active'].includes(b.status)
  );

  if (!booking) {
    return res.status(401).json({ error: 'Invalid access code', code: 'INVALID_CODE' });
  }

  // Check if booking is within time window
  const now = new Date();
  if (now < booking.startTime) {
    return res.status(400).json({
      error: 'Booking not yet active',
      code: 'TOO_EARLY',
      startTime: booking.startTime
    });
  }
  if (now > booking.endTime) {
    return res.status(400).json({
      error: 'Booking has expired',
      code: 'EXPIRED',
      endTime: booking.endTime
    });
  }

  console.log('Event: access.verified', { bookingId: booking.id });

  res.json({
    valid: true,
    booking: {
      id: booking.id,
      lockerNumber: booking.lockerNumber,
      status: booking.status
    }
  });
});

// GET /api/bookings/user/:userId/active - Get user's active bookings
bookingRoutes.get('/user/:userId/active', (req, res) => {
  const activeBookings = Array.from(bookings.values()).filter(
    b => b.userId === req.params.userId &&
      ['pending', 'confirmed', 'active'].includes(b.status)
  );

  res.json({
    bookings: activeBookings,
    count: activeBookings.length
  });
});
