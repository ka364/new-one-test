/**
 * COD Workflow Service
 * 
 * Manages the 8-stage COD workflow:
 * 1. pending - الطلب الجديد
 * 2. customerService - خدمة العملاء (Call Center)
 * 3. confirmation - التأكيد
 * 4. preparation - التحضير
 * 5. supplier - تنسيق الموردين
 * 6. shipping - توزيع الشحن
 * 7. delivery - التسليم
 * 8. collection - التحصيل
 * 9. settlement - التسوية
 * 
 * Features:
 * - Strict TypeScript typing
 * - Stage validation and transitions
 * - Automatic logging of all stage changes
 * - Timeline generation
 * - Notification triggers
 * 
 * @module CODWorkflowService
 */

import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { getDb } from '../db';
import { codOrders, codWorkflowLogs, type InsertCODWorkflowLog } from '../../drizzle/schema';
import { codOrderService, OrderNotFoundError } from './cod-order.service';

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * COD workflow stages in order
 */
export const COD_STAGES = [
  'pending',
  'customerService',
  'confirmation',
  'preparation',
  'supplier',
  'shipping',
  'delivery',
  'collection',
  'settlement',
] as const;

export type CODStage = typeof COD_STAGES[number];

/**
 * Stage display names in Arabic
 */
export const STAGE_NAMES: Record<CODStage, string> = {
  pending: 'طلب جديد',
  customerService: 'خدمة العملاء',
  confirmation: 'التأكيد',
  preparation: 'التحضير',
  supplier: 'تنسيق الموردين',
  shipping: 'توزيع الشحن',
  delivery: 'التسليم',
  collection: 'التحصيل',
  settlement: 'التسوية',
};

/**
 * Valid stage transitions
 * Each stage can only transition to specific next stages
 */
export const STAGE_TRANSITIONS: Record<CODStage, CODStage[]> = {
  pending: ['customerService'],
  customerService: ['confirmation', 'pending'], // Can go back if customer doesn't answer
  confirmation: ['preparation', 'customerService'], // Can go back to retry confirmation
  preparation: ['supplier', 'confirmation'], // Can go back if preparation issues
  supplier: ['shipping', 'preparation'], // Can go back if supplier issues
  shipping: ['delivery', 'supplier'], // Can go back if shipping issues
  delivery: ['collection', 'shipping'], // Can go back if delivery failed
  collection: ['settlement', 'delivery'], // Can go back if collection failed
  settlement: [], // Final stage
};

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

/**
 * Update stage validation schema
 */
export const updateStageSchema = z.object({
  orderId: z.string().min(1),
  stage: z.enum(COD_STAGES),
  agentId: z.string().optional(),
  notes: z.string().optional(),
  data: z.record(z.unknown()).optional(),
});

export type UpdateStageInput = z.infer<typeof updateStageSchema>;

// ============================================================================
// ERRORS
// ============================================================================

export class WorkflowError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'WorkflowError';
  }
}

export class InvalidStageTransitionError extends WorkflowError {
  constructor(from: CODStage, to: CODStage) {
    super(
      `لا يمكن الانتقال من ${STAGE_NAMES[from]} إلى ${STAGE_NAMES[to]}`,
      'INVALID_STAGE_TRANSITION',
      { from, to, validTransitions: STAGE_TRANSITIONS[from] }
    );
    this.name = 'InvalidStageTransitionError';
  }
}

// ============================================================================
// SERVICE CLASS
// ============================================================================

