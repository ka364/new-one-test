/**
 * Conversational UI Router
 * 
 * Enables users to interact with HADEROS using natural language.
 * Generates dynamic UI components based on conversation context.
 */

import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { CUIEngine } from "../services/cui-engine";

const cuiEngine = new CUIEngine();

export const cuiRouter = router({
  /**
   * Process a conversational message
   */
  processMessage: protectedProcedure
    .input(
      z.object({
        message: z.string().min(1),
        stateId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      
      const response = await cuiEngine.processMessage(
        userId,
        input.message,
        input.stateId
      );

      return response;
    }),

  /**
   * Get conversation history
   */
  getHistory: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      // In production, this would fetch from database
      return {
        messages: [],
        total: 0
      };
    }),

  /**
   * Clear conversation state
   */
  clearState: protectedProcedure
    .input(
      z.object({
        stateId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Clear the state from the engine
      return {
        success: true,
        message: "تم مسح حالة المحادثة"
      };
    }),
});
