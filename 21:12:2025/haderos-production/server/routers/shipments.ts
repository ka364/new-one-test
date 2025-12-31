import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import * as XLSX from "xlsx";
import {
  getShipments,
  getShipmentStats,
  bulkInsertShipments,
  getShipmentCount,
  type ShipmentFilters,
} from "../db-shipments";
import {
  optimizeDeliveryRoute,
  batchOptimizeShipments,
  trackDeliveryWithTardigrade,
  getDeliveryInsights,
  type ShipmentData,
} from "../bio-modules/shipping-bio-integration.js";

export const shipmentsRouter = router({
  // Get shipments list with filters
  list: publicProcedure
    .input(
      z.object({
        company: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        status: z.string().optional(),
        search: z.string().optional(),
        limit: z.number().optional(),
        offset: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      const shipments = await getShipments(input);
      const total = await getShipmentCount(input);
      
      return {
        shipments,
        total,
        hasMore: input.offset ? (input.offset + (input.limit || 50)) < total : total > (input.limit || 50),
      };
    }),

  // Get shipment statistics
  stats: publicProcedure.query(async () => {
    return await getShipmentStats();
  }),

  // Bulk import shipments (Admin only)
  bulkImport: protectedProcedure
    .input(
      z.object({
        shipments: z.array(
          z.object({
            company: z.string(),
            trackingNumber: z.string().optional(),
            orderNumber: z.string().optional(),
            customerName: z.string().optional(),
            customerPhone: z.string().optional(),
            quantity: z.number().optional(),
            amount: z.number().optional(),
            shipmentDate: z.string().optional(),
            status: z.string().optional(),
            fileSource: z.string().optional(),
          })
        ),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const inserted = await bulkInsertShipments(input.shipments);
      return { inserted };
    }),

  // Export shipments to Excel
  export: protectedProcedure
    .input(
      z.object({
        company: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        status: z.string().optional(),
        search: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const shipments = await getShipments({ ...input, limit: 10000 });

      // Create Excel workbook
      const workbook = XLSX.utils.book_new();
      
      const worksheetData = [
        [
          "الرقم",
          "الشركة",
          "رقم التتبع",
          "رقم الطلب",
          "اسم العميل",
          "رقم الهاتف",
          "الكمية",
          "المبلغ",
          "تاريخ الشحن",
          "الحالة",
          "المصدر",
        ],
        ...shipments.map((s: any, i: number) => [
          i + 1,
          s.company,
          s.tracking_number || "",
          s.order_number || "",
          s.customer_name || "",
          s.customer_phone || "",
          s.quantity || 0,
          s.amount || 0,
          s.shipment_date || "",
          s.status || "",
          s.file_source || "",
        ]),
      ];

      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      
      // Set column widths
      worksheet['!cols'] = [
        { wch: 8 },  // ID
        { wch: 15 }, // Company
        { wch: 20 }, // Tracking
        { wch: 20 }, // Order
        { wch: 25 }, // Customer
        { wch: 15 }, // Phone
        { wch: 10 }, // Quantity
        { wch: 12 }, // Amount
        { wch: 15 }, // Date
        { wch: 12 }, // Status
        { wch: 30 }, // Source
      ];

      XLSX.utils.book_append_sheet(workbook, worksheet, "الشحنات");

      // Convert to buffer
      const excelBuffer = XLSX.write(workbook, {
        type: "buffer",
        bookType: "xlsx",
      });

      // Convert buffer to base64
      const excelBase64 = excelBuffer.toString("base64");

      const filename = `shipments_${input.company || 'all'}_${new Date().toISOString().split('T')[0]}.xlsx`;

      return {
        excelFile: excelBase64,
        filename,
        count: shipments.length,
      };
    }),

  // Optimize delivery routes (Bio-Module: Ant)
  optimizeRoutes: publicProcedure
    .input(
      z.object({
        shipments: z.array(
          z.object({
            shipmentId: z.number(),
            orderId: z.number(),
            orderNumber: z.string(),
            pickupLocation: z.object({
              address: z.string(),
              latitude: z.number().optional(),
              longitude: z.number().optional(),
              city: z.string().optional(),
              district: z.string().optional(),
            }),
            deliveryLocation: z.object({
              address: z.string(),
              latitude: z.number().optional(),
              longitude: z.number().optional(),
              city: z.string().optional(),
              district: z.string().optional(),
            }),
            priority: z.enum(["low", "medium", "high", "urgent"]),
            estimatedWeight: z.number().optional(),
            fragile: z.boolean().optional(),
          })
        ),
      })
    )
    .query(async ({ input }) => {
      const result = await batchOptimizeShipments(input.shipments);
      return result;
    }),

  // Track delivery status (Bio-Module: Tardigrade)
  trackDelivery: publicProcedure
    .input(
      z.object({
        shipmentId: z.number(),
        status: z.enum(["picked_up", "in_transit", "out_for_delivery", "delivered", "failed", "returned"]),
        location: z.object({
          address: z.string(),
          latitude: z.number().optional(),
          longitude: z.number().optional(),
          city: z.string().optional(),
          district: z.string().optional(),
        }).optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const result = await trackDeliveryWithTardigrade(
        input.shipmentId,
        input.status,
        input.location,
        input.notes
      );
      return result;
    }),

  // Get delivery insights (Bio-Modules)
  getInsights: publicProcedure
    .input(z.object({ shipmentId: z.number() }))
    .query(async ({ input }) => {
      const insights = await getDeliveryInsights(input.shipmentId);
      return insights;
    }),
});
