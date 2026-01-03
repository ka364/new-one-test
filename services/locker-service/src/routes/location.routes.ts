/**
 * Locker Location Routes
 */

import { Router } from 'express';
import { nanoid } from 'nanoid';
import { LockerLocation, CreateLocationInput } from '../models/locker.model';

export const locationRoutes = Router();

// In-memory store
const locations = new Map<string, LockerLocation>();

// Initialize with default Egyptian locations
const initializeLocations = () => {
  const defaultLocations: Partial<LockerLocation>[] = [
    {
      name: 'City Stars Mall',
      nameAr: 'سيتي ستارز مول',
      address: 'City Stars Mall, Nasr City',
      addressAr: 'سيتي ستارز مول، مدينة نصر',
      city: 'Cairo',
      district: 'Nasr City',
      lat: 30.0728,
      lng: 31.3454,
      operatingHours: { open: '10:00', close: '23:00', is24Hours: false },
      totalLockers: 50,
      availableLockers: 45,
      hasParking: true
    },
    {
      name: 'Cairo Festival City',
      nameAr: 'كايرو فيستيفال سيتي',
      address: 'Cairo Festival City, New Cairo',
      addressAr: 'كايرو فيستيفال سيتي، القاهرة الجديدة',
      city: 'Cairo',
      district: 'New Cairo',
      lat: 30.0286,
      lng: 31.4086,
      operatingHours: { open: '10:00', close: '22:00', is24Hours: false },
      totalLockers: 40,
      availableLockers: 35,
      hasParking: true
    },
    {
      name: 'Mall of Arabia',
      nameAr: 'مول العرب',
      address: 'Mall of Arabia, 6th October',
      addressAr: 'مول العرب، 6 أكتوبر',
      city: 'Giza',
      district: '6th October',
      lat: 29.9725,
      lng: 30.9432,
      operatingHours: { open: '10:00', close: '23:00', is24Hours: false },
      totalLockers: 60,
      availableLockers: 52,
      hasParking: true
    },
    {
      name: 'San Stefano Mall',
      nameAr: 'سان ستيفانو مول',
      address: 'San Stefano Mall, Alexandria',
      addressAr: 'سان ستيفانو مول، الإسكندرية',
      city: 'Alexandria',
      lat: 31.2432,
      lng: 29.9597,
      operatingHours: { open: '10:00', close: '22:00', is24Hours: false },
      totalLockers: 35,
      availableLockers: 30,
      hasParking: true
    },
    {
      name: 'Metro Station - Sadat',
      nameAr: 'محطة مترو السادات',
      address: 'Tahrir Square Metro Station',
      addressAr: 'محطة مترو ميدان التحرير',
      city: 'Cairo',
      district: 'Downtown',
      lat: 30.0444,
      lng: 31.2357,
      operatingHours: { open: '06:00', close: '00:00', is24Hours: false },
      totalLockers: 30,
      availableLockers: 25,
      hasParking: false
    }
  ];

  defaultLocations.forEach(loc => {
    const id = nanoid();
    locations.set(id, {
      id,
      name: loc.name!,
      nameAr: loc.nameAr!,
      address: loc.address!,
      addressAr: loc.addressAr!,
      city: loc.city!,
      district: loc.district,
      lat: loc.lat!,
      lng: loc.lng!,
      operatingHours: loc.operatingHours!,
      totalLockers: loc.totalLockers!,
      availableLockers: loc.availableLockers!,
      hasParking: loc.hasParking || false,
      isAccessible: true,
      hasCamera: true,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  });
};

// Initialize on load
initializeLocations();

// GET /api/locker-locations - List all locations
locationRoutes.get('/', (req, res) => {
  const { city, hasAvailable, nearLat, nearLng, radius = 10 } = req.query;

  let locationList = Array.from(locations.values()).filter(l => l.isActive);

  if (city) {
    locationList = locationList.filter(l =>
      l.city.toLowerCase() === (city as string).toLowerCase()
    );
  }

  if (hasAvailable === 'true') {
    locationList = locationList.filter(l => l.availableLockers > 0);
  }

  // Filter by proximity
  if (nearLat && nearLng) {
    const targetLat = parseFloat(nearLat as string);
    const targetLng = parseFloat(nearLng as string);
    const radiusKm = parseFloat(radius as string);

    locationList = locationList
      .map(l => ({
        ...l,
        distance: calculateDistance(targetLat, targetLng, l.lat, l.lng)
      }))
      .filter(l => l.distance <= radiusKm)
      .sort((a, b) => a.distance - b.distance);
  }

  res.json({
    locations: locationList,
    total: locationList.length
  });
});

// Helper: Calculate distance
const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// GET /api/locker-locations/:id - Get location details
locationRoutes.get('/:id', (req, res) => {
  const location = locations.get(req.params.id);
  if (!location) {
    return res.status(404).json({ error: 'Location not found', code: 'NOT_FOUND' });
  }
  res.json({ location });
});

// POST /api/locker-locations - Create new location
locationRoutes.post('/', (req, res) => {
  try {
    const input = CreateLocationInput.parse(req.body);

    const location: LockerLocation = {
      id: nanoid(),
      ...input,
      operatingHours: {
        ...input.operatingHours,
        is24Hours: input.operatingHours.is24Hours || false
      },
      totalLockers: 0,
      availableLockers: 0,
      hasParking: input.hasParking || false,
      isAccessible: input.isAccessible !== false,
      hasCamera: true,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    locations.set(location.id, location);

    console.log('Event: location.created', { locationId: location.id });

    res.status(201).json({ location });
  } catch (error: any) {
    res.status(400).json({ error: error.message, code: 'VALIDATION_ERROR' });
  }
});

// PUT /api/locker-locations/:id - Update location
locationRoutes.put('/:id', (req, res) => {
  const location = locations.get(req.params.id);
  if (!location) {
    return res.status(404).json({ error: 'Location not found', code: 'NOT_FOUND' });
  }

  const updates = req.body;
  const updatedLocation: LockerLocation = {
    ...location,
    ...updates,
    id: location.id,
    updatedAt: new Date()
  };

  locations.set(location.id, updatedLocation);

  res.json({ location: updatedLocation });
});

// DELETE /api/locker-locations/:id - Deactivate location
locationRoutes.delete('/:id', (req, res) => {
  const location = locations.get(req.params.id);
  if (!location) {
    return res.status(404).json({ error: 'Location not found', code: 'NOT_FOUND' });
  }

  location.isActive = false;
  location.updatedAt = new Date();
  locations.set(location.id, location);

  console.log('Event: location.deactivated', { locationId: location.id });

  res.json({ success: true, message: 'Location deactivated' });
});

// GET /api/locker-locations/cities/list - Get available cities
locationRoutes.get('/cities/list', (req, res) => {
  const cities = [...new Set(Array.from(locations.values()).filter(l => l.isActive).map(l => l.city))];
  res.json({ cities });
});

// Export locations map for other routes
export { locations };
