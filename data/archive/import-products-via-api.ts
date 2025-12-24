/**
 * Import NOW SHOES products from CSV via tRPC API
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
      const imagesStr = row['صور المنتج\nProduct Images'] || '';
      const name = row['اسم المنتج\nProduct Name'] || '';
      const description = row['وصف المنتج\nDescription'] || '';
      const modelCode = row['كود الموديل\nModel Code'] || '';
      const basePrice = parseFloat(row['السعر الأساسي\nBase Price'] || '0');
      const discountedPrice = parseFloat(row['السعر بعد الخصم\nDiscounted Price'] || '0');
      const sizesStr = row['المقاسات المتاحة\nAvailable Sizes'] || '';
      const colorsStr = row['الألوان المتاحة\nAvailable Colors'] || '';
      const stock = parseInt(row['الكمية المتاحة\nStock Quantity'] || '0');
      const category = row['الفئة\nCategory'] || '';
      const brand = row['العلامة التجارية\nBrand'] || '';
      const specialOffers = row['العروض الخاصة\nSpecial Offers'] || '';
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
        .from(nowshoesProducts)
        .where(eq(nowshoesProducts.modelCode, modelCode))
        .limit(1);
      
      if (existing.length > 0) {
        console.log(`  [${idx + 1}] Skipping ${modelCode} - already exists`);
        skipped++;
        continue;
      }
      
      // Parse images (Google Drive URLs separated by newlines)
      const imageUrls = imagesStr
        .split('\n')
        .map(url => url.trim())
        .filter(url => url && url.includes('drive.google.com'));
      
      // Parse sizes (comma or slash separated)
      const sizes = sizesStr
        .replace(/\//g, ',')
        .split(',')
        .map(s => s.trim())
        .filter(s => s);
      
      // Parse colors (comma or slash separated)
      const colors = colorsStr
        .replace(/\//g, ',')
        .split(',')
        .map(c => c.trim())
        .filter(c => c);
      
      // Insert product
      const [product] = await db.insert(nowshoesProducts).values({
        modelCode,
        nameAr: name,
        descriptionAr: description,
        category: category || null,
        brand: brand || null,
        basePrice,
        discountedPrice: discountedPrice || basePrice,
        stockQuantity: stock,
        status: status === 'متاح' ? 'active' : 'inactive',
        specialOffers: specialOffers || null,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();
      
      const productId = product.id;
      
      // Insert images
      if (imageUrls.length > 0) {
        await db.insert(nowshoesProductImages).values(
          imageUrls.map((url, imgIdx) => ({
            productId,
            imageUrl: url,
            isPrimary: imgIdx === 0,
            displayOrder: imgIdx,
            createdAt: new Date()
          }))
        );
      }
      
      // Insert sizes
      if (sizes.length > 0) {
        await db.insert(nowshoesProductSizes).values(
          sizes.map(size => ({
            productId,
            size,
            createdAt: new Date()
          }))
        );
      }
      
      // Insert colors
      if (colors.length > 0) {
        await db.insert(nowshoesProductColors).values(
          colors.map(color => ({
            productId,
            color,
            createdAt: new Date()
          }))
        );
      }
      
      console.log(`  [${idx + 1}] ✓ Imported ${modelCode} - ${name} (${imageUrls.length} images, ${sizes.length} sizes, ${colors.length} colors)`);
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
