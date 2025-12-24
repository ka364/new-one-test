import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { requireDb } from "../db";
import { orders } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { 
  validateOrderWithArachnid, 
  trackOrderLifecycle,
  getOrderInsights 
} from "../bio-modules/orders-bio-integration.js";

export const ordersRouter = router({
  // Create new order
  createOrder: publicProcedure
    .input(
      z.object({
        customerName: z.string(),
        customerEmail: z.string().email().optional(),
        customerPhone: z.string(),
        shippingAddress: z.string(),
        items: z.array(
          z.object({
            productId: z.number(),
            productName: z.string(),
            quantity: z.number(),
            price: z.number(),
            size: z.string().optional(),
            color: z.string().optional(),
          })
        ),
        totalAmount: z.number(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await requireDb();
      
      // Generate unique order number
      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      
      // Get user ID (default to 1 if not authenticated)
      const userId = ctx.user?.id || 1;

      // Create separate order for each item (based on current schema)
      const orderIds: number[] = [];
      
      for (const item of input.items) {
        const itemDescription = [
          item.size ? `المقاس: ${item.size}` : null,
          item.color ? `اللون: ${item.color}` : null,
        ]
          .filter(Boolean)
          .join(", ");

        const result = await db
          .insert(orders)
          .values({
            orderNumber: `${orderNumber}-${orderIds.length + 1}`,
            customerName: input.customerName,
            customerEmail: input.customerEmail || null,
            customerPhone: input.customerPhone || null,
            productName: item.productName,
            productDescription: itemDescription || null,
            quantity: item.quantity,
            unitPrice: item.price.toString(),
            totalAmount: (item.price * item.quantity).toString(),
            currency: "EGP",
            status: "pending",
            paymentStatus: "pending",
            shippingAddress: input.shippingAddress,
            notes: input.notes || null,
            createdBy: userId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        
        // Extract ID from result
        if (result && typeof result === 'object' && 'insertId' in result) {
          orderIds.push(Number(result.insertId));
        }
      }

      // Validate order with Arachnid (Bio-Module)
      const validation = await validateOrderWithArachnid({
        orderId: orderIds[0],
        orderNumber,
        customerName: input.customerName,
        customerPhone: input.customerPhone,
        totalAmount: input.totalAmount,
        items: input.items,
        shippingAddress: input.shippingAddress,
      });

      // Track order lifecycle
      await trackOrderLifecycle(orderIds[0], orderNumber, "created");

      return {
        success: true,
        orderId: orderIds[0],
        orderNumber,
        message: "تم إنشاء الطلب بنجاح",
        validation: {
          isValid: validation.isValid,
          warnings: validation.warnings,
          recommendations: validation.recommendations,
        },
      };
    }),

  // Get all orders (protected - admin only)
  getAllOrders: protectedProcedure.query(async () => {
    const db = await requireDb();
    const allOrders = await db
      .select()
      .from(orders)
      .orderBy(desc(orders.createdAt));
    return allOrders;
  }),

  // Get order by ID
  getOrderById: publicProcedure
    .input(z.object({ orderId: z.number() }))
    .query(async ({ input }) => {
      const db = await requireDb();
      
      const [order] = await db
        .select()
        .from(orders)
        .where(eq(orders.id, input.orderId));

      if (!order) {
        throw new Error("Order not found");
      }

      return order;
    }),

  // Get orders by order number
  getOrdersByNumber: publicProcedure
    .input(z.object({ orderNumber: z.string() }))
    .query(async ({ input }) => {
      const db = await requireDb();
      
      // Get all orders with same base order number
      const baseOrderNumber = input.orderNumber.split('-').slice(0, -1).join('-');
      
      const ordersList = await db
        .select()
        .from(orders)
        .where(eq(orders.orderNumber, input.orderNumber));

      return ordersList;
    }),

  // Update order status (protected - admin only)
  updateOrderStatus: protectedProcedure
    .input(
      z.object({
        orderId: z.number(),
        status: z.enum([
          "pending",
          "confirmed",
          "processing",
          "shipped",
          "delivered",
          "cancelled",
          "refunded",
        ]),
      })
    )
    .mutation(async ({ input }) => {
      const db = await requireDb();
      
      // Get order to get orderNumber
      const [order] = await db
        .select()
        .from(orders)
        .where(eq(orders.id, input.orderId));

      if (!order) {
        throw new Error("Order not found");
      }
      
      await db
        .update(orders)
        .set({
          status: input.status,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(orders.id, input.orderId));

      // Track lifecycle with Bio-Modules
      const lifecycleStatus = input.status as "created" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";
      await trackOrderLifecycle(input.orderId, order.orderNumber, lifecycleStatus);

      return {
        success: true,
        message: "تم تحديث حالة الطلب",
      };
    }),

  // Update payment status (protected - admin only)
  updatePaymentStatus: protectedProcedure
    .input(
      z.object({
        orderId: z.number(),
        paymentStatus: z.enum(["pending", "paid", "failed", "refunded"]),
      })
    )
    .mutation(async ({ input }) => {
      const db = await requireDb();
      
      await db
        .update(orders)
        .set({
          paymentStatus: input.paymentStatus,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(orders.id, input.orderId));

      return {
        success: true,
        message: "تم تحديث حالة الدفع",
      };
    }),

  // Get Bio-Module insights for an order
  getOrderBioInsights: publicProcedure
    .input(z.object({ orderId: z.number() }))
    .query(async ({ input }) => {
      const insights = await getOrderInsights(input.orderId);
      return insights;
    }),
});
