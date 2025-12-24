/**
 * Upload Product Images Script
 * Downloads images from Google Drive and uploads to S3
 */

import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fetch from 'node-fetch';
import { createWriteStream, mkdirSync, existsSync } from 'fs';
import { pipeline } from 'stream/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: join(__dirname, '..', '.env') });

const STORAGE_API_URL = process.env.BUILT_IN_FORGE_API_URL + '/storage';
const STORAGE_API_KEY = process.env.BUILT_IN_FORGE_API_KEY;

// Sample product images from Google Drive (public access)
// Format: { productCode, driveFileId, fileName }
const SAMPLE_IMAGES = [
  // These are example IDs - replace with actual Google Drive file IDs
  { productCode: 'PR20', driveFileId: '1abc...', fileName: 'PR20-1.jpg' },
  { productCode: 'MK-02', driveFileId: '1def...', fileName: 'MK-02-1.jpg' },
  { productCode: 'A1', driveFileId: '1ghi...', fileName: 'A1-1.jpg' },
];

/**
 * Download image from Google Drive
 */
async function downloadFromDrive(fileId, outputPath) {
  const url = `https://drive.google.com/uc?export=download&id=${fileId}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download: ${response.statusText}`);
    }
    
    const fileStream = createWriteStream(outputPath);
    await pipeline(response.body, fileStream);
    
    console.log(`✅ Downloaded: ${outputPath}`);
    return true;
  } catch (error) {
    console.error(`❌ Download failed for ${fileId}:`, error.message);
    return false;
  }
}

/**
 * Upload image to S3 via Manus Storage API
 */
async function uploadToS3(filePath, s3Key) {
  try {
    const fileBuffer = await import('fs').then(fs => fs.promises.readFile(filePath));
    
    const response = await fetch(`${STORAGE_API_URL}/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STORAGE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        key: s3Key,
        data: fileBuffer.toString('base64'),
        contentType: 'image/jpeg',
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log(`✅ Uploaded to S3: ${s3Key}`);
    return result.url;
  } catch (error) {
    console.error(`❌ S3 upload failed for ${s3Key}:`, error.message);
    return null;
  }
}

/**
 * Insert product image into database
 */
async function insertProductImage(productId, s3Url, s3Key) {
  try {
    const response = await fetch('http://localhost:3000/api/trpc/nowshoes.addProductImage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        productId,
        s3Url,
        s3Key,
        imageType: 'product',
        isPrimary: true,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Database insert failed: ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log(`✅ Inserted into DB: Product ${productId}`);
    return result;
  } catch (error) {
    console.error(`❌ DB insert failed for product ${productId}:`, error.message);
    return null;
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Starting product image upload process...\n');
  
  // Create temp directory
  const tempDir = join(__dirname, '..', 'temp', 'product-images');
  if (!existsSync(tempDir)) {
    mkdirSync(tempDir, { recursive: true });
  }
  
  console.log('📦 Processing images...\n');
  
  for (const image of SAMPLE_IMAGES) {
    console.log(`\n📸 Processing: ${image.productCode} - ${image.fileName}`);
    
    // 1. Download from Google Drive
    const localPath = join(tempDir, image.fileName);
    const downloaded = await downloadFromDrive(image.driveFileId, localPath);
    
    if (!downloaded) {
      console.log(`⏭️  Skipping ${image.productCode}\n`);
      continue;
    }
    
    // 2. Upload to S3
    const s3Key = `products/${image.productCode}/${image.fileName}`;
    const s3Url = await uploadToS3(localPath, s3Key);
    
    if (!s3Url) {
      console.log(`⏭️  Skipping ${image.productCode}\n`);
      continue;
    }
    
    // 3. Find product ID by code
    // TODO: Query database to get product ID
    console.log(`✅ Completed: ${image.productCode}\n`);
  }
  
  console.log('\n✅ Upload process completed!');
  console.log('\n📝 Next steps:');
  console.log('1. Generate embeddings: pnpm tsx scripts/generate-embeddings.mjs');
  console.log('2. Test visual search in the UI');
}

// Note: This script needs actual Google Drive file IDs
// For now, we'll create a simpler approach using the storage API directly
console.log('⚠️  This script requires Google Drive file IDs.');
console.log('📋 Alternative: Use the UI to upload images manually.');
console.log('🔗 Or provide direct image URLs for batch upload.');

// Uncomment to run:
// main().catch(console.error);
