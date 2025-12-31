/**
 * Shipment State Machine
 * Manages shipment lifecycle transitions
 */

export type ShipmentStatus =
  | 'created'
  | 'picked_up'
  | 'in_transit'
  | 'out_for_delivery'
  | 'delivered'
  | 'failed'
  | 'returned'

export interface Shipment {
  id: string
  orderId: string
  status: ShipmentStatus
  trackingNumber?: string
  carrier?: string
  pickupDate?: Date
  estimatedDelivery?: Date
  actualDelivery?: Date
  deliveryProof?: string
  failureReason?: string
  stateHistory: StateTransition[]
}

export interface StateTransition {
  from: ShipmentStatus
  to: ShipmentStatus
  timestamp: Date
  location?: string
  notes?: string
}

export interface TransitionResult {
  success: boolean
  shipment?: Shipment
  error?: string
}

export class ShipmentStateMachine {
  async transition(
    shipment: Shipment,
    newState: ShipmentStatus,
    metadata?: { location?: string; notes?: string }
  ): Promise<TransitionResult> {
    const currentState = shipment.status

    // Validate transition
    if (!this.isValidTransition(currentState, newState)) {
      return {
        success: false,
        error: `Invalid transition from '${currentState}' to '${newState}'`
      }
    }

    // Check conditions
    const conditionCheck = this.checkConditions(shipment, newState)
    if (!conditionCheck.valid) {
      return {
        success: false,
        error: conditionCheck.error
      }
    }

    // Execute transition
    shipment.status = newState
    shipment.stateHistory.push({
      from: currentState,
      to: newState,
      timestamp: new Date(),
      location: metadata?.location,
      notes: metadata?.notes
    })

    // Update timestamps
    if (newState === 'picked_up') {
      shipment.pickupDate = new Date()
    } else if (newState === 'delivered') {
      shipment.actualDelivery = new Date()
    }

    return {
      success: true,
      shipment
    }
  }

  private isValidTransition(from: ShipmentStatus, to: ShipmentStatus): boolean {
    const validTransitions: Record<ShipmentStatus, ShipmentStatus[]> = {
      created: ['picked_up', 'failed'],
      picked_up: ['in_transit', 'failed'],
      in_transit: ['out_for_delivery', 'failed'],
      out_for_delivery: ['delivered', 'failed'],
      delivered: ['returned'],
      failed: ['created'], // Can retry
      returned: []
    }

    return validTransitions[from]?.includes(to) || false
  }

  private checkConditions(
    shipment: Shipment,
    newState: ShipmentStatus
  ): { valid: boolean; error?: string } {
    switch (newState) {
      case 'picked_up':
        if (!shipment.trackingNumber) {
          return { valid: false, error: 'Tracking number required' }
        }
        break

      case 'delivered':
        if (!shipment.actualDelivery && !shipment.deliveryProof) {
          return { valid: false, error: 'Delivery proof required' }
        }
        break

      case 'failed':
        if (!shipment.failureReason) {
          return { valid: false, error: 'Failure reason required' }
        }
        break
    }

    return { valid: true }
  }

  getAllowedTransitions(currentState: ShipmentStatus): ShipmentStatus[] {
    const validTransitions: Record<ShipmentStatus, ShipmentStatus[]> = {
      created: ['picked_up', 'failed'],
      picked_up: ['in_transit', 'failed'],
      in_transit: ['out_for_delivery', 'failed'],
      out_for_delivery: ['delivered', 'failed'],
      delivered: ['returned'],
      failed: ['created'],
      returned: []
    }

    return validTransitions[currentState] || []
  }
}
