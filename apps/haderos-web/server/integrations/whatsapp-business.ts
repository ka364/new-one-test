/**
 * WhatsApp Business API Integration
 * تكامل واتساب للأعمال
 *
 * Essential for customer communication in Egypt
 * Supports order notifications, tracking, and customer support
 */

// WhatsApp Cloud API Configuration
const WHATSAPP_CONFIG = {
  apiUrl: 'https://graph.facebook.com/v18.0',
  mediaUrl: 'https://graph.facebook.com/v18.0',
};

// Message Types
export enum WhatsAppMessageType {
  TEXT = 'text',
  IMAGE = 'image',
  DOCUMENT = 'document',
  TEMPLATE = 'template',
  INTERACTIVE = 'interactive',
  LOCATION = 'location',
  CONTACTS = 'contacts',
  STICKER = 'sticker',
  AUDIO = 'audio',
  VIDEO = 'video',
}

// Template Categories
export enum TemplateCategory {
  MARKETING = 'MARKETING',
  UTILITY = 'UTILITY',
  AUTHENTICATION = 'AUTHENTICATION',
}

// Message Status
export enum WhatsAppMessageStatus {
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed',
}

// Interfaces
export interface WhatsAppCredentials {
  phoneNumberId: string;
  accessToken: string;
  businessAccountId: string;
  webhookVerifyToken: string;
}

export interface WhatsAppContact {
  phoneNumber: string; // Format: 201xxxxxxxxx (no + or spaces)
  name?: string;
}

export interface WhatsAppTextMessage {
  to: string;
  text: string;
  previewUrl?: boolean;
}

export interface WhatsAppTemplateMessage {
  to: string;
  templateName: string;
  languageCode: string;
  components?: WhatsAppTemplateComponent[];
}

export interface WhatsAppTemplateComponent {
  type: 'header' | 'body' | 'button';
  parameters: WhatsAppTemplateParameter[];
  subType?: 'quick_reply' | 'url';
  index?: number;
}

export interface WhatsAppTemplateParameter {
  type: 'text' | 'currency' | 'date_time' | 'image' | 'document' | 'video';
  text?: string;
  currency?: {
    fallbackValue: string;
    code: string;
    amount1000: number;
  };
  dateTime?: {
    fallbackValue: string;
  };
  image?: {
    link: string;
  };
  document?: {
    link: string;
    filename: string;
  };
}

export interface WhatsAppInteractiveMessage {
  to: string;
  type: 'list' | 'button' | 'product' | 'product_list';
  header?: {
    type: 'text' | 'image' | 'video' | 'document';
    text?: string;
    image?: { link: string };
  };
  body: {
    text: string;
  };
  footer?: {
    text: string;
  };
  action: WhatsAppInteractiveAction;
}

export interface WhatsAppInteractiveAction {
  button?: string;
  buttons?: Array<{
    type: 'reply';
    reply: {
      id: string;
      title: string;
    };
  }>;
  sections?: Array<{
    title: string;
    rows: Array<{
      id: string;
      title: string;
      description?: string;
    }>;
  }>;
  catalogId?: string;
  productRetailerId?: string;
}

export interface WhatsAppMediaMessage {
  to: string;
  type: 'image' | 'document' | 'audio' | 'video' | 'sticker';
  mediaUrl?: string;
  mediaId?: string;
  caption?: string;
  filename?: string;
}

export interface WhatsAppMessageResponse {
  messagingProduct: string;
  contacts: Array<{
    input: string;
    waId: string;
  }>;
  messages: Array<{
    id: string;
  }>;
}

export interface WhatsAppWebhookPayload {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{
      value: {
        messagingProduct: string;
        metadata: {
          displayPhoneNumber: string;
          phoneNumberId: string;
        };
        contacts?: Array<{
          profile: { name: string };
          waId: string;
        }>;
        messages?: Array<{
          from: string;
          id: string;
          timestamp: string;
          type: WhatsAppMessageType;
          text?: { body: string };
          image?: { id: string; mime_type: string; sha256: string };
          document?: { id: string; mime_type: string; sha256: string; filename: string };
          button?: { payload: string; text: string };
          interactive?: {
            type: string;
            button_reply?: { id: string; title: string };
            list_reply?: { id: string; title: string; description: string };
          };
        }>;
        statuses?: Array<{
          id: string;
          status: WhatsAppMessageStatus;
          timestamp: string;
          recipientId: string;
        }>;
      };
      field: string;
    }>;
  }>;
}

