import pg from 'pg';

const connectionString = 'postgresql://postgres:Shreyas@2593@db.radpjeksfeufuzmokpec.supabase.co:5432/postgres';
const pool = new pg.Pool({ connectionString });

async function check() {
  try {
    const res = await pool.query(`SELECT id, email, encrypted_password, email_confirmed_at, raw_user_meta_data FROM auth.users WHERE email = 'nischay@theboringpeople.in'`);
    console.log("User:", JSON.stringify(res.rows[0], null, 2));

    const idRes = await pool.query(`SELECT * FROM auth.identities WHERE user_id = '${res.rows[0]?.id}'`);
    console.log("Identity:", JSON.stringify(idRes.rows[0], null, 2));
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await pool.end();
  }
}

check();
