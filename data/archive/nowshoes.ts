import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import {
  getAllProducts,
  getProductById,
  getInventory,
  getLowStockItems,
  getAllOrders,
  getDailySalesStats,
  getTopSellingProducts,
} from "../db-nowshoes";

export const nowshoesRouter = router({
  getAllProducts: protectedProcedure.query(async () => {
    return await getAllProducts();
  }),

  getProductById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return await getProductById(input.id);
    }),

  getInventory: protectedProcedure.query(async () => {
    return await getInventory();
  }),

  getLowStockItems: protectedProcedure.query(async () => {
    return await getLowStockItems();
  }),

  getAllOrders: protectedProcedure.query(async () => {
    return await getAllOrders();
  }),

  getDailySalesStats: protectedProcedure
    .input(z.object({ date: z.date() }))
    .query(async ({ input }) => {
      return await getDailySalesStats(input.date);
    }),

  getTopSellingProducts: protectedProcedure
    .input(z.object({ limit: z.number().optional().default(10) }))
    .query(async ({ input }) => {
      return await getTopSellingProducts(input.limit);
    }),
});
