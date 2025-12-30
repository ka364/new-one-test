import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import {
  distributeResources,
  checkInventoryAvailability,
  requestReplenishment,
  makeDistributedDecision,
  delegateAuthority,
  getResourceInsights,
} from "../bio-modules/inventory-bio-integration.js";

export const inventoryRouter = router({
  // Distribute resources (Bio-Module: Mycelium)
  distributeResources: publicProcedure
    .input(
      z.object({
        orderId: z.number(),
        requiredItems: z.array(
          z.object({
            productId: z.number(),
            quantity: z.number(),
          })
        ),
        deliveryLocation: z.string(),
      })
    )
    .query(async ({ input }) => {
      const result = await distributeResources(
        input.orderId,
        input.requiredItems,
        input.deliveryLocation
      );
      return result;
    }),

  // Check inventory availability (Bio-Module: Mycelium)
  checkAvailability: publicProcedure
    .input(
      z.object({
        items: z.array(
          z.object({
            productId: z.number(),
            quantity: z.number(),
          })
        ),
      })
    )
    .query(async ({ input }) => {
      const result = await checkInventoryAvailability(input.items);
      return result;
    }),

  // Request replenishment (Bio-Module: Mycelium)
  requestReplenishment: protectedProcedure
    .input(
      z.object({
        productId: z.number(),
        quantity: z.number(),
        urgency: z.enum(["low", "medium", "high", "urgent"]),
      })
    )
    .mutation(async ({ input }) => {
      const result = await requestReplenishment(
        input.productId,
        input.quantity,
        input.urgency
      );
      return result;
    }),

  // Make distributed decision (Bio-Module: Cephalopod)
  makeDecision: protectedProcedure
    .input(
      z.object({
        decisionType: z.enum([
          "order_approval",
          "pricing_override",
          "inventory_transfer",
          "supplier_selection",
        ]),
        context: z.record(z.any()),
        requiredApprovers: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const result = await makeDistributedDecision(
        input.decisionType,
        input.context,
        input.requiredApprovers || []
      );
      return result;
    }),

  // Delegate authority (Bio-Module: Cephalopod)
  delegateAuthority: protectedProcedure
    .input(
      z.object({
        fromEntity: z.string(),
        toEntity: z.string(),
        authority: z.enum([
          "approve_orders",
          "modify_prices",
          "manage_inventory",
          "select_suppliers",
        ]),
        duration: z.number(), // in hours
      })
    )
    .mutation(async ({ input }) => {
      const result = await delegateAuthority(
        input.fromEntity,
        input.toEntity,
        input.authority,
        input.duration
      );
      return result;
    }),

  // Get resource insights (Bio-Modules)
  getInsights: publicProcedure.query(async () => {
    const insights = await getResourceInsights();
    return insights;
  }),
});
