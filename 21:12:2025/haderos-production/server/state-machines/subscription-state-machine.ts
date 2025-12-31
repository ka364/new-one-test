/**
 * Subscription State Machine
 * Manages subscription lifecycle states
 */

export type SubscriptionState =
  | 'trial'
  | 'active'
  | 'past_due'
  | 'paused'
  | 'canceled'
  | 'expired'

export type SubscriptionTransition =
  | 'activate'
  | 'payment_failed'
  | 'payment_received'
  | 'pause'
  | 'resume'
  | 'cancel'
  | 'expire'

const transitions: Record<SubscriptionState, SubscriptionState[]> = {
  trial: ['active', 'canceled', 'expired'],
  active: ['past_due', 'paused', 'canceled', 'expired'],
  past_due: ['active', 'canceled', 'expired'],
  paused: ['active', 'canceled', 'expired'],
  canceled: ['expired'],
  expired: [],
}

export class SubscriptionStateMachine {
  private currentState: SubscriptionState

  constructor(initialState: SubscriptionState = 'trial') {
    this.currentState = initialState
  }

  getCurrentState(): SubscriptionState {
    return this.currentState
  }

  canTransitionTo(newState: SubscriptionState): boolean {
    return transitions[this.currentState].includes(newState)
  }

  transition(action: SubscriptionTransition): SubscriptionState {
    let newState: SubscriptionState

    switch (action) {
      case 'activate':
        newState = 'active'
        break
      case 'payment_failed':
        newState = 'past_due'
        break
      case 'payment_received':
        newState = 'active'
        break
      case 'pause':
        newState = 'paused'
        break
      case 'resume':
        newState = 'active'
        break
      case 'cancel':
        newState = 'canceled'
        break
      case 'expire':
        newState = 'expired'
        break
      default:
        throw new Error(`Unknown action: ${action}`)
    }

    if (!this.canTransitionTo(newState)) {
      throw new Error(
        `Cannot transition from ${this.currentState} to ${newState}`
      )
    }

    this.currentState = newState
    return this.currentState
  }

  // Helper methods
  isActive(): boolean {
    return this.currentState === 'active' || this.currentState === 'trial'
  }

  canUseService(): boolean {
    return this.isActive() || this.currentState === 'past_due'
  }

  needsPayment(): boolean {
    return this.currentState === 'past_due'
  }
}
