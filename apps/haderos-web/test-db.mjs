import pg from 'pg';
import fs from 'fs';

const DATABASE_URL = "postgresql://dbhaderos-db:AVNS_Ncgk8Xv7bwjAHnEgipx@app-0aa826b8-e1c8-4121-adfe-11a37780bc7b-do-user-30833516-0.k.db.ondigitalocean.com:25060/dbhaderos-db?sslmode=require";
const CA_CERT = "/Users/ahmedmohamedshawkyatta/Documents/HADEROS-AI-CLOUD/21:12:2025/ca-certificate.crt";

const pool = new pg.Pool({
  connectionString: DATABASE_URL,
  ssl: {
    rejectUnauthorized: false  // For development - use CA cert in production
  }
});

console.log('Testing DigitalOcean PostgreSQL connection...');

try {
  const result = await pool.query('SELECT NOW() as time, current_database() as db');
  console.log('✅ Connected successfully!');
  console.log('📅 Server time:', result.rows[0].time);
  console.log('🗄️ Database:', result.rows[0].db);
} catch(error) {
  console.log('❌ Connection failed:', error.message);
} finally {
  await pool.end();
  process.exit(0);
}
