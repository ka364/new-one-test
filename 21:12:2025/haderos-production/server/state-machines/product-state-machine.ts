/**
 * Product State Machine
 * Manages product lifecycle transitions
 */

export type ProductStatus = 'draft' | 'active' | 'out_of_stock' | 'discontinued' | 'archived'

export interface Product {
  id: string
  status: ProductStatus
  stock: number
  isPublished: boolean
  stateHistory: StateTransition[]
}

export interface StateTransition {
  from: ProductStatus
  to: ProductStatus
  timestamp: Date
  reason?: string
}

export class ProductStateMachine {
  async transition(
    product: Product,
    newState: ProductStatus,
    reason?: string
  ): Promise<{ success: boolean; product?: Product; error?: string }> {
    const currentState = product.status

    const validTransitions: Record<ProductStatus, ProductStatus[]> = {
      draft: ['active', 'archived'],
      active: ['out_of_stock', 'discontinued', 'archived'],
      out_of_stock: ['active', 'discontinued', 'archived'],
      discontinued: ['archived'],
      archived: []
    }

    if (!validTransitions[currentState]?.includes(newState)) {
      return { success: false, error: `Invalid transition from '${currentState}' to '${newState}'` }
    }

    // Conditions
    if (newState === 'active' && product.stock === 0) {
      return { success: false, error: 'Cannot activate product with zero stock' }
    }

    product.status = newState
    product.stateHistory.push({ from: currentState, to: newState, timestamp: new Date(), reason })

    return { success: true, product }
  }
}
