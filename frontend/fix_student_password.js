import pg from 'pg';

const connectionString = 'postgresql://postgres:6Cvk25Fg1hxUYpNv@db.pvgcmrjgzzccfkvetnbh.supabase.co:5432/postgres';
const pool = new pg.Pool({ connectionString });

async function run() {
  try {
    const email = '4sh24cs001@forge.local';
    const password = '4sh24cs001';
    
    console.log(`Updating password for ${email} to cost factor 10...`);
    await pool.query("UPDATE auth.users SET encrypted_password = crypt($1, gen_salt('bf', 10)) WHERE email = $2", [password, email]);
    console.log("Updated!");

  } catch (e) {
    console.error("Error:", e);
  } finally {
    await pool.end();
  }
}

run();
