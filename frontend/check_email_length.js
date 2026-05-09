import pg from 'pg';

const connectionString = 'postgresql://postgres:6Cvk25Fg1hxUYpNv@db.pvgcmrjgzzccfkvetnbh.supabase.co:5432/postgres';
const pool = new pg.Pool({ connectionString });

async function run() {
  try {
    const res = await pool.query("SELECT email, length(email) as len FROM auth.users WHERE email LIKE 'nischay%'");
    console.log("Nischay Email Info:", res.rows);
    
    const res2 = await pool.query("SELECT email, length(email) as len FROM auth.users WHERE email = 'test_865@theboringpeople.in'");
    console.log("Test User Email Info:", res2.rows);

  } catch (e) {
    console.error("Error:", e);
  } finally {
    await pool.end();
  }
}

run();
