/**
 * Zone Routes - Delivery Zone Management
 */

import { Router } from 'express';
import { nanoid } from 'nanoid';

export const zoneRoutes = Router();

// Zone type
interface DeliveryZone {
  id: string;
  name: string;
  nameAr: string;
  city: string;
  polygon: { lat: number; lng: number }[]; // GeoJSON polygon
  deliveryFee: number;
  minOrderAmount: number;
  estimatedTime: number; // minutes
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// In-memory store
const zones = new Map<string, DeliveryZone>();

// Initialize with default Egyptian zones
const initializeZones = () => {
  const defaultZones: Partial<DeliveryZone>[] = [
    {
      name: 'Nasr City',
      nameAr: 'مدينة نصر',
      city: 'Cairo',
      deliveryFee: 25,
      minOrderAmount: 50,
      estimatedTime: 30
    },
    {
      name: 'Heliopolis',
      nameAr: 'مصر الجديدة',
      city: 'Cairo',
      deliveryFee: 30,
      minOrderAmount: 50,
      estimatedTime: 35
    },
    {
      name: 'Maadi',
      nameAr: 'المعادي',
      city: 'Cairo',
      deliveryFee: 35,
      minOrderAmount: 75,
      estimatedTime: 40
    },
    {
      name: 'Dokki',
      nameAr: 'الدقي',
      city: 'Giza',
      deliveryFee: 30,
      minOrderAmount: 50,
      estimatedTime: 35
    },
    {
      name: '6th October',
      nameAr: '6 أكتوبر',
      city: 'Giza',
      deliveryFee: 45,
      minOrderAmount: 100,
      estimatedTime: 50
    },
    {
      name: 'New Cairo',
      nameAr: 'القاهرة الجديدة',
      city: 'Cairo',
      deliveryFee: 40,
      minOrderAmount: 75,
      estimatedTime: 45
    },
    {
      name: 'Alexandria Downtown',
      nameAr: 'وسط الإسكندرية',
      city: 'Alexandria',
      deliveryFee: 25,
      minOrderAmount: 50,
      estimatedTime: 30
    },
    {
      name: 'Smouha',
      nameAr: 'سموحة',
      city: 'Alexandria',
      deliveryFee: 30,
      minOrderAmount: 50,
      estimatedTime: 35
    }
  ];

  defaultZones.forEach(zone => {
    const id = nanoid();
    zones.set(id, {
      id,
      name: zone.name!,
      nameAr: zone.nameAr!,
      city: zone.city!,
      polygon: [], // Would be filled with actual coordinates
      deliveryFee: zone.deliveryFee!,
      minOrderAmount: zone.minOrderAmount!,
      estimatedTime: zone.estimatedTime!,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  });
};

// Initialize on load
initializeZones();

// GET /api/zones - List all zones
zoneRoutes.get('/', (req, res) => {
  const { city, active } = req.query;

  let zoneList = Array.from(zones.values());

  if (city) {
    zoneList = zoneList.filter(z => z.city.toLowerCase() === (city as string).toLowerCase());
  }
  if (active === 'true') {
    zoneList = zoneList.filter(z => z.isActive);
  }

  res.json({
    zones: zoneList,
    total: zoneList.length
  });
});

// GET /api/zones/:id - Get zone details
zoneRoutes.get('/:id', (req, res) => {
  const zone = zones.get(req.params.id);
  if (!zone) {
    return res.status(404).json({ error: 'Zone not found', code: 'NOT_FOUND' });
  }
  res.json({ zone });
});

// POST /api/zones - Create new zone
zoneRoutes.post('/', (req, res) => {
  const { name, nameAr, city, polygon, deliveryFee, minOrderAmount, estimatedTime } = req.body;

  const zone: DeliveryZone = {
    id: nanoid(),
    name,
    nameAr,
    city,
    polygon: polygon || [],
    deliveryFee,
    minOrderAmount,
    estimatedTime,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  zones.set(zone.id, zone);

  console.log('Event: zone.created', { zoneId: zone.id });

  res.status(201).json({ zone });
});

// PUT /api/zones/:id - Update zone
zoneRoutes.put('/:id', (req, res) => {
  const zone = zones.get(req.params.id);
  if (!zone) {
    return res.status(404).json({ error: 'Zone not found', code: 'NOT_FOUND' });
  }

  const updates = req.body;
  const updatedZone: DeliveryZone = {
    ...zone,
    ...updates,
    id: zone.id,
    updatedAt: new Date()
  };

  zones.set(zone.id, updatedZone);

  res.json({ zone: updatedZone });
});

// POST /api/zones/check - Check if location is in a delivery zone
zoneRoutes.post('/check', (req, res) => {
  const { lat, lng } = req.body;

  // For simplicity, we'll check based on city
  // In production, use point-in-polygon algorithm
  const activeZones = Array.from(zones.values()).filter(z => z.isActive);

  // Return first matching zone (simplified)
  // Real implementation would use geo coordinates
  if (activeZones.length > 0) {
    const zone = activeZones[0];
    res.json({
      inZone: true,
      zone: {
        id: zone.id,
        name: zone.name,
        nameAr: zone.nameAr,
        deliveryFee: zone.deliveryFee,
        minOrderAmount: zone.minOrderAmount,
        estimatedTime: zone.estimatedTime
      }
    });
  } else {
    res.json({ inZone: false, message: 'Location not in delivery zone' });
  }
});

// DELETE /api/zones/:id - Deactivate zone
zoneRoutes.delete('/:id', (req, res) => {
  const zone = zones.get(req.params.id);
  if (!zone) {
    return res.status(404).json({ error: 'Zone not found', code: 'NOT_FOUND' });
  }

  zone.isActive = false;
  zone.updatedAt = new Date();
  zones.set(zone.id, zone);

  console.log('Event: zone.deactivated', { zoneId: zone.id });

  res.json({ success: true, message: 'Zone deactivated' });
});

// GET /api/zones/cities - Get available cities
zoneRoutes.get('/cities/list', (req, res) => {
  const cities = [...new Set(Array.from(zones.values()).map(z => z.city))];
  res.json({ cities });
});
