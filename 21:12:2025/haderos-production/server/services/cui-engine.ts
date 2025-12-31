/**
 * Conversational UI Engine
 * 
 * Enables users to interact with HADEROS using natural language commands.
 * Instead of navigating complex UIs, users can simply chat with the system.
 */

import { UnifiedAIService } from '../_core/ai-service';

export type Intent =
  | 'create_order'
  | 'check_stock'
  | 'generate_report'
  | 'update_product'
  | 'view_customer'
  | 'create_invoice'
  | 'track_shipment'
  | 'unknown';

export interface Entity {
  name: string;
  value: any;
  confidence: number;
}

export interface ParsedCommand {
  intent: Intent;
  entities: Entity[];
  confidence: number;
  rawText: string;
}

export interface ConversationState {
  id: string;
  userId: string;
  intent: Intent;
  collectedParams: Record<string, any>;
  requiredParams: string[];
  currentStep: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface UIComponent {
  type: 'text' | 'dropdown' | 'date_picker' | 'number_input' | 'button_group' | 'file_upload';
  label: string;
  paramName: string;
  options?: Array<{ label: string; value: any }>;
  placeholder?: string;
  validation?: {
    min?: number;
    max?: number;
    required?: boolean;
    pattern?: string;
  };
}

export interface OutputFormat {
  id: string;
  label: string;
  description: string;
  icon: string;
  format: 'table' | 'cards' | 'chart' | 'list' | 'timeline' | 'kanban' | 'calendar' | 'map';
  recommended?: boolean;
}

export interface CUIResponse {
  message: string;
  uiComponents?: UIComponent[];
  completed: boolean;
  result?: any;
  error?: string;
  outputFormats?: OutputFormat[];
  data?: any;
}

/**
 * Command Parser
 * Uses AI to extract intent and entities from natural language
 */
export class CommandParser {
  private aiService: UnifiedAIService;

  constructor() {
    this.aiService = new UnifiedAIService();
  }

  async parse(text: string): Promise<ParsedCommand> {
    const systemPrompt = `أنت محلل أوامر ذكي لنظام HADEROS. مهمتك هي استخراج النية (Intent) والكيانات (Entities) من النص.

الأوامر المتاحة:
- create_order: إنشاء طلب جديد (كيانات: product_name, quantity, customer_id)
- check_stock: فحص المخزون (كيانات: product_name)
- generate_report: إنشاء تقرير (كيانات: report_type, date_range)
- update_product: تحديث منتج (كيانات: product_id, field, value)
- view_customer: عرض بيانات عميل (كيانات: customer_id or customer_name)
- create_invoice: إنشاء فاتورة (كيانات: order_id)
- track_shipment: تتبع شحنة (كيانات: shipment_id or tracking_number)

أجب بصيغة JSON فقط:
{
  "intent": "...",
  "entities": [{"name": "...", "value": "...", "confidence": 0.95}],
  "confidence": 0.9
}`;

    try {
      const response = await this.aiService.generateResponse([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: text }
      ], {
        autoSelect: true,
        maxCost: 0.01
      });

      // Parse JSON response
      const parsed = JSON.parse(response.content);

      return {
        intent: parsed.intent || 'unknown',
        entities: parsed.entities || [],
        confidence: parsed.confidence || 0,
        rawText: text
      };
    } catch (error) {
      console.error('Command parsing error:', error);
      return {
        intent: 'unknown',
        entities: [],
        confidence: 0,
        rawText: text
      };
    }
  }
}

/**
 * State Manager
 * Manages conversation state and tracks progress
 */
export class StateManager {
  private states: Map<string, ConversationState> = new Map();