// Pre-defined Templates for NOW SHOES
export const NOW_SHOES_TEMPLATES = {
  // Order Confirmation
  ORDER_CONFIRMATION: {
    name: 'order_confirmation',
    language: 'ar',
    components: (orderNumber: string, total: number, items: string) => [
      {
        type: 'body' as const,
        parameters: [
          { type: 'text' as const, text: orderNumber },
          { type: 'text' as const, text: `${total} جنيه` },
          { type: 'text' as const, text: items },
        ],
      },
    ],
  },

  // Shipping Update
  SHIPPING_UPDATE: {
    name: 'shipping_update',
    language: 'ar',
    components: (orderNumber: string, status: string, trackingUrl: string) => [
      {
        type: 'body' as const,
        parameters: [
          { type: 'text' as const, text: orderNumber },
          { type: 'text' as const, text: status },
        ],
      },
      {
        type: 'button' as const,
        subType: 'url' as const,
        index: 0,
        parameters: [{ type: 'text' as const, text: trackingUrl }],
      },
    ],
  },

  // Delivery Confirmation
  DELIVERY_CONFIRMATION: {
    name: 'delivery_confirmation',
    language: 'ar',
    components: (orderNumber: string, deliveryDate: string) => [
      {
        type: 'body' as const,
        parameters: [
          { type: 'text' as const, text: orderNumber },
          { type: 'text' as const, text: deliveryDate },
        ],
      },
    ],
  },

  // COD Reminder
  COD_REMINDER: {
    name: 'cod_reminder',
    language: 'ar',
    components: (orderNumber: string, amount: number, deliveryDate: string) => [
      {
        type: 'body' as const,
        parameters: [
          { type: 'text' as const, text: orderNumber },
          { type: 'text' as const, text: `${amount} جنيه` },
          { type: 'text' as const, text: deliveryDate },
        ],
      },
    ],
  },

  // OTP Verification
  OTP_VERIFICATION: {
    name: 'otp_verification',
    language: 'ar',
    components: (otp: string) => [
      {
        type: 'body' as const,
        parameters: [{ type: 'text' as const, text: otp }],
      },
    ],
  },

  // Abandoned Cart
  ABANDONED_CART: {
    name: 'abandoned_cart',
    language: 'ar',
    components: (customerName: string, cartItems: string, cartUrl: string) => [
      {
        type: 'body' as const,
        parameters: [
          { type: 'text' as const, text: customerName },
          { type: 'text' as const, text: cartItems },
        ],
      },
      {
        type: 'button' as const,
        subType: 'url' as const,
        index: 0,
        parameters: [{ type: 'text' as const, text: cartUrl }],
      },
    ],
  },
};

/**
 * WhatsApp Business Service
 */
export class WhatsAppBusinessService {
  private credentials: WhatsAppCredentials;

  constructor(credentials: WhatsAppCredentials) {
    this.credentials = credentials;
  }

  /**
   * Format phone number to WhatsApp format
   */
  private formatPhoneNumber(phoneNumber: string): string {
    let cleaned = phoneNumber.replace(/\D/g, '');

    // Add Egypt country code if not present
    if (cleaned.startsWith('0')) {
      cleaned = '20' + cleaned.substring(1);
    } else if (!cleaned.startsWith('20')) {
      cleaned = '20' + cleaned;
    }

    return cleaned;
  }

