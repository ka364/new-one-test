
  // Admin endpoints for manager dashboard
  getAllPatterns: protectedProcedure
    .input(z.object({ limit: z.number().optional() }).optional())
    .query(async ({ input }) => {
      return await getAllTaskPatterns(input?.limit);
    }),

  getAllSuggestions: protectedProcedure
    .input(z.object({ limit: z.number().optional() }).optional())
    .query(async ({ input }) => {
      return await getAllAiSuggestions(input?.limit);
    }),

  getAllIcons: protectedProcedure
    .input(z.object({ limit: z.number().optional() }).optional())
    .query(async ({ input }) => {
      return await getAllDynamicIcons(input?.limit);
    }),

  // Google Sheets Operations

  // إنشاء فاتورة
  createInvoice: protectedProcedure
    .input(