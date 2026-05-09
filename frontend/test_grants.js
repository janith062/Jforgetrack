import pg from 'pg';
const connectionString = 'postgresql://postgres:6Cvk25Fg1hxUYpNv@db.pvgcmrjgzzccfkvetnbh.supabase.co:5432/postgres';
const pool = new pg.Pool({ connectionString });

async function run() {
  try {
    const res = await pool.query(`
      SELECT grantee, privilege_type 
      FROM information_schema.role_table_grants 
      WHERE table_schema = 'auth' AND table_name = 'users';
    `);
    console.log("Grants on auth.users:", JSON.stringify(res.rows, null, 2));

    const res2 = await pool.query(`
      SELECT grantee, privilege_type 
      FROM information_schema.role_table_grants 
      WHERE table_schema = 'auth' AND table_name = 'identities';
    `);
    console.log("Grants on auth.identities:", JSON.stringify(res2.rows, null, 2));
    
    // Check if supabase_auth_admin has usage on auth schema
    const res3 = await pool.query(`
      SELECT grantee, privilege_type 
      FROM information_schema.role_usage_grants 
      WHERE object_schema = 'auth';
    `);
    console.log("Usage on auth schema:", JSON.stringify(res3.rows, null, 2));

  } catch (e) {
    console.error("Error:", e);
  } finally {
    await pool.end();
  }
}
run();
