import pg from 'pg';
import fs from 'fs';

const connectionString = 'postgresql://postgres:Shreyas@2593@db.radpjeksfeufuzmokpec.supabase.co:5432/postgres';

const pool = new pg.Pool({
  connectionString,
});

async function run() {
  try {
    const schemaSql = fs.readFileSync('../backend/schema.sql', 'utf8');
    console.log("Running schema...");
    await pool.query(schemaSql);
    console.log("Schema applied successfully.");
    
    const seedSql = fs.readFileSync('../backend/seed.sql', 'utf8');
    console.log("Running seed data...");
    await pool.query(seedSql);
    console.log("Seed data applied successfully.");
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await pool.end();
  }
}

run();
