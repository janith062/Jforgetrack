import pg from 'pg';
const connectionString = 'postgresql://postgres:6Cvk25Fg1hxUYpNv@db.pvgcmrjgzzccfkvetnbh.supabase.co:5432/postgres';
const pool = new pg.Pool({ connectionString });

async function run() {
  try {
    console.log("Attempting to grant usage on extensions to supabase_auth_admin...");
    await pool.query('GRANT USAGE ON SCHEMA extensions TO supabase_auth_admin;');
    console.log("Success!");
  } catch (e) {
    console.error("Error:", e.message);
  } finally {
    await pool.end();
  }
}
run();
