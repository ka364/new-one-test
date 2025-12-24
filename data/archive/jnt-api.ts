import axios, { AxiosInstance } from 'axios';
import crypto from 'crypto';

/**
 * J&T Express API Client
 * 
 * Platform: https://open.jtjms-eg.com
 * Documentation: Available after registration
 * 
 * Authentication: API Account + Private Key with signature
 */

const JNT_API_BASE_URL = process.env.JNT_API_URL || 'https://open.jtjms-eg.com/api';
const JNT_API_ACCOUNT = process.env.JNT_API_ACCOUNT || '';
const JNT_PRIVATE_KEY = process.env.JNT_PRIVATE_KEY || '';

interface JNTAddress {
  address: string;
  city: string;
  area?: string;
  postcode?: string;
}

interface JNTReceiver {
  name: string;
  phone: string;
  mobile?: string;
  email?: string;
}

interface JNTOrderItem {
  itemName: string;
  quantity: number;
  itemValue: number;
}

interface CreateOrderRequest {
  txlogisticId: string; // Your unique order ID
  sender: {
    name: string;
    phone: string;
    mobile?: string;
    address: JNTAddress;
  };
  receiver: JNTReceiver & { address: JNTAddress };
  items: JNTOrderItem[];
  weight: number; // in KG
  goodsType: string; // e.g., "Shoes", "Clothing"
  payType: number; // 1 = Prepaid, 2 = COD
  codAmount?: number; // Cash on Delivery amount
  insured?: number; // Insurance amount
  remark?: string; // Notes
}

interface JNTOrderResponse {
  code: number; // 1 = success, other = error
  msg: string;
  data: {
    txlogisticId: string;
    billCode: string; // J&T tracking number
    sortingCode?: string;
    packageCode?: string;
  };
}

interface JNTTrackingResponse {
  code: number;
  msg: string;
  data: {
    billCode: string;
    txlogisticId: string;
    status: string;
    details: Array<{
      scanType: string;
      desc: string;
      scanTime: string;
      operatorName?: string;
      operatorSite?: string;
    }>;
  };
}

interface JNTCancelRequest {
  txlogisticId: string;
  billCode: string;
  cancelReason: string;
}

class JNTAPI {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: JNT_API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    // Add request interceptor to sign requests
    this.client.interceptors.request.use((config) => {
      if (config.data) {
        const signature = this.generateSignature(config.data);
        config.headers['apiAccount'] = JNT_API_ACCOUNT;
        config.headers['signature'] = signature;
        config.headers['timestamp'] = Date.now().toString();
      }
      return config;
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response) {
          console.error('J&T API Error:', {
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
   * Generate signature for API authentication
   * Signature = MD5(apiAccount + data + privateKey + timestamp)
   */
  private generateSignature(data: any): string {
    const timestamp = Date.now().toString();
    const dataString = JSON.stringify(data);
    const signString = `${JNT_API_ACCOUNT}${dataString}${JNT_PRIVATE_KEY}${timestamp}`;
    return crypto.createHash('md5').update(signString).digest('hex');
  }

  /**
   * Create a new order/shipment
   * POST /order/create
   */
  async createOrder(data: CreateOrderRequest): Promise<JNTOrderResponse> {
    const response = await this.client.post('/order/create', data);
    return response.data;
  }

  /**
   * Get order tracking information
   * POST /order/track
   */
  async getTracking(billCode: string): Promise<JNTTrackingResponse> {
    const response = await this.client.post('/order/track', { billCode });
    return response.data;
  }

  /**
   * Batch track multiple orders
   * POST /order/batchTrack
   */
  async batchTracking(billCodes: string[]): Promise<{
    code: number;
    msg: string;
    data: JNTTrackingResponse['data'][];
  }> {
    const response = await this.client.post('/order/batchTrack', { billCodes });
    return response.data;
  }

  /**
   * Cancel order
   * POST /order/cancel
   */
  async cancelOrder(data: JNTCancelRequest): Promise<{
    code: number;
    msg: string;
    data: {
      txlogisticId: string;
      billCode: string;
      cancelStatus: boolean;
    };
  }> {
    const response = await this.client.post('/order/cancel', data);
    return response.data;
  }

  /**
   * Get waybill (shipping label) PDF
   * POST /order/waybill
   */
  async getWaybill(billCodes: string[]): Promise<{
    code: number;
    msg: string;
    data: {
      pdfUrl: string;
    };
  }> {
    const response = await this.client.post('/order/waybill', { billCodes });
    return response.data;
  }

  /**
   * Get COD collections
   * POST /finance/cod
   */
  async getCODCollections(params: {
    startDate: string; // YYYY-MM-DD
    endDate: string; // YYYY-MM-DD
  }): Promise<{
    code: number;
    msg: string;
    data: Array<{
      billCode: string;
      txlogisticId: string;
      codAmount: number;
      collectionDate: string;
      transferDate?: string;
      transferAmount?: number;
      status: string;
    }>;
  }> {
    const response = await this.client.post('/finance/cod', params);
    return response.data;
  }

  /**
   * Get service areas
   * POST /area/query
   */
  async getServiceAreas(params?: { city?: string; area?: string }): Promise<{
    code: number;
    msg: string;
    data: Array<{
      city: string;
      cityCode: string;
      areas: Array<{
        area: string;
        areaCode: string;
        postcode?: string;
      }>;
    }>;
  }> {
    const response = await this.client.post('/area/query', params || {});
    return response.data;
  }

  /**
   * Calculate shipping cost
   * POST /order/calculate
   */
  async calculateShipping(data: {
    fromCity: string;
    toCity: string;
    weight: number;
    payType: number;
    codAmount?: number;
  }): Promise<{
    code: number;
    msg: string;
    data: {
      shippingFee: number;
      codFee: number;
      totalFee: number;
      currency: 'EGP';
    };
  }> {
    const response = await this.client.post('/order/calculate', data);
    return response.data;
  }

  /**
   * Get order list with filters
   * POST /order/list
   */
  async getOrders(params: {
    startDate: string;
    endDate: string;
    page?: number;
    pageSize?: number;
    status?: string;
  }): Promise<{
    code: number;
    msg: string;
    data: {
      total: number;
      page: number;
      pageSize: number;
      orders: Array<{
        billCode: string;
        txlogisticId: string;
        status: string;
        createTime: string;
        updateTime: string;
      }>;
    };
  }> {
    const response = await this.client.post('/order/list', params);
    return response.data;
  }

  /**
   * Update order information
   * POST /order/update
   */
  async updateOrder(data: {
    billCode: string;
    txlogisticId: string;
    receiver?: Partial<JNTReceiver & { address: JNTAddress }>;
    remark?: string;
  }): Promise<{
    code: number;
    msg: string;
    data: {
      billCode: string;
      updateStatus: boolean;
    };
  }> {
    const response = await this.client.post('/order/update', data);
    return response.data;
  }
}

// Export singleton instance
export const jntAPI = new JNTAPI();

// Export types
export type {
  JNTAddress,
  JNTReceiver,
  JNTOrderItem,
  CreateOrderRequest,
  JNTOrderResponse,
  JNTTrackingResponse,
  JNTCancelRequest,
};