  createState(userId: string, intent: Intent): ConversationState {
    const id = `state_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const requiredParams = this.getRequiredParams(intent);

    const state: ConversationState = {
      id,
      userId,
      intent,
      collectedParams: {},
      requiredParams,
      currentStep: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.states.set(id, state);
    return state;
  }

  getState(stateId: string): ConversationState | undefined {
    return this.states.get(stateId);
  }

  updateState(stateId: string, paramName: string, value: any): ConversationState | undefined {
    const state = this.states.get(stateId);
    if (!state) return undefined;

    state.collectedParams[paramName] = value;
    state.currentStep++;
    state.updatedAt = new Date();

    return state;
  }

  isComplete(stateId: string): boolean {
    const state = this.states.get(stateId);
    if (!state) return false;

    return state.requiredParams.every(param => param in state.collectedParams);
  }

  deleteState(stateId: string): void {
    this.states.delete(stateId);
  }

  private getRequiredParams(intent: Intent): string[] {
    const paramMap: Record<Intent, string[]> = {
      create_order: ['product_id', 'quantity', 'customer_id'],
      check_stock: ['product_id'],
      generate_report: ['report_type', 'date_range'],
      update_product: ['product_id', 'field', 'value'],
      view_customer: ['customer_id'],
      create_invoice: ['order_id'],
      track_shipment: ['shipment_id'],
      unknown: []
    };

    return paramMap[intent] || [];
  }
}

/**
 * Dynamic UI Generator
 * Creates UI components based on the current state
 */
export class DynamicUIGenerator {
  generateUI(state: ConversationState): UIComponent | null {
    const missingParams = state.requiredParams.filter(
      param => !(param in state.collectedParams)
    );

    if (missingParams.length === 0) return null;

    const nextParam = missingParams[0];

    // Generate UI based on parameter type
    return this.generateComponentForParam(state.intent, nextParam);
  }

  private generateComponentForParam(intent: Intent, paramName: string): UIComponent {
    // This is a simplified version. In production, you'd have a more sophisticated mapping.
    const componentMap: Record<string, UIComponent> = {
      product_id: {
        type: 'dropdown',
        label: 'اختر المنتج',
        paramName: 'product_id',
        options: [], // Will be populated from database
        validation: { required: true }
      },
      quantity: {
        type: 'number_input',
        label: 'كم الكمية؟',
        paramName: 'quantity',
        placeholder: 'أدخل الكمية',
        validation: { min: 1, required: true }
      },
      customer_id: {
        type: 'dropdown',
        label: 'لمن هذا الطلب؟',
        paramName: 'customer_id',
        options: [], // Will be populated from database
        validation: { required: true }
      },
      report_type: {
        type: 'dropdown',
        label: 'نوع التقرير',
        paramName: 'report_type',
        options: [
          { label: 'تقرير المبيعات', value: 'sales' },
          { label: 'تقرير المخزون', value: 'inventory' },
          { label: 'تقرير الأرباح', value: 'profit' }
        ],
        validation: { required: true }
      },
      date_range: {
        type: 'date_picker',
        label: 'الفترة الزمنية',
        paramName: 'date_range',
        validation: { required: true }
      }
    };

    return componentMap[paramName] || {
      type: 'text',
      label: `أدخل ${paramName}`,
      paramName,
      validation: { required: true }
    };
  }
}

/**
 * Action Executor
 * Executes the final action once all parameters are collected
 */
export class ActionExecutor {
  async execute(state: ConversationState): Promise<any> {
    const { intent, collectedParams } = state;

    // In production, this would call the appropriate service
    switch (intent) {
      case 'create_order':
        return this.createOrder(collectedParams);
      case 'check_stock':
        return this.checkStock(collectedParams);
      case 'generate_report':
        return this.generateReport(collectedParams);
      // ... other intents
      default:
        throw new Error(`Unknown intent: ${intent}`);
    }
  }

  private async createOrder(params: Record<string, any>): Promise<any> {
    // Placeholder - would call OrderService
    return {
      success: true,
      orderId: Math.floor(Math.random() * 10000),
      message: 'تم إنشاء الطلب بنجاح!'
    };
  }

  private async checkStock(params: Record<string, any>): Promise<any> {
    // Placeholder - would call ProductService
    return {
      success: true,
      stock: Math.floor(Math.random() * 500),
      message: `المخزون المتاح: ${Math.floor(Math.random() * 500)} قطعة`
    };
  }

  private async generateReport(params: Record<string, any>): Promise<any> {
    // Placeholder - would call ReportService
    return {
      success: true,
      reportUrl: '/reports/sales_2025_01.pdf',
      message: 'تم إنشاء التقرير بنجاح!'
    };
  }
}

/**
 * Main C-UI Engine
 * Orchestrates all components
 */
export class CUIEngine {
  private parser: CommandParser;
  private stateManager: StateManager;
  private uiGenerator: DynamicUIGenerator;
  private executor: ActionExecutor;

  constructor() {
    this.parser = new CommandParser();
    this.stateManager = new StateManager();
    this.uiGenerator = new DynamicUIGenerator();
    this.executor = new ActionExecutor();
  }

  async processMessage(userId: string, message: string, stateId?: string): Promise<CUIResponse> {
    try {
      // If there's an existing state, update it
      if (stateId) {
        const state = this.stateManager.getState(stateId);
        if (state) {
          return this.continueConversation(state, message);
        }
      }

      // Otherwise, parse the command and start a new conversation
      const parsed = await this.parser.parse(message);

      if (parsed.intent === 'unknown' || parsed.confidence < 0.5) {
        return {
          message: 'عذراً، لم أفهم طلبك. هل يمكنك إعادة صياغته؟',
          completed: false
        };
      }

      // Create new state
      const state = this.stateManager.createState(userId, parsed.intent);

      // Pre-fill entities from the initial command
      for (const entity of parsed.entities) {
        this.stateManager.updateState(state.id, entity.name, entity.value);
      }

      // Check if we're done
      if (this.stateManager.isComplete(state.id)) {
        return this.executeAction(state);
      }

      // Generate UI for next parameter
      const uiComponent = this.uiGenerator.generateUI(state);

      return {
        message: this.getNextStepMessage(state),
        uiComponents: uiComponent ? [uiComponent] : undefined,
        completed: false
      };

    } catch (error: any) {
      console.error('C-UI Engine error:', error);
      return {
        message: 'حدث خطأ في معالجة طلبك.',
        completed: false,
        error: error.message
      };
    }
  }

  private async continueConversation(state: ConversationState, value: string): Promise<CUIResponse> {
    // Find the next missing parameter
    const missingParams = state.requiredParams.filter(
      param => !(param in state.collectedParams)
    );

    if (missingParams.length === 0) {
      return this.executeAction(state);
    }

    const nextParam = missingParams[0];
    this.stateManager.updateState(state.id, nextParam, value);

    // Check if we're done now
    if (this.stateManager.isComplete(state.id)) {
      return this.executeAction(state);
    }

    // Generate UI for next parameter
    const uiComponent = this.uiGenerator.generateUI(state);

    return {
      message: this.getNextStepMessage(state),
      uiComponents: uiComponent ? [uiComponent] : undefined,
      completed: false
    };
  }

  private async executeAction(state: ConversationState): Promise<CUIResponse> {
    try {
      const result = await this.executor.execute(state);
      this.stateManager.deleteState(state.id);

      // Generate output format suggestions
      const outputFormats = this.generateOutputFormats(state.intent, result);

      return {
        message: result.message || 'تم تنفيذ العملية بنجاح! اختر طريقة العرض المناسبة:',
        completed: true,
        result,
        outputFormats,
        data: result.data
      };
    } catch (error: any) {
      return {
        message: 'حدث خطأ أثناء تنفيذ العملية.',
        completed: true,
        error: error.message
      };
    }
  }

  /**
   * Generate 3 output format suggestions based on the intent and result
   */
  private generateOutputFormats(intent: Intent, result: any): OutputFormat[] {
    const formatsByIntent: Record<Intent, OutputFormat[]> = {
      create_order: [
        {
          id: 'order_card',
          label: 'بطاقة الطلب',
          description: 'عرض تفاصيل الطلب في بطاقة منظمة',
          icon: '📋',
          format: 'cards',
          recommended: true
        },
        {
          id: 'order_timeline',
          label: 'خط زمني',
          description: 'تتبع مراحل الطلب على خط زمني',
          icon: '⏱️',
          format: 'timeline'
        },
        {
          id: 'order_list',
          label: 'قائمة تفصيلية',
          description: 'عرض جميع تفاصيل الطلب في قائمة',
          icon: '📝',
          format: 'list'
        }
      ],
      check_stock: [
        {
          id: 'stock_chart',
          label: 'رسم بياني',
          description: 'عرض المخزون في رسم بياني تفاعلي',
          icon: '📊',
          format: 'chart',
          recommended: true
        },
        {
          id: 'stock_table',
          label: 'جدول',
          description: 'عرض المخزون في جدول مفصل',
          icon: '📋',
          format: 'table'
        },
        {
          id: 'stock_cards',
          label: 'بطاقات المنتجات',
          description: 'عرض المنتجات في بطاقات مرئية',
          icon: '🎴',
          format: 'cards'
        }
      ],
      generate_report: [
        {
          id: 'report_chart',
          label: 'رسوم بيانية',
          description: 'عرض التقرير برسوم بيانية تفاعلية',
          icon: '📈',
          format: 'chart',
          recommended: true
        },
        {
          id: 'report_table',
          label: 'جدول مفصل',
          description: 'عرض البيانات في جدول قابل للتصدير',
          icon: '📊',
          format: 'table'
        },
        {
          id: 'report_cards',
          label: 'بطاقات ملخصة',
          description: 'عرض المؤشرات الرئيسية في بطاقات',
          icon: '💳',
          format: 'cards'
        }
      ],
      view_customer: [
        {
          id: 'customer_card',
          label: 'بطاقة العميل',
          description: 'عرض معلومات العميل في بطاقة شاملة',
          icon: '👤',
          format: 'cards',
          recommended: true
        },
        {
          id: 'customer_timeline',
          label: 'تاريخ التعاملات',
          description: 'عرض تاريخ تعاملات العميل على خط زمني',
          icon: '📅',
          format: 'timeline'
        },
        {
          id: 'customer_list',
          label: 'قائمة تفصيلية',
          description: 'عرض جميع بيانات العميل في قائمة',
          icon: '📋',
          format: 'list'
        }
      ],
      track_shipment: [
        {
          id: 'shipment_map',
          label: 'خريطة التتبع',
          description: 'تتبع موقع الشحنة على الخريطة',
          icon: '🗺️',
          format: 'map',
          recommended: true
        },
        {
          id: 'shipment_timeline',
          label: 'خط زمني',
          description: 'عرض مراحل الشحنة على خط زمني',
          icon: '⏱️',
          format: 'timeline'
        },
        {
          id: 'shipment_card',
          label: 'بطاقة الشحنة',
          description: 'عرض تفاصيل الشحنة في بطاقة',
          icon: '📦',
          format: 'cards'
        }
      ],
      update_product: [
        {
          id: 'product_card',
          label: 'بطاقة المنتج',
          description: 'عرض المنتج المحدث في بطاقة',
          icon: '🏷️',
          format: 'cards',
          recommended: true
        },
        {
          id: 'product_table',
          label: 'جدول المقارنة',
          description: 'مقارنة القيم القديمة والجديدة',
          icon: '⚖️',
          format: 'table'
        },
        {
          id: 'product_list',
          label: 'قائمة التغييرات',
          description: 'عرض جميع التغييرات في قائمة',
          icon: '📝',
          format: 'list'
        }
      ],
      create_invoice: [
        {
          id: 'invoice_card',
          label: 'بطاقة الفاتورة',
          description: 'عرض الفاتورة بتصميم احترافي',
          icon: '🧾',
          format: 'cards',
          recommended: true
        },
        {
          id: 'invoice_table',
          label: 'جدول العناصر',
          description: 'عرض عناصر الفاتورة في جدول',
          icon: '📊',
          format: 'table'
        },
        {
          id: 'invoice_list',
          label: 'قائمة تفصيلية',
          description: 'عرض جميع تفاصيل الفاتورة',
          icon: '📋',
          format: 'list'
        }
      ],
      unknown: [
        {
          id: 'default_table',
          label: 'جدول',
          description: 'عرض البيانات في جدول',
          icon: '📊',
          format: 'table',
          recommended: true
        },
        {
          id: 'default_cards',
          label: 'بطاقات',
          description: 'عرض البيانات في بطاقات',
          icon: '🎴',
          format: 'cards'
        },
        {
          id: 'default_list',
          label: 'قائمة',
          description: 'عرض البيانات في قائمة',
          icon: '📝',
          format: 'list'
        }
      ]
    };

    return formatsByIntent[intent] || formatsByIntent.unknown;
  }

  private getNextStepMessage(state: ConversationState): string {
    const missingParams = state.requiredParams.filter(
      param => !(param in state.collectedParams)
    );

    if (missingParams.length === 0) {
      return 'جاري تنفيذ العملية...';
    }

    const nextParam = missingParams[0];
    const messages: Record<string, string> = {
      product_id: 'ما هو المنتج؟',
      quantity: 'كم الكمية؟',
      customer_id: 'لمن هذا الطلب؟',
      report_type: 'أي نوع من التقارير تريد؟',
      date_range: 'ما هي الفترة الزمنية؟'
    };

    return messages[nextParam] || `أدخل ${nextParam}`;
  }
}
