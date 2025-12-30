# 🚀 Bosta API Integration - Research & Implementation Plan

Based on official Bosta API documentation at https://docs.bosta.co/api

---

## 📡 API Base Information

**Base URL:** `http://app.bosta.co/api/v2`  
**Authentication:** Bearer Token (Authorization header)  
**API Version:** v2.0.0

---

## 🔑 Authentication

Bosta supports two authentication methods:

### 1. API Key
```
Authorization: YOUR_API_KEY
```

### 2. Bearer Token (Recommended)
```
Authorization: Bearer YOUR_TOKEN
```

**Action Required:** Request API credentials from Bosta sales team

---

## 📦 Core API Endpoints

### 1. **Create Delivery (Shipment)**

**Endpoint:** `POST /deliveries?apiVersion=1`

**Purpose:** Create a new shipment/delivery

**Request Body:**
```json
{
  "type": 10,
  "specs": {
    "packageType": "Parcel",
    "size": "MEDIUM",
    "packageDetails": {
      "itemsCount": 2,
      "description": "Shoes"
    }
  },
  "dropOffAddress": {
    "firstLine": "Street address",
    "city": "Cairo",
    "zone": "Nasr City",
    "district": "District name"
  },
  "receiver": {
    "firstName": "Ahmed",
    "lastName": "Mohamed",
    "phone": "+201234567890",
    "email": "customer@example.com"
  },
  "notes": "Handle with care",
  "cod": 500.00,
  "allowToOpenPackage": false
}
```

**Response:** Returns delivery tracking number and details

---

### 2. **Create Bulk Deliveries**

**Endpoint:** `POST /deliveries/bulk`

**Purpose:** Create multiple shipments at once

**Use Case:** Process multiple orders from Shopify in one API call

---

### 3. **Search for Deliveries**

**Endpoint:** `POST /deliveries/search`

**Purpose:** Search and filter deliveries

**Request Body:**
```json
{
  "trackingNumber": "BOSTA123456",
  "status": "delivered",
  "dateFrom": "2025-01-01",
  "dateTo": "2025-01-31"
}
```

---

### 4. **Business View Delivery**

**Endpoint:** `GET /deliveries/:trackingNumber`

**Purpose:** Get detailed information about a specific delivery

**Response:** Full delivery details including status, timeline, location

---

### 5. **Business Update Delivery**

**Endpoint:** `PUT /deliveries/:trackingNumber`

**Purpose:** Update delivery information

**Use Cases:**
- Update customer phone number
- Change delivery address
- Modify COD amount

---

### 6. **Business Terminate Delivery**

**Endpoint:** `DELETE /deliveries/:trackingNumber`

**Purpose:** Cancel a delivery before pickup

---

### 7. **Business Deliveries Analytics**

**Endpoint:** `GET /deliveries/analytics/total-deliveries`

**Purpose:** Get delivery statistics and analytics

**Use Cases:**
- Total deliveries count
- Success rate
- Average delivery time
- COD collection stats

---

## 🔔 Webhooks (Real-time Updates)

Bosta supports webhooks for real-time status updates. We need to:

1. **Setup webhook endpoint** in our system: `/api/webhooks/bosta`
2. **Register webhook URL** with Bosta
3. **Handle webhook events:**
   - Delivery created
   - Delivery picked up
   - Delivery in transit
   - Delivery delivered
   - Delivery failed
   - COD collected

**Webhook Payload Example:**
```json
{
  "event": "delivery.delivered",
  "trackingNumber": "BOSTA123456",
  "status": "delivered",
  "timestamp": "2025-12-18T10:30:00Z",
  "deliveryDetails": {
    "cod": 500.00,
    "codCollected": true
  }
}
```

---

## 💰 COD Reconciliation

**Endpoint:** `/deliveries/cod-reconciliation` (need to confirm)

**Purpose:** Track COD collections and reconcile payments

**Features:**
- View COD balance
- Track collection dates
- Export COD reports

---

## 🏗️ Implementation Architecture

### Phase 1: Database Schema

