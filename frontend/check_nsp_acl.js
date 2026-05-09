import pg from 'pg';
const connectionString = 'postgresql://postgres:6Cvk25Fg1hxUYpNv@db.pvgcmrjgzzccfkvetnbh.supabase.co:5432/postgres';
const pool = new pg.Pool({ connectionString });

async function run() {
  try {
    const res = await pool.query(`
      SELECT nspname, nspacl FROM pg_namespace WHERE nspname = 'extensions';
    `);
    console.log("Namespace extensions ACL:", JSON.stringify(res.rows, null, 2));
    
    const res2 = await pool.query(`
      SELECT nspname, nspacl FROM pg_namespace WHERE nspname = 'auth';
    `);
    console.log("Namespace auth ACL:", JSON.stringify(res2.rows, null, 2));
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await pool.end();
  }
}
run();
