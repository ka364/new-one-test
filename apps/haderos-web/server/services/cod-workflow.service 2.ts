// @ts-nocheck
/**
 * COD Workflow Service
 * Manages the 8-stage COD order workflow
 */

import { requireDb } from '../db';
import { codOrders, trackingLogs } from '../../drizzle/schema';
import { eq, desc, and, gte, lte } from 'drizzle-orm';

export class CODWorkflowService {
  /**
   * Create a new COD order
   */
  async createCODOrder(orderData: {
    orderId: string;
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    shippingAddress: {
      governorate: string;
      city: string;
      area: string;
      street: string;
      building: string;
      floor: string;
      apartment: string;
      notes?: string;
    };
    orderAmount: number;
    codAmount: number;
  }) {
    const db = await requireDb();

    const [order] = await db.insert(codOrders).values({
      orderId: orderData.orderId,
      customerName: orderData.customerName,
      customerPhone: orderData.customerPhone,
      customerEmail: orderData.customerEmail,
      shippingAddress: orderData.shippingAddress,
      orderAmount: orderData.orderAmount.toString(),
      codAmount: orderData.codAmount.toString(),
      currentStage: 'pending',
      status: 'pending',
      stages: {},
      notifications: [],
    });

    // Log creation
    await this.logTracking(order.insertId, 'pending', 'created', 'Order created');

    return { success: true, orderId: orderData.orderId, id: order.insertId };
  }

  /**
   * Update COD order stage
   */
  async updateStage(orderId: string, stage: string, data: any) {
    const db = await requireDb();

    // Get current order
    const [order] = await db.select().from(codOrders).where(eq(codOrders.orderId, orderId));

    if (!order) {
      throw new Error('الطلب غير موجود');
    }

    // Update stages JSON
    const stages = order.stages || {};
    stages[stage] = {
      ...data,
      updatedAt: new Date().toISOString(),
    };

    // Update order
    await db
      .update(codOrders)
      .set({
        stages,
        currentStage: stage,
        status: this.getStatusFromStage(stage),
      })
      .where(eq(codOrders.orderId, orderId));

    // Log the update
    await this.logTracking(order.id, stage, 'updated', `Stage ${stage} updated`, data.agentId);

    // Send notifications
    await this.sendStageNotifications(orderId, stage, data);

    return { success: true, stage, updatedAt: new Date() };
  }

  /**
   * Get tracking status
   */
  async getTrackingStatus(orderId: string) {
    const db = await requireDb();

    const [order] = await db.select().from(codOrders).where(eq(codOrders.orderId, orderId));

    if (!order) {
      throw new Error('الطلب غير موجود');
    }

    // Get tracking logs
    const logs = await db
      .select()
      .from(trackingLogs)
      .where(eq(trackingLogs.codOrderId, order.id))
      .orderBy(desc(trackingLogs.createdAt));

    return {
      order,
      trackingLogs: logs,
      timeline: this.generateTimeline(order, logs),
    };
  }

  /**
   * Generate timeline from order and logs
   */
  private generateTimeline(order: any, logs: any[]) {
    const timeline = [];
    const stages = order.stages || {};

    // Add stages from JSON
    for (const [stage, data] of Object.entries(stages)) {
      if (data && typeof data === 'object' && 'updatedAt' in (data as any)) {
        timeline.push({
          stage,
          timestamp: (data as any).updatedAt,
          data,
          type: 'stage_update',
        });
      }
    }

    // Add tracking logs
    logs.forEach((log) => {
      timeline.push({
        stage: log.stage,
        timestamp: log.createdAt,
        description: log.description,
        agentId: log.agentId,
        type: 'tracking_log',
      });
    });

    // Sort by date
    timeline.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return timeline;
  }

  /**
   * Log tracking event
   */
  private async logTracking(
    codOrderId: number,
    stage: string,
    status: string,
    description: string,
    agentId?: string
  ) {
    const db = await requireDb();

    await db.insert(trackingLogs).values({
      codOrderId,
      stage,
      status,
      description,
      agentId,
    });
  }

