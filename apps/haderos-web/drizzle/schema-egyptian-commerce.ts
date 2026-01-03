/**
 * 🇪🇬 Egyptian Commerce Schema
 * نظام التجارة المصرية - قاعدة البيانات
 *
 * Tables:
 * - egyptian_categories: الفئات المصرية
 * - egyptian_search_synonyms: مرادفات البحث المصرية
 * - delivery_micro_zones: مناطق التوصيل الصغيرة
 * - dark_stores: مخازن الظلام
 * - dark_store_inventory: مخزون المخازن الصغيرة
 * - egyptian_holidays: الأعياد والمناسبات المصرية
 * - holiday_promotions: عروض المناسبات
 */

import {
  pgTable,
  text,
  timestamp,
  integer,
  boolean,
  decimal,
  jsonb,
  uuid,
  pgEnum,
  date,
  time,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============================================
// ENUMS
// ============================================

export const deliverySpeedEnum = pgEnum('delivery_speed', [
  'express', // 15-30 دقيقة
  'fast', // 30-60 دقيقة
  'standard', // 1-3 ساعات
  'scheduled', // موعد محدد
]);

export const darkStoreStatusEnum = pgEnum('dark_store_status', [
  'active', // نشط
  'busy', // مشغول
  'maintenance', // صيانة
  'closed', // مغلق
]);

export const holidayTypeEnum = pgEnum('holiday_type', [
  'religious', // ديني
  'national', // وطني
  'seasonal', // موسمي
  'special', // مناسبة خاصة
]);

// ============================================
// EGYPTIAN CATEGORIES
// ============================================

/**
 * الفئات المصرية للمنتجات
 */
export const egyptianCategories = pgTable('egyptian_categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  parentId: uuid('parent_id'),
  code: text('code').notNull().unique(),

  // الأسماء
  nameAr: text('name_ar').notNull(),
  nameEn: text('name_en'),
  nameDarija: text('name_darija'), // الاسم العامي المصري

  // الوصف
  descriptionAr: text('description_ar'),
  descriptionEn: text('description_en'),

  // الأيقونة والصورة
  icon: text('icon'),
  imageUrl: text('image_url'),
  color: text('color'),

  // الترتيب والعرض
  sortOrder: integer('sort_order').default(0),
  isActive: boolean('is_active').default(true),
  isFeatured: boolean('is_featured').default(false),
  showOnHome: boolean('show_on_home').default(false),

  // المنتجات الشائعة في هذه الفئة
  popularProducts: jsonb('popular_products').$type<string[]>(),

  // كلمات البحث المرتبطة
  searchKeywords: jsonb('search_keywords').$type<string[]>(),

  // إحصائيات
  productsCount: integer('products_count').default(0),
  viewsCount: integer('views_count').default(0),

  metadata: jsonb('metadata').$type<Record<string, any>>(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ============================================
// EGYPTIAN SEARCH SYSTEM
// ============================================

/**
 * مرادفات البحث المصرية
 * للبحث بالعامية والمفردات المحلية
 */
export const egyptianSearchSynonyms = pgTable('egyptian_search_synonyms', {
  id: uuid('id').primaryKey().defaultRandom(),

  // الكلمة الأساسية (الفصحى أو الرسمية)
  standardTerm: text('standard_term').notNull(),
  standardTermAr: text('standard_term_ar'),

  // المرادفات المصرية
  egyptianVariants: jsonb('egyptian_variants').$type<string[]>().notNull(),

  // الأخطاء الإملائية الشائعة
  commonMisspellings: jsonb('common_misspellings').$type<string[]>(),

  // الفئة المرتبطة
  categoryId: uuid('category_id').references(() => egyptianCategories.id),

  // أمثلة الاستخدام
  examples: jsonb('examples').$type<
    {
      query: string;
      result: string;
    }[]
  >(),

  // الأولوية في البحث
  priority: integer('priority').default(0),

  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

/**
 * وحدات القياس المصرية
 */
export const egyptianUnits = pgTable('egyptian_units', {
  id: uuid('id').primaryKey().defaultRandom(),

  // الوحدة
  code: text('code').notNull().unique(),
  nameAr: text('name_ar').notNull(),
  nameEn: text('name_en'),

  // الاختصارات
  abbreviationAr: text('abbreviation_ar'),
  abbreviationEn: text('abbreviation_en'),

  // التحويل للوحدة الأساسية
  baseUnit: text('base_unit'), // كيلو، لتر، قطعة
  conversionFactor: decimal('conversion_factor', { precision: 10, scale: 4 }),

  // الفئات التي تستخدم هذه الوحدة
  applicableCategories: jsonb('applicable_categories').$type<string[]>(),

  // أمثلة
  examples: jsonb('examples').$type<string[]>(),

  sortOrder: integer('sort_order').default(0),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

// ============================================
// DELIVERY MICRO-ZONES
// ============================================

/**
 * مناطق التوصيل الصغيرة
 * لتوصيل أسرع وأدق
 */
export const deliveryMicroZones = pgTable('delivery_micro_zones', {
  id: uuid('id').primaryKey().defaultRandom(),

  // الموقع
  governorate: text('governorate').notNull(), // المحافظة
  city: text('city').notNull(), // المدينة
  district: text('district').notNull(), // الحي
  neighborhood: text('neighborhood'), // المنطقة الصغيرة

  // الأسماء
  nameAr: text('name_ar').notNull(),
  nameEn: text('name_en'),

  // الإحداثيات
  centerLatitude: decimal('center_latitude', { precision: 10, scale: 8 }),
  centerLongitude: decimal('center_longitude', { precision: 11, scale: 8 }),
  radiusKm: decimal('radius_km', { precision: 5, scale: 2 }).default('2'),

  // الحدود (GeoJSON polygon)
  boundaries: jsonb('boundaries').$type<{
    type: 'Polygon';
    coordinates: number[][][];
  }>(),

  // التوصيل
  deliverySpeed: deliverySpeedEnum('delivery_speed').default('fast'),
  estimatedDeliveryMinutes: integer('estimated_delivery_minutes').default(45),
  deliveryFee: decimal('delivery_fee', { precision: 10, scale: 2 }).default('15'),
  freeDeliveryThreshold: decimal('free_delivery_threshold', { precision: 10, scale: 2 }),

  // المخزن المرتبط
  assignedDarkStoreId: uuid('assigned_dark_store_id').references(() => darkStores.id),
  backupDarkStoreId: uuid('backup_dark_store_id').references(() => darkStores.id),

  // ساعات العمل
  workingHoursStart: time('working_hours_start').default('08:00'),
  workingHoursEnd: time('working_hours_end').default('23:00'),

  // الحالة
  isActive: boolean('is_active').default(true),
  isCovered: boolean('is_covered').default(true), // هل نغطي هذه المنطقة؟

  // الإحصائيات
  totalOrders: integer('total_orders').default(0),
  avgDeliveryTime: integer('avg_delivery_time'), // بالدقائق

  // رسوم إضافية (للمناطق البعيدة)
  surchargeAmount: decimal('surcharge_amount', { precision: 10, scale: 2 }),
  surchargeReason: text('surcharge_reason'),

  metadata: jsonb('metadata').$type<Record<string, any>>(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ============================================
// DARK STORES
// ============================================

/**
 * مخازن الظلام (Dark Stores)
 * مخازن صغيرة في الأحياء للتوصيل السريع
 */
export const darkStores = pgTable('dark_stores', {
  id: uuid('id').primaryKey().defaultRandom(),

  // البيانات الأساسية
  code: text('code').notNull().unique(),
  nameAr: text('name_ar').notNull(),
  nameEn: text('name_en'),

  // الموقع
  governorate: text('governorate').notNull(),
  city: text('city').notNull(),
  district: text('district').notNull(),
  address: text('address'),
  addressAr: text('address_ar'),

  // الإحداثيات
  latitude: decimal('latitude', { precision: 10, scale: 8 }),
  longitude: decimal('longitude', { precision: 11, scale: 8 }),

  // المساحة والسعة
  areaSqm: decimal('area_sqm', { precision: 10, scale: 2 }),
  maxProducts: integer('max_products').default(500),
  maxSkus: integer('max_skus').default(200),

  // الفريق
  managerId: uuid('manager_id'),
  staffCount: integer('staff_count').default(2),
  driversCount: integer('drivers_count').default(3),

  // الحالة
  status: darkStoreStatusEnum('status').default('active'),
  isOpen: boolean('is_open').default(true),

  // ساعات العمل
  openingTime: time('opening_time').default('07:00'),
  closingTime: time('closing_time').default('24:00'),
  workingDays: jsonb('working_days').$type<number[]>().default([0, 1, 2, 3, 4, 5, 6]),

  // السعة الحالية
  currentOrdersCount: integer('current_orders_count').default(0),
  maxConcurrentOrders: integer('max_concurrent_orders').default(20),
  avgPreparationTime: integer('avg_preparation_time').default(10), // بالدقائق

  // الإحصائيات
  totalOrdersCompleted: integer('total_orders_completed').default(0),
  avgRating: decimal('avg_rating', { precision: 3, scale: 2 }),

  // التواصل
  phone: text('phone'),
  whatsapp: text('whatsapp'),

  // إعدادات خاصة
  priorityCategories: jsonb('priority_categories').$type<string[]>(), // الفئات المهمة
  specialEquipment: jsonb('special_equipment').$type<string[]>(), // ثلاجات، فريزرات

  metadata: jsonb('metadata').$type<Record<string, any>>(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

/**
 * مخزون المخازن الصغيرة
 */
export const darkStoreInventory = pgTable('dark_store_inventory', {
  id: uuid('id').primaryKey().defaultRandom(),

  darkStoreId: uuid('dark_store_id')
    .references(() => darkStores.id)
    .notNull(),
  productId: uuid('product_id').notNull(),

  // الكمية
  quantity: integer('quantity').default(0),
  reservedQuantity: integer('reserved_quantity').default(0),
  availableQuantity: integer('available_quantity').default(0),

  // حدود المخزون
  minQuantity: integer('min_quantity').default(5),
  maxQuantity: integer('max_quantity').default(50),
  reorderPoint: integer('reorder_point').default(10),

  // الموقع في المخزن
  shelfLocation: text('shelf_location'),
  zone: text('zone'), // A, B, C

  // التواريخ
  lastRestockedAt: timestamp('last_restocked_at'),
  lastSoldAt: timestamp('last_sold_at'),

  // الإحصائيات
  totalSold: integer('total_sold').default(0),
  avgDailySales: decimal('avg_daily_sales', { precision: 10, scale: 2 }),

  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

/**
 * طلبات تزويد المخازن الصغيرة
 */
export const darkStoreRestockOrders = pgTable('dark_store_restock_orders', {
  id: uuid('id').primaryKey().defaultRandom(),

  orderNumber: text('order_number').notNull().unique(),
  darkStoreId: uuid('dark_store_id')
    .references(() => darkStores.id)
    .notNull(),

  // الحالة
  status: text('status').default('pending'), // pending, approved, in_transit, received, cancelled

  // التفاصيل
  items: jsonb('items').$type<
    {
      productId: string;
      productName: string;
      requestedQuantity: number;
      receivedQuantity?: number;
    }[]
  >(),

  totalItems: integer('total_items').default(0),

  // التواريخ
  requestedAt: timestamp('requested_at').defaultNow(),
  approvedAt: timestamp('approved_at'),
  shippedAt: timestamp('shipped_at'),
  receivedAt: timestamp('received_at'),

  // الملاحظات
  notes: text('notes'),

  requestedBy: uuid('requested_by'),
  approvedBy: uuid('approved_by'),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ============================================
// EGYPTIAN HOLIDAYS & PROMOTIONS
// ============================================

/**
 * الأعياد والمناسبات المصرية
 */
export const egyptianHolidays = pgTable('egyptian_holidays', {
  id: uuid('id').primaryKey().defaultRandom(),

  // البيانات الأساسية
  code: text('code').notNull().unique(),
  nameAr: text('name_ar').notNull(),
  nameEn: text('name_en'),

  // النوع
  type: holidayTypeEnum('type').notNull(),

  // التاريخ
  isHijri: boolean('is_hijri').default(false), // تاريخ هجري؟
  month: integer('month').notNull(), // 1-12
  day: integer('day').notNull(), // 1-31
  year: integer('year'), // null = كل سنة

  // مدة المناسبة
  durationDays: integer('duration_days').default(1),

  // التفاصيل
  description: text('description'),
  descriptionAr: text('description_ar'),

  // العروض المرتبطة
  suggestedCategories: jsonb('suggested_categories').$type<string[]>(), // فئات المنتجات المناسبة
  suggestedProducts: jsonb('suggested_products').$type<string[]>(), // منتجات مقترحة

  // التصميم
  bannerImageUrl: text('banner_image_url'),
  themeColor: text('theme_color'),
  icon: text('icon'),

  // الإحصائيات
  avgSalesIncrease: decimal('avg_sales_increase', { precision: 5, scale: 2 }), // نسبة زيادة المبيعات

  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

/**
 * عروض المناسبات
 */
export const holidayPromotions = pgTable('holiday_promotions', {
  id: uuid('id').primaryKey().defaultRandom(),

  holidayId: uuid('holiday_id')
    .references(() => egyptianHolidays.id)
    .notNull(),

  // البيانات الأساسية
  nameAr: text('name_ar').notNull(),
  nameEn: text('name_en'),
  description: text('description'),
  descriptionAr: text('description_ar'),

  // نوع العرض
  promotionType: text('promotion_type').notNull(), // percentage, fixed, bogo, bundle

  // قيمة الخصم
  discountPercentage: decimal('discount_percentage', { precision: 5, scale: 2 }),
  discountAmount: decimal('discount_amount', { precision: 10, scale: 2 }),

  // الشروط
  minOrderAmount: decimal('min_order_amount', { precision: 10, scale: 2 }),
  maxDiscountAmount: decimal('max_discount_amount', { precision: 10, scale: 2 }),

  // المنتجات المشمولة
  applicableCategories: jsonb('applicable_categories').$type<string[]>(),
  applicableProducts: jsonb('applicable_products').$type<string[]>(),
  excludedProducts: jsonb('excluded_products').$type<string[]>(),

  // الصلاحية
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),

  // الحدود
  totalUsageLimit: integer('total_usage_limit'),
  perCustomerLimit: integer('per_customer_limit').default(1),
  usageCount: integer('usage_count').default(0),

  // التصميم
  bannerImageUrl: text('banner_image_url'),
  badgeText: text('badge_text'),
  badgeTextAr: text('badge_text_ar'),

  isActive: boolean('is_active').default(true),
  isFeatured: boolean('is_featured').default(false),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ============================================
// SHARED ORDERS (Postgres Definition)
// ============================================

/**
 * طلبات النظام (تعريف Postgres)
 * مطلوب للتحليلات لأن التعريف الأصلي MySQL
 */
export const orders = pgTable('orders', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  orderNumber: text('order_number').notNull().unique(),

  customerName: text('customer_name').notNull(),
  customerPhone: text('customer_phone'),
  customerEmail: text('customer_email'),

  totalAmount: decimal('total_amount', { precision: 10, scale: 2 }).notNull(),
  currency: text('currency').default('EGP'),

  status: text('status').default('pending'),
  paymentStatus: text('payment_status').default('pending'),

  shippingAddress: text('shipping_address'),
  notes: text('notes'),

  createdBy: integer('created_by'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ============================================
// RELATIONS
// ============================================

export const egyptianCategoriesRelations = relations(egyptianCategories, ({ one, many }) => ({
  parent: one(egyptianCategories, {
    fields: [egyptianCategories.parentId],
    references: [egyptianCategories.id],
  }),
  children: many(egyptianCategories),
  synonyms: many(egyptianSearchSynonyms),
}));

export const darkStoresRelations = relations(darkStores, ({ many }) => ({
  inventory: many(darkStoreInventory),
  restockOrders: many(darkStoreRestockOrders),
  microZones: many(deliveryMicroZones),
}));

export const deliveryMicroZonesRelations = relations(deliveryMicroZones, ({ one }) => ({
  darkStore: one(darkStores, {
    fields: [deliveryMicroZones.assignedDarkStoreId],
    references: [darkStores.id],
  }),
  backupDarkStore: one(darkStores, {
    fields: [deliveryMicroZones.backupDarkStoreId],
    references: [darkStores.id],
  }),
}));

export const egyptianHolidaysRelations = relations(egyptianHolidays, ({ many }) => ({
  promotions: many(holidayPromotions),
}));

// ============================================
// DEFAULT DATA
// ============================================

/**
 * الفئات المصرية الافتراضية
 */
export const DEFAULT_EGYPTIAN_CATEGORIES = [
  // البقالة
  { code: 'GROCERY', nameAr: 'البقالة', nameDarija: 'البقالة', icon: '🛒' },
  { code: 'GROCERY_OILS', nameAr: 'زيوت ومرغرين', nameDarija: 'زيت وسمنة', parentCode: 'GROCERY' },
  { code: 'GROCERY_RICE', nameAr: 'أرز ومعكرونة', nameDarija: 'رز ومكرونة', parentCode: 'GROCERY' },
  { code: 'GROCERY_SUGAR', nameAr: 'سكر ودقيق', nameDarija: 'سكر ودقيق', parentCode: 'GROCERY' },
  { code: 'GROCERY_SPICES', nameAr: 'بهارات وتوابل', nameDarija: 'بهارات', parentCode: 'GROCERY' },

  // الخضروات
  { code: 'VEGETABLES', nameAr: 'الخضروات', nameDarija: 'خضار', icon: '🥬' },
  {
    code: 'VEGETABLES_LEAFY',
    nameAr: 'خضروات ورقية',
    nameDarija: 'ورقيات',
    parentCode: 'VEGETABLES',
  },
  {
    code: 'VEGETABLES_ROOT',
    nameAr: 'خضروات جذرية',
    nameDarija: 'جزر وبنجر',
    parentCode: 'VEGETABLES',
  },
  {
    code: 'VEGETABLES_POTATO',
    nameAr: 'بطاطس وبصل',
    nameDarija: 'بطاطس وبصل',
    parentCode: 'VEGETABLES',
  },

  // الفواكه
  { code: 'FRUITS', nameAr: 'الفواكه', nameDarija: 'فاكهة', icon: '🍎' },
  { code: 'FRUITS_CITRUS', nameAr: 'حمضيات', nameDarija: 'برتقان وليمون', parentCode: 'FRUITS' },
  {
    code: 'FRUITS_TROPICAL',
    nameAr: 'فواكه استوائية',
    nameDarija: 'مانجا وموز',
    parentCode: 'FRUITS',
  },

  // اللحوم
  { code: 'MEAT', nameAr: 'اللحوم', nameDarija: 'لحمة', icon: '🥩' },
  { code: 'MEAT_BEEF', nameAr: 'لحوم حمراء', nameDarija: 'لحمة بقري', parentCode: 'MEAT' },
  { code: 'MEAT_POULTRY', nameAr: 'دواجن', nameDarija: 'فراخ', parentCode: 'MEAT' },
  { code: 'MEAT_FISH', nameAr: 'أسماك', nameDarija: 'سمك', parentCode: 'MEAT' },

  // الألبان
  { code: 'DAIRY', nameAr: 'الألبان', nameDarija: 'لبن وجبنة', icon: '🧀' },
  { code: 'DAIRY_MILK', nameAr: 'حليب', nameDarija: 'لبن', parentCode: 'DAIRY' },
  { code: 'DAIRY_CHEESE', nameAr: 'جبن', nameDarija: 'جبنة', parentCode: 'DAIRY' },
  { code: 'DAIRY_YOGURT', nameAr: 'زبادي', nameDarija: 'زبادي', parentCode: 'DAIRY' },

  // المخبوزات
  { code: 'BAKERY', nameAr: 'المخبوزات', nameDarija: 'عيش وفينو', icon: '🍞' },
  { code: 'BAKERY_BREAD', nameAr: 'خبز', nameDarija: 'عيش', parentCode: 'BAKERY' },
  { code: 'BAKERY_PASTRY', nameAr: 'معجنات', nameDarija: 'فطاير', parentCode: 'BAKERY' },

  // المشروبات
  { code: 'BEVERAGES', nameAr: 'المشروبات', nameDarija: 'مشروبات', icon: '🥤' },
  { code: 'BEVERAGES_WATER', nameAr: 'مياه', nameDarija: 'مية', parentCode: 'BEVERAGES' },
  { code: 'BEVERAGES_JUICE', nameAr: 'عصائر', nameDarija: 'عصير', parentCode: 'BEVERAGES' },
  {
    code: 'BEVERAGES_SODA',
    nameAr: 'مشروبات غازية',
    nameDarija: 'حاجة ساقعة',
    parentCode: 'BEVERAGES',
  },

  // التنظيف
  { code: 'CLEANING', nameAr: 'منتجات التنظيف', nameDarija: 'منظفات', icon: '🧹' },
  {
    code: 'CLEANING_LAUNDRY',
    nameAr: 'غسيل الملابس',
    nameDarija: 'مسحوق غسيل',
    parentCode: 'CLEANING',
  },
  {
    code: 'CLEANING_DISHES',
    nameAr: 'غسيل الأطباق',
    nameDarija: 'صابون مواعين',
    parentCode: 'CLEANING',
  },
];

/**
 * مرادفات البحث المصرية الافتراضية
 */
export const DEFAULT_EGYPTIAN_SYNONYMS = [
  // الخبز
  {
    standardTerm: 'bread',
    standardTermAr: 'خبز',
    egyptianVariants: ['عيش', 'عيش بلدي', 'عيش فينو', 'عيش شامي'],
  },

  // الثوم
  { standardTerm: 'garlic', standardTermAr: 'ثوم', egyptianVariants: ['توم', 'تومة'] },

  // البطاطس
  { standardTerm: 'potato', standardTermAr: 'بطاطا', egyptianVariants: ['بطاطس', 'بطاطسة'] },

  // الطماطم
  { standardTerm: 'tomato', standardTermAr: 'طماطم', egyptianVariants: ['طماطم', 'قوطة', 'أوطة'] },

  // الدجاج
  { standardTerm: 'chicken', standardTermAr: 'دجاج', egyptianVariants: ['فراخ', 'فرخة', 'دجاج'] },

  // الحليب
  { standardTerm: 'milk', standardTermAr: 'حليب', egyptianVariants: ['لبن', 'لبنة'] },

  // السمن
  { standardTerm: 'ghee', standardTermAr: 'سمن', egyptianVariants: ['سمنة', 'سمن بلدي'] },

  // الكشري
  { standardTerm: 'koshari', standardTermAr: 'كشري', egyptianVariants: ['كشرى', 'كوشري'] },

  // الفول
  { standardTerm: 'fava_beans', standardTermAr: 'فول', egyptianVariants: ['فول مدمس', 'مدمس'] },

  // الملوخية
  { standardTerm: 'molokhia', standardTermAr: 'ملوخية', egyptianVariants: ['ملوخية', 'ملخية'] },

  // المانجو
  { standardTerm: 'mango', standardTermAr: 'مانجو', egyptianVariants: ['مانجا', 'منجة', 'منجا'] },

  // البصل
  { standardTerm: 'onion', standardTermAr: 'بصل', egyptianVariants: ['بصل', 'بصلة'] },

  // المكرونة
  { standardTerm: 'pasta', standardTermAr: 'معكرونة', egyptianVariants: ['مكرونة', 'مكرونه'] },

  // الزبادي
  {
    standardTerm: 'yogurt',
    standardTermAr: 'لبن رائب',
    egyptianVariants: ['زبادي', 'زبادى', 'ياغورت'],
  },
];

/**
 * الأعياد المصرية الافتراضية
 */
export const DEFAULT_EGYPTIAN_HOLIDAYS = [
  // رمضان
  {
    code: 'RAMADAN',
    nameAr: 'شهر رمضان',
    nameEn: 'Ramadan',
    type: 'religious',
    isHijri: true,
    month: 9,
    day: 1,
    durationDays: 30,
    suggestedCategories: ['GROCERY', 'BEVERAGES', 'MEAT', 'BAKERY'],
    themeColor: '#1a5f2a',
  },

  // عيد الفطر
  {
    code: 'EID_FITR',
    nameAr: 'عيد الفطر المبارك',
    nameEn: 'Eid al-Fitr',
    type: 'religious',
    isHijri: true,
    month: 10,
    day: 1,
    durationDays: 4,
    suggestedCategories: ['BAKERY', 'CLEANING', 'MEAT'],
    themeColor: '#d4af37',
  },

  // عيد الأضحى
  {
    code: 'EID_ADHA',
    nameAr: 'عيد الأضحى المبارك',
    nameEn: 'Eid al-Adha',
    type: 'religious',
    isHijri: true,
    month: 12,
    day: 10,
    durationDays: 4,
    suggestedCategories: ['MEAT', 'GROCERY_SPICES', 'CLEANING'],
    themeColor: '#8b4513',
  },

  // المولد النبوي
  {
    code: 'MAWLID',
    nameAr: 'المولد النبوي الشريف',
    nameEn: 'Mawlid',
    type: 'religious',
    isHijri: true,
    month: 3,
    day: 12,
    durationDays: 1,
    suggestedCategories: ['BAKERY'],
    themeColor: '#006400',
  },

  // شم النسيم
  {
    code: 'SHAM_ENNASIM',
    nameAr: 'شم النسيم',
    nameEn: 'Sham el-Nessim',
    type: 'seasonal',
    isHijri: false,
    month: 4, // يختلف
    day: 15, // تقريبي
    durationDays: 1,
    suggestedCategories: ['MEAT_FISH', 'VEGETABLES'],
    themeColor: '#87ceeb',
  },

  // رأس السنة الميلادية
  {
    code: 'NEW_YEAR',
    nameAr: 'رأس السنة الميلادية',
    nameEn: 'New Year',
    type: 'national',
    isHijri: false,
    month: 1,
    day: 1,
    durationDays: 1,
    themeColor: '#ffd700',
  },

  // ثورة يناير
  {
    code: 'JANUARY_25',
    nameAr: 'ذكرى ثورة 25 يناير',
    nameEn: 'January 25 Revolution',
    type: 'national',
    isHijri: false,
    month: 1,
    day: 25,
    durationDays: 1,
    themeColor: '#c8102e',
  },

  // عيد الأم
  {
    code: 'MOTHERS_DAY',
    nameAr: 'عيد الأم',
    nameEn: "Mother's Day",
    type: 'special',
    isHijri: false,
    month: 3,
    day: 21,
    durationDays: 1,
    themeColor: '#ff69b4',
  },

  // ثورة يوليو
  {
    code: 'JULY_23',
    nameAr: 'ذكرى ثورة 23 يوليو',
    nameEn: 'July 23 Revolution',
    type: 'national',
    isHijri: false,
    month: 7,
    day: 23,
    durationDays: 1,
    themeColor: '#000080',
  },

  // عيد تحرير سيناء
  {
    code: 'SINAI_DAY',
    nameAr: 'عيد تحرير سيناء',
    nameEn: 'Sinai Liberation Day',
    type: 'national',
    isHijri: false,
    month: 4,
    day: 25,
    durationDays: 1,
    themeColor: '#ffd700',
  },

  // الموسم الدراسي
  {
    code: 'BACK_TO_SCHOOL',
    nameAr: 'موسم العودة للمدارس',
    nameEn: 'Back to School',
    type: 'seasonal',
    isHijri: false,
    month: 9,
    day: 1,
    durationDays: 30,
    themeColor: '#4169e1',
  },
];

// ============================================
// TYPES
// ============================================

export type EgyptianCategory = typeof egyptianCategories.$inferSelect;
export type NewEgyptianCategory = typeof egyptianCategories.$inferInsert;

export type EgyptianSearchSynonym = typeof egyptianSearchSynonyms.$inferSelect;
export type NewEgyptianSearchSynonym = typeof egyptianSearchSynonyms.$inferInsert;

export type DeliveryMicroZone = typeof deliveryMicroZones.$inferSelect;
export type NewDeliveryMicroZone = typeof deliveryMicroZones.$inferInsert;

export type DarkStore = typeof darkStores.$inferSelect;
export type NewDarkStore = typeof darkStores.$inferInsert;

export type DarkStoreInventory = typeof darkStoreInventory.$inferSelect;
export type NewDarkStoreInventory = typeof darkStoreInventory.$inferInsert;

export type EgyptianHoliday = typeof egyptianHolidays.$inferSelect;
export type NewEgyptianHoliday = typeof egyptianHolidays.$inferInsert;

export type HolidayPromotion = typeof holidayPromotions.$inferSelect;
export type NewHolidayPromotion = typeof holidayPromotions.$inferInsert;
