import pg from 'pg';

const connectionString = 'postgresql://postgres:6Cvk25Fg1hxUYpNv@db.pvgcmrjgzzccfkvetnbh.supabase.co:5432/postgres';
const pool = new pg.Pool({ connectionString });

async function run() {
  try {
    const email = 'nischay@theboringpeople.in';
    console.log(`Cleaning up account for: ${email}`);

    // Delete in order to satisfy foreign keys
    await pool.query('DELETE FROM public.users WHERE email = $1', [email]);
    await pool.query('DELETE FROM auth.identities WHERE email = $1', [email]);
    await pool.query('DELETE FROM auth.users WHERE email = $1', [email]);

    console.log("Cleanup done. Now you should be able to sign up or re-create the user properly.");

  } catch (e) {
    console.error("Error:", e);
  } finally {
    await pool.end();
  }
}

run();
