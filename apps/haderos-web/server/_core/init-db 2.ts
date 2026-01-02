// @ts-nocheck
import { Pool } from 'pg';

/**
 * Initialize database tables on first run
 * This will create all necessary tables if they don't exist
 * Uses raw pg client to avoid Drizzle schema validation issues
 */
export async function initializeDatabase() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🔍 Checking database tables...');

    // Create haderos schema if it doesn't exist
    await pool.query(`CREATE SCHEMA IF NOT EXISTS haderos`);
    console.log('  ✓ haderos schema created/verified');

    // Set search_path to haderos schema
    await pool.query(`SET search_path TO haderos`);

    // Check if events table exists (our main table)
    const checkResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'haderos' 
      AND table_name = 'events'
    `);

    if (checkResult.rows.length > 0) {
      console.log('✅ Database tables already exist, skipping initialization');
      await pool.end();
      return;
    }

    console.log('📋 Creating database tables in haderos schema...');

    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        open_id VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        avatar VARCHAR(500),
        role VARCHAR(50) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('  ✓ users table created');

    // Create events table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS events (
        id SERIAL PRIMARY KEY,
        event_type VARCHAR(100) NOT NULL,
        event_data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        processed BOOLEAN DEFAULT FALSE
      )
    `);
    console.log('  ✓ events table created');

    // Create products table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        name_ar VARCHAR(255),
        description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        stock INTEGER DEFAULT 0,
        category VARCHAR(100),
        image_url VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('  ✓ products table created');

    // Create orders table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        total_amount DECIMAL(10, 2) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        payment_method VARCHAR(50),
        shipping_address JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('  ✓ orders table created');

    // Create transactions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        transaction_type VARCHAR(50) NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        description TEXT,
        status VARCHAR(50) DEFAULT 'pending',
        kaia_status VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('  ✓ transactions table created');

    // Create indexes
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_events_created ON events(created_at)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_products_category ON products(category)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)`);
    await pool.query(
      `CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(transaction_type)`
    );
    console.log('  ✓ indexes created');

    // Insert initial test data
    await pool.query(`
      INSERT INTO users (open_id, name, email, role) VALUES
      ('admin_001', 'Admin User', 'admin@haderos.ai', 'admin'),
      ('user_001', 'Test User', 'user@haderos.ai', 'user')
      ON CONFLICT (open_id) DO NOTHING
    `);
    console.log('  ✓ test users created');

    await pool.query(`
      INSERT INTO products (name, name_ar, description, price, stock, category) VALUES
      ('Test Product 1', 'منتج تجريبي 1', 'Test product description', 99.99, 10, 'shoes'),
      ('Test Product 2', 'منتج تجريبي 2', 'Another test product', 149.99, 5, 'shoes')
    `);
    console.log('  ✓ test products created');

    console.log('🎉 Database initialization completed successfully!');

    await pool.end();
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    await pool.end();
    // Don't throw error to prevent app from crashing
    // The app should still start even if DB init fails
  }
}
