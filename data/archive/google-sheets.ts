/**
 * Google Sheets Integration for NOW SHOES Product Import
 * 
 * This module provides functions to read product data from Google Sheets
 * and parse it into a structured format for database import.
 */

interface GoogleSheetsProduct {
  modelCode: string;
  nameAr: string;
  nameEn?: string;
  category?: string;
  brand?: string;
  costPrice: number;
  wholesalePrice: number;
  retailPrice: number;
  sizes: string[];
  colors: string[];
  images: string[]; // Google Drive URLs
  description?: string;
  material?: string;
  weight?: number;
  status: 'active' | 'inactive';
}

interface ImportResult {
  success: boolean;
  totalRows: number;
  imported: number;
  skipped: number;
  errors: Array<{
    row: number;
    error: string;
    data?: any;
  }>;
}

/**
 * Fetch data from Google Sheets using public CSV export
 * 
 * Google Sheets URL format:
 * https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit#gid={GID}
 * 
 * CSV Export URL:
 * https://docs.google.com/spreadsheets/d/{SHEET_ID}/export?format=csv&gid={GID}
 */
export async function fetchGoogleSheetData(sheetId: string, gid: string = '0'): Promise<string[][]> {
  const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
  
  try {
    const response = await fetch(csvUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch Google Sheet: ${response.statusText}`);
    }
    
    const csvText = await response.text();
    
    // Parse CSV
    const rows = parseCSV(csvText);
    
    return rows;
  } catch (error) {
    console.error('[Google Sheets] Fetch error:', error);
    throw error;
  }
}

/**
 * Simple CSV parser
 * Handles quoted fields and commas within quotes
 */
function parseCSV(csvText: string): string[][] {
  const rows: string[][] = [];
  const lines = csvText.split('\n');
  
  for (const line of lines) {
    if (!line.trim()) continue;
    
    const row: string[] = [];
    let currentField = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        row.push(currentField.trim());
        currentField = '';
      } else {
        currentField += char;
      }
    }
    
    // Push last field
    row.push(currentField.trim());
    rows.push(row);
  }
  
  return rows;
}

/**
 * Parse Google Sheets rows into structured product data
 * 
 * Expected columns (based on NOW SHOES Google Sheet):
 * - Model Code (كود الموديل)
 * - Name Arabic (الاسم بالعربي)
 * - Name English (optional)
 * - Category (الفئة)
 * - Brand (الماركة)
 * - Cost Price (سعر التكلفة)
 * - Wholesale Price (سعر الجملة)
 * - Retail Price (سعر القطاعي)
 * - Sizes (المقاسات) - comma-separated
 * - Colors (الألوان) - comma-separated
 * - Images (الصور) - Google Drive URLs, comma-separated
 * - Description (الوصف)
 * - Material (الخامة)
 * - Weight (الوزن)
 * - Status (الحالة)
 */
export function parseProductsFromSheet(rows: string[][]): {
  products: GoogleSheetsProduct[];
  errors: Array<{ row: number; error: string; data?: any }>;
} {
  if (rows.length === 0) {
    return { products: [], errors: [] };
  }
  
  // First row is headers
  const headers = rows[0];
  const products: GoogleSheetsProduct[] = [];
  const errors: Array<{ row: number; error: string; data?: any }> = [];
  
  // Find column indexes (case-insensitive, supports Arabic and English)
  const getColumnIndex = (possibleNames: string[]): number => {
    return headers.findIndex(h => 
      possibleNames.some(name => 
        h.toLowerCase().includes(name.toLowerCase())
      )
    );
  };
  
  const columnIndexes = {
    modelCode: getColumnIndex(['model', 'code', 'كود', 'موديل']),
    nameAr: getColumnIndex(['name', 'اسم', 'arabic', 'عربي']),
    nameEn: getColumnIndex(['english', 'انجليزي']),
    category: getColumnIndex(['category', 'فئة', 'تصنيف']),
    brand: getColumnIndex(['brand', 'ماركة']),
    costPrice: getColumnIndex(['cost', 'تكلفة']),
    wholesalePrice: getColumnIndex(['wholesale', 'جملة']),
    retailPrice: getColumnIndex(['retail', 'قطاعي']),
    sizes: getColumnIndex(['size', 'مقاس']),
    colors: getColumnIndex(['color', 'لون']),
    images: getColumnIndex(['image', 'صور', 'photo']),
    description: getColumnIndex(['description', 'وصف']),
    material: getColumnIndex(['material', 'خامة']),
    weight: getColumnIndex(['weight', 'وزن']),
    status: getColumnIndex(['status', 'حالة']),
  };
  
  // Process data rows (skip header)
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    
    try {
      // Skip empty rows
      if (row.every(cell => !cell || cell.trim() === '')) {
        continue;
      }
      
      // Extract model code (required)
      const modelCode = row[columnIndexes.modelCode]?.trim();
      if (!modelCode) {
        errors.push({
          row: i + 1,
          error: 'Missing model code',
          data: row
        });
        continue;
      }
      
      // Extract prices (required)
      const costPrice = parseFloat(row[columnIndexes.costPrice] || '0');
      const wholesalePrice = parseFloat(row[columnIndexes.wholesalePrice] || '0');
      const retailPrice = parseFloat(row[columnIndexes.retailPrice] || '0');
      
      if (costPrice <= 0 || wholesalePrice <= 0 || retailPrice <= 0) {
        errors.push({
          row: i + 1,
          error: 'Invalid prices (must be > 0)',
          data: { modelCode, costPrice, wholesalePrice, retailPrice }
        });
        continue;
      }
      
      // Extract sizes and colors (arrays)
      const sizesStr = row[columnIndexes.sizes] || '';
      const colorsStr = row[columnIndexes.colors] || '';
      
      const sizes = sizesStr
        .split(/[,،]/) // Support both English and Arabic comma
        .map(s => s.trim())
        .filter(s => s);
      
      const colors = colorsStr
        .split(/[,،]/)
        .map(c => c.trim())
        .filter(c => c);
      
      // Extract images (Google Drive URLs)
      const imagesStr = row[columnIndexes.images] || '';
      const images = imagesStr
        .split(/[,،\n]/)
        .map(url => url.trim())
        .filter(url => url && (url.includes('drive.google.com') || url.startsWith('http')));
      
      // Build product object
      const product: GoogleSheetsProduct = {
        modelCode,
        nameAr: row[columnIndexes.nameAr]?.trim() || modelCode,
        nameEn: row[columnIndexes.nameEn]?.trim(),
        category: row[columnIndexes.category]?.trim(),
        brand: row[columnIndexes.brand]?.trim(),
        costPrice,
        wholesalePrice,
        retailPrice,
        sizes,
        colors,
        images,
        description: row[columnIndexes.description]?.trim(),
        material: row[columnIndexes.material]?.trim(),
        weight: parseFloat(row[columnIndexes.weight] || '0') || undefined,
        status: (row[columnIndexes.status]?.toLowerCase().includes('inactive') || 
                 row[columnIndexes.status]?.toLowerCase().includes('غير نشط'))
          ? 'inactive'
          : 'active',
      };
      
      products.push(product);
      
    } catch (error) {
      errors.push({
        row: i + 1,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: row
      });
    }
  }
  
  return { products, errors };
}

/**
 * Extract Google Drive file ID from various URL formats
 * 
 * Supported formats:
 * - https://drive.google.com/file/d/{FILE_ID}/view
 * - https://drive.google.com/open?id={FILE_ID}
 * - https://drive.google.com/uc?id={FILE_ID}
 */
export function extractGoogleDriveFileId(url: string): string | null {
  if (!url) return null;
  
  // Format 1: /file/d/{FILE_ID}/
  const match1 = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (match1) return match1[1];
  
  // Format 2: ?id={FILE_ID}
  const match2 = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (match2) return match2[1];
  
  return null;
}

/**
 * Convert Google Drive URL to direct download URL
 */
export function getGoogleDriveDirectUrl(fileId: string): string {
  return `https://drive.google.com/uc?export=download&id=${fileId}`;
}

/**
 * Validate product data before import
 */
export function validateProduct(product: GoogleSheetsProduct): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!product.modelCode || product.modelCode.length < 2) {
    errors.push('Model code is required and must be at least 2 characters');
  }
  
  if (!product.nameAr || product.nameAr.length < 2) {
    errors.push('Arabic name is required');
  }
  
  if (product.costPrice <= 0) {
    errors.push('Cost price must be greater than 0');
  }
  
  if (product.wholesalePrice <= 0) {
    errors.push('Wholesale price must be greater than 0');
  }
  
  if (product.retailPrice <= 0) {
    errors.push('Retail price must be greater than 0');
  }
  
  if (product.wholesalePrice < product.costPrice) {
    errors.push('Wholesale price should be >= cost price');
  }
  
  if (product.retailPrice < product.wholesalePrice) {
    errors.push('Retail price should be >= wholesale price');
  }
  
  if (product.sizes.length === 0) {
    errors.push('At least one size is required');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

export type { GoogleSheetsProduct, ImportResult };
