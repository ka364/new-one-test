/**
 * Product Import Router
 * Handles importing products from Google Sheets to database
 */

import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { 
  fetchGoogleSheetData, 
  parseProductsFromSheet,
  validateProduct,
  type GoogleSheetsProduct
} from "../integrations/google-sheets";
import { 
  migrateProductImages,
  type ImageMigrationResult
} from "../integrations/image-migration";
import { requireDb } from "../db";
import { products, inventory } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export const productImportRouter = router({
  /**
   * Preview products from Google Sheets before import
   */
  previewFromSheet: protectedProcedure
    .input(z.object({
      sheetId: z.string(),
      gid: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        // Fetch data from Google Sheets
        const rows = await fetchGoogleSheetData(input.sheetId, input.gid);
        
        // Parse products
        const { products: parsedProducts, errors: parseErrors } = parseProductsFromSheet(rows);
        
        // Validate each product
        const validationResults = parsedProducts.map(product => {
          const validation = validateProduct(product);
          return {
            product,
            valid: validation.valid,
            errors: validation.errors
          };
        });
        
        const validProducts = validationResults.filter(r => r.valid);
        const invalidProducts = validationResults.filter(r => !r.valid);
        
        return {
          success: true,
          totalRows: rows.length - 1, // Exclude header
          validProducts: validProducts.length,
          invalidProducts: invalidProducts.length,
          parseErrors: parseErrors.length,
          preview: {
            valid: validProducts.slice(0, 10), // First 10 valid
            invalid: invalidProducts.slice(0, 10), // First 10 invalid
            parseErrors: parseErrors.slice(0, 10) // First 10 parse errors
          }
        };
      } catch (error) {
        console.error('[Product Import] Preview error:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }),

  /**
   * Import products from Google Sheets to database
   */
  importFromSheet: protectedProcedure
    .input(z.object({
      sheetId: z.string(),
      gid: z.string().optional(),
      migrateImages: z.boolean().default(true),
      skipExisting: z.boolean().default(true),
    }))
    .mutation(async ({ input }) => {
      try {
        const db = await requireDb();
        if (!db) throw new Error('Database connection failed');
        
        // Fetch and parse data
        const rows = await fetchGoogleSheetData(input.sheetId, input.gid);
        const { products: parsedProducts, errors: parseErrors } = parseProductsFromSheet(rows);
        
        // Validate products
        const validProducts: GoogleSheetsProduct[] = [];
        const invalidProducts: Array<{ product: GoogleSheetsProduct; errors: string[] }> = [];
        
        for (const product of parsedProducts) {
          const validation = validateProduct(product);
          if (validation.valid) {
            validProducts.push(product);
          } else {
            invalidProducts.push({ product, errors: validation.errors });
          }
        }
        
        // Import valid products
        let imported = 0;
        let skipped = 0;
        let failed = 0;
        const importErrors: Array<{ modelCode: string; error: string }> = [];
        
        for (const product of validProducts) {
          try {
            // Check if product exists
            if (input.skipExisting) {
              const [existing] = await db
                .select()
                .from(products)
                .where(eq(products.modelCode, product.modelCode));
              
              if (existing) {
                skipped++;
                continue;
              }
            }
            
            // Migrate images to S3 if enabled
            let s3Images: string[] = [];
            if (input.migrateImages && product.images.length > 0) {
              const migration = await migrateProductImages(
                product.images,
                product.modelCode
              );
              s3Images = migration.s3Urls;
            }
            
            // Insert product
            await db.insert(products).values({
              modelCode: product.modelCode,
              supplierPrice: product.costPrice.toString(),
              sellingPrice: product.retailPrice.toString(),
              category: product.category,
              isActive: product.status === 'active' ? 1 : 0,
            });
            
            // Get inserted product ID
            const [insertedProduct] = await db
              .select()
              .from(products)
              .where(eq(products.modelCode, product.modelCode));
            
            if (insertedProduct) {
              // Create inventory records for each size
              for (const size of product.sizes) {
                for (const color of product.colors.length > 0 ? product.colors : [undefined]) {
                  await db.insert(inventory).values({
                    productId: insertedProduct.id,
                    size,
                    color: color || null,
                    quantity: 0, // Initial quantity is 0
                    minStockLevel: 10,
                  });
                }
              }
            }
            
            imported++;
          } catch (error) {
            failed++;
            importErrors.push({
              modelCode: product.modelCode,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          }
        }
        
        return {
          success: true,
          totalRows: rows.length - 1,
          validProducts: validProducts.length,
          invalidProducts: invalidProducts.length,
          imported,
          skipped,
          failed,
          parseErrors: parseErrors.length,
          invalidProductsList: invalidProducts.slice(0, 20),
          importErrors: importErrors.slice(0, 20)
        };
      } catch (error) {
        console.error('[Product Import] Import error:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }),

  /**
   * Get import history/status
   */
  getImportHistory: protectedProcedure
    .query(async () => {
      // TODO: Implement import history tracking
      return {
        imports: []
      };
    }),
});
