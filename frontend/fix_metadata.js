import pg from 'pg';

const connectionString = 'postgresql://postgres:6Cvk25Fg1hxUYpNv@db.pvgcmrjgzzccfkvetnbh.supabase.co:5432/postgres';
const pool = new pg.Pool({ connectionString });

async function run() {
  const email = 'nischay@theboringpeople.in';
  
  try {
    const res = await pool.query("SELECT id FROM auth.users WHERE email = $1", [email]);
    if (res.rows.length === 0) {
        console.log("User not found!");
        return;
    }
    const userId = res.rows[0].id;
    console.log(`Fixing metadata for ${email} (${userId})...`);

    await pool.query(`
      UPDATE auth.users 
      SET raw_app_meta_data = '{"provider":"email","providers":["email"]}'::jsonb,
          raw_user_meta_data = jsonb_build_object('sub', id::text, 'email', email),
          email_confirmed_at = NOW(),
          last_sign_in_at = NOW()
      WHERE id = $1::uuid
    `, [userId]);

    await pool.query(`
      UPDATE auth.identities
      SET identity_data = jsonb_build_object('sub', user_id::text, 'email', $1::text),
          last_sign_in_at = NOW()
      WHERE user_id = $2::uuid
    `, [email, userId]);

    console.log("Metadata fixed!");

  } catch (e) {
    console.error("Error:", e.message);
  } finally {
    await pool.end();
  }
}

run();
