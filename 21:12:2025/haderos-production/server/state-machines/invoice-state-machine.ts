/**
 * Invoice State Machine
 * Manages invoice lifecycle transitions
 */

export type InvoiceStatus =
  | 'draft'
  | 'sent'
  | 'viewed'
  | 'paid'
  | 'partially_paid'
  | 'overdue'
  | 'cancelled'
  | 'refunded'

export interface Invoice {
  id: string
  orderId: string
  status: InvoiceStatus
  totalAmount: number
  paidAmount: number
  dueDate?: Date
  sentDate?: Date
  paidDate?: Date
  paymentMethod?: string
  stateHistory: StateTransition[]
}

export interface StateTransition {
  from: InvoiceStatus
  to: InvoiceStatus
  timestamp: Date
  amount?: number
  notes?: string
}

export interface TransitionResult {
  success: boolean
  invoice?: Invoice
  error?: string
}

export class InvoiceStateMachine {
  async transition(
    invoice: Invoice,
    newState: InvoiceStatus,
    metadata?: { amount?: number; notes?: string }
  ): Promise<TransitionResult> {
    const currentState = invoice.status

    if (!this.isValidTransition(currentState, newState)) {
      return {
        success: false,
        error: `Invalid transition from '${currentState}' to '${newState}'`
      }
    }

    const conditionCheck = this.checkConditions(invoice, newState, metadata)
    if (!conditionCheck.valid) {
      return {
        success: false,
        error: conditionCheck.error
      }
    }

    invoice.status = newState
    invoice.stateHistory.push({
      from: currentState,
      to: newState,
      timestamp: new Date(),
      amount: metadata?.amount,
      notes: metadata?.notes
    })

    // Update fields based on state
    if (newState === 'sent') {
      invoice.sentDate = new Date()
    } else if (newState === 'paid') {
      invoice.paidDate = new Date()
      invoice.paidAmount = invoice.totalAmount
    } else if (newState === 'partially_paid' && metadata?.amount) {
      invoice.paidAmount += metadata.amount
    }

    return {
      success: true,
      invoice
    }
  }

  private isValidTransition(from: InvoiceStatus, to: InvoiceStatus): boolean {
    const validTransitions: Record<InvoiceStatus, InvoiceStatus[]> = {
      draft: ['sent', 'cancelled'],
      sent: ['viewed', 'paid', 'partially_paid', 'overdue', 'cancelled'],
      viewed: ['paid', 'partially_paid', 'overdue', 'cancelled'],
      paid: ['refunded'],
      partially_paid: ['paid', 'overdue', 'cancelled'],
      overdue: ['paid', 'partially_paid', 'cancelled'],
      cancelled: [],
      refunded: []
    }

    return validTransitions[from]?.includes(to) || false
  }

  private checkConditions(
    invoice: Invoice,
    newState: InvoiceStatus,
    metadata?: { amount?: number }
  ): { valid: boolean; error?: string } {
    switch (newState) {
      case 'sent':
        if (!invoice.dueDate) {
          return { valid: false, error: 'Due date required' }
        }
        break

      case 'partially_paid':
        if (!metadata?.amount || metadata.amount <= 0) {
          return { valid: false, error: 'Payment amount required' }
        }
        if (metadata.amount >= invoice.totalAmount - invoice.paidAmount) {
          return { valid: false, error: 'Amount too large for partial payment' }
        }
        break

      case 'paid':
        const remaining = invoice.totalAmount - invoice.paidAmount
        if (remaining > 0 && !metadata?.amount) {
          return { valid: false, error: 'Final payment amount required' }
        }
        break

      case 'overdue':
        if (!invoice.dueDate || invoice.dueDate > new Date()) {
          return { valid: false, error: 'Invoice not yet due' }
        }
        break
    }

    return { valid: true }
  }

  getAllowedTransitions(currentState: InvoiceStatus): InvoiceStatus[] {
    const validTransitions: Record<InvoiceStatus, InvoiceStatus[]> = {
      draft: ['sent', 'cancelled'],
      sent: ['viewed', 'paid', 'partially_paid', 'overdue', 'cancelled'],
      viewed: ['paid', 'partially_paid', 'overdue', 'cancelled'],
      paid: ['refunded'],
      partially_paid: ['paid', 'overdue', 'cancelled'],
      overdue: ['paid', 'partially_paid', 'cancelled'],
      cancelled: [],
      refunded: []
    }

    return validTransitions[currentState] || []
  }

  getRemainingAmount(invoice: Invoice): number {
    return invoice.totalAmount - invoice.paidAmount
  }

  isOverdue(invoice: Invoice): boolean {
    return (
      invoice.status !== 'paid' &&
      invoice.status !== 'cancelled' &&
      invoice.dueDate !== undefined &&
      invoice.dueDate < new Date()
    )
  }
}
