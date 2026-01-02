import axios, { AxiosInstance } from 'axios';

/**
 * Bosta API Client
 *
 * Official API Documentation: https://docs.bosta.co/
 * Base URL: https://app.bosta.co/api/v2
 *
 * Authentication: Bearer Token in Authorization header
 */

const BOSTA_API_BASE_URL = process.env.BOSTA_API_URL || 'https://app.bosta.co/api/v2';
const BOSTA_API_KEY = process.env.BOSTA_API_KEY || '';

interface BostaAddress {
  firstLine: string;
  secondLine?: string;
  city: string;
  zone?: string;
  district?: string;
  buildingNumber?: string;
  floor?: string;
  apartment?: string;
}

interface BostaReceiver {
  firstName: string;
  lastName?: string;
  phone: string;
  email?: string;
}

interface BostaDropOffAddress extends BostaAddress {
  geoLocation?: {
    lat: number;
    lng: number;
  };
}

interface BostaDeliverySpecs {
  packageType: 'Parcel' | 'Document' | 'Light Bulky' | 'Heavy Bulky';
  size?: 'SMALL' | 'MEDIUM' | 'LARGE';
  packageDetails?: {
    itemsCount: number;
    description: string;
  };
  cod?: number; // Cash on Delivery amount
  allowToOpenPackage?: boolean;
  notes?: string;
}

interface CreateDeliveryRequest {
  type: number; // 10 = Send, 20 = Exchange, 30 = Return
  specs: BostaDeliverySpecs;
  dropOffAddress: BostaDropOffAddress;
  receiver: BostaReceiver;
  businessReference?: string; // Your internal order ID
}

interface BostaDeliveryResponse {
  _id: string;
  trackingNumber: string;
  state: {
    value: string; // pending, picked_up, in_transit, delivered, etc.
    code: number;
  };
  waybill?: string; // URL to waybill PDF
  createdAt: string;
  updatedAt: string;
}

interface BostaTrackingResponse {
  trackingNumber: string;
  state: {
    value: string;
    code: number;
  };
  promisedDate?: string;
  trackingHistory: Array<{
    state: string;
    timestamp: string;
    hub?: string;
    reason?: string;
  }>;
  receiver: BostaReceiver;
  dropOffAddress: BostaAddress;
  cod?: {
    amount: number;
    collected: boolean;
    collectionDate?: string;
  };
}

interface BostaSearchParams {
  page?: number;
  pageSize?: number;
  state?: string;
  fromDate?: string; // YYYY-MM-DD
  toDate?: string; // YYYY-MM-DD
}

class BostaAPI {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: BOSTA_API_BASE_URL,
      headers: {
        Authorization: `Bearer ${BOSTA_API_KEY}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000, // 30 seconds
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response) {
          console.error('Bosta API Error:', {
            status: error.response.status,
            data: error.response.data,
            url: error.config?.url,
          });
        }
        throw error;
      }
    );
  }

  /**
   * Create a new delivery/shipment
   * POST /deliveries
   */
  async createDelivery(data: CreateDeliveryRequest): Promise<BostaDeliveryResponse> {
    const response = await this.client.post('/deliveries', data);
    return response.data;
  }

  /**
   * Get delivery tracking information
   * GET /deliveries/:trackingNumber
   */
  async getTracking(trackingNumber: string): Promise<BostaTrackingResponse> {
    const response = await this.client.get(`/deliveries/${trackingNumber}`);
    return response.data;
  }

  /**
   * Search deliveries with filters
   * GET /deliveries
   */
  async searchDeliveries(params: BostaSearchParams = {}): Promise<{
    deliveries: BostaDeliveryResponse[];
    totalCount: number;
    page: number;
    pageSize: number;
  }> {
    const response = await this.client.get('/deliveries', { params });
    return response.data;
  }

  /**
   * Update delivery (e.g., change address, reschedule)
   * PUT /deliveries/:trackingNumber
   */
  async updateDelivery(
    trackingNumber: string,
    updates: Partial<CreateDeliveryRequest>
  ): Promise<BostaDeliveryResponse> {
    const response = await this.client.put(`/deliveries/${trackingNumber}`, updates);
    return response.data;
  }

  /**
   * Cancel delivery
   * DELETE /deliveries/:trackingNumber
   */
  async cancelDelivery(trackingNumber: string): Promise<{ success: boolean; message: string }> {
    const response = await this.client.delete(`/deliveries/${trackingNumber}`);
    return response.data;
  }

  /**
   * Get waybill (shipping label) PDF
   * GET /deliveries/:trackingNumber/waybill
   */
  async getWaybill(trackingNumber: string): Promise<{ url: string }> {
    const response = await this.client.get(`/deliveries/${trackingNumber}/waybill`);
    return response.data;
  }

  /**
   * Get pickup requests
   * GET /pickups
   */
  async getPickups(params: { fromDate?: string; toDate?: string } = {}): Promise<any> {
    const response = await this.client.get('/pickups', { params });
    return response.data;
  }

  /**
   * Create pickup request
   * POST /pickups
   */
  async createPickup(data: {
    businessLocationId: string;
    scheduledDate: string; // YYYY-MM-DD
    scheduledTimeSlot: string; // e.g., "10:00-12:00"
    notes?: string;
  }): Promise<any> {
    const response = await this.client.post('/pickups', data);
    return response.data;
  }

  /**
   * Get COD collections
   * GET /cod-collections
   */
  async getCODCollections(params: { fromDate?: string; toDate?: string } = {}): Promise<{
    collections: Array<{
      trackingNumber: string;
      amount: number;
      collectionDate: string;
      transferDate?: string;
      transferAmount?: number;
      status: 'pending' | 'transferred' | 'disputed';
    }>;
    totalAmount: number;
  }> {
    const response = await this.client.get('/cod-collections', { params });
    return response.data;
  }

  /**
   * Get cities list
   * GET /cities
   */
  async getCities(): Promise<Array<{ _id: string; name: string; nameAr: string }>> {
    const response = await this.client.get('/cities');
    return response.data;
  }

  /**
   * Get zones for a city
   * GET /cities/:cityId/zones
   */
  async getZones(cityId: string): Promise<Array<{ _id: string; name: string; nameAr: string }>> {
    const response = await this.client.get(`/cities/${cityId}/zones`);
    return response.data;
  }

  /**
   * Validate address
   * POST /addresses/validate
   */
  async validateAddress(address: BostaAddress): Promise<{
    valid: boolean;
    suggestions?: BostaAddress[];
    errors?: string[];
  }> {
    const response = await this.client.post('/addresses/validate', address);
    return response.data;
  }

  /**
   * Get pricing estimate
   * POST /pricing/calculate
   */
  async calculatePricing(data: {
    fromCity: string;
    toCity: string;
    packageType: string;
    size?: string;
    cod?: number;
  }): Promise<{
    basePrice: number;
    codFee: number;
    totalPrice: number;
    currency: 'EGP';
  }> {
    const response = await this.client.post('/pricing/calculate', data);
    return response.data;
  }
}

// Export singleton instance
export const bostaAPI = new BostaAPI();

// Export types
export type {
  BostaAddress,
  BostaReceiver,
  BostaDropOffAddress,
  BostaDeliverySpecs,
  CreateDeliveryRequest,
  BostaDeliveryResponse,
  BostaTrackingResponse,
  BostaSearchParams,
};
