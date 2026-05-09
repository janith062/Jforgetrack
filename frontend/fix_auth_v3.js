import pg from 'pg';
const connectionString = 'postgresql://postgres:6Cvk25Fg1hxUYpNv@db.pvgcmrjgzzccfkvetnbh.supabase.co:5432/postgres';
const pool = new pg.Pool({ connectionString });

async function run() {
  try {
    console.log("Granting supabase_auth_admin to postgres...");
    await pool.query("GRANT supabase_auth_admin TO postgres;");
    
    // Now try to disable RLS
    console.log("Attempting to disable RLS on auth.users...");
    await pool.query('ALTER TABLE auth.users DISABLE ROW LEVEL SECURITY;');
    
    console.log("Success!");
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await pool.end();
  }
}
run();
