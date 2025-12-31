/**
 * Payment Provider Interface
 * Supports Stripe, PayPal, and other payment gateways
 */

import { BaseAdapter, AdapterResponse, AdapterConfig } from './base-adapter'

export interface PaymentIntent {
  id: string
  amount: number
  currency: string
  status: 'pending' | 'succeeded' | 'failed' | 'canceled'
  clientSecret?: string
  created: number
}

export interface RefundRequest {
  paymentIntentId: string
  amount?: number
  reason?: string
}

export interface RefundResponse {
  id: string
  amount: number
  status: 'succeeded' | 'pending' | 'failed'
  created: number
}

export abstract class PaymentProvider extends BaseAdapter {
  abstract createPaymentIntent(
    amount: number,
    currency: string,
    metadata?: Record<string, any>
  ): Promise<AdapterResponse<PaymentIntent>>

  abstract confirmPayment(paymentIntentId: string): Promise<AdapterResponse<PaymentIntent>>

  abstract refund(request: RefundRequest): Promise<AdapterResponse<RefundResponse>>

  abstract getPaymentStatus(paymentIntentId: string): Promise<AdapterResponse<PaymentIntent>>
}
