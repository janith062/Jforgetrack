import pg from 'pg';
const connectionString = 'postgresql://postgres:6Cvk25Fg1hxUYpNv@db.pvgcmrjgzzccfkvetnbh.supabase.co:5432/postgres';
const pool = new pg.Pool({ connectionString });

async function run() {
  try {
    console.log("Attempting to drop expression from auth.users.confirmed_at...");
    await pool.query('ALTER TABLE auth.users ALTER COLUMN confirmed_at DROP EXPRESSION;');
    console.log("Success for users.confirmed_at!");
    
    console.log("Attempting to drop expression from auth.identities.email...");
    await pool.query('ALTER TABLE auth.identities ALTER COLUMN email DROP EXPRESSION;');
    console.log("Success for identities.email!");
  } catch (e) {
    console.error("Error:", e.message);
  } finally {
    await pool.end();
  }
}
run();
