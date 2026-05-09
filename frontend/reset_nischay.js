import pg from 'pg';

const connectionString = 'postgresql://postgres:6Cvk25Fg1hxUYpNv@db.pvgcmrjgzzccfkvetnbh.supabase.co:5432/postgres';
const pool = new pg.Pool({ connectionString });

async function run() {
  try {
    const email = 'nischay@theboringpeople.in';
    console.log(`Resetting password for: ${email}`);

    // Update password in auth.users
    await pool.query(`
      UPDATE auth.users 
      SET encrypted_password = crypt('password123', gen_salt('bf', 10)),
          email_confirmed_at = NOW(),
          updated_at = NOW()
      WHERE email = $1
    `, [email]);

    console.log("Password reset to 'password123'");

  } catch (e) {
    console.error("Error:", e);
  } finally {
    await pool.end();
  }
}

run();