export class CODWorkflowService {
  /**
   * Update order stage
   * 
   * @param input - Stage update data
   * @returns Updated order
   * @throws {OrderNotFoundError} If order does not exist
   * @throws {InvalidStageTransitionError} If stage transition is invalid
   * 
   * @example
   * ```typescript
   * await workflowService.updateStage({
   *   orderId: 'ORD-001',
   *   stage: 'confirmation',
   *   agentId: 'agent-123',
   *   notes: 'تم التأكيد مع العميل',
   * });
   * ```
   */
  async updateStage(input: unknown) {
    try {
      // Validate input
      const validated = updateStageSchema.parse(input);

      const db = await getDb();
      if (!db) {
        throw new WorkflowError(
          'قاعدة البيانات غير متاحة',
          'DATABASE_UNAVAILABLE'
        );
      }

      // Get current order
      const order = await codOrderService.getOrder(validated.orderId);
      if (!order) {
        throw new OrderNotFoundError(validated.orderId);
      }

      // Validate stage transition
      const currentStage = order.currentStage as CODStage;
      const newStage = validated.stage;

      if (currentStage !== newStage) {
        const validTransitions = STAGE_TRANSITIONS[currentStage];
        if (!validTransitions.includes(newStage)) {
          throw new InvalidStageTransitionError(currentStage, newStage);
        }
      }

      // Update order stage
      const now = new Date().toISOString();
      const stages = order.stages as Record<string, {
        updatedAt: string;
        agentId?: string;
        notes?: string;
        [key: string]: unknown;
      }>;

      stages[newStage] = {
        updatedAt: now,
        agentId: validated.agentId,
        notes: validated.notes,
        ...validated.data,
      };

      await db
        .update(codOrders)
        .set({
          currentStage: newStage,
          stages,
        })
        .where(eq(codOrders.orderId, validated.orderId));

      // Log stage change
      await this.logStageChange({
        orderId: validated.orderId,
        stage: newStage,
        status: 'updated',
        description: `تم الانتقال من ${STAGE_NAMES[currentStage]} إلى ${STAGE_NAMES[newStage]}`,
        data: {
          previousStage: currentStage,
          newStage,
          agentId: validated.agentId,
          notes: validated.notes,
          ...validated.data,
        },
        agentId: validated.agentId,
      });

      console.log('[CODWorkflowService] Stage updated', {
        orderId: validated.orderId,
        from: currentStage,
        to: newStage,
      });

      // Return updated order
      return await codOrderService.getOrder(validated.orderId);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new WorkflowError(
          'بيانات المرحلة غير صحيحة',
          'VALIDATION_ERROR',
          error.issues
        );
      }
      throw error;
    }
  }

  /**
   * Log stage change
   * 
   * @param log - Log data
   * @returns Log ID
   * 
   * @example
   * ```typescript
   * await workflowService.logStageChange({
   *   orderId: 'ORD-001',
   *   stage: 'confirmation',
   *   status: 'updated',
   *   description: 'تم التأكيد',
   * });
   * ```
   */
  async logStageChange(log: {
    orderId: string;
    stage: string;
    status: string;
    description?: string;
    data?: Record<string, unknown>;
    agentId?: string;
  }) {
    const db = await getDb();
    if (!db) {
      throw new WorkflowError(
        'قاعدة البيانات غير متاحة',
        'DATABASE_UNAVAILABLE'
      );
    }

    const logData: InsertCODWorkflowLog = {
      orderId: log.orderId,
      stage: log.stage,
      status: log.status,
      description: log.description || null,
      data: log.data || null,
      agentId: log.agentId || null,
    };

    const [result] = await db.insert(codWorkflowLogs).values(logData);

    return Number(result.insertId);
  }

  /**
   * Get order timeline
   * 
   * @param orderId - Order ID
   * @returns Timeline of all stage changes
   * 
   * @example
   * ```typescript
   * const timeline = await workflowService.getTimeline('ORD-001');
   * console.log(timeline); // [{ stage, updatedAt, agentId, ... }]
   * ```
   */
  async getTimeline(orderId: string) {
    const db = await getDb();
    if (!db) {
      throw new WorkflowError(
        'قاعدة البيانات غير متاحة',
        'DATABASE_UNAVAILABLE'
      );
    }

    const logs = await db
      .select()
      .from(codWorkflowLogs)
      .where(eq(codWorkflowLogs.orderId, orderId))
      .orderBy(codWorkflowLogs.createdAt);

    return logs.map(log => ({
      stage: log.stage,
      stageName: STAGE_NAMES[log.stage as CODStage] || log.stage,
      status: log.status,
      description: log.description,
      data: log.data,
      agentId: log.agentId,
      createdAt: log.createdAt,
    }));
  }

  /**
   * Get current stage info
   * 
   * @param orderId - Order ID
   * @returns Current stage information
   * 
   * @example
   * ```typescript
   * const info = await workflowService.getCurrentStage('ORD-001');
   * console.log(info.stageName); // "التأكيد"
   * ```
   */
  async getCurrentStage(orderId: string) {
    const order = await codOrderService.getOrder(orderId);
    if (!order) {
      throw new OrderNotFoundError(orderId);
    }

    const currentStage = order.currentStage as CODStage;
    const stages = order.stages as Record<string, {
      updatedAt: string;
      agentId?: string;
      notes?: string;
      [key: string]: unknown;
    }>;

    return {
      stage: currentStage,
      stageName: STAGE_NAMES[currentStage],
      stageData: stages[currentStage],
      validNextStages: STAGE_TRANSITIONS[currentStage].map(s => ({
        stage: s,
        stageName: STAGE_NAMES[s],
      })),
    };
  }

  /**
   * Check if stage transition is valid
   * 
   * @param from - Current stage
   * @param to - Target stage
   * @returns True if transition is valid
   * 
   * @example
   * ```typescript
   * const isValid = workflowService.isValidTransition('pending', 'customerService');
   * console.log(isValid); // true
   * ```
   */
  isValidTransition(from: CODStage, to: CODStage): boolean {
    return STAGE_TRANSITIONS[from].includes(to);
  }

  /**
   * Get all stages with their names
   * 
   * @returns List of all stages
   * 
   * @example
   * ```typescript
   * const stages = workflowService.getAllStages();
   * console.log(stages); // [{ stage: 'pending', name: 'طلب جديد' }, ...]
   * ```
   */
  getAllStages() {
    return COD_STAGES.map(stage => ({
      stage,
      name: STAGE_NAMES[stage],
    }));
  }
}

// Export singleton instance
export const codWorkflowService = new CODWorkflowService();
