import mysql from 'mysql2/promise';
import { readFileSync } from 'fs';
import 'dotenv/config';

async function createTables() {
  const sql = readFileSync('scripts/create-remaining-tables.sql', 'utf-8');
  const connection = await mysql.createConnection(process.env.DATABASE_URL!);

  const statements = sql.split(';').filter(s => s.trim());
  
  console.log(`🚀 Creating ${statements.length} tables...`);
  
  for (const statement of statements) {
    if (statement.trim()) {
      try {
        await connection.execute(statement);
        console.log('✅ Table created');
      } catch (e: any) {
        if (!e.message.includes('already exists')) {
          console.error('❌ Error:', e.message.substring(0, 100));
        } else {
          console.log('⏭️  Table already exists');
        }
      }
    }
  }

  await connection.end();
  console.log('\n✅ All tables created!');
}

createTables()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Failed:', error);
    process.exit(1);
  });
