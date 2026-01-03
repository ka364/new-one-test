/**
 * Template Routes
 */

import { Router } from 'express';
import { nanoid } from 'nanoid';
import { Template } from '../models/notification.model';

export const templateRoutes = Router();

// In-memory store
export const templates = new Map<string, Template>();

// Initialize default templates
const initializeTemplates = () => {
  const defaultTemplates: Partial<Template>[] = [
    // Order templates
    {
      name: 'Order Placed',
      type: 'order_placed',
      channel: 'push',
      titleTemplate: 'Order Confirmed! 🎉',
      titleTemplateAr: 'تم تأكيد طلبك! 🎉',
      bodyTemplate: 'Your order #{{orderId}} has been confirmed. Total: {{total}} EGP',
      bodyTemplateAr: 'تم تأكيد طلبك رقم #{{orderId}}. الإجمالي: {{total}} جنيه'
    },
    {
      name: 'Order Shipped',
      type: 'order_shipped',
      channel: 'push',
      titleTemplate: 'Your order is on the way! 🚚',
      titleTemplateAr: 'طلبك في الطريق! 🚚',
      bodyTemplate: 'Order #{{orderId}} has been shipped. Track your delivery.',
      bodyTemplateAr: 'تم شحن طلبك رقم #{{orderId}}. تابع التوصيل.'
    },
    {
      name: 'Order Delivered',
      type: 'order_delivered',
      channel: 'push',
      titleTemplate: 'Order Delivered! ✅',
      titleTemplateAr: 'تم التوصيل! ✅',
      bodyTemplate: 'Your order #{{orderId}} has been delivered. Enjoy!',
      bodyTemplateAr: 'تم توصيل طلبك رقم #{{orderId}}. استمتع!'
    },

    // Group buying templates
    {
      name: 'Deal Joined',
      type: 'deal_joined',
      channel: 'push',
      titleTemplate: 'Welcome to the deal! 🤝',
      titleTemplateAr: 'أهلاً بك في العرض! 🤝',
      bodyTemplate: 'You joined the group deal for {{productName}}. Current price: {{price}} EGP',
      bodyTemplateAr: 'انضممت للعرض الجماعي لـ {{productName}}. السعر الحالي: {{price}} جنيه'
    },
    {
      name: 'Price Dropped',
      type: 'price_dropped',
      channel: 'push',
      titleTemplate: 'Price Dropped! 💰',
      titleTemplateAr: 'السعر انخفض! 💰',
      bodyTemplate: '{{productName}} price dropped to {{price}} EGP! {{participantCount}} people joined.',
      bodyTemplateAr: 'سعر {{productName}} أصبح {{price}} جنيه! انضم {{participantCount}} شخص.'
    },
    {
      name: 'Deal Threshold Reached',
      type: 'deal_threshold_reached',
      channel: 'push',
      titleTemplate: 'Goal Reached! 🎯',
      titleTemplateAr: 'تم تحقيق الهدف! 🎯',
      bodyTemplate: 'The group deal for {{productName}} reached its goal! Final price: {{price}} EGP',
      bodyTemplateAr: 'العرض الجماعي لـ {{productName}} حقق هدفه! السعر النهائي: {{price}} جنيه'
    },
    {
      name: 'Deal Reminder',
      type: 'deal_reminder',
      channel: 'push',
      titleTemplate: 'Deal Ending Soon! ⏰',
      titleTemplateAr: 'العرض ينتهي قريباً! ⏰',
      bodyTemplate: '{{productName}} deal ends in {{hoursLeft}} hours. Don\'t miss out!',
      bodyTemplateAr: 'عرض {{productName}} ينتهي خلال {{hoursLeft}} ساعات. لا تفوت الفرصة!'
    },

    // Delivery templates
    {
      name: 'Driver Assigned',
      type: 'driver_assigned',
      channel: 'push',
      titleTemplate: 'Driver on the way! 🛵',
      titleTemplateAr: 'السائق في الطريق! 🛵',
      bodyTemplate: '{{driverName}} is picking up your order. ETA: {{eta}} minutes',
      bodyTemplateAr: '{{driverName}} يستلم طلبك. الوصول المتوقع: {{eta}} دقيقة'
    },
    {
      name: 'Driver Arriving',
      type: 'driver_arriving',
      channel: 'push',
      titleTemplate: 'Almost there! 📍',
      titleTemplateAr: 'على وشك الوصول! 📍',
      bodyTemplate: 'Your order will arrive in {{minutes}} minutes. Be ready!',
      bodyTemplateAr: 'طلبك سيصل خلال {{minutes}} دقائق. كن مستعداً!'
    },

    // Locker templates
    {
      name: 'Locker Ready',
      type: 'locker_ready',
      channel: 'sms',
      titleTemplate: 'Package Ready for Pickup',
      titleTemplateAr: 'الطرد جاهز للاستلام',
      bodyTemplate: 'Your package is in locker {{lockerNumber}} at {{location}}. Code: {{accessCode}}',
      bodyTemplateAr: 'طردك في الخزنة رقم {{lockerNumber}} في {{location}}. الكود: {{accessCode}}'
    },
    {
      name: 'Locker Expiring',
      type: 'locker_expiring',
      channel: 'push',
      titleTemplate: 'Pickup Reminder! ⚠️',
      titleTemplateAr: 'تذكير بالاستلام! ⚠️',
      bodyTemplate: 'Your locker booking expires in {{hoursLeft}} hours. Pick up your package!',
      bodyTemplateAr: 'حجز الخزنة ينتهي خلال {{hoursLeft}} ساعات. استلم طردك!'
    },

    // Payment templates
    {
      name: 'Payment Received',
      type: 'payment_received',
      channel: 'push',
      titleTemplate: 'Payment Successful! ✅',
      titleTemplateAr: 'تم الدفع بنجاح! ✅',
      bodyTemplate: 'We received your payment of {{amount}} EGP for order #{{orderId}}',
      bodyTemplateAr: 'استلمنا {{amount}} جنيه لطلبك رقم #{{orderId}}'
    },
    {
      name: 'Refund Processed',
      type: 'refund_processed',
      channel: 'push',
      titleTemplate: 'Refund Processed 💸',
      titleTemplateAr: 'تم رد المبلغ 💸',
      bodyTemplate: '{{amount}} EGP has been refunded to your {{method}}',
      bodyTemplateAr: 'تم إرجاع {{amount}} جنيه إلى {{method}}'
    },

    // Promo templates
    {
      name: 'Flash Sale',
      type: 'flash_sale',
      channel: 'push',
      titleTemplate: '⚡ Flash Sale! ⚡',
      titleTemplateAr: '⚡ تخفيضات فلاش! ⚡',
      bodyTemplate: 'Up to {{discount}}% off! Ends in {{hours}} hours. Shop now!',
      bodyTemplateAr: 'خصم يصل إلى {{discount}}%! ينتهي خلال {{hours}} ساعات. تسوق الآن!'
    },

    // Account templates
    {
      name: 'Welcome',
      type: 'welcome',
      channel: 'email',
      titleTemplate: 'Welcome to HADEROS! 🎉',
      titleTemplateAr: 'أهلاً بك في هاديروس! 🎉',
      bodyTemplate: 'Hi {{userName}}, welcome to HADEROS! Start shopping and save with group deals.',
      bodyTemplateAr: 'مرحباً {{userName}}، أهلاً بك في هاديروس! ابدأ التسوق ووفر مع العروض الجماعية.'
    }
  ];

  defaultTemplates.forEach(tmpl => {
    const id = nanoid();
    templates.set(id, {
      id,
      name: tmpl.name!,
      type: tmpl.type!,
      channel: tmpl.channel!,
      titleTemplate: tmpl.titleTemplate!,
      titleTemplateAr: tmpl.titleTemplateAr,
      bodyTemplate: tmpl.bodyTemplate!,
      bodyTemplateAr: tmpl.bodyTemplateAr,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  });
};

// Initialize on load
initializeTemplates();

// GET /api/templates - List templates
templateRoutes.get('/', (req, res) => {
  const { type, channel, active } = req.query;

  let templateList = Array.from(templates.values());

  if (type) {
    templateList = templateList.filter(t => t.type === type);
  }
  if (channel) {
    templateList = templateList.filter(t => t.channel === channel);
  }
  if (active === 'true') {
    templateList = templateList.filter(t => t.isActive);
  }

  res.json({
    templates: templateList,
    total: templateList.length
  });
});

// GET /api/templates/:id - Get template
templateRoutes.get('/:id', (req, res) => {
  const template = templates.get(req.params.id);
  if (!template) {
    return res.status(404).json({ error: 'Template not found', code: 'NOT_FOUND' });
  }
  res.json({ template });
});

// POST /api/templates - Create template
templateRoutes.post('/', (req, res) => {
  const {
    name,
    type,
    channel,
    titleTemplate,
    titleTemplateAr,
    bodyTemplate,
    bodyTemplateAr,
    whatsappTemplateId
  } = req.body;

  const template: Template = {
    id: nanoid(),
    name,
    type,
    channel,
    titleTemplate,
    titleTemplateAr,
    bodyTemplate,
    bodyTemplateAr,
    whatsappTemplateId,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  templates.set(template.id, template);

  console.log('Event: template.created', { templateId: template.id });

  res.status(201).json({ template });
});

// PUT /api/templates/:id - Update template
templateRoutes.put('/:id', (req, res) => {
  const template = templates.get(req.params.id);
  if (!template) {
    return res.status(404).json({ error: 'Template not found', code: 'NOT_FOUND' });
  }

  const updates = req.body;
  const updatedTemplate: Template = {
    ...template,
    ...updates,
    id: template.id,
    updatedAt: new Date()
  };

  templates.set(template.id, updatedTemplate);

  res.json({ template: updatedTemplate });
});

// DELETE /api/templates/:id - Delete template
templateRoutes.delete('/:id', (req, res) => {
  if (!templates.has(req.params.id)) {
    return res.status(404).json({ error: 'Template not found', code: 'NOT_FOUND' });
  }

  templates.delete(req.params.id);

  res.json({ success: true, message: 'Template deleted' });
});

// POST /api/templates/:id/preview - Preview template with data
templateRoutes.post('/:id/preview', (req, res) => {
  const template = templates.get(req.params.id);
  if (!template) {
    return res.status(404).json({ error: 'Template not found', code: 'NOT_FOUND' });
  }

  const { data = {} } = req.body;

  const processTemplate = (tmpl: string, d: Record<string, string>): string => {
    let result = tmpl;
    for (const [key, value] of Object.entries(d)) {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }
    return result;
  };

  res.json({
    title: processTemplate(template.titleTemplate, data),
    titleAr: template.titleTemplateAr ? processTemplate(template.titleTemplateAr, data) : null,
    body: processTemplate(template.bodyTemplate, data),
    bodyAr: template.bodyTemplateAr ? processTemplate(template.bodyTemplateAr, data) : null
  });
});
