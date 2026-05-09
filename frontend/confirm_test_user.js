import pg from 'pg';

const connectionString = 'postgresql://postgres:6Cvk25Fg1hxUYpNv@db.pvgcmrjgzzccfkvetnbh.supabase.co:5432/postgres';
const pool = new pg.Pool({ connectionString });

async function run() {
  const email = 'test_865@theboringpeople.in';
  
  try {
    console.log(`Confirming ${email}...`);
    await pool.query('UPDATE auth.users SET email_confirmed_at = NOW() WHERE email = $1', [email]);
    console.log("Confirmed!");
  } catch (e) {
    console.error("Error:", e.message);
  } finally {
    await pool.end();
  }
}

run();
