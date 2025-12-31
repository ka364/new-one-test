/**
 * Mock Notification Adapter
 * Simulates push notification services (FCM, OneSignal, APNs)
 */

import { BaseAdapter, AdapterResponse, AdapterConfig } from '../base-adapter'

export interface PushNotification {
  title: string
  body: string
  data?: Record<string, any>
  imageUrl?: string
  actionUrl?: string
  badge?: number
  sound?: string
}

export interface NotificationTarget {
  userId?: string
  deviceToken?: string
  topic?: string
  segment?: string
}

export interface NotificationResult {
  id: string
  target: NotificationTarget
  status: 'sent' | 'failed' | 'pending'
  sentAt: Date
  deliveredAt?: Date
  error?: string
}

export class MockNotificationAdapter extends BaseAdapter {
  private notifications: NotificationResult[] = []
  private deviceTokens = new Map<string, string[]>() // userId -> deviceTokens[]

  constructor(config: AdapterConfig = {}) {
    super(config)
  }

  async send(
    notification: PushNotification,
    target: NotificationTarget
  ): Promise<AdapterResponse<NotificationResult>> {
    await this.handleFailureMode()
    await this.simulateDelay(200)

    const result: NotificationResult = {
      id: `notif_mock_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      target,
      status: 'sent',
      sentAt: new Date(),
      deliveredAt: new Date(Date.now() + 1000) // Delivered 1 second later
    }

    this.notifications.push(result)

    return this.wrapResponse(result)
  }

  async sendBatch(
    notification: PushNotification,
    targets: NotificationTarget[]
  ): Promise<AdapterResponse<NotificationResult[]>> {
    await this.handleFailureMode()
    await this.simulateDelay(400)

    const results: NotificationResult[] = []

    for (const target of targets) {
      const result: NotificationResult = {
        id: `notif_mock_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        target,
        status: 'sent',
        sentAt: new Date(),
        deliveredAt: new Date(Date.now() + 1000)
      }
      results.push(result)
      this.notifications.push(result)
    }

    return this.wrapResponse(results)
  }

  async sendToTopic(
    notification: PushNotification,
    topic: string
  ): Promise<AdapterResponse<NotificationResult>> {
    await this.handleFailureMode()
    await this.simulateDelay(250)

    const result: NotificationResult = {
      id: `notif_mock_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      target: { topic },
      status: 'sent',
      sentAt: new Date(),
      deliveredAt: new Date(Date.now() + 1000)
    }

    this.notifications.push(result)

    return this.wrapResponse(result)
  }

  async sendToSegment(
    notification: PushNotification,
    segment: string
  ): Promise<AdapterResponse<NotificationResult>> {
    await this.handleFailureMode()
    await this.simulateDelay(300)

    const result: NotificationResult = {
      id: `notif_mock_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      target: { segment },
      status: 'sent',
      sentAt: new Date(),
      deliveredAt: new Date(Date.now() + 1000)
    }

    this.notifications.push(result)

    return this.wrapResponse(result)
  }

  async registerDevice(userId: string, deviceToken: string): Promise<AdapterResponse<{ registered: boolean }>> {
    await this.simulateDelay(100)

    if (!this.deviceTokens.has(userId)) {
      this.deviceTokens.set(userId, [])
    }

    const tokens = this.deviceTokens.get(userId)!
    if (!tokens.includes(deviceToken)) {
      tokens.push(deviceToken)
    }

    return this.wrapResponse({ registered: true })
  }

  async unregisterDevice(userId: string, deviceToken: string): Promise<AdapterResponse<{ unregistered: boolean }>> {
    await this.simulateDelay(100)

    const tokens = this.deviceTokens.get(userId)

    if (!tokens) {
      return this.wrapError('User not found', 404)
    }

    const index = tokens.indexOf(deviceToken)
    if (index > -1) {
      tokens.splice(index, 1)
    }

    return this.wrapResponse({ unregistered: true })
  }

  async getNotificationStatus(notificationId: string): Promise<AdapterResponse<NotificationResult>> {
    await this.simulateDelay(50)

    const notification = this.notifications.find(n => n.id === notificationId)

    if (!notification) {
      return this.wrapError('Notification not found', 404)
    }

    return this.wrapResponse(notification)
  }

  /**
   * Test helper: Get all sent notifications
   */
  getSentNotifications(): NotificationResult[] {
    return this.notifications
  }

  /**
   * Test helper: Get notifications for user
   */
  getNotificationsForUser(userId: string): NotificationResult[] {
    return this.notifications.filter(n => n.target.userId === userId)
  }

  /**
   * Test helper: Get notifications for topic
   */
  getNotificationsForTopic(topic: string): NotificationResult[] {
    return this.notifications.filter(n => n.target.topic === topic)
  }

  /**
   * Test helper: Clear all notifications
   */
  clearNotifications(): void {
    this.notifications = []
  }

  /**
   * Test helper: Get device tokens for user
   */
  getDeviceTokens(userId: string): string[] {
    return this.deviceTokens.get(userId) || []
  }

  /**
   * Test helper: Get notification count
   */
  getNotificationCount(): number {
    return this.notifications.length
  }
}
