// Run Employment Plan Schema SQL
// This script executes the employment_plan_schema.sql file

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pg from 'pg';
import dotenv from 'dotenv';

const { Pool } = pg;

// Get current directory in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

const sqlFile = join(__dirname, 'employment_plan_schema.sql');
const sql = readFileSync(sqlFile, 'utf8');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function runSchema() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting Employment Plan Schema Setup...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Execute the SQL file
    await client.query(sql);
    
    console.log('✅ Schema created successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Check results
    const cyclesResult = await client.query('SELECT COUNT(*) FROM employment_cycles');
    const gatesResult = await client.query('SELECT COUNT(*) FROM cycle_gates');
    const criteriaResult = await client.query('SELECT COUNT(*) FROM gate_criteria');
    const coreResult = await client.query('SELECT COUNT(*) FROM core_pod_members');
    
    console.log(`\n📊 Summary:`);
    console.log(`   Employment Cycles: ${cyclesResult.rows[0].count}`);
    console.log(`   Gates: ${gatesResult.rows[0].count}`);
    console.log(`   Criteria: ${criteriaResult.rows[0].count}`);
    console.log(`   Core Pod Members: ${coreResult.rows[0].count}`);
    
    console.log(`\n📋 Quick View:`);
    
    // Show current cycle
    const cycleProgress = await client.query('SELECT * FROM v_cycle_progress');
    if (cycleProgress.rows.length > 0) {
      const cycle = cycleProgress.rows[0];
      console.log(`\n   Current Cycle: ${cycle.cycle_name}`);
      console.log(`   Days Elapsed: ${cycle.days_elapsed}/${cycle.total_days}`);
      console.log(`   Progress: ${cycle.progress_percentage}%`);
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Employment Plan System Ready!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
  } catch (error) {
    console.error('❌ Error running schema:', error.message);
    console.error('Stack:', error.stack);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runSchema()
  .then(() => {
    console.log('🎉 Done!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
