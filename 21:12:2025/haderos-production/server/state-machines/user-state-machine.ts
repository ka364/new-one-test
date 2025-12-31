/**
 * User State Machine
 * Manages user account lifecycle transitions
 */

export type UserStatus =
  | 'pending_verification'
  | 'active'
  | 'suspended'
  | 'deactivated'
  | 'deleted'

export interface User {
  id: string
  status: UserStatus
  emailVerified: boolean
  suspensionReason?: string
  stateHistory: StateTransition[]
}

export interface StateTransition {
  from: UserStatus
  to: UserStatus
  timestamp: Date
  reason?: string
}

export class UserStateMachine {
  async transition(
    user: User,
    newState: UserStatus,
    reason?: string
  ): Promise<{ success: boolean; user?: User; error?: string }> {
    const currentState = user.status

    const validTransitions: Record<UserStatus, UserStatus[]> = {
      pending_verification: ['active', 'deleted'],
      active: ['suspended', 'deactivated', 'deleted'],
      suspended: ['active', 'deleted'],
      deactivated: ['active', 'deleted'],
      deleted: []
    }

    if (!validTransitions[currentState]?.includes(newState)) {
      return { success: false, error: `Invalid transition from '${currentState}' to '${newState}'` }
    }

    // Conditions
    if (newState === 'active' && !user.emailVerified) {
      return { success: false, error: 'Email must be verified' }
    }

    if (newState === 'suspended' && !reason) {
      return { success: false, error: 'Suspension reason required' }
    }

    user.status = newState
    if (newState === 'suspended') {
      user.suspensionReason = reason
    }
    user.stateHistory.push({ from: currentState, to: newState, timestamp: new Date(), reason })

    return { success: true, user }
  }
}
