import pg from 'pg';

const connectionString = 'postgresql://postgres:6Cvk25Fg1hxUYpNv@db.pvgcmrjgzzccfkvetnbh.supabase.co:5432/postgres';
const pool = new pg.Pool({ connectionString });

async function run() {
  try {
    const email = 'nischay@theboringpeople.in';
    
    console.log(`Restoring identity_data fields for ${email}...`);

    const res = await pool.query("SELECT id FROM auth.users WHERE email = $1", [email]);
    if (res.rows.length === 0) {
        console.log("User not found!");
        return;
    }
    const userId = res.rows[0].id;

    await pool.query(`
        UPDATE auth.identities 
        SET identity_data = jsonb_build_object(
            'sub', user_id::text, 
            'email', $1::text,
            'email_verified', false,
            'phone_verified', false
        ) 
        WHERE user_id = $2
    `, [email, userId]);

    await pool.query(`
        UPDATE auth.users
        SET raw_user_meta_data = jsonb_build_object(
            'sub', id::text, 
            'email', email,
            'email_verified', false,
            'phone_verified', false
        )
        WHERE id = $1
    `, [userId]);

    console.log("Restored!");

  } catch (e) {
    console.error("Error:", e);
  } finally {
    await pool.end();
  }
}

run();
