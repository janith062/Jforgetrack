import pg from 'pg';

const connectionString = 'postgresql://postgres:6Cvk25Fg1hxUYpNv@db.pvgcmrjgzzccfkvetnbh.supabase.co:5432/postgres';
const pool = new pg.Pool({ connectionString });

async function run() {
  try {
    const res = await pool.query("SELECT crypt('password123', gen_salt('bf', 10)) as hash");
    console.log("Produced Hash:", res.rows[0].hash);
    
    const res2 = await pool.query("SELECT encrypted_password FROM auth.users WHERE email = 'nischay@theboringpeople.in'");
    console.log("Current Nischay Hash:", res2.rows[0]?.encrypted_password);

  } catch (e) {
    console.error("Error:", e);
  } finally {
    await pool.end();
  }
}

run();
