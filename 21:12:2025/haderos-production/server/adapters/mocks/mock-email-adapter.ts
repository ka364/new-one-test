/**
 * Mock Email Adapter
 * Simulates email sending (SendGrid, AWS SES, etc.)
 */

import { BaseAdapter, AdapterResponse, AdapterConfig } from '../base-adapter'

export interface EmailMessage {
  to: string | string[]
  from: string
  subject: string
  text?: string
  html?: string
  attachments?: Array<{
    filename: string
    content: string | Buffer
  }>
}

export interface EmailResponse {
  messageId: string
  accepted: string[]
  rejected: string[]
  timestamp: Date
}

export class MockEmailAdapter extends BaseAdapter {
  private sentEmails: Array<EmailMessage & { messageId: string; timestamp: Date }> = []

  constructor(config: AdapterConfig = {}) {
    super(config)
  }

  async send(message: EmailMessage): Promise<AdapterResponse<EmailResponse>> {
    await this.handleFailureMode()
    await this.simulateDelay(150)

    const recipients = Array.isArray(message.to) ? message.to : [message.to]
    const messageId = `msg_mock_${Date.now()}_${Math.random().toString(36).substring(7)}`

    // Store sent email
    this.sentEmails.push({
      ...message,
      messageId,
      timestamp: new Date()
    })

    const response: EmailResponse = {
      messageId,
      accepted: recipients,
      rejected: [],
      timestamp: new Date()
    }

    return this.wrapResponse(response)
  }

  async sendBulk(messages: EmailMessage[]): Promise<AdapterResponse<EmailResponse[]>> {
    await this.handleFailureMode()
    await this.simulateDelay(300)

    const responses: EmailResponse[] = []

    for (const message of messages) {
      const result = await this.send(message)
      if (result.success && result.data) {
        responses.push(result.data)
      }
    }

    return this.wrapResponse(responses)
  }

  /**
   * Test helper: Get all sent emails
   */
  getSentEmails(): Array<EmailMessage & { messageId: string; timestamp: Date }> {
    return this.sentEmails
  }

  /**
   * Test helper: Get emails sent to specific recipient
   */
  getEmailsTo(recipient: string): Array<EmailMessage & { messageId: string; timestamp: Date }> {
    return this.sentEmails.filter(email => {
      const recipients = Array.isArray(email.to) ? email.to : [email.to]
      return recipients.includes(recipient)
    })
  }

  /**
   * Test helper: Clear sent emails
   */
  clearSentEmails(): void {
    this.sentEmails = []
  }

  /**
   * Test helper: Get count of sent emails
   */
  getSentEmailCount(): number {
    return this.sentEmails.length
  }
}
