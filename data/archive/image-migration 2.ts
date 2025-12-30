/**
 * Image Migration Service
 * Migrates images from Google Drive to S3 for better performance and control
 */

import { storagePut } from '../storage';
import { extractGoogleDriveFileId, getGoogleDriveDirectUrl } from './google-sheets';

interface ImageMigrationResult {
  success: boolean;
  originalUrl: string;
  s3Url?: string;
  s3Key?: string;
  error?: string;
}

/**
 * Download image from Google Drive and upload to S3
 */
export async function migrateImageToS3(
  googleDriveUrl: string,
  productModelCode: string,
  imageIndex: number = 0
): Promise<ImageMigrationResult> {
  try {
    // Extract file ID from Google Drive URL
    const fileId = extractGoogleDriveFileId(googleDriveUrl);
    
    if (!fileId) {
      return {
        success: false,
        originalUrl: googleDriveUrl,
        error: 'Invalid Google Drive URL - could not extract file ID'
      };
    }
    
    // Get direct download URL
    const downloadUrl = getGoogleDriveDirectUrl(fileId);
    
    // Download image from Google Drive
    const response = await fetch(downloadUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (!response.ok) {
      return {
        success: false,
        originalUrl: googleDriveUrl,
        error: `Failed to download from Google Drive: ${response.statusText}`
      };
    }
    
    // Get image buffer
    const imageBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(imageBuffer);
    
    // Detect content type from response headers
    let contentType = response.headers.get('content-type') || 'image/jpeg';
    
    // If content-type is not image, try to detect from buffer
    if (!contentType.startsWith('image/')) {
      contentType = detectImageType(buffer) || 'image/jpeg';
    }
    
    // Generate S3 key
    // Format: products/{modelCode}/{modelCode}-{index}.{ext}
    const ext = getExtensionFromContentType(contentType);
    const s3Key = `products/${productModelCode}/${productModelCode}-${imageIndex}.${ext}`;
    
    // Upload to S3
    const { url: s3Url } = await storagePut(s3Key, buffer, contentType);
    
    return {
      success: true,
      originalUrl: googleDriveUrl,
      s3Url,
      s3Key
    };
    
  } catch (error) {
    console.error('[Image Migration] Error:', error);
    return {
      success: false,
      originalUrl: googleDriveUrl,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Migrate multiple images for a product
 */
export async function migrateProductImages(
  googleDriveUrls: string[],
  productModelCode: string
): Promise<{
  successful: ImageMigrationResult[];
  failed: ImageMigrationResult[];
  s3Urls: string[];
}> {
  const results = await Promise.all(
    googleDriveUrls.map((url, index) => 
      migrateImageToS3(url, productModelCode, index)
    )
  );
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  const s3Urls = successful.map(r => r.s3Url!);
  
  return {
    successful,
    failed,
    s3Urls
  };
}

/**
 * Detect image type from buffer (magic numbers)
 */
function detectImageType(buffer: Buffer): string | null {
  // JPEG: FF D8 FF
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return 'image/jpeg';
  }
  
  // PNG: 89 50 4E 47
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
    return 'image/png';
  }
  
  // GIF: 47 49 46
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
    return 'image/gif';
  }
  
  // WebP: 52 49 46 46 ... 57 45 42 50
  if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
      buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50) {
    return 'image/webp';
  }
  
  return null;
}

/**
 * Get file extension from content type
 */
function getExtensionFromContentType(contentType: string): string {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'image/svg+xml': 'svg',
  };
  
  return map[contentType.toLowerCase()] || 'jpg';
}

/**
 * Batch migrate images with concurrency control
 */
export async function batchMigrateImages(
  migrations: Array<{ url: string; modelCode: string; index: number }>,
  concurrency: number = 5
): Promise<ImageMigrationResult[]> {
  const results: ImageMigrationResult[] = [];
  
  // Process in batches
  for (let i = 0; i < migrations.length; i += concurrency) {
    const batch = migrations.slice(i, i + concurrency);
    
    const batchResults = await Promise.all(
      batch.map(m => migrateImageToS3(m.url, m.modelCode, m.index))
    );
    
    results.push(...batchResults);
    
    // Log progress
    console.log(`[Image Migration] Progress: ${Math.min(i + concurrency, migrations.length)}/${migrations.length}`);
  }
  
  return results;
}

export type { ImageMigrationResult };
