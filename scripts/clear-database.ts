import { pool } from '../server/db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function clearDatabase() {
  try {
    console.log('Clearing database...');
    
    const sqlContent = fs.readFileSync(
      path.join(process.cwd(), 'supabase', 'migrations', '002_clear_data.sql'),
      'utf8'
    );
    
    await pool.query(sqlContent);
    
    console.log('✅ Database cleared successfully!');
    console.log('All tables are now empty and ready for fresh data.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error clearing database:', error);
    process.exit(1);
  }
}

clearDatabase();
