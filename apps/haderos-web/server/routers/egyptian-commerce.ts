/**
 * Egyptian Commerce Router
 * نظام التجارة المصرية - الـ API
 *
 * Features:
 * - Egyptian Categories with dialect names
 * - Egyptian dialect search with synonyms
 * - Dark Stores management
 * - Micro-zones delivery system
 * - Egyptian holidays & promotions
 */

import { z } from "zod";
import { router, publicProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

// ============================================
// EGYPTIAN CATEGORIES
// ============================================

const categoryRouter = router({
  // Get all categories
  getAll: publicProcedure
    .input(z.object({
      includeInactive: z.boolean().default(false),
      parentId: z.string().uuid().optional(),
    }).optional())
    .query(async ({ input }) => {
      // Mock data based on schema
      const categories = [
        { id: "1", code: "GROCERY", nameAr: "البقالة", nameDarija: "البقالة", icon: "🛒", productsCount: 150 },
        { id: "2", code: "VEGETABLES", nameAr: "الخضروات", nameDarija: "خضار", icon: "🥬", productsCount: 80 },
        { id: "3", code: "FRUITS", nameAr: "الفواكه", nameDarija: "فاكهة", icon: "🍎", productsCount: 60 },
        { id: "4", code: "MEAT", nameAr: "اللحوم", nameDarija: "لحمة", icon: "🥩", productsCount: 45 },
        { id: "5", code: "DAIRY", nameAr: "الألبان", nameDarija: "لبن وجبنة", icon: "🧀", productsCount: 70 },
        { id: "6", code: "BAKERY", nameAr: "المخبوزات", nameDarija: "عيش وفينو", icon: "🍞", productsCount: 35 },
        { id: "7", code: "BEVERAGES", nameAr: "المشروبات", nameDarija: "مشروبات", icon: "🥤", productsCount: 90 },
        { id: "8", code: "CLEANING", nameAr: "منتجات التنظيف", nameDarija: "منظفات", icon: "🧹", productsCount: 55 },
      ];

      return {
        success: true,
        categories,
        total: categories.length,
      };
    }),

  // Get category by ID
  getById: publicProcedure
    .input(z.object({
      id: z.string().uuid(),
    }))
    .query(async ({ input }) => {
      return {
        success: true,
        category: {
          id: input.id,
          code: "GROCERY",
          nameAr: "البقالة",
          nameDarija: "البقالة",
          nameEn: "Grocery",
          icon: "🛒",
          isActive: true,
          productsCount: 150,
          children: [
            { id: "1-1", code: "GROCERY_OILS", nameAr: "زيوت ومرغرين", nameDarija: "زيت وسمنة" },
            { id: "1-2", code: "GROCERY_RICE", nameAr: "أرز ومعكرونة", nameDarija: "رز ومكرونة" },
          ],
        },
      };
    }),

  // Create category
  create: publicProcedure
    .input(z.object({
      code: z.string().min(2).max(50),
      nameAr: z.string().min(2),
      nameEn: z.string().optional(),
      nameDarija: z.string().optional(),
      parentId: z.string().uuid().optional(),
      icon: z.string().optional(),
      imageUrl: z.string().url().optional(),
      color: z.string().optional(),
      searchKeywords: z.array(z.string()).optional(),
    }))
    .mutation(async ({ input }) => {
      const categoryId = crypto.randomUUID();

      return {
        success: true,
        category: {
          id: categoryId,
          ...input,
          isActive: true,
          productsCount: 0,
          createdAt: new Date().toISOString(),
        },
        message: "تم إنشاء الفئة بنجاح",
      };
    }),

  // Update category
  update: publicProcedure
    .input(z.object({
      id: z.string().uuid(),
      nameAr: z.string().optional(),
      nameEn: z.string().optional(),
      nameDarija: z.string().optional(),
      icon: z.string().optional(),
      imageUrl: z.string().url().optional(),
      color: z.string().optional(),
      isActive: z.boolean().optional(),
      isFeatured: z.boolean().optional(),
      showOnHome: z.boolean().optional(),
      searchKeywords: z.array(z.string()).optional(),
    }))
    .mutation(async ({ input }) => {
      return {
        success: true,
        category: {
          ...input,
          updatedAt: new Date().toISOString(),
        },
        message: "تم تحديث الفئة بنجاح",
      };
    }),

  // Get featured categories for home page
  getFeatured: publicProcedure
    .query(async () => {
      return {
        success: true,
        categories: [
          { id: "1", code: "GROCERY", nameAr: "البقالة", nameDarija: "البقالة", icon: "🛒", imageUrl: "/images/grocery.jpg" },
          { id: "4", code: "MEAT", nameAr: "اللحوم", nameDarija: "لحمة", icon: "🥩", imageUrl: "/images/meat.jpg" },
          { id: "5", code: "DAIRY", nameAr: "الألبان", nameDarija: "لبن وجبنة", icon: "🧀", imageUrl: "/images/dairy.jpg" },
        ],
      };
    }),
});

// ============================================
// EGYPTIAN SEARCH (with dialect support)
// ============================================

const searchRouter = router({
  // Search with Egyptian dialect support
  search: publicProcedure
    .input(z.object({
      query: z.string().min(1),
      categoryId: z.string().uuid().optional(),
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ input }) => {
      // Egyptian dialect mapping
      const dialectMap: Record<string, string[]> = {
        // Bread variations
        "عيش": ["خبز", "عيش بلدي", "عيش فينو"],
        "خبز": ["عيش", "عيش بلدي"],

        // Chicken variations
        "فراخ": ["دجاج", "فرخة"],
        "دجاج": ["فراخ", "فرخة"],

        // Milk variations
        "لبن": ["حليب", "لبنة"],
        "حليب": ["لبن"],

        // Tomato variations
        "طماطم": ["قوطة", "أوطة"],
        "قوطة": ["طماطم"],

        // Pasta variations
        "مكرونة": ["معكرونة", "مكرونه"],
        "معكرونة": ["مكرونة"],

        // Potato variations
        "بطاطس": ["بطاطا", "بطاطسة"],

        // Garlic
        "توم": ["ثوم", "تومة"],
        "ثوم": ["توم"],
      };

      // Expand search query with synonyms
      const expandedTerms = [input.query];
      const lowerQuery = input.query.toLowerCase();

      for (const [term, synonyms] of Object.entries(dialectMap)) {
        if (input.query.includes(term)) {
          expandedTerms.push(...synonyms);
        }
      }

      // Mock search results
      const mockProducts = [
        { id: "p1", name: "عيش بلدي", nameAr: "عيش بلدي", price: 5, categoryCode: "BAKERY" },
        { id: "p2", name: "فراخ طازجة", nameAr: "فراخ طازجة", price: 120, categoryCode: "MEAT" },
        { id: "p3", name: "لبن طازج", nameAr: "لبن طازج", price: 25, categoryCode: "DAIRY" },
        { id: "p4", name: "طماطم", nameAr: "طماطم", price: 15, categoryCode: "VEGETABLES" },
        { id: "p5", name: "مكرونة", nameAr: "مكرونة", price: 35, categoryCode: "GROCERY" },
      ];

      const results = mockProducts.filter(p =>
        expandedTerms.some(term =>
          p.name.includes(term) || p.nameAr.includes(term)
        )
      );

      return {
        success: true,
        query: input.query,
        expandedTerms: expandedTerms.slice(1), // Show what synonyms were used
        results,
        total: results.length,
        pagination: {
          limit: input.limit,
          offset: input.offset,
          hasMore: false,
        },
      };
    }),

  // Get search suggestions
  suggestions: publicProcedure
    .input(z.object({
      query: z.string().min(1),
      limit: z.number().min(1).max(10).default(5),
    }))
    .query(async ({ input }) => {
      // Common Egyptian search terms
      const commonTerms = [
        "عيش بلدي",
        "فراخ",
        "لبن",
        "جبنة بيضاء",
        "بيض بلدي",
        "زيت عباد الشمس",
        "سكر",
        "أرز مصري",
        "مكرونة",
        "طماطم",
        "بطاطس",
        "بصل",
      ];

      const suggestions = commonTerms
        .filter(term => term.includes(input.query))
        .slice(0, input.limit);

      return {
        success: true,
        suggestions,
      };
    }),

  // Manage synonyms
  getSynonyms: publicProcedure
    .input(z.object({
      categoryId: z.string().uuid().optional(),
      isActive: z.boolean().default(true),
    }).optional())
    .query(async ({ input }) => {
      const synonyms = [
        { id: "s1", standardTerm: "bread", standardTermAr: "خبز", egyptianVariants: ["عيش", "عيش بلدي", "عيش فينو"] },
        { id: "s2", standardTerm: "chicken", standardTermAr: "دجاج", egyptianVariants: ["فراخ", "فرخة"] },
        { id: "s3", standardTerm: "milk", standardTermAr: "حليب", egyptianVariants: ["لبن", "لبنة"] },
        { id: "s4", standardTerm: "tomato", standardTermAr: "طماطم", egyptianVariants: ["قوطة", "أوطة"] },
        { id: "s5", standardTerm: "pasta", standardTermAr: "معكرونة", egyptianVariants: ["مكرونة", "مكرونه"] },
      ];

      return {
        success: true,
        synonyms,
        total: synonyms.length,
      };
    }),

  // Add new synonym
  addSynonym: publicProcedure
    .input(z.object({
      standardTerm: z.string().min(1),
      standardTermAr: z.string().optional(),
      egyptianVariants: z.array(z.string()).min(1),
      commonMisspellings: z.array(z.string()).optional(),
      categoryId: z.string().uuid().optional(),
      priority: z.number().default(0),
    }))
    .mutation(async ({ input }) => {
      return {
        success: true,
        synonym: {
          id: crypto.randomUUID(),
          ...input,
          isActive: true,
          createdAt: new Date().toISOString(),
        },
        message: "تم إضافة المرادفات بنجاح",
      };
    }),
});

// ============================================
// DARK STORES
// ============================================

const darkStoreRouter = router({
  // Get all dark stores
  getAll: publicProcedure
    .input(z.object({
      governorate: z.string().optional(),
      city: z.string().optional(),
      status: z.enum(["active", "busy", "maintenance", "closed"]).optional(),
    }).optional())
    .query(async ({ input }) => {
      const darkStores = [
        {
          id: "ds1",
          code: "DS-MAADI-001",
          nameAr: "مخزن المعادي",
          governorate: "القاهرة",
          city: "المعادي",
          district: "المعادي الجديدة",
          status: "active",
          isOpen: true,
          currentOrdersCount: 5,
          maxConcurrentOrders: 20,
          avgPreparationTime: 10,
          driversCount: 4,
        },
        {
          id: "ds2",
          code: "DS-NASR-001",
          nameAr: "مخزن مدينة نصر",
          governorate: "القاهرة",
          city: "مدينة نصر",
          district: "الحي الثامن",
          status: "active",
          isOpen: true,
          currentOrdersCount: 12,
          maxConcurrentOrders: 25,
          avgPreparationTime: 8,
          driversCount: 6,
        },
        {
          id: "ds3",
          code: "DS-DOKKI-001",
          nameAr: "مخزن الدقي",
          governorate: "الجيزة",
          city: "الدقي",
          district: "الدقي",
          status: "busy",
          isOpen: true,
          currentOrdersCount: 18,
          maxConcurrentOrders: 20,
          avgPreparationTime: 12,
          driversCount: 5,
        },
      ];

      let filtered = darkStores;
      if (input?.governorate) {
        filtered = filtered.filter(ds => ds.governorate === input.governorate);
      }
      if (input?.status) {
        filtered = filtered.filter(ds => ds.status === input.status);
      }

      return {
        success: true,
        darkStores: filtered,
        total: filtered.length,
      };
    }),

  // Get dark store by ID
  getById: publicProcedure
    .input(z.object({
      id: z.string(),
    }))
    .query(async ({ input }) => {
      return {
        success: true,
        darkStore: {
          id: input.id,
          code: "DS-MAADI-001",
          nameAr: "مخزن المعادي",
          nameEn: "Maadi Store",
          governorate: "القاهرة",
          city: "المعادي",
          district: "المعادي الجديدة",
          address: "شارع 9، المعادي الجديدة",
          latitude: 29.9602,
          longitude: 31.2569,
          status: "active",
          isOpen: true,
          openingTime: "07:00",
          closingTime: "24:00",
          currentOrdersCount: 5,
          maxConcurrentOrders: 20,
          avgPreparationTime: 10,
          staffCount: 3,
          driversCount: 4,
          totalOrdersCompleted: 1250,
          avgRating: 4.7,
          priorityCategories: ["MEAT", "DAIRY", "BAKERY"],
          specialEquipment: ["ثلاجات", "فريزرات"],
        },
      };
    }),

  // Create dark store
  create: publicProcedure
    .input(z.object({
      code: z.string().min(3),
      nameAr: z.string().min(2),
      nameEn: z.string().optional(),
      governorate: z.string(),
      city: z.string(),
      district: z.string(),
      address: z.string().optional(),
      latitude: z.number().optional(),
      longitude: z.number().optional(),
      maxProducts: z.number().default(500),
      maxConcurrentOrders: z.number().default(20),
      openingTime: z.string().default("07:00"),
      closingTime: z.string().default("24:00"),
    }))
    .mutation(async ({ input }) => {
      return {
        success: true,
        darkStore: {
          id: crypto.randomUUID(),
          ...input,
          status: "active",
          isOpen: true,
          currentOrdersCount: 0,
          createdAt: new Date().toISOString(),
        },
        message: "تم إنشاء المخزن بنجاح",
      };
    }),

  // Update dark store status
  updateStatus: publicProcedure
    .input(z.object({
      id: z.string(),
      status: z.enum(["active", "busy", "maintenance", "closed"]),
      isOpen: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      return {
        success: true,
        darkStore: {
          id: input.id,
          status: input.status,
          isOpen: input.isOpen ?? (input.status === "active"),
          updatedAt: new Date().toISOString(),
        },
        message: "تم تحديث حالة المخزن",
      };
    }),

  // Get store inventory
  getInventory: publicProcedure
    .input(z.object({
      darkStoreId: z.string(),
      lowStock: z.boolean().optional(),
      categoryCode: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const inventory = [
        { productId: "p1", productName: "عيش بلدي", quantity: 50, minQuantity: 20, zone: "A", shelfLocation: "A1" },
        { productId: "p2", productName: "لبن كامل الدسم", quantity: 30, minQuantity: 15, zone: "B", shelfLocation: "B2" },
        { productId: "p3", productName: "جبنة بيضاء", quantity: 8, minQuantity: 10, zone: "B", shelfLocation: "B3" },
        { productId: "p4", productName: "طماطم طازجة", quantity: 25, minQuantity: 20, zone: "C", shelfLocation: "C1" },
      ];

      let filtered = inventory;
      if (input.lowStock) {
        filtered = filtered.filter(item => item.quantity <= item.minQuantity);
      }

      return {
        success: true,
        darkStoreId: input.darkStoreId,
        inventory: filtered,
        lowStockCount: inventory.filter(i => i.quantity <= i.minQuantity).length,
      };
    }),

  // Update inventory
  updateInventory: publicProcedure
    .input(z.object({
      darkStoreId: z.string(),
      productId: z.string(),
      quantity: z.number().min(0),
      action: z.enum(["set", "add", "subtract"]),
    }))
    .mutation(async ({ input }) => {
      return {
        success: true,
        inventory: {
          darkStoreId: input.darkStoreId,
          productId: input.productId,
          quantity: input.quantity,
          updatedAt: new Date().toISOString(),
        },
        message: "تم تحديث المخزون",
      };
    }),

  // Request restock
  requestRestock: publicProcedure
    .input(z.object({
      darkStoreId: z.string(),
      items: z.array(z.object({
        productId: z.string(),
        productName: z.string(),
        requestedQuantity: z.number().min(1),
      })).min(1),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const orderNumber = `RST-${Date.now().toString(36).toUpperCase()}`;

      return {
        success: true,
        restockOrder: {
          id: crypto.randomUUID(),
          orderNumber,
          darkStoreId: input.darkStoreId,
          items: input.items,
          totalItems: input.items.length,
          status: "pending",
          notes: input.notes,
          requestedAt: new Date().toISOString(),
        },
        message: "تم إرسال طلب التزويد",
      };
    }),
});

// ============================================
// DELIVERY MICRO-ZONES
// ============================================

const microZoneRouter = router({
  // Get all micro-zones
  getAll: publicProcedure
    .input(z.object({
      governorate: z.string().optional(),
      city: z.string().optional(),
      isCovered: z.boolean().optional(),
    }).optional())
    .query(async ({ input }) => {
      const zones = [
        {
          id: "mz1",
          governorate: "القاهرة",
          city: "المعادي",
          district: "المعادي الجديدة",
          nameAr: "المعادي الجديدة",
          deliverySpeed: "express",
          estimatedDeliveryMinutes: 20,
          deliveryFee: 15,
          freeDeliveryThreshold: 200,
          isCovered: true,
        },
        {
          id: "mz2",
          governorate: "القاهرة",
          city: "مدينة نصر",
          district: "الحي السابع",
          nameAr: "الحي السابع - مدينة نصر",
          deliverySpeed: "fast",
          estimatedDeliveryMinutes: 35,
          deliveryFee: 20,
          freeDeliveryThreshold: 250,
          isCovered: true,
        },
        {
          id: "mz3",
          governorate: "الجيزة",
          city: "الدقي",
          district: "الدقي",
          nameAr: "الدقي",
          deliverySpeed: "fast",
          estimatedDeliveryMinutes: 40,
          deliveryFee: 20,
          freeDeliveryThreshold: 250,
          isCovered: true,
        },
        {
          id: "mz4",
          governorate: "القاهرة",
          city: "التجمع الخامس",
          district: "التجمع الأول",
          nameAr: "التجمع الأول",
          deliverySpeed: "standard",
          estimatedDeliveryMinutes: 60,
          deliveryFee: 30,
          freeDeliveryThreshold: 300,
          isCovered: true,
        },
      ];

      let filtered = zones;
      if (input?.governorate) {
        filtered = filtered.filter(z => z.governorate === input.governorate);
      }
      if (input?.city) {
        filtered = filtered.filter(z => z.city === input.city);
      }
      if (input?.isCovered !== undefined) {
        filtered = filtered.filter(z => z.isCovered === input.isCovered);
      }

      return {
        success: true,
        zones: filtered,
        total: filtered.length,
      };
    }),

  // Check delivery for address
  checkDelivery: publicProcedure
    .input(z.object({
      latitude: z.number(),
      longitude: z.number(),
    }))
    .query(async ({ input }) => {
      // Simple distance calculation (mock)
      // In production, this would use proper geolocation
      return {
        success: true,
        isCovered: true,
        zone: {
          id: "mz1",
          nameAr: "المعادي الجديدة",
          deliverySpeed: "express",
          estimatedDeliveryMinutes: 20,
          deliveryFee: 15,
          freeDeliveryThreshold: 200,
        },
        assignedDarkStore: {
          id: "ds1",
          nameAr: "مخزن المعادي",
          distance: 1.5, // km
        },
      };
    }),

  // Get delivery estimate
  getEstimate: publicProcedure
    .input(z.object({
      zoneId: z.string(),
      orderAmount: z.number(),
    }))
    .query(async ({ input }) => {
      const baseDeliveryFee = 15;
      const freeDeliveryThreshold = 200;
      const estimatedMinutes = 20;

      const deliveryFee = input.orderAmount >= freeDeliveryThreshold ? 0 : baseDeliveryFee;

      return {
        success: true,
        estimate: {
          deliveryFee,
          isFreeDelivery: deliveryFee === 0,
          freeDeliveryThreshold,
          amountToFreeDelivery: Math.max(0, freeDeliveryThreshold - input.orderAmount),
          estimatedMinutes,
          deliverySpeed: "express",
          estimatedArrival: new Date(Date.now() + estimatedMinutes * 60 * 1000).toISOString(),
        },
      };
    }),

  // Create micro-zone
  create: publicProcedure
    .input(z.object({
      governorate: z.string(),
      city: z.string(),
      district: z.string(),
      neighborhood: z.string().optional(),
      nameAr: z.string(),
      nameEn: z.string().optional(),
      centerLatitude: z.number().optional(),
      centerLongitude: z.number().optional(),
      radiusKm: z.number().default(2),
      deliverySpeed: z.enum(["express", "fast", "standard", "scheduled"]).default("fast"),
      estimatedDeliveryMinutes: z.number().default(45),
      deliveryFee: z.number().default(15),
      freeDeliveryThreshold: z.number().optional(),
      assignedDarkStoreId: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      return {
        success: true,
        zone: {
          id: crypto.randomUUID(),
          ...input,
          isActive: true,
          isCovered: true,
          createdAt: new Date().toISOString(),
        },
        message: "تم إنشاء منطقة التوصيل بنجاح",
      };
    }),

  // Get governorates list
  getGovernorates: publicProcedure
    .query(async () => {
      return {
        success: true,
        governorates: [
          { code: "cairo", nameAr: "القاهرة", nameEn: "Cairo" },
          { code: "giza", nameAr: "الجيزة", nameEn: "Giza" },
          { code: "alexandria", nameAr: "الإسكندرية", nameEn: "Alexandria" },
          { code: "dakahlia", nameAr: "الدقهلية", nameEn: "Dakahlia" },
          { code: "sharqia", nameAr: "الشرقية", nameEn: "Sharqia" },
          { code: "qalyubia", nameAr: "القليوبية", nameEn: "Qalyubia" },
          { code: "gharbia", nameAr: "الغربية", nameEn: "Gharbia" },
          { code: "menoufia", nameAr: "المنوفية", nameEn: "Menoufia" },
          { code: "beheira", nameAr: "البحيرة", nameEn: "Beheira" },
          { code: "kafr_el_sheikh", nameAr: "كفر الشيخ", nameEn: "Kafr El Sheikh" },
        ],
      };
    }),
});

// ============================================
// EGYPTIAN HOLIDAYS & PROMOTIONS
// ============================================

const holidayRouter = router({
  // Get all holidays
  getAll: publicProcedure
    .input(z.object({
      type: z.enum(["religious", "national", "seasonal", "special"]).optional(),
      month: z.number().min(1).max(12).optional(),
      isActive: z.boolean().default(true),
    }).optional())
    .query(async ({ input }) => {
      const holidays = [
        {
          id: "h1",
          code: "RAMADAN",
          nameAr: "شهر رمضان",
          nameEn: "Ramadan",
          type: "religious",
          isHijri: true,
          month: 9,
          day: 1,
          durationDays: 30,
          themeColor: "#1a5f2a",
          suggestedCategories: ["GROCERY", "BEVERAGES", "MEAT", "BAKERY"],
          avgSalesIncrease: 150,
        },
        {
          id: "h2",
          code: "EID_FITR",
          nameAr: "عيد الفطر المبارك",
          nameEn: "Eid al-Fitr",
          type: "religious",
          isHijri: true,
          month: 10,
          day: 1,
          durationDays: 4,
          themeColor: "#d4af37",
          suggestedCategories: ["BAKERY", "CLEANING", "MEAT"],
          avgSalesIncrease: 200,
        },
        {
          id: "h3",
          code: "MOTHERS_DAY",
          nameAr: "عيد الأم",
          nameEn: "Mother's Day",
          type: "special",
          isHijri: false,
          month: 3,
          day: 21,
          durationDays: 1,
          themeColor: "#ff69b4",
          avgSalesIncrease: 80,
        },
        {
          id: "h4",
          code: "BACK_TO_SCHOOL",
          nameAr: "موسم العودة للمدارس",
          nameEn: "Back to School",
          type: "seasonal",
          isHijri: false,
          month: 9,
          day: 1,
          durationDays: 30,
          themeColor: "#4169e1",
          avgSalesIncrease: 60,
        },
      ];

      let filtered = holidays;
      if (input?.type) {
        filtered = filtered.filter(h => h.type === input.type);
      }
      if (input?.month) {
        filtered = filtered.filter(h => h.month === input.month);
      }

      return {
        success: true,
        holidays: filtered,
        total: filtered.length,
      };
    }),

  // Get upcoming holidays
  getUpcoming: publicProcedure
    .input(z.object({
      days: z.number().min(1).max(90).default(30),
    }).optional())
    .query(async ({ input }) => {
      // In production, this would calculate based on current date and Hijri calendar
      return {
        success: true,
        upcomingHolidays: [
          {
            id: "h3",
            code: "MOTHERS_DAY",
            nameAr: "عيد الأم",
            daysUntil: 15,
            startDate: "2026-03-21",
            suggestedCategories: ["BAKERY", "DAIRY"],
          },
        ],
      };
    }),

  // Get holiday promotions
  getPromotions: publicProcedure
    .input(z.object({
      holidayId: z.string().optional(),
      isActive: z.boolean().default(true),
      isFeatured: z.boolean().optional(),
    }).optional())
    .query(async ({ input }) => {
      const promotions = [
        {
          id: "promo1",
          holidayId: "h1",
          holidayName: "شهر رمضان",
          nameAr: "عروض رمضان الكريم",
          promotionType: "percentage",
          discountPercentage: 20,
          minOrderAmount: 100,
          startDate: "2026-02-28",
          endDate: "2026-03-30",
          isActive: true,
          isFeatured: true,
          usageCount: 450,
        },
        {
          id: "promo2",
          holidayId: "h2",
          holidayName: "عيد الفطر",
          nameAr: "عروض العيد",
          promotionType: "fixed",
          discountAmount: 50,
          minOrderAmount: 200,
          startDate: "2026-03-30",
          endDate: "2026-04-05",
          isActive: true,
          isFeatured: true,
          usageCount: 120,
        },
      ];

      let filtered = promotions;
      if (input?.holidayId) {
        filtered = filtered.filter(p => p.holidayId === input.holidayId);
      }
      if (input?.isFeatured !== undefined) {
        filtered = filtered.filter(p => p.isFeatured === input.isFeatured);
      }

      return {
        success: true,
        promotions: filtered,
        total: filtered.length,
      };
    }),

  // Create holiday promotion
  createPromotion: publicProcedure
    .input(z.object({
      holidayId: z.string(),
      nameAr: z.string(),
      nameEn: z.string().optional(),
      description: z.string().optional(),
      promotionType: z.enum(["percentage", "fixed", "bogo", "bundle"]),
      discountPercentage: z.number().optional(),
      discountAmount: z.number().optional(),
      minOrderAmount: z.number().optional(),
      maxDiscountAmount: z.number().optional(),
      applicableCategories: z.array(z.string()).optional(),
      applicableProducts: z.array(z.string()).optional(),
      startDate: z.string(),
      endDate: z.string(),
      totalUsageLimit: z.number().optional(),
      perCustomerLimit: z.number().default(1),
      bannerImageUrl: z.string().url().optional(),
      isFeatured: z.boolean().default(false),
    }))
    .mutation(async ({ input }) => {
      return {
        success: true,
        promotion: {
          id: crypto.randomUUID(),
          ...input,
          isActive: true,
          usageCount: 0,
          createdAt: new Date().toISOString(),
        },
        message: "تم إنشاء العرض بنجاح",
      };
    }),

  // Apply promotion to order
  applyPromotion: publicProcedure
    .input(z.object({
      promotionId: z.string(),
      orderId: z.string().optional(),
      orderAmount: z.number(),
      categoryIds: z.array(z.string()).optional(),
      productIds: z.array(z.string()).optional(),
    }))
    .mutation(async ({ input }) => {
      // Mock promotion application
      const discountPercentage = 20;
      const discountAmount = input.orderAmount * (discountPercentage / 100);
      const maxDiscount = 100;
      const finalDiscount = Math.min(discountAmount, maxDiscount);

      return {
        success: true,
        applied: {
          promotionId: input.promotionId,
          originalAmount: input.orderAmount,
          discountAmount: finalDiscount,
          finalAmount: input.orderAmount - finalDiscount,
          discountPercentage,
          message: `تم تطبيق خصم ${discountPercentage}%`,
        },
      };
    }),
});

// ============================================
// ANALYTICS
// ============================================

const analyticsRouter = router({
  // Get Egyptian commerce stats
  getStats: publicProcedure
    .input(z.object({
      period: z.enum(["today", "week", "month", "year"]).default("week"),
    }).optional())
    .query(async ({ input }) => {
      return {
        success: true,
        stats: {
          totalOrders: 1250,
          totalRevenue: 185000,
          avgOrderValue: 148,
          avgDeliveryTime: 28, // minutes

          // Q-Commerce metrics
          expressDeliveries: 450,
          expressDeliveryRate: 36, // %

          // Dark stores
          activeDarkStores: 3,
          darkStoreUtilization: 72, // %

          // Top categories
          topCategories: [
            { code: "GROCERY", nameAr: "البقالة", orders: 380, revenue: 45000 },
            { code: "MEAT", nameAr: "اللحوم", orders: 220, revenue: 55000 },
            { code: "DAIRY", nameAr: "الألبان", orders: 180, revenue: 22000 },
          ],

          // Search insights
          topSearchTerms: [
            { term: "عيش", count: 450 },
            { term: "فراخ", count: 380 },
            { term: "لبن", count: 320 },
            { term: "طماطم", count: 280 },
          ],

          // Dialect search usage
          dialectSearchUsage: 68, // % of searches use Egyptian dialect
        },
      };
    }),

  // Get zone performance
  getZonePerformance: publicProcedure
    .input(z.object({
      period: z.enum(["today", "week", "month"]).default("week"),
    }).optional())
    .query(async ({ input }) => {
      return {
        success: true,
        zones: [
          { zoneId: "mz1", name: "المعادي الجديدة", orders: 180, avgDeliveryTime: 18, onTimeRate: 94 },
          { zoneId: "mz2", name: "الحي السابع - مدينة نصر", orders: 250, avgDeliveryTime: 32, onTimeRate: 88 },
          { zoneId: "mz3", name: "الدقي", orders: 150, avgDeliveryTime: 38, onTimeRate: 85 },
        ],
      };
    }),
});

// ============================================
// MAIN ROUTER
// ============================================

export const egyptianCommerceRouter = router({
  categories: categoryRouter,
  search: searchRouter,
  darkStores: darkStoreRouter,
  microZones: microZoneRouter,
  holidays: holidayRouter,
  analytics: analyticsRouter,
});

export type EgyptianCommerceRouter = typeof egyptianCommerceRouter;
