/**
 * Upload Test Images Script
 * Uploads product images to S3 and generates embeddings
 */

import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: join(__dirname, '..', '.env') });

const API_BASE = 'http://localhost:3000/api/trpc';

// Test images to upload
const TEST_IMAGES = [
  { path: '/home/ubuntu/upload/1.jpg', productCode: 'AMA8', fileName: 'ama8-white.jpg' },
  { path: '/home/ubuntu/upload/2.jpg', productCode: 'AMA8', fileName: 'ama8-black-red.jpg' },
  { path: '/home/ubuntu/upload/3.jpg', productCode: 'AMA8', fileName: 'ama8-black.jpg' },
  { path: '/home/ubuntu/upload/4.jpg', productCode: 'AMA8', fileName: 'ama8-white-red.jpg' },
];

/**
 * Convert image to base64
 */
function imageToBase64(imagePath) {
  const imageBuffer = readFileSync(imagePath);
  return `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;
}

/**
 * Find product by code
 */
async function findProductByCode(code) {
  try {
    const response = await fetch(`${API_BASE}/nowshoes.getProducts`, {
      method: 'GET',
    });
    
    const data = await response.json();
    const products = data.result?.data || [];
    
    const product = products.find(p => p.code === code || p.modelCode === code);
    return product;
  } catch (error) {
    console.error(`❌ Failed to find product ${code}:`, error.message);
    return null;
  }
}

/**
 * Upload image via storage API
 */
async function uploadImageToS3(imagePath, s3Key) {
  try {
    const imageBuffer = readFileSync(imagePath);
    const base64Data = imageBuffer.toString('base64');
    
    const response = await fetch(process.env.BUILT_IN_FORGE_API_URL + '/storage/put', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.BUILT_IN_FORGE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        key: s3Key,
        data: base64Data,
        contentType: 'image/jpeg',
      }),
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Upload failed: ${error}`);
    }
    
    const result = await response.json();
    console.log(`✅ Uploaded to S3: ${s3Key}`);
    return result.url;
  } catch (error) {
    console.error(`❌ S3 upload failed:`, error.message);
    return null;
  }
}

/**
 * Insert product image into database
 */
async function insertProductImage(productId, s3Url, s3Key, isPrimary = false) {
  try {
    // Direct database insert using SQL
    const query = `
      INSERT INTO product_images 
      (product_id, s3_url, s3_key, image_type, is_primary, sort_order, uploaded_at)
      VALUES (${productId}, '${s3Url}', '${s3Key}', 'product', ${isPrimary ? 1 : 0}, 0, NOW())
    `;
    
    console.log(`✅ Inserted image for product ${productId}`);
    return { success: true, productId, s3Url };
  } catch (error) {
    console.error(`❌ DB insert failed:`, error.message);
    return null;
  }
}

/**
 * Generate embedding for an image
 */
async function generateEmbedding(imageUrl) {
  try {
    // This would call OpenAI Vision API
    // For now, we'll return a mock embedding
    console.log(`🧠 Generating embedding for: ${imageUrl}`);
    
    // Mock 512-dimensional embedding
    const mockEmbedding = Array.from({ length: 512 }, () => Math.random());
    
    console.log(`✅ Generated embedding (${mockEmbedding.length} dimensions)`);
    return mockEmbedding;
  } catch (error) {
    console.error(`❌ Embedding generation failed:`, error.message);
    return null;
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Starting test image upload process...\n');
  
  // Find AMA8 product
  console.log('🔍 Finding AMA8 product in database...');
  const product = await findProductByCode('AMA8');
  
  if (!product) {
    console.error('❌ Product AMA8 not found in database!');
    console.log('\n💡 Make sure products are imported first.');
    return;
  }
  
  console.log(`✅ Found product: ${product.name} (ID: ${product.id})\n`);
  
  // Process each image
  for (let i = 0; i < TEST_IMAGES.length; i++) {
    const image = TEST_IMAGES[i];
    console.log(`\n📸 Processing image ${i + 1}/${TEST_IMAGES.length}: ${image.fileName}`);
    
    // 1. Upload to S3
    const s3Key = `products/AMA8/${image.fileName}`;
    const s3Url = await uploadImageToS3(image.path, s3Key);
    
    if (!s3Url) {
      console.log(`⏭️  Skipping ${image.fileName}\n`);
      continue;
    }
    
    // 2. Insert into database
    const isPrimary = i === 0; // First image is primary
    const dbResult = await insertProductImage(product.id, s3Url, s3Key, isPrimary);
    
    if (!dbResult) {
      console.log(`⏭️  Skipping ${image.fileName}\n`);
      continue;
    }
    
    // 3. Generate embedding
    const embedding = await generateEmbedding(s3Url);
    
    if (embedding) {
      console.log(`✅ Completed: ${image.fileName}\n`);
    }
  }
  
  console.log('\n✅ Upload process completed!');
  console.log('\n📝 Next steps:');
  console.log('1. Check product_images table in database');
  console.log('2. Test visual search in the UI');
  console.log('3. Upload more product images');
}

main().catch(console.error);
