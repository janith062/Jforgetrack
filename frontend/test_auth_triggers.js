import pg from 'pg';
const connectionString = 'postgresql://postgres:6Cvk25Fg1hxUYpNv@db.pvgcmrjgzzccfkvetnbh.supabase.co:5432/postgres';
const pool = new pg.Pool({ connectionString });

async function run() {
  try {
    const res = await pool.query(`
      SELECT tgname, relname, nspname
      FROM pg_trigger t 
      JOIN pg_class c ON t.tgrelid = c.oid 
      JOIN pg_namespace n ON c.relnamespace = n.oid
      WHERE c.relname = 'users' AND n.nspname = 'auth';
    `);
    console.log("Triggers on auth.users:", JSON.stringify(res.rows, null, 2));
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await pool.end();
  }
}
run();
