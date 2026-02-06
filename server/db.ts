import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

// For Supabase, you need the direct connection string
// Get it from: Project Settings > Database > Connection string > URI (use connection pooling)
const DATABASE_URL = process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL;

let pool: pg.Pool;
let db: ReturnType<typeof drizzle>;

if (!DATABASE_URL) {
  console.warn("No DATABASE_URL found - database features will not work");
  pool = null as any;
  db = null as any;
} else {
  console.log('Connecting to Supabase database...');
  
  pool = new Pool({ 
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });

  pool.on('error', (err) => {
    console.error('Unexpected database error:', err);
  });

  db = drizzle(pool, { schema });
}

export { pool, db };
