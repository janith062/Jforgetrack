import pg from 'pg';
const connectionString = 'postgresql://postgres:6Cvk25Fg1hxUYpNv@db.pvgcmrjgzzccfkvetnbh.supabase.co:5432/postgres';
const pool = new pg.Pool({ connectionString });

async function run() {
  try {
    const res = await pool.query(`
      SELECT schemaname, tablename, rowsecurity 
      FROM pg_tables 
      WHERE schemaname = 'auth' AND tablename = 'users';
    `);
    console.log("RLS Status for auth.users:", JSON.stringify(res.rows, null, 2));

    const res2 = await pool.query(`
      SELECT * FROM pg_policies WHERE schemaname = 'auth' AND tablename = 'users';
    `);
    console.log("Policies on auth.users:", JSON.stringify(res2.rows, null, 2));

  } catch (e) {
    console.error("Error:", e);
  } finally {
    await pool.end();
  }
}
run();