  /**
   * Send text message
   */
  async sendTextMessage(message: WhatsAppTextMessage): Promise<WhatsAppMessageResponse> {
    const response = await fetch(
      `${WHATSAPP_CONFIG.apiUrl}/${this.credentials.phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.credentials.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: this.formatPhoneNumber(message.to),
          type: 'text',
          text: {
            preview_url: message.previewUrl || false,
            body: message.text,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`WhatsApp send text failed: ${JSON.stringify(error)}`);
    }

    return await response.json();
  }

  /**
   * Send template message
   */
  async sendTemplateMessage(message: WhatsAppTemplateMessage): Promise<WhatsAppMessageResponse> {
    const response = await fetch(
      `${WHATSAPP_CONFIG.apiUrl}/${this.credentials.phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.credentials.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: this.formatPhoneNumber(message.to),
          type: 'template',
          template: {
            name: message.templateName,
            language: {
              code: message.languageCode,
            },
            components: message.components,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`WhatsApp send template failed: ${JSON.stringify(error)}`);
    }

    return await response.json();
  }

  /**
   * Send interactive message (buttons or list)
   */
  async sendInteractiveMessage(
    message: WhatsAppInteractiveMessage
  ): Promise<WhatsAppMessageResponse> {
    const response = await fetch(
      `${WHATSAPP_CONFIG.apiUrl}/${this.credentials.phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.credentials.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: this.formatPhoneNumber(message.to),
          type: 'interactive',
          interactive: {
            type: message.type,
            header: message.header,
            body: message.body,
            footer: message.footer,
            action: message.action,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`WhatsApp send interactive failed: ${JSON.stringify(error)}`);
    }

    return await response.json();
  }

  /**
   * Send media message (image, document, video, audio)
   */
  async sendMediaMessage(message: WhatsAppMediaMessage): Promise<WhatsAppMessageResponse> {
    const mediaPayload: any = {};

    if (message.mediaUrl) {
      mediaPayload.link = message.mediaUrl;
    } else if (message.mediaId) {
      mediaPayload.id = message.mediaId;
    }

    if (message.caption) {
      mediaPayload.caption = message.caption;
    }

    if (message.filename && message.type === 'document') {
      mediaPayload.filename = message.filename;
    }

    const response = await fetch(
      `${WHATSAPP_CONFIG.apiUrl}/${this.credentials.phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.credentials.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: this.formatPhoneNumber(message.to),
          type: message.type,
          [message.type]: mediaPayload,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`WhatsApp send media failed: ${JSON.stringify(error)}`);
    }

    return await response.json();
  }

  /**
   * Mark message as read
   */
  async markAsRead(messageId: string): Promise<void> {
    await fetch(`${WHATSAPP_CONFIG.apiUrl}/${this.credentials.phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.credentials.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        status: 'read',
        message_id: messageId,
      }),
    });
  }

  /**
   * Upload media to WhatsApp
   */
  async uploadMedia(file: Buffer, mimeType: string, filename: string): Promise<string> {
    const formData = new FormData();
    formData.append('file', new Blob([file], { type: mimeType }), filename);
    formData.append('messaging_product', 'whatsapp');
    formData.append('type', mimeType);

    const response = await fetch(
      `${WHATSAPP_CONFIG.mediaUrl}/${this.credentials.phoneNumberId}/media`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.credentials.accessToken}`,
        },
        body: formData,
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`WhatsApp upload media failed: ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    return data.id;
  }

  /**
   * Get media URL
   */
  async getMediaUrl(mediaId: string): Promise<string> {
    const response = await fetch(`${WHATSAPP_CONFIG.mediaUrl}/${mediaId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.credentials.accessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`WhatsApp get media failed: ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    return data.url;
  }

  /**
   * Verify webhook signature
   */
  verifyWebhook(mode: string, token: string, challenge: string): string | null {
    if (mode === 'subscribe' && token === this.credentials.webhookVerifyToken) {
      return challenge;
    }
    return null;
  }

  /**
   * Parse webhook payload
   */
  parseWebhook(payload: WhatsAppWebhookPayload): {
    messages: Array<{
      from: string;
      id: string;
      type: WhatsAppMessageType;
      content: any;
      timestamp: Date;
    }>;
    statuses: Array<{
      messageId: string;
      status: WhatsAppMessageStatus;
      recipientId: string;
      timestamp: Date;
    }>;
  } {
    const messages: any[] = [];
    const statuses: any[] = [];

    for (const entry of payload.entry) {
      for (const change of entry.changes) {
        if (change.value.messages) {
          for (const msg of change.value.messages) {
            messages.push({
              from: msg.from,
              id: msg.id,
              type: msg.type,
              content: msg[msg.type as keyof typeof msg],
              timestamp: new Date(parseInt(msg.timestamp) * 1000),
            });
          }
        }

        if (change.value.statuses) {
          for (const status of change.value.statuses) {
            statuses.push({
              messageId: status.id,
              status: status.status,
              recipientId: status.recipientId,
              timestamp: new Date(parseInt(status.timestamp) * 1000),
            });
          }
        }
      }
    }

    return { messages, statuses };
  }

  // ============ NOW SHOES Specific Methods ============

  /**
   * Send order confirmation
   */
  async sendOrderConfirmation(
    to: string,
    orderNumber: string,
    total: number,
    items: string[]
  ): Promise<WhatsAppMessageResponse> {
    const template = NOW_SHOES_TEMPLATES.ORDER_CONFIRMATION;
    return this.sendTemplateMessage({
      to,
      templateName: template.name,
      languageCode: template.language,
      components: template.components(orderNumber, total, items.join('، ')),
    });
  }

  /**
   * Send shipping update
   */
  async sendShippingUpdate(
    to: string,
    orderNumber: string,
    status: string,
    trackingUrl: string
  ): Promise<WhatsAppMessageResponse> {
    const template = NOW_SHOES_TEMPLATES.SHIPPING_UPDATE;
    return this.sendTemplateMessage({
      to,
      templateName: template.name,
      languageCode: template.language,
      components: template.components(orderNumber, status, trackingUrl),
    });
  }

  /**
   * Send delivery confirmation
   */
  async sendDeliveryConfirmation(
    to: string,
    orderNumber: string,
    deliveryDate: string
  ): Promise<WhatsAppMessageResponse> {
    const template = NOW_SHOES_TEMPLATES.DELIVERY_CONFIRMATION;
    return this.sendTemplateMessage({
      to,
      templateName: template.name,
      languageCode: template.language,
      components: template.components(orderNumber, deliveryDate),
    });
  }

  /**
   * Send COD reminder
   */
  async sendCODReminder(
    to: string,
    orderNumber: string,
    amount: number,
    deliveryDate: string
  ): Promise<WhatsAppMessageResponse> {
    const template = NOW_SHOES_TEMPLATES.COD_REMINDER;
    return this.sendTemplateMessage({
      to,
      templateName: template.name,
      languageCode: template.language,
      components: template.components(orderNumber, amount, deliveryDate),
    });
  }

  /**
   * Send OTP verification
   */
  async sendOTPVerification(to: string, otp: string): Promise<WhatsAppMessageResponse> {
    const template = NOW_SHOES_TEMPLATES.OTP_VERIFICATION;
    return this.sendTemplateMessage({
      to,
      templateName: template.name,
      languageCode: template.language,
      components: template.components(otp),
    });
  }

  /**
   * Send abandoned cart reminder
   */
  async sendAbandonedCartReminder(
    to: string,
    customerName: string,
    cartItems: string[],
    cartUrl: string
  ): Promise<WhatsAppMessageResponse> {
    const template = NOW_SHOES_TEMPLATES.ABANDONED_CART;
    return this.sendTemplateMessage({
      to,
      templateName: template.name,
      languageCode: template.language,
      components: template.components(customerName, cartItems.join('، '), cartUrl),
    });
  }

  /**
   * Send order tracking buttons
   */
  async sendOrderTrackingButtons(
    to: string,
    orderNumber: string,
    trackingNumber: string
  ): Promise<WhatsAppMessageResponse> {
    return this.sendInteractiveMessage({
      to,
      type: 'button',
      body: {
        text: `طلبك رقم ${orderNumber} في الطريق إليك! 📦\n\nرقم التتبع: ${trackingNumber}`,
      },
      footer: {
        text: 'NOW SHOES - أحذية عصرية',
      },
      action: {
        buttons: [
          {
            type: 'reply',
            reply: {
              id: `track_${orderNumber}`,
              title: 'تتبع الشحنة 📍',
            },
          },
          {
            type: 'reply',
            reply: {
              id: `support_${orderNumber}`,
              title: 'تواصل معنا 💬',
            },
          },
        ],
      },
    });
  }
}

/**
 * Create WhatsApp Business service instance
 */
export function createWhatsAppService(): WhatsAppBusinessService {
  const credentials: WhatsAppCredentials = {
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
    businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || '',
    webhookVerifyToken: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || '',
  };

  return new WhatsAppBusinessService(credentials);
}

export default WhatsAppBusinessService;
