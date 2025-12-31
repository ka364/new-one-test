/**
 * Mock Shipping Adapter
 * Simulates shipping providers (Aramex, DHL, FedEx, etc.)
 */

import { BaseAdapter, AdapterResponse, AdapterConfig } from '../base-adapter'

export interface ShippingRate {
  carrier: string
  service: string
  cost: number
  currency: string
  estimatedDays: number
}

export interface ShipmentRequest {
  from: Address
  to: Address
  packages: Package[]
  service?: string
}

export interface Address {
  name: string
  company?: string
  street1: string
  street2?: string
  city: string
  state?: string
  zip: string
  country: string
  phone?: string
}

export interface Package {
  weight: number
  length: number
  width: number
  height: number
  weightUnit: 'kg' | 'lb'
  dimensionUnit: 'cm' | 'in'
}

export interface Shipment {
  id: string
  trackingNumber: string
  carrier: string
  service: string
  status: 'created' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'failed'
  labelUrl: string
  cost: number
  currency: string
  createdAt: Date
  estimatedDelivery?: Date
}

export interface TrackingEvent {
  timestamp: Date
  status: string
  location: string
  description: string
}

export class MockShippingAdapter extends BaseAdapter {
  private shipments = new Map<string, Shipment>()
  private trackingHistory = new Map<string, TrackingEvent[]>()

  constructor(config: AdapterConfig = {}) {
    super(config)
  }

  async getRates(request: ShipmentRequest): Promise<AdapterResponse<ShippingRate[]>> {
    await this.handleFailureMode()
    await this.simulateDelay(200)

    const totalWeight = request.packages.reduce((sum, pkg) => sum + pkg.weight, 0)
    const distance = this.calculateDistance(request.from, request.to)

    const rates: ShippingRate[] = [
      {
        carrier: 'Aramex',
        service: 'Standard',
        cost: this.calculateCost(totalWeight, distance, 1.0),
        currency: 'USD',
        estimatedDays: 5
      },
      {
        carrier: 'Aramex',
        service: 'Express',
        cost: this.calculateCost(totalWeight, distance, 1.5),
        currency: 'USD',
        estimatedDays: 2
      },
      {
        carrier: 'DHL',
        service: 'Standard',
        cost: this.calculateCost(totalWeight, distance, 1.2),
        currency: 'USD',
        estimatedDays: 4
      },
      {
        carrier: 'DHL',
        service: 'Express',
        cost: this.calculateCost(totalWeight, distance, 2.0),
        currency: 'USD',
        estimatedDays: 1
      }
    ]

    return this.wrapResponse(rates)
  }

  async createShipment(request: ShipmentRequest): Promise<AdapterResponse<Shipment>> {
    await this.handleFailureMode()
    await this.simulateDelay(300)

    const shipmentId = `shp_mock_${Date.now()}_${Math.random().toString(36).substring(7)}`
    const trackingNumber = `TRK${Date.now()}${Math.floor(Math.random() * 10000)}`

    const totalWeight = request.packages.reduce((sum, pkg) => sum + pkg.weight, 0)
    const distance = this.calculateDistance(request.from, request.to)

    const shipment: Shipment = {
      id: shipmentId,
      trackingNumber,
      carrier: 'Aramex',
      service: request.service || 'Standard',
      status: 'created',
      labelUrl: `https://mock-shipping.com/labels/${shipmentId}.pdf`,
      cost: this.calculateCost(totalWeight, distance, 1.0),
      currency: 'USD',
      createdAt: new Date(),
      estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) // 5 days
    }

    this.shipments.set(shipmentId, shipment)
    this.trackingHistory.set(trackingNumber, [
      {
        timestamp: new Date(),
        status: 'created',
        location: `${request.from.city}, ${request.from.country}`,
        description: 'Shipment created'
      }
    ])

    return this.wrapResponse(shipment)
  }

  async trackShipment(trackingNumber: string): Promise<AdapterResponse<TrackingEvent[]>> {
    await this.simulateDelay(150)

    const history = this.trackingHistory.get(trackingNumber)

    if (!history) {
      return this.wrapError('Tracking number not found', 404)
    }

    return this.wrapResponse(history)
  }

  async cancelShipment(shipmentId: string): Promise<AdapterResponse<{ canceled: boolean }>> {
    await this.handleFailureMode()
    await this.simulateDelay(200)

    const shipment = this.shipments.get(shipmentId)

    if (!shipment) {
      return this.wrapError('Shipment not found', 404)
    }

    if (shipment.status !== 'created') {
      return this.wrapError('Cannot cancel shipment in current status', 400)
    }

    this.shipments.delete(shipmentId)

    return this.wrapResponse({ canceled: true })
  }

  /**
   * Calculate shipping cost based on weight and distance
   */
  private calculateCost(weight: number, distance: number, multiplier: number): number {
    const baseCost = 5
    const weightCost = weight * 0.5
    const distanceCost = distance * 0.01
    return Math.round((baseCost + weightCost + distanceCost) * multiplier * 100) / 100
  }

  /**
   * Calculate distance between two addresses (mock implementation)
   */
  private calculateDistance(from: Address, to: Address): number {
    // Mock distance calculation (in km)
    if (from.country !== to.country) {
      return 1000 + Math.random() * 2000
    }
    if (from.city !== to.city) {
      return 100 + Math.random() * 500
    }
    return 10 + Math.random() * 50
  }

  /**
   * Test helper: Clear all shipments
   */
  clearShipments(): void {
    this.shipments.clear()
    this.trackingHistory.clear()
  }

  /**
   * Test helper: Update shipment status
   */
  updateShipmentStatus(
    trackingNumber: string,
    status: Shipment['status'],
    location: string
  ): void {
    const history = this.trackingHistory.get(trackingNumber)
    if (history) {
      history.push({
        timestamp: new Date(),
        status,
        location,
        description: `Status updated to ${status}`
      })
    }
  }
}
