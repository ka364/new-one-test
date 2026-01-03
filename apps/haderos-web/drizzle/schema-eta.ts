
import { pgTable, text, timestamp, integer, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const etaInvoiceStatusEnum = pgEnum('eta_invoice_status', [
    'pending',    // Created locally, not sent
    'submitted',  // Sent to ETA, waiting response
    'valid',      // Accepted by ETA
    'invalid',    // Rejected by ETA
    'cancelled',  // Cancelled by user/admin
    'rejected'    // Rejected by ETA (alias for invalid but specific)
]);

export const eInvoices = pgTable('e_invoices', {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    orderId: integer('order_id').notNull(), // References orders.id (logical FK)

    // ETA Specific Identifiers
    uuid: text('uuid').unique(),              // The unique ID generated for ETA
    submissionUuid: text('submission_uuid'),  // The ID of the submission batch
    longId: text('long_id'),                  // ETA Long ID (returned after validation)

    // Status tracking
    status: etaInvoiceStatusEnum('status').default('pending').notNull(),

    // Data archiving
    receipt: jsonb('receipt'),                // The full receipt/response from ETA
    signedJson: jsonb('signed_json'),         // The signed document sent to ETA
    rejectionReasons: jsonb('rejection_reasons'), // If invalid, why?

    // URLs
    publicUrl: text('public_url'),            // Link to public invoice view

    // Metadata
    metadata: jsonb('metadata'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
