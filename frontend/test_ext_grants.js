import pg from 'pg';
const connectionString = 'postgresql://postgres:6Cvk25Fg1hxUYpNv@db.pvgcmrjgzzccfkvetnbh.supabase.co:5432/postgres';
const pool = new pg.Pool({ connectionString });

async function run() {
  try {
    const res = await pool.query(`
      SELECT grantee, privilege_type 
      FROM information_schema.usage_privileges 
      WHERE object_schema = 'extensions';
    `);
    console.log("Usage on extensions schema:", JSON.stringify(res.rows, null, 2));

    const res2 = await pool.query(`
      SELECT grantee, privilege_type 
      FROM information_schema.role_usage_grants 
      WHERE object_schema = 'extensions';
    `);
    console.log("Usage on extensions schema (role_usage_grants):", JSON.stringify(res2.rows, null, 2));

  } catch (e) {
    console.error("Error:", e);
  } finally {
    await pool.end();
  }
}
run();
