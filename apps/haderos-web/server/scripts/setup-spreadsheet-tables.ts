import { getDb } from '../db';
import { sql } from 'drizzle-orm';

async function setupSpreadsheetTables() {
  const db = await getDb();

  try {
    console.log('🔍 Checking spreadsheet tables...');

    // Check if tables exist
    const result = await db.execute(sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN (
        'spreadsheet_sessions',
        'cell_comments',
        'spreadsheet_versions',
        'spreadsheet_sharing',
        'spreadsheet_edits',
        'spreadsheet_formulas',
        'spreadsheet_charts'
      )
    `);

    console.log(`✅ Found ${result.rows.length} existing tables`);

    if (result.rows.length === 7) {
      console.log('✅ All spreadsheet tables already exist!');
      return;
    }

    console.log('📝 Creating missing spreadsheet tables...');

    // Create spreadsheet_sessions table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS spreadsheet_sessions (
        id VARCHAR(36) PRIMARY KEY,
        hierarchy_path VARCHAR(500) NOT NULL,
        name VARCHAR(255) NOT NULL,
        stakeholder_name VARCHAR(255),
        data JSONB NOT NULL DEFAULT '[]',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        created_by_id INTEGER REFERENCES users(id),
        last_edited_by_id INTEGER REFERENCES users(id)
      )
    `);

    // Create cell_comments table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS cell_comments (
        id VARCHAR(36) PRIMARY KEY,
        session_id VARCHAR(36) NOT NULL REFERENCES spreadsheet_sessions(id) ON DELETE CASCADE,
        cell_address VARCHAR(20) NOT NULL,
        comment TEXT NOT NULL,
        comment_type VARCHAR(50) DEFAULT 'note',
        created_by_id INTEGER NOT NULL REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW(),
        resolved BOOLEAN DEFAULT FALSE,
        resolved_by_id INTEGER REFERENCES users(id),
        resolved_at TIMESTAMP,
        parent_comment_id VARCHAR(36) REFERENCES cell_comments(id) ON DELETE CASCADE,
        mentions JSONB DEFAULT '[]'
      )
    `);

    // Create spreadsheet_versions table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS spreadsheet_versions (
        id VARCHAR(36) PRIMARY KEY,
        session_id VARCHAR(36) NOT NULL REFERENCES spreadsheet_sessions(id) ON DELETE CASCADE,
        version_number INTEGER NOT NULL,
        data JSONB NOT NULL,
        change_summary TEXT,
        created_by_id INTEGER NOT NULL REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create spreadsheet_sharing table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS spreadsheet_sharing (
        id VARCHAR(36) PRIMARY KEY,
        session_id VARCHAR(36) NOT NULL REFERENCES spreadsheet_sessions(id) ON DELETE CASCADE,
        shared_with_user_id INTEGER NOT NULL REFERENCES users(id),
        permission VARCHAR(50) NOT NULL DEFAULT 'view',
        shared_by_id INTEGER NOT NULL REFERENCES users(id),
        shared_at TIMESTAMP DEFAULT NOW(),
        expires_at TIMESTAMP,
        UNIQUE(session_id, shared_with_user_id)
      )
    `);

    // Create spreadsheet_edits table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS spreadsheet_edits (
        id VARCHAR(36) PRIMARY KEY,
        session_id VARCHAR(36) NOT NULL REFERENCES spreadsheet_sessions(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id),
        cell_address VARCHAR(20) NOT NULL,
        old_value TEXT,
        new_value TEXT,
        edited_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create spreadsheet_formulas table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS spreadsheet_formulas (
        id VARCHAR(36) PRIMARY KEY,
        session_id VARCHAR(36) NOT NULL REFERENCES spreadsheet_sessions(id) ON DELETE CASCADE,
        cell_address VARCHAR(20) NOT NULL,
        formula TEXT NOT NULL,
        dependencies JSONB DEFAULT '[]',
        created_by_id INTEGER NOT NULL REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(session_id, cell_address)
      )
    `);

    // Create spreadsheet_charts table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS spreadsheet_charts (
        id VARCHAR(36) PRIMARY KEY,
        session_id VARCHAR(36) NOT NULL REFERENCES spreadsheet_sessions(id) ON DELETE CASCADE,
        chart_type VARCHAR(50) NOT NULL,
        data_range VARCHAR(100) NOT NULL,
        config JSONB NOT NULL DEFAULT '{}',
        created_by_id INTEGER NOT NULL REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    console.log('✅ All spreadsheet tables created successfully!');

    // Verify tables
    const verifyResult = await db.execute(sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN (
        'spreadsheet_sessions',
        'cell_comments',
        'spreadsheet_versions',
        'spreadsheet_sharing',
        'spreadsheet_edits',
        'spreadsheet_formulas',
        'spreadsheet_charts'
      )
    `);

    console.log(`✅ Verification: ${verifyResult.rows.length}/7 tables exist`);
  } catch (error) {
    console.error('❌ Error setting up spreadsheet tables:', error);
    throw error;
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setupSpreadsheetTables()
    .then(() => {
      console.log('✅ Setup complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Setup failed:', error);
      process.exit(1);
    });
}

export { setupSpreadsheetTables };
