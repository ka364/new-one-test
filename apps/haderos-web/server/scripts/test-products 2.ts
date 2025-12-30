import { getDb } from "../db";
import { sql } from "drizzle-orm";

async function main() {
  const db = await getDb();
  if (!db) {
    console.error("Database connection failed");
    process.exit(1);
  }

  const products: any = await db.execute(
    sql`SELECT * FROM products WHERE is_active = 1 LIMIT 2`
  );

  console.log("Products count:", products.length);
  console.log("\nFirst product:");
  console.log(JSON.stringify(products[0], null, 2));
  
  if (products[1]) {
    console.log("\nSecond product:");
    console.log(JSON.stringify(products[1], null, 2));
  }
}

main().catch(console.error);
