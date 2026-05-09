import pg from 'pg';

const connectionString = 'postgresql://postgres:6Cvk25Fg1hxUYpNv@db.pvgcmrjgzzccfkvetnbh.supabase.co:5432/postgres';
const pool = new pg.Pool({ connectionString });

async function run() {
  try {
    const res = await pool.query("SELECT email, id FROM auth.users");
    console.log("All Auth Users:", res.rows);

  } catch (e) {
    console.error("Error:", e);
  } finally {
    await pool.end();
  }
}

run();
