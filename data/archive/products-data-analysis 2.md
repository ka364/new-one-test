# NOW SHOES Products Data Analysis

## File Information
- **Source:** Copy of NOW SHOES PRODUCTS.xlsx
- **Total Products:** 1,019 products
- **Last Updated:** December 18, 2025

## Data Structure

### Columns (16 total)

1. **صور المنتج / Product Images**
   - Format: Multiple Google Drive URLs (newline separated)
   - Example: `https://drive.google.com/file/d/...`

2. **اسم المنتج / Product Name**
   - Format: Arabic name + product type
   - Example: "N110 جزمة", "AMA8 كوتشي"

3. **وصف المنتج / Description**
   - Format: Arabic text description
   - Details: Material, comfort features, durability

4. **كود الموديل / Model Code**
   - Format: Alphanumeric code
   - Example: "N110", "AMA8", "MK01"
   - **Important:** This is the SKU/unique identifier

5. **السعر الأساسي / Base Price**
   - Format: Decimal number (EGP)
   - Example: 600.0, 599.0

6. **السعر بعد الخصم / Discounted Price**
   - Format: Decimal number (EGP)
   - Can be null if no discount

7. **نسبة الخصم % / Discount %**
   - Format: Percentage
   - Calculated from base and discounted price

8. **المقاسات المتاحة / Available Sizes**
   - Format: Comma-separated sizes
   - Example: "40, 41, 42, 43, 44, 45"

9. **الألوان المتاحة / Available Colors**
   - Format: Comma-separated colors (Arabic)
   - Example: "أسود, بني, كحلي"

10. **الكمية المتاحة / Stock Quantity**
    - Format: Integer
    - Total stock across all sizes/colors

11. **الفئة / Category**
    - Format: Arabic category name
    - Example: "أحذية رجالي", "كوتشي"

12. **العلامة التجارية / Brand**
    - Format: Brand name
    - Example: "NOW SHOES", "Adidas", "Nike"

13. **العروض الخاصة / Special Offers**
    - Format: Text description
    - Example: "اشتري 2 واحصل على خصم 10%"

14. **حالة المنتج / Product Status**
    - Format: Status text
    - Values: "متاح", "نفذ", "قريباً"

15. **تاريخ الإضافة / Date Added**
    - Format: Date
    - When product was added to catalog

16. **فئة** (Duplicate column)
    - Appears to be duplicate of column 11

## Sample Products

### Product 1: N110 جزمة
- **Model Code:** N110
- **Base Price:** 600 EGP
- **Description:** حذاء كلاسيك مُصنع من الجلد الطبيعي 100%، ويتميز بنعل مريح
- **Images:** 2 Google Drive links

### Product 2: AMA8 كوتشي
- **Model Code:** AMA8
- **Base Price:** 599 EGP
- **Description:** كوتشي سهل الإرتداء يمتعك بالراحة طوال اليوم، مُصمم بنعل مرن وبطانة داخلية ناعمة ومريحة
- **Images:** 4 Google Drive links

### Product 3: MK01 كوتشي
- **Model Code:** MK01
- **Base Price:** 599 EGP
- **Description:** كوتشي مُصنع من نعل PVC الخفيف والمريح بيتحمل معاك طول اليوم
- **Images:** 3 Google Drive links

## Integration Requirements

### 1. Product Images
- **Challenge:** Images are Google Drive links (not direct URLs)
- **Solution Options:**
  1. Download images and upload to S3
  2. Convert Google Drive links to direct image URLs
  3. Use Google Drive API for image serving

### 2. Size/Color Variants
- **Current:** Comma-separated text
- **Needed:** Structured variant system with individual SKUs
- **Example:**
  - Product: N110 جزمة
  - Variants:
    - N110-40-BLACK (Size 40, Black)
    - N110-41-BLACK (Size 41, Black)
    - N110-40-BROWN (Size 40, Brown)

### 3. Stock Management
- **Current:** Single total quantity
- **Needed:** Per-variant stock tracking
- **Challenge:** How to distribute total stock across variants?

### 4. Shopify Sync Strategy

#### Option A: Simple Products (No Variants)
- Create 1,019 simple products
- Ignore size/color variations
- **Pros:** Quick to implement
- **Cons:** Poor customer experience, can't track size-specific stock

#### Option B: Products with Variants
- Create ~100-200 parent products
- Each with size/color variants
- **Pros:** Professional, accurate stock
- **Cons:** Need to restructure data

#### Option C: Hybrid Approach
- Import as simple products initially
- Gradually convert to variants as needed
- **Pros:** Fast start, incremental improvement
- **Cons:** Temporary data inconsistency

## Recommended Approach

### Phase 1: Data Preparation (1-2 days)
1. Clean and normalize product data
2. Download all product images from Google Drive
3. Upload images to S3
4. Generate variant SKUs from size/color combinations
5. Distribute stock across variants (manual or rule-based)

### Phase 2: Shopify Import (1 day)
1. Create products via Shopify API
2. Upload images
3. Set up variants
4. Configure inventory tracking

### Phase 3: Ongoing Sync (Automated)
1. Daily stock sync from NOW SHOES → Shopify
2. Order sync from Shopify → NOW SHOES
3. Price updates
4. New product additions

## Data Quality Issues to Address

1. **Duplicate Column:** Column 16 "فئة" appears to be duplicate
2. **Image URLs:** Need conversion to direct URLs or S3
3. **Stock Distribution:** Total stock needs breakdown by variant
4. **Missing Data:** Check for products with missing critical fields
5. **Price Consistency:** Verify discount calculations

## Next Steps

1. ✅ Analyze Excel structure (DONE)
2. [ ] Create product import script
3. [ ] Download and process images
4. [ ] Build variant generation logic
5. [ ] Test Shopify API integration
6. [ ] Import sample batch (10-20 products)
7. [ ] Verify data accuracy
8. [ ] Full import (1,019 products)
9. [ ] Set up automated sync

## Technical Notes

- **Excel Format:** XLSX (OpenPyXL compatible)
- **Encoding:** UTF-8 (Arabic text)
- **Row Count:** 1,020 (1 header + 1,019 products)
- **Column Count:** 26 (A-Z, but only 16 have data)
