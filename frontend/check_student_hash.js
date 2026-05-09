import pg from 'pg';

const connectionString = 'postgresql://postgres:6Cvk25Fg1hxUYpNv@db.pvgcmrjgzzccfkvetnbh.supabase.co:5432/postgres';
const pool = new pg.Pool({ connectionString });

async function run() {
  try {
    const res = await pool.query("SELECT email, encrypted_password FROM auth.users WHERE email = '4sh24cs001@forge.local'");
    console.log("Student Hash:", res.rows[0]);

  } catch (e) {
    console.error("Error:", e);
  } finally {
    await pool.end();
  }
}

run();
