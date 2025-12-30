/**
 * Import NOW SHOES products from CSV - Simple version
 * Imports to existing products table
 */

import fs from 'fs';
import { parse } from 'csv-parse/sync';
import { getDb } from '../server/db';
import { eq } from 'drizzle-orm';
import { products } from '../drizzle/schema-nowshoes';

async function importProducts() {
  console.log('Starting product import...\n');
  
  // Read CSV file
  const csvPath = '/tmp/nowshoes_products.csv';
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  
  // Parse CSV
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  });
  
  console.log(`Found ${records.length} products in CSV\n`);
  
  const db = await getDb();
  if (!db) {
    console.error('Failed to connect to database');
    process.exit(1);
  }
  
  let imported = 0;
  let skipped = 0;
  const errors: string[] = [];
  
  for (let idx = 0; idx < records.length; idx++) {
    const row = records[idx];
    
    try {
      // Extract column data (handle multi-line headers)
      const modelCode = row['كود الموديل\nModel Code'] || '';
      const name = row['اسم المنتج\nProduct Name'] || '';
      const basePrice = parseFloat(row['السعر الأساسي\nBase Price'] || '0');
      const discountedPrice = parseFloat(row['السعر بعد الخصم\nDiscounted Price'] || '0');
      const category = row['الفئة\nCategory'] || '';
      const status = row['حالة المنتج\nProduct Status'] || 'متاح';
      
      // Validate required fields
      if (!modelCode || !name) {
        errors.push(`Row ${idx + 1}: Missing model code or name`);
        continue;
      }
      
      if (basePrice <= 0) {
        errors.push(`Row ${idx + 1}: Invalid base price: ${basePrice}`);
        continue;
      }
      
      // Check if product already exists
      const existing = await db.select()
        .from(products)
        .where(eq(products.modelCode, modelCode))
        .limit(1);
      
      if (existing.length > 0) {
        console.log(`  [${idx + 1}] Skipping ${modelCode} - already exists`);
        skipped++;
        continue;
      }
      
      // Insert product (using existing schema fields)
      await db.insert(products).values({
        modelCode,
        supplierPrice: basePrice,
        sellingPrice: discountedPrice || basePrice,
        category: category || null,
        isActive: status === 'متاح',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      console.log(`  [${idx + 1}] ✓ Imported ${modelCode} - ${name}`);
      imported++;
      
    } catch (error) {
      const errorMsg = `Row ${idx + 1}: ${error instanceof Error ? error.message : String(error)}`;
      errors.push(errorMsg);
      console.log(`  [${idx + 1}] ✗ Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  console.log(`\n${'='.repeat(60)}`);
  console.log('Import Summary:');
  console.log(`  Total products in CSV: ${records.length}`);
  console.log(`  Successfully imported: ${imported}`);
  console.log(`  Skipped (already exist): ${skipped}`);
  console.log(`  Errors: ${errors.length}`);
  
  if (errors.length > 0) {
    console.log('\nErrors:');
    errors.slice(0, 10).forEach(error => console.log(`  - ${error}`));
    if (errors.length > 10) {
      console.log(`  ... and ${errors.length - 10} more errors`);
    }
  }
  
  console.log('\n✓ Import complete!');
  process.exit(0);
}

// Run import
importProducts().catch(error => {
  console.error('Import failed:', error);
  process.exit(1);
});
