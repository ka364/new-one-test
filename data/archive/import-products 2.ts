import mysql from 'mysql2/promise';
import 'dotenv/config';

// قائمة المنتجات من الصورة (قائمة أسعار المصنع 10/12/2025)
const productsData = [
  { modelCode: "A1", supplierPrice: 125 },
  { modelCode: "L2", supplierPrice: 150 },
  { modelCode: "SK5", supplierPrice: 155 },
  { modelCode: "D2", supplierPrice: 180 },
  { modelCode: "A10M", supplierPrice: 130 },
  { modelCode: "A10F", supplierPrice: 130 },
  { modelCode: "D4", supplierPrice: 180 },
  { modelCode: "AMA8", supplierPrice: 220 },
  { modelCode: "BO4", supplierPrice: 180 },
  { modelCode: "K1", supplierPrice: 170 },
  { modelCode: "BO5", supplierPrice: 180 },
  { modelCode: "BO6", supplierPrice: 170 },
  { modelCode: "D21", supplierPrice: 165 },
  { modelCode: "L10", supplierPrice: 165 },
  { modelCode: "HF3", supplierPrice: 120 },
  { modelCode: "SK12", supplierPrice: 190 },
  { modelCode: "G5", supplierPrice: 190 },
  { modelCode: "N110", supplierPrice: 280 },
  { modelCode: "W3", supplierPrice: 125 },
  { modelCode: "DF1", supplierPrice: 160 },
  { modelCode: "DF2", supplierPrice: 160 },
  { modelCode: "DF3", supplierPrice: 160 },
  { modelCode: "DF4", supplierPrice: 160 },
  { modelCode: "NO1", supplierPrice: 150 },
  { modelCode: "NZ3", supplierPrice: 160 },
  { modelCode: "NZ1", supplierPrice: 160 },
  { modelCode: "DG1", supplierPrice: 170 },
  { modelCode: "D20", supplierPrice: 170 },
  { modelCode: "D23", supplierPrice: 170 },
  { modelCode: "D22", supplierPrice: 170 },
  { modelCode: "PR21", supplierPrice: 185 },
  { modelCode: "SM1", supplierPrice: 165 },
  { modelCode: "PR26", supplierPrice: 185 },
  { modelCode: "PR25", supplierPrice: 185 },
  { modelCode: "PR22", supplierPrice: 185 },
  { modelCode: "PR24", supplierPrice: 185 },
  { modelCode: "PR4", supplierPrice: 185 },
  { modelCode: "PR14", supplierPrice: 185 },
  { modelCode: "RP15", supplierPrice: 185 },
  { modelCode: "SK1", supplierPrice: 165 },
  { modelCode: "SK20", supplierPrice: 165 },
  { modelCode: "SK21", supplierPrice: 165 },
  { modelCode: "SK22", supplierPrice: 175 },
  { modelCode: "MK07F", supplierPrice: 200 },
  { modelCode: "MK06F", supplierPrice: 200 },
  { modelCode: "MK02F", supplierPrice: 200 },
  { modelCode: "BKB01", supplierPrice: 200 },
  { modelCode: "MK01", supplierPrice: 200 },
  { modelCode: "MK02", supplierPrice: 200 },
  { modelCode: "MK04", supplierPrice: 200 },
  { modelCode: "LK01", supplierPrice: 200 },
  { modelCode: "MK05", supplierPrice: 200 },
  { modelCode: "HK01", supplierPrice: 200 },
  { modelCode: "HK02", supplierPrice: 200 },
  { modelCode: "KS2", supplierPrice: 175 },
  { modelCode: "KO2", supplierPrice: 165 },
  { modelCode: "AX03", supplierPrice: 185 },
  { modelCode: "HD3", supplierPrice: 165 },
  { modelCode: "AX05", supplierPrice: 185 },
  { modelCode: "SK23", supplierPrice: 175 },
  { modelCode: "KS7", supplierPrice: 175 },
  { modelCode: "KS4", supplierPrice: 175 },
  { modelCode: "MKM01", supplierPrice: 185 },
  { modelCode: "KS5", supplierPrice: 175 },
  { modelCode: "KS6", supplierPrice: 175 },
  { modelCode: "AX02", supplierPrice: 170 },
  { modelCode: "MZ1", supplierPrice: 165 },
  { modelCode: "AX06M", supplierPrice: 185 },
  { modelCode: "AX06F", supplierPrice: 180 },
];

async function importProducts() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL!);
  
  console.log(`🚀 بدء استيراد ${productsData.length} منتج...`);
  
  let inserted = 0;
  let skipped = 0;
  
  for (const product of productsData) {
    try {
      // حساب سعر البيع (هامش ربح 30%)
      const sellingPrice = product.supplierPrice * 1.3;
      
      await connection.execute(
        `INSERT INTO products (model_code, supplier_price, selling_price, is_active)
         VALUES (?, ?, ?, 1)
         ON DUPLICATE KEY UPDATE
         supplier_price = VALUES(supplier_price),
         selling_price = VALUES(selling_price)`,
        [product.modelCode, product.supplierPrice, sellingPrice]
      );
      
      inserted++;
      console.log(`✅ ${product.modelCode} - ${product.supplierPrice}ج`);
    } catch (error: any) {
      if (error.code === 'ER_DUP_ENTRY') {
        skipped++;
        console.log(`⏭️  ${product.modelCode} - موجود بالفعل`);
      } else {
        console.error(`❌ خطأ في ${product.modelCode}:`, error.message);
      }
    }
  }
  
  await connection.end();
  
  console.log(`\n📊 النتيجة:`);
  console.log(`   ✅ تم الإدراج: ${inserted}`);
  console.log(`   ⏭️  تم التخطي: ${skipped}`);
  console.log(`   📦 الإجمالي: ${productsData.length}`);
}

importProducts()
  .then(() => {
    console.log('\n✅ تم الانتهاء من الاستيراد!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ فشل الاستيراد:', error);
    process.exit(1);
  });
