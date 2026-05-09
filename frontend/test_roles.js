import pg from 'pg';
const connectionString = 'postgresql://postgres:6Cvk25Fg1hxUYpNv@db.pvgcmrjgzzccfkvetnbh.supabase.co:5432/postgres';
const pool = new pg.Pool({ connectionString });

async function run() {
  try {
    const res = await pool.query(`
      SELECT rolname FROM pg_roles WHERE rolname IN ('supabase_auth_admin', 'anon', 'authenticated', 'service_role', 'dashboard_user');
    `);
    console.log("Roles:", res.rows.map(r => r.rolname));
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await pool.end();
  }
}
run();
