/**
 * Driver Routes
 */

import { Router } from 'express';
import { nanoid } from 'nanoid';
import { Driver, CreateDriverInput, UpdateLocationInput } from '../models/delivery.model';

export const driverRoutes = Router();

// In-memory store
const drivers = new Map<string, Driver>();

// GET /api/drivers - List all drivers
driverRoutes.get('/', (req, res) => {
  const { status, vehicleType, zone, available } = req.query;

  let driverList = Array.from(drivers.values());

  if (status) {
    driverList = driverList.filter(d => d.status === status);
  }
  if (vehicleType) {
    driverList = driverList.filter(d => d.vehicleType === vehicleType);
  }
  if (zone) {
    driverList = driverList.filter(d => d.preferredZones.includes(zone as string));
  }
  if (available === 'true') {
    driverList = driverList.filter(d => d.status === 'available');
  }

  // Sort by rating
  driverList.sort((a, b) => b.rating - a.rating);

  res.json({
    drivers: driverList,
    total: driverList.length,
    available: driverList.filter(d => d.status === 'available').length
  });
});

// GET /api/drivers/:id - Get driver details
driverRoutes.get('/:id', (req, res) => {
  const driver = drivers.get(req.params.id);
  if (!driver) {
    return res.status(404).json({ error: 'Driver not found', code: 'NOT_FOUND' });
  }
  res.json({ driver });
});

// POST /api/drivers - Register new driver
driverRoutes.post('/', (req, res) => {
  try {
    const input = CreateDriverInput.parse(req.body);

    const driver: Driver = {
      id: nanoid(),
      ...input,
      preferredZones: input.preferredZones || [],
      status: 'offline',
      rating: 5,
      totalDeliveries: 0,
      completionRate: 100,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    drivers.set(driver.id, driver);

    console.log('Event: driver.registered', { driverId: driver.id });

    res.status(201).json({ driver });
  } catch (error: any) {
    res.status(400).json({ error: error.message, code: 'VALIDATION_ERROR' });
  }
});

// PUT /api/drivers/:id - Update driver info
driverRoutes.put('/:id', (req, res) => {
  const driver = drivers.get(req.params.id);
  if (!driver) {
    return res.status(404).json({ error: 'Driver not found', code: 'NOT_FOUND' });
  }

  const updates = req.body;
  const updatedDriver: Driver = {
    ...driver,
    ...updates,
    id: driver.id, // Prevent ID change
    updatedAt: new Date()
  };

  drivers.set(driver.id, updatedDriver);

  res.json({ driver: updatedDriver });
});

// PUT /api/drivers/:id/status - Update driver status
driverRoutes.put('/:id/status', (req, res) => {
  const { status } = req.body;
  const driver = drivers.get(req.params.id);

  if (!driver) {
    return res.status(404).json({ error: 'Driver not found', code: 'NOT_FOUND' });
  }

  driver.status = status;
  driver.updatedAt = new Date();
  drivers.set(driver.id, driver);

  console.log('Event: driver.status_changed', { driverId: driver.id, status });

  res.json({ driver });
});

// PUT /api/drivers/:id/location - Update driver location
driverRoutes.put('/:id/location', (req, res) => {
  try {
    const input = UpdateLocationInput.parse(req.body);
    const driver = drivers.get(req.params.id);

    if (!driver) {
      return res.status(404).json({ error: 'Driver not found', code: 'NOT_FOUND' });
    }

    driver.currentLocation = {
      lat: input.lat,
      lng: input.lng
    };
    driver.lastLocationUpdate = new Date();
    driver.updatedAt = new Date();
    drivers.set(driver.id, driver);

    res.json({ success: true, location: driver.currentLocation });
  } catch (error: any) {
    res.status(400).json({ error: error.message, code: 'VALIDATION_ERROR' });
  }
});

// GET /api/drivers/nearby - Find nearby available drivers
driverRoutes.get('/nearby/:lat/:lng', (req, res) => {
  const { lat, lng } = req.params;
  const { radius = 5, vehicleType } = req.query; // radius in km

  const targetLat = parseFloat(lat);
  const targetLng = parseFloat(lng);
  const radiusKm = parseFloat(radius as string);

  // Calculate distance using Haversine formula
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  let nearbyDrivers = Array.from(drivers.values())
    .filter(d => d.status === 'available' && d.currentLocation)
    .map(d => ({
      ...d,
      distance: calculateDistance(
        targetLat, targetLng,
        d.currentLocation!.lat, d.currentLocation!.lng
      )
    }))
    .filter(d => d.distance <= radiusKm)
    .sort((a, b) => a.distance - b.distance);

  if (vehicleType) {
    nearbyDrivers = nearbyDrivers.filter(d => d.vehicleType === vehicleType);
  }

  res.json({
    drivers: nearbyDrivers.map(d => ({
      id: d.id,
      name: d.name,
      vehicleType: d.vehicleType,
      rating: d.rating,
      distance: Math.round(d.distance * 100) / 100, // Round to 2 decimals
      location: d.currentLocation
    })),
    total: nearbyDrivers.length
  });
});

// DELETE /api/drivers/:id - Remove driver
driverRoutes.delete('/:id', (req, res) => {
  const driver = drivers.get(req.params.id);
  if (!driver) {
    return res.status(404).json({ error: 'Driver not found', code: 'NOT_FOUND' });
  }

  drivers.delete(req.params.id);

  console.log('Event: driver.removed', { driverId: req.params.id });

  res.json({ success: true, message: 'Driver removed successfully' });
});
