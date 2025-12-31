/**
 * Return State Machine
 * Manages product return lifecycle transitions
 */

export type ReturnStatus =
  | 'requested'
  | 'approved'
  | 'rejected'
  | 'shipped'
  | 'received'
  | 'inspected'
  | 'refunded'
  | 'completed'

export interface Return {
  id: string
  orderId: string
  status: ReturnStatus
  reason: string
  refundAmount?: number
  rejectionReason?: string
  stateHistory: StateTransition[]
}

export interface StateTransition {
  from: ReturnStatus
  to: ReturnStatus
  timestamp: Date
  notes?: string
}

export class ReturnStateMachine {
  async transition(
    returnItem: Return,
    newState: ReturnStatus,
    notes?: string
  ): Promise<{ success: boolean; return?: Return; error?: string }> {
    const currentState = returnItem.status

    const validTransitions: Record<ReturnStatus, ReturnStatus[]> = {
      requested: ['approved', 'rejected'],
      approved: ['shipped'],
      rejected: [],
      shipped: ['received'],
      received: ['inspected'],
      inspected: ['refunded', 'rejected'],
      refunded: ['completed'],
      completed: []
    }

    if (!validTransitions[currentState]?.includes(newState)) {
      return { success: false, error: `Invalid transition from '${currentState}' to '${newState}'` }
    }

    // Conditions
    if (newState === 'rejected' && !notes) {
      return { success: false, error: 'Rejection reason required' }
    }

    if (newState === 'refunded' && !returnItem.refundAmount) {
      return { success: false, error: 'Refund amount required' }
    }

    returnItem.status = newState
    if (newState === 'rejected') {
      returnItem.rejectionReason = notes
    }
    returnItem.stateHistory.push({ from: currentState, to: newState, timestamp: new Date(), notes })

    return { success: true, return: returnItem }
  }
}

/**
 * Subscription State Machine
 * Manages subscription lifecycle transitions
 */

export type SubscriptionStatus =
  | 'trial'
  | 'active'
  | 'past_due'
  | 'paused'
  | 'canceled'
  | 'expired'

export interface Subscription {
  id: string
  userId: string
  status: SubscriptionStatus
  trialEndsAt?: Date
  currentPeriodEnd?: Date
  canceledAt?: Date
  stateHistory: SubscriptionTransition[]
}

export interface SubscriptionTransition {
  from: SubscriptionStatus
  to: SubscriptionStatus
  timestamp: Date
  reason?: string
}

export class SubscriptionStateMachine {
  async transition(
    subscription: Subscription,
    newState: SubscriptionStatus,
    reason?: string
  ): Promise<{ success: boolean; subscription?: Subscription; error?: string }> {
    const currentState = subscription.status

    const validTransitions: Record<SubscriptionStatus, SubscriptionStatus[]> = {
      trial: ['active', 'canceled', 'expired'],
      active: ['past_due', 'paused', 'canceled'],
      past_due: ['active', 'canceled', 'expired'],
      paused: ['active', 'canceled'],
      canceled: [],
      expired: []
    }

    if (!validTransitions[currentState]?.includes(newState)) {
      return { success: false, error: `Invalid transition from '${currentState}' to '${newState}'` }
    }

    subscription.status = newState
    if (newState === 'canceled') {
      subscription.canceledAt = new Date()
    }
    subscription.stateHistory.push({ from: currentState, to: newState, timestamp: new Date(), reason })

    return { success: true, subscription }
  }
}
