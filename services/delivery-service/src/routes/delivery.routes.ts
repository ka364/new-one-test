/**
 * Delivery Routes
 */

import { Router } from 'express';
import { nanoid } from 'nanoid';
import { Delivery, Driver, CreateDeliveryInput, UpdateStatusInput, Location } from '../models/delivery.model';

export const deliveryRoutes = Router();

// In-memory stores
const deliveries = new Map<string, Delivery>();
const drivers = new Map<string, Driver>();

// Helper: Calculate distance between two points (Haversine)
const calculateDistance = (loc1: Location, loc2: Location): number => {
  const R = 6371; // Earth's radius in km
  const dLat = (loc2.lat - loc1.lat) * Math.PI / 180;
  const dLng = (loc2.lng - loc1.lng) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(loc1.lat * Math.PI / 180) * Math.cos(loc2.lat * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Helper: Find best matching driver
const findBestDriver = (delivery: Delivery): Driver | null => {
  const availableDrivers = Array.from(drivers.values())
    .filter(d => d.status === 'available' && d.currentLocation);

  if (availableDrivers.length === 0) return null;

  // Score drivers based on multiple factors
  const scoredDrivers = availableDrivers.map(driver => {
    let score = 0;

    // Distance score (closer is better)
    const distance = calculateDistance(driver.currentLocation!, delivery.pickupLocation);
    score += Math.max(0, 10 - distance); // Max 10 points for being close

    // Rating score
    score += driver.rating * 2; // Max 10 points

    // Completion rate score
    score += driver.completionRate / 10; // Max 10 points

    // Vehicle type bonus for heavy packages
    if (delivery.packageWeight && delivery.packageWeight > 10) {
      if (driver.vehicleType === 'van' || driver.vehicleType === 'truck') {
        score += 5;
      }
    }

    // Zone preference bonus
    const zone = delivery.deliveryLocation.district || delivery.deliveryLocation.city;
    if (zone && driver.preferredZones.includes(zone)) {
      score += 3;
    }

    return { driver, score, distance };
  });

  // Sort by score (highest first)
  scoredDrivers.sort((a, b) => b.score - a.score);

  return scoredDrivers[0]?.driver || null;
};

// GET /api/deliveries - List deliveries
deliveryRoutes.get('/', (req, res) => {
  const { status, driverId, customerId, date, page = 1, limit = 20 } = req.query;

  let deliveryList = Array.from(deliveries.values());

  if (status) {
    deliveryList = deliveryList.filter(d => d.status === status);
  }
  if (driverId) {
    deliveryList = deliveryList.filter(d => d.driverId === driverId);
  }
  if (customerId) {
    deliveryList = deliveryList.filter(d => d.customerId === customerId);
  }
  if (date) {
    const targetDate = new Date(date as string).toDateString();
    deliveryList = deliveryList.filter(d =>
      d.scheduledDelivery && new Date(d.scheduledDelivery).toDateString() === targetDate
    );
  }

  // Sort by created date (newest first)
  deliveryList.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const start = (Number(page) - 1) * Number(limit);
  const paginated = deliveryList.slice(start, start + Number(limit));

  res.json({
    deliveries: paginated,
    total: deliveryList.length,
    page: Number(page)
  });
});

// GET /api/deliveries/:id - Get delivery details
deliveryRoutes.get('/:id', (req, res) => {
  const delivery = deliveries.get(req.params.id);
  if (!delivery) {
    return res.status(404).json({ error: 'Delivery not found', code: 'NOT_FOUND' });
  }
  res.json({ delivery });
});

// GET /api/deliveries/:id/track - Track delivery in real-time
deliveryRoutes.get('/:id/track', (req, res) => {
  const delivery = deliveries.get(req.params.id);
  if (!delivery) {
    return res.status(404).json({ error: 'Delivery not found', code: 'NOT_FOUND' });
  }

  const driver = delivery.driverId ? drivers.get(delivery.driverId) : null;

  res.json({
    deliveryId: delivery.id,
    status: delivery.status,
    currentLocation: driver?.currentLocation || delivery.currentLocation,
    estimatedArrival: delivery.estimatedArrival,
    driver: driver ? {
      id: driver.id,
      name: driver.name,
      phone: driver.phone,
      vehicleType: driver.vehicleType,
      rating: driver.rating
    } : null,
    trackingHistory: delivery.trackingHistory
  });
});

// POST /api/deliveries - Create new delivery
deliveryRoutes.post('/', (req, res) => {
  try {
    const input = CreateDeliveryInput.parse(req.body);

    const delivery: Delivery = {
      id: nanoid(),
      ...input,
      scheduledPickup: input.scheduledPickup ? new Date(input.scheduledPickup) : undefined,
      scheduledDelivery: input.scheduledDelivery ? new Date(input.scheduledDelivery) : undefined,
      deliveryFee: input.deliveryFee || 0,
      codAmount: input.codAmount || 0,
      status: 'pending',
      isPaid: false,
      trackingHistory: [{
        status: 'pending',
        timestamp: new Date(),
        notes: 'Delivery created'
      }],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    deliveries.set(delivery.id, delivery);

    console.log('Event: delivery.created', { deliveryId: delivery.id, orderId: delivery.orderId });

    res.status(201).json({ delivery });
  } catch (error: any) {
    res.status(400).json({ error: error.message, code: 'VALIDATION_ERROR' });
  }
});

// POST /api/deliveries/:id/assign - Assign driver (manual or auto)
deliveryRoutes.post('/:id/assign', (req, res) => {
  const { driverId, auto } = req.body;
  const delivery = deliveries.get(req.params.id);

  if (!delivery) {
    return res.status(404).json({ error: 'Delivery not found', code: 'NOT_FOUND' });
  }

  if (delivery.status !== 'pending') {
    return res.status(400).json({ error: 'Delivery already assigned', code: 'ALREADY_ASSIGNED' });
  }

  let driver: Driver | null = null;

  if (auto) {
    // Smart matching
    driver = findBestDriver(delivery);
    if (!driver) {
      return res.status(400).json({ error: 'No available drivers found', code: 'NO_DRIVERS' });
    }
  } else if (driverId) {
    driver = drivers.get(driverId) || null;
    if (!driver) {
      return res.status(404).json({ error: 'Driver not found', code: 'DRIVER_NOT_FOUND' });
    }
    if (driver.status !== 'available') {
      return res.status(400).json({ error: 'Driver is not available', code: 'DRIVER_BUSY' });
    }
  } else {
    return res.status(400).json({ error: 'Provide driverId or set auto=true', code: 'INVALID_REQUEST' });
  }

  // Assign driver
  delivery.driverId = driver.id;
  delivery.driverName = driver.name;
  delivery.status = 'assigned';
  delivery.updatedAt = new Date();
  delivery.trackingHistory.push({
    status: 'assigned',
    timestamp: new Date(),
    notes: `Assigned to ${driver.name}`
  });

  // Update driver status
  driver.status = 'busy';
  driver.updatedAt = new Date();
  drivers.set(driver.id, driver);
  deliveries.set(delivery.id, delivery);

  console.log('Event: delivery.assigned', { deliveryId: delivery.id, driverId: driver.id });

  res.json({ delivery, driver: { id: driver.id, name: driver.name } });
});

// PUT /api/deliveries/:id/status - Update delivery status
deliveryRoutes.put('/:id/status', (req, res) => {
  try {
    const input = UpdateStatusInput.parse(req.body);
    const delivery = deliveries.get(req.params.id);

    if (!delivery) {
      return res.status(404).json({ error: 'Delivery not found', code: 'NOT_FOUND' });
    }

    const previousStatus = delivery.status;
    delivery.status = input.status;
    delivery.updatedAt = new Date();

    if (input.location) {
      delivery.currentLocation = input.location;
    }

    // Update timestamps based on status
    switch (input.status) {
      case 'picked_up':
        delivery.actualPickup = new Date();
        break;
      case 'delivered':
        delivery.actualDelivery = new Date();
        // Free up driver
        if (delivery.driverId) {
          const driver = drivers.get(delivery.driverId);
          if (driver) {
            driver.status = 'available';
            driver.totalDeliveries++;
            driver.updatedAt = new Date();
            drivers.set(driver.id, driver);
          }
        }
        break;
      case 'failed':
      case 'cancelled':
        // Free up driver
        if (delivery.driverId) {
          const driver = drivers.get(delivery.driverId);
          if (driver) {
            driver.status = 'available';
            driver.updatedAt = new Date();
            drivers.set(driver.id, driver);
          }
        }
        break;
    }

    delivery.trackingHistory.push({
      status: input.status,
      location: input.location,
      timestamp: new Date(),
      notes: input.notes
    });

    deliveries.set(delivery.id, delivery);

    console.log('Event: delivery.status_changed', {
      deliveryId: delivery.id,
      from: previousStatus,
      to: input.status
    });

    res.json({ delivery });
  } catch (error: any) {
    res.status(400).json({ error: error.message, code: 'VALIDATION_ERROR' });
  }
});

// PUT /api/deliveries/:id/location - Update current location
deliveryRoutes.put('/:id/location', (req, res) => {
  const { lat, lng } = req.body;
  const delivery = deliveries.get(req.params.id);

  if (!delivery) {
    return res.status(404).json({ error: 'Delivery not found', code: 'NOT_FOUND' });
  }

  delivery.currentLocation = { lat, lng };
  delivery.updatedAt = new Date();

  // Calculate ETA if in transit
  if (delivery.status === 'in_transit') {
    const distance = calculateDistance(
      delivery.currentLocation,
      delivery.deliveryLocation
    );
    // Assume 30 km/h average speed
    const etaMinutes = Math.round((distance / 30) * 60);
    delivery.estimatedArrival = new Date(Date.now() + etaMinutes * 60 * 1000);
  }

  deliveries.set(delivery.id, delivery);

  res.json({
    success: true,
    location: delivery.currentLocation,
    estimatedArrival: delivery.estimatedArrival
  });
});

// POST /api/deliveries/:id/proof - Submit proof of delivery
deliveryRoutes.post('/:id/proof', (req, res) => {
  const delivery = deliveries.get(req.params.id);

  if (!delivery) {
    return res.status(404).json({ error: 'Delivery not found', code: 'NOT_FOUND' });
  }

  const { signature, photo, notes, receiverName } = req.body;

  delivery.proofOfDelivery = {
    signature,
    photo,
    notes,
    receiverName
  };
  delivery.status = 'delivered';
  delivery.actualDelivery = new Date();
  delivery.updatedAt = new Date();

  delivery.trackingHistory.push({
    status: 'delivered',
    timestamp: new Date(),
    notes: `Delivered to ${receiverName || 'recipient'}`
  });

  deliveries.set(delivery.id, delivery);

  // Free up driver
  if (delivery.driverId) {
    const driver = drivers.get(delivery.driverId);
    if (driver) {
      driver.status = 'available';
      driver.totalDeliveries++;
      driver.updatedAt = new Date();
      drivers.set(driver.id, driver);
    }
  }

  console.log('Event: delivery.completed', { deliveryId: delivery.id });

  res.json({ delivery });
});

// GET /api/deliveries/stats/overview - Get delivery statistics
deliveryRoutes.get('/stats/overview', (req, res) => {
  const allDeliveries = Array.from(deliveries.values());
  const today = new Date().toDateString();

  const stats = {
    total: allDeliveries.length,
    pending: allDeliveries.filter(d => d.status === 'pending').length,
    inProgress: allDeliveries.filter(d =>
      ['assigned', 'picked_up', 'in_transit', 'arrived'].includes(d.status)
    ).length,
    completed: allDeliveries.filter(d => d.status === 'delivered').length,
    failed: allDeliveries.filter(d => d.status === 'failed').length,
    todayDeliveries: allDeliveries.filter(d =>
      d.createdAt.toDateString() === today
    ).length,
    avgDeliveryTime: 0 // Calculate if needed
  };

  // Calculate average delivery time
  const completedWithTimes = allDeliveries.filter(d =>
    d.status === 'delivered' && d.actualPickup && d.actualDelivery
  );
  if (completedWithTimes.length > 0) {
    const totalTime = completedWithTimes.reduce((sum, d) =>
      sum + (d.actualDelivery!.getTime() - d.actualPickup!.getTime()), 0
    );
    stats.avgDeliveryTime = Math.round(totalTime / completedWithTimes.length / 60000); // minutes
  }

  res.json(stats);
});
