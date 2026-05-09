import pg from 'pg';
const connectionString = 'postgresql://postgres:6Cvk25Fg1hxUYpNv@db.pvgcmrjgzzccfkvetnbh.supabase.co:5432/postgres';
const pool = new pg.Pool({ connectionString });

async function run() {
  try {
    const res = await pool.query(`
      SELECT r1.rolname AS role, r2.rolname AS member_of
      FROM pg_auth_members m
      JOIN pg_roles r1 ON m.member = r1.oid
      JOIN pg_roles r2 ON m.role = r2.oid
      WHERE r1.rolname = 'postgres';
    `);
    console.log("Postgres memberships:", JSON.stringify(res.rows, null, 2));
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await pool.end();
  }
}
run();