```sql
-- Add to drizzle/schema-nowshoes.ts

export const bostaShipments = mysqlTable('bosta_shipments', {
  id: int('id').primaryKey().autoincrement(),
  orderId: int('order_id').notNull().references(() => orders.id),
  trackingNumber: varchar('tracking_number', { length: 255 }).unique(),
  
  // Bosta API Response
  bostaDeliveryId: varchar('bosta_delivery_id', { length: 255 }),
  status: varchar('status', { length: 50 }), // pending, picked_up, in_transit, delivered, failed
  
  // Package Details
  packageType: varchar('package_type', { length: 50 }), // Parcel, Document
  size: varchar('size', { length: 50 }), // SMALL, MEDIUM, LARGE
  itemsCount: int('items_count'),
  
  // COD
  codAmount: decimal('cod_amount', { precision: 10, scale: 2 }),
  codCollected: boolean('cod_collected').default(false),
  codCollectionDate: datetime('cod_collection_date'),
  
  // Tracking
  pickupDate: datetime('pickup_date'),
  deliveryDate: datetime('delivery_date'),
  failureReason: text('failure_reason'),
  
  // Waybill
  waybillUrl: text('waybill_url'),
  
  // Timestamps
  createdAt: datetime('created_at').notNull(),
  updatedAt: datetime('updated_at').notNull(),
});

export const bostaWebhookLogs = mysqlTable('bosta_webhook_logs', {
  id: int('id').primaryKey().autoincrement(),
  trackingNumber: varchar('tracking_number', { length: 255 }),
  event: varchar('event', { length: 100 }),
  payload: json('payload'),
  processed: boolean('processed').default(false),
  createdAt: datetime('created_at').notNull(),
});
```

---

### Phase 2: Bosta API Client

**File:** `server/integrations/bosta-api.ts`

```typescript
import axios from 'axios';

const BOSTA_BASE_URL = 'http://app.bosta.co/api/v2';
const BOSTA_API_KEY = process.env.BOSTA_API_KEY || '';

export interface CreateDeliveryRequest {
  type: number; // 10 for regular delivery
  specs: {
    packageType: 'Parcel' | 'Document';
    size: 'SMALL' | 'MEDIUM' | 'LARGE';
    packageDetails: {
      itemsCount: number;
      description: string;
    };
  };
  dropOffAddress: {
    firstLine: string;
    city: string;
    zone: string;
    district?: string;
  };
  receiver: {
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
  };
  notes?: string;
  cod?: number;
  allowToOpenPackage?: boolean;
}

export interface DeliveryResponse {
  trackingNumber: string;
  deliveryId: string;
  status: string;
  waybillUrl?: string;
}

class BostaAPI {
  private headers = {
    'Authorization': `Bearer ${BOSTA_API_KEY}`,
    'Content-Type': 'application/json',
  };

  async createDelivery(data: CreateDeliveryRequest): Promise<DeliveryResponse> {
    try {
      const response = await axios.post(
        `${BOSTA_BASE_URL}/deliveries?apiVersion=1`,
        data,
        { headers: this.headers }
      );
      return response.data;
    } catch (error) {
      console.error('Bosta API Error:', error);
      throw new Error('Failed to create Bosta delivery');
    }
  }

  async getDelivery(trackingNumber: string) {
    try {
      const response = await axios.get(
        `${BOSTA_BASE_URL}/deliveries/${trackingNumber}`,
        { headers: this.headers }
      );
      return response.data;
    } catch (error) {
      console.error('Bosta API Error:', error);
      throw new Error('Failed to fetch delivery details');
    }
  }

  async searchDeliveries(filters: {
    trackingNumber?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
  }) {
    try {
      const response = await axios.post(
        `${BOSTA_BASE_URL}/deliveries/search`,
        filters,
        { headers: this.headers }
      );
      return response.data;
    } catch (error) {
      console.error('Bosta API Error:', error);
      throw new Error('Failed to search deliveries');
    }
  }

  async updateDelivery(trackingNumber: string, updates: Partial<CreateDeliveryRequest>) {
    try {
      const response = await axios.put(
        `${BOSTA_BASE_URL}/deliveries/${trackingNumber}`,
        updates,
        { headers: this.headers }
      );
      return response.data;
    } catch (error) {
      console.error('Bosta API Error:', error);
      throw new Error('Failed to update delivery');
    }
  }

  async cancelDelivery(trackingNumber: string) {
    try {
      const response = await axios.delete(
        `${BOSTA_BASE_URL}/deliveries/${trackingNumber}`,
        { headers: this.headers }
      );
      return response.data;
    } catch (error) {
      console.error('Bosta API Error:', error);
      throw new Error('Failed to cancel delivery');
    }
  }
}

export const bostaAPI = new BostaAPI();
```

---

### Phase 3: tRPC Procedures

**File:** `server/routers/bosta.ts`

