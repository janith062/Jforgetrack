import pg from 'pg';

const connectionString = 'postgresql://postgres:6Cvk25Fg1hxUYpNv@db.pvgcmrjgzzccfkvetnbh.supabase.co:5432/postgres';
const pool = new pg.Pool({ connectionString });

async function run() {
  try {
    const emailToConvert = 'test_865@theboringpeople.in';
    const targetEmail = 'nischay@theboringpeople.in';
    
    console.log(`Converting ${emailToConvert} to ${targetEmail}...`);

    // 1. Get ID
    const res = await pool.query("SELECT id FROM auth.users WHERE email = $1", [emailToConvert]);
    if (res.rows.length === 0) {
        console.log("Source account not found!");
        return;
    }
    const userId = res.rows[0].id;

    // 2. Update auth.users
    await pool.query("UPDATE auth.users SET email = $1, email_confirmed_at = NOW() WHERE id = $2", [targetEmail, userId]);

    // 3. Update auth.identities
    await pool.query(`
        UPDATE auth.identities 
        SET identity_data = jsonb_build_object('sub', user_id::text, 'email', $1::text) 
        WHERE user_id = $2
    `, [targetEmail, userId]);

    // 4. Update public.users
    await pool.query(`
      INSERT INTO public.users (id, email, role, display_name)
      VALUES ($1, $2, 'mentor', 'Nischay B K')
      ON CONFLICT (id) DO UPDATE SET email = $2, role = 'mentor', display_name = 'Nischay B K'
    `, [userId, targetEmail]);

    console.log("Conversion complete! Nischay should be able to log in with 'password123'.");

  } catch (e) {
    console.error("Error:", e);
  } finally {
    await pool.end();
  }
}

run();