  /**
   * Send stage notifications
   */
  private async sendStageNotifications(orderId: string, stage: string, data: any) {
    const db = await requireDb();
    const [order] = await db.select().from(codOrders).where(eq(codOrders.orderId, orderId));

    if (!order) return;

    const notifications = [];

    switch (stage) {
      case 'confirmation':
        if (data.confirmed) {
          notifications.push({
            type: 'order_confirmed',
            channel: 'sms' as const,
            template: `تم تأكيد طلبك #${orderId}. شكراً لتسوقك معنا!`,
          });
        }
        break;

      case 'shipping':
        if (order.trackingNumber) {
          notifications.push({
            type: 'shipped',
            channel: 'sms' as const,
            template: `تم شحن طلبك #${orderId}. رقم التتبع: ${order.trackingNumber}`,
          });
        }
        break;

      case 'delivery':
        notifications.push({
          type: 'delivered',
          channel: 'sms' as const,
          template: `تم توصيل طلبك #${orderId}. شكراً لتسوقك معنا!`,
        });
        break;

      case 'collection':
        notifications.push({
          type: 'cash_collected',
          channel: 'whatsapp' as const,
          template: `تم تحصيل مبلغ ${order.codAmount} ج.م لطلب #${orderId}`,
        });
        break;
    }

    // Save notifications
    const currentNotifications = order.notifications || [];
    const updatedNotifications = [
      ...currentNotifications,
      ...notifications.map((n) => ({
        ...n,
        sentAt: new Date().toISOString(),
        status: 'sent' as const,
      })),
    ];

    await db
      .update(codOrders)
      .set({ notifications: updatedNotifications })
      .where(eq(codOrders.orderId, orderId));
  }

  /**
   * Get status from stage
   */
  private getStatusFromStage(stage: string): 'pending' | 'in_progress' | 'completed' | 'cancelled' {
    const stageStatusMap: Record<string, 'pending' | 'in_progress' | 'completed' | 'cancelled'> = {
      pending: 'pending',
      customerService: 'in_progress',
      confirmation: 'in_progress',
      preparation: 'in_progress',
      supplier: 'in_progress',
      shipping: 'in_progress',
      delivery: 'in_progress',
      collection: 'in_progress',
      settlement: 'completed',
    };

    return stageStatusMap[stage] || 'pending';
  }

  /**
   * Generate COD report
   */
  async generateReport(startDate: Date, endDate: Date) {
    const db = await requireDb();

    const ordersInRange = await db
      .select()
      .from(codOrders)
      .where(
        and(
          gte(codOrders.createdAt, startDate.toISOString()),
          lte(codOrders.createdAt, endDate.toISOString())
        )
      );

    const report = {
      totalOrders: ordersInRange.length,
      totalCODValue: ordersInRange.reduce((sum, order) => sum + Number(order.codAmount || 0), 0),
      byStage: {} as Record<string, number>,
      byStatus: {} as Record<string, number>,
      collectionRate: 0,
      settlementRate: 0,
    };

    // Group by stage
    ordersInRange.forEach((order) => {
      const stage = order.currentStage || 'unknown';
      report.byStage[stage] = (report.byStage[stage] || 0) + 1;

      const status = order.status || 'unknown';
      report.byStatus[status] = (report.byStatus[status] || 0) + 1;
    });

    // Calculate rates
    const collectedOrders = ordersInRange.filter(
      (order) => order.stages?.collection?.collected
    ).length;

    const settledOrders = ordersInRange.filter((order) => order.stages?.settlement?.settled).length;

    report.collectionRate =
      ordersInRange.length > 0 ? (collectedOrders / ordersInRange.length) * 100 : 0;

    report.settlementRate = collectedOrders > 0 ? (settledOrders / collectedOrders) * 100 : 0;

    return report;
  }
}

export const codWorkflowService = new CODWorkflowService();
