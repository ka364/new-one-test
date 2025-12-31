/**
 * Mock Payment Adapter
 * Simulates payment gateway behavior for testing
 */

import {
  PaymentProvider,
  PaymentIntent,
  RefundRequest,
  RefundResponse
} from '../payment-provider'
import { AdapterResponse, AdapterConfig } from '../base-adapter'

export class MockPaymentAdapter extends PaymentProvider {
  private payments = new Map<string, PaymentIntent>()

  constructor(config: AdapterConfig = {}) {
    super(config)
  }

  async createPaymentIntent(
    amount: number,
    currency: string,
    metadata?: Record<string, any>
  ): Promise<AdapterResponse<PaymentIntent>> {
    await this.handleFailureMode()
    await this.simulateDelay(200)

    const paymentIntent: PaymentIntent = {
      id: `pi_mock_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      amount,
      currency,
      status: 'pending',
      clientSecret: `pi_mock_${Date.now()}_secret_${Math.random().toString(36).substring(7)}`,
      created: Math.floor(Date.now() / 1000)
    }

    this.payments.set(paymentIntent.id, paymentIntent)

    return this.wrapResponse(paymentIntent)
  }

  async confirmPayment(paymentIntentId: string): Promise<AdapterResponse<PaymentIntent>> {
    await this.handleFailureMode()
    await this.simulateDelay(300)

    const payment = this.payments.get(paymentIntentId)

    if (!payment) {
      return this.wrapError('Payment intent not found', 404)
    }

    payment.status = 'succeeded'
    this.payments.set(paymentIntentId, payment)

    return this.wrapResponse(payment)
  }

  async refund(request: RefundRequest): Promise<AdapterResponse<RefundResponse>> {
    await this.handleFailureMode()
    await this.simulateDelay(250)

    const payment = this.payments.get(request.paymentIntentId)

    if (!payment) {
      return this.wrapError('Payment intent not found', 404)
    }

    if (payment.status !== 'succeeded') {
      return this.wrapError('Cannot refund non-successful payment', 400)
    }

    const refundAmount = request.amount || payment.amount

    if (refundAmount > payment.amount) {
      return this.wrapError('Refund amount exceeds payment amount', 400)
    }

    const refund: RefundResponse = {
      id: `re_mock_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      amount: refundAmount,
      status: 'succeeded',
      created: Math.floor(Date.now() / 1000)
    }

    return this.wrapResponse(refund)
  }

  async getPaymentStatus(paymentIntentId: string): Promise<AdapterResponse<PaymentIntent>> {
    await this.simulateDelay(100)

    const payment = this.payments.get(paymentIntentId)

    if (!payment) {
      return this.wrapError('Payment intent not found', 404)
    }

    return this.wrapResponse(payment)
  }

  /**
   * Test helper: Clear all payments
   */
  clearPayments(): void {
    this.payments.clear()
  }

  /**
   * Test helper: Get all payments
   */
  getAllPayments(): PaymentIntent[] {
    return Array.from(this.payments.values())
  }
}