```typescript
import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { bostaAPI } from "../integrations/bosta-api";
import { createBostaShipment, getBostaShipmentByTracking } from "../db-bosta";

export const bostaRouter = router({
  createShipment: protectedProcedure
    .input(z.object({
      orderId: z.number(),
      customerName: z.string(),
      customerPhone: z.string(),
      shippingAddress: z.string(),
      city: z.string(),
      zone: z.string(),
      itemsCount: z.number(),
      codAmount: z.number().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      // Split customer name
      const [firstName, ...lastNameParts] = input.customerName.split(' ');
      const lastName = lastNameParts.join(' ') || firstName;

      // Create delivery via Bosta API
      const delivery = await bostaAPI.createDelivery({
        type: 10,
        specs: {
          packageType: 'Parcel',
          size: 'MEDIUM',
          packageDetails: {
            itemsCount: input.itemsCount,
            description: 'Shoes',
          },
        },
        dropOffAddress: {
          firstLine: input.shippingAddress,
          city: input.city,
          zone: input.zone,
        },
        receiver: {
          firstName,
          lastName,
          phone: input.customerPhone,
        },
        notes: input.notes,
        cod: input.codAmount,
        allowToOpenPackage: false,
      });

      // Save to database
      await createBostaShipment({
        orderId: input.orderId,
        trackingNumber: delivery.trackingNumber,
        bostaDeliveryId: delivery.deliveryId,
        status: delivery.status,
        packageType: 'Parcel',
        size: 'MEDIUM',
        itemsCount: input.itemsCount,
        codAmount: input.codAmount || 0,
        waybillUrl: delivery.waybillUrl,
      });

      return delivery;
    }),

  trackShipment: protectedProcedure
    .input(z.object({
      trackingNumber: z.string(),
    }))
    .query(async ({ input }) => {
      const delivery = await bostaAPI.getDelivery(input.trackingNumber);
      return delivery;
    }),

  searchShipments: protectedProcedure
    .input(z.object({
      trackingNumber: z.string().optional(),
      status: z.string().optional(),
      dateFrom: z.string().optional(),
      dateTo: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const results = await bostaAPI.searchDeliveries(input);
      return results;
    }),
});
```

---

### Phase 4: Webhook Handler

**File:** `server/_core/webhooks/bosta.ts`

```typescript
import { Request, Response } from 'express';
import { updateBostaShipmentStatus, logBostaWebhook } from '../../db-bosta';

export async function handleBostaWebhook(req: Request, res: Response) {
  try {
    const payload = req.body;

    // Log webhook
    await logBostaWebhook({
      trackingNumber: payload.trackingNumber,
      event: payload.event,
      payload: JSON.stringify(payload),
    });

    // Update shipment status
    await updateBostaShipmentStatus({
      trackingNumber: payload.trackingNumber,
      status: payload.status,
      deliveryDate: payload.event === 'delivery.delivered' ? new Date() : undefined,
      codCollected: payload.deliveryDetails?.codCollected || false,
      codCollectionDate: payload.deliveryDetails?.codCollected ? new Date() : undefined,
    });

    // Send success response
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Webhook Error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}
```

---

## 🎯 Implementation Checklist

### Backend
- [ ] Add Bosta API key to environment variables
- [ ] Create database schema (`bostaShipments`, `bostaWebhookLogs`)
- [ ] Build Bosta API client (`server/integrations/bosta-api.ts`)
- [ ] Create database functions (`server/db-bosta.ts`)
- [ ] Build tRPC router (`server/routers/bosta.ts`)
- [ ] Setup webhook endpoint (`/api/webhooks/bosta`)
- [ ] Register webhook URL with Bosta
- [ ] Test API integration

### Frontend
- [ ] Create shipment creation form
- [ ] Add tracking display component
- [ ] Build COD reconciliation dashboard
- [ ] Add waybill print functionality
- [ ] Show shipment status timeline

### Testing
- [ ] Write vitest tests for Bosta API client
- [ ] Test create shipment flow
- [ ] Test webhook handling
- [ ] Test error scenarios
- [ ] Test COD reconciliation

---

## 🔗 Integration with Shopify

Once Shopify integration is complete:

1. **Auto-create Bosta shipment** when new Shopify order arrives
2. **Push tracking number** to Shopify order
3. **Update order status** in Shopify based on Bosta delivery status
4. **Sync inventory** after delivery confirmation

---

## 📞 Next Steps

1. **Contact Bosta Sales:** Request API credentials
2. **Setup test environment:** Use Bosta sandbox/test API
3. **Build Phase 1:** Database schema
4. **Build Phase 2:** API client
5. **Build Phase 3:** tRPC procedures
6. **Build Phase 4:** Webhook handler
7. **Build Phase 5:** Frontend UI
8. **Test thoroughly:** All flows
9. **Deploy to production:** After successful testing

---

**Document Created:** December 18, 2025  
**Source:** Bosta API Documentation (https://docs.bosta.co/api)  
**Maintained by:** NOW SHOES Development Team
