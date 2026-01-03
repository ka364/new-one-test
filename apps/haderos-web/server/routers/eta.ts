
import { router, publicProcedure, protectedProcedure } from '../trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { getEInvoiceByOrderId, getEInvoiceByUuid, getOrderById } from '../db';
import { etaService } from '../services/eta.service';

export const etaRouter = router({
    getInvoiceStatus: protectedProcedure
        .input(z.object({ orderId: z.number() }))
        .query(async ({ input }) => {
            const invoice = await getEInvoiceByOrderId(input.orderId);
            if (!invoice) return null;
            return invoice;
        }),

    submitInvoice: protectedProcedure
        .input(z.object({ orderId: z.number() }))
        .mutation(async ({ input }) => {
            // 1. Check if invoice exists
            let invoice = await getEInvoiceByOrderId(input.orderId);

            // 2. If not, create it
            if (!invoice) {
                // Ensure order exists
                const order = await getOrderById(input.orderId);
                if (!order) {
                    throw new TRPCError({
                        code: 'NOT_FOUND',
                        message: 'Order not found',
                    });
                }
                invoice = await etaService.createInvoiceForOrder(input.orderId);
            }

            // 3. Submit if not already valid/submitted
            if (invoice.status === 'valid' || invoice.status === 'submitted') {
                return { success: true, message: 'Invoice already submitted', invoice };
            }

            try {
                const result = await etaService.submitInvoice(invoice.uuid!);
                return { success: true, message: 'Invoice submitted successfully', invoice: result };
            } catch (error) {
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Failed to submit invoice to ETA',
                    cause: error,
                });
            }
        }),

    submitByUuid: protectedProcedure
        .input(z.object({ uuid: z.string() }))
        .mutation(async ({ input }) => {
            const invoice = await getEInvoiceByUuid(input.uuid);
            if (!invoice) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Invoice not found',
                });
            }

            try {
                const result = await etaService.submitInvoice(input.uuid);
                return { success: true, message: 'Invoice submitted successfully', invoice: result };
            } catch (error) {
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Failed to submit invoice to ETA',
                    cause: error,
                });
            }
        }),
});
