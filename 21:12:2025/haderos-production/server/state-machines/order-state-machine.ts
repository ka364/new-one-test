/**
 * Order State Machine
 * Manages order lifecycle transitions with validation
 */

export type OrderStatus =
  | 'draft'
  | 'pending_payment'
  | 'paid'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded'

export interface Order {
  id: string
  status: OrderStatus
  items: Array<{ productId: string; quantity: number; price: number }>
  shippingAddress?: any
  paymentConfirmed?: boolean
  paymentAmount?: number
  total: number
  inventoryReserved?: boolean
  onHold?: boolean
  trackingNumber?: string
  shippedAt?: Date
  deliveredAt?: Date
  deliveryConfirmed?: boolean
  updatedBy?: string
  stateHistory: StateTransition[]
}

export interface StateTransition {
  from: OrderStatus
  to: OrderStatus
  timestamp: Date
  userId?: string
  reason?: string
}

export interface TransitionRule {
  from: OrderStatus
  to: OrderStatus
  condition: (order: Order) => boolean | Promise<boolean>
  onTransition?: (order: Order) => void | Promise<void>
}

export interface TransitionResult {
  success: boolean
  order?: Order
  error?: string
  transition?: {
    from: OrderStatus
    to: OrderStatus
    timestamp: Date
  }
}

export class OrderStateMachine {
  private transitions: TransitionRule[] = []

  constructor() {
    this.initializeTransitions()
  }

  private initializeTransitions(): void {
    // Draft -> Pending Payment
    this.addTransition({
      from: 'draft',
      to: 'pending_payment',
      condition: (order) => {
        return order.items.length > 0 && !!order.shippingAddress
      }
    })

    // Pending Payment -> Paid
    this.addTransition({
      from: 'pending_payment',
      to: 'paid',
      condition: (order) => {
        return !!order.paymentConfirmed && (order.paymentAmount || 0) >= order.total
      }
    })

    // Paid -> Processing
    this.addTransition({
      from: 'paid',
      to: 'processing',
      condition: (order) => {
        return !!order.inventoryReserved && !order.onHold
      }
    })

    // Processing -> Shipped
    this.addTransition({
      from: 'processing',
      to: 'shipped',
      condition: (order) => {
        return !!order.trackingNumber && !!order.shippedAt
      }
    })

    // Shipped -> Delivered
    this.addTransition({
      from: 'shipped',
      to: 'delivered',
      condition: (order) => {
        return !!order.deliveredAt && !!order.deliveryConfirmed
      }
    })

    // Any -> Cancelled (with restrictions)
    this.addTransition({
      from: 'draft',
      to: 'cancelled',
      condition: () => true
    })

    this.addTransition({
      from: 'pending_payment',
      to: 'cancelled',
      condition: () => true
    })

    this.addTransition({
      from: 'paid',
      to: 'cancelled',
      condition: (order) => {
        // Can only cancel paid orders if not yet processed
        return !order.inventoryReserved
      }
    })

    // Paid/Delivered -> Refunded
    this.addTransition({
      from: 'paid',
      to: 'refunded',
      condition: () => true
    })

    this.addTransition({
      from: 'delivered',
      to: 'refunded',
      condition: () => true
    })
  }

  private addTransition(rule: TransitionRule): void {
    this.transitions.push(rule)
  }

  /**
   * Attempt to transition order to new state
   */
  async transition(order: Order, newState: OrderStatus, userId?: string): Promise<TransitionResult> {
    const currentState = order.status

    // Check if transition is allowed
    const rule = this.transitions.find(
      t => t.from === currentState && t.to === newState
    )

    if (!rule) {
      return {
        success: false,
        error: `Transition from '${currentState}' to '${newState}' is not allowed`
      }
    }

    // Check conditions
    const conditionsMet = await rule.condition(order)

    if (!conditionsMet) {
      return {
        success: false,
        error: `Conditions not met for transition from '${currentState}' to '${newState}'`
      }
    }

    // Execute transition
    const previousStatus = order.status
    order.status = newState

    // Record transition in history
    const transition: StateTransition = {
      from: previousStatus,
      to: newState,
      timestamp: new Date(),
      userId
    }

    order.stateHistory.push(transition)

    // Execute post-transition hook
    if (rule.onTransition) {
      await rule.onTransition(order)
    }

    return {
      success: true,
      order,
      transition
    }
  }

  /**
   * Get allowed transitions for current state
   */
  getAllowedTransitions(currentState: OrderStatus): OrderStatus[] {
    return this.transitions
      .filter(t => t.from === currentState)
      .map(t => t.to)
  }

  /**
   * Check if transition is allowed
   */
  canTransition(from: OrderStatus, to: OrderStatus): boolean {
    return this.transitions.some(t => t.from === from && t.to === to)
  }

  /**
   * Validate order state
   */
  validateState(order: Order): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    switch (order.status) {
      case 'draft':
        if (order.items.length === 0) {
          errors.push('Draft order must have at least one item')
        }
        break

      case 'pending_payment':
        if (!order.shippingAddress) {
          errors.push('Pending payment order must have shipping address')
        }
        break

      case 'paid':
        if (!order.paymentConfirmed) {
          errors.push('Paid order must have payment confirmation')
        }
        if ((order.paymentAmount || 0) < order.total) {
          errors.push('Payment amount must be >= order total')
        }
        break

      case 'processing':
        if (!order.inventoryReserved) {
          errors.push('Processing order must have inventory reserved')
        }
        break

      case 'shipped':
        if (!order.trackingNumber) {
          errors.push('Shipped order must have tracking number')
        }
        break

      case 'delivered':
        if (!order.deliveredAt) {
          errors.push('Delivered order must have delivery date')
        }
        break
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }
}
