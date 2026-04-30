import pg from 'pg';
import { createClient } from '@supabase/supabase-js';

const connectionString = 'postgresql://postgres:Shreyas@2593@db.radpjeksfeufuzmokpec.supabase.co:5432/postgres';
const supabaseUrl = 'https://radpjeksfeufuzmokpec.supabase.co';
const supabaseKey = 'sb_publishable_okfNVV3zxS-ymvfcowZvGQ_Xo5MOxdP';
const supabase = createClient(supabaseUrl, supabaseKey);
const pool = new pg.Pool({ connectionString });

async function run() {
  try {
    const targetEmail = 'nischay@theboringpeople.in';
    const tempEmail = 'temp_signup_' + Date.now() + '@theboringpeople.in';
    
    console.log("1. Signing up fresh user...");
    const { data, error } = await supabase.auth.signUp({
      email: tempEmail,
      password: 'password123',
    });
    
    if (error) {
      console.error("SignUp Error:", error);
      return;
    }
    
    const userId = data.user.id;
    console.log("Created user ID:", userId);

    console.log("2. Cleaning up any existing target email records...");
    await pool.query(`DELETE FROM auth.identities WHERE email = $1`, [targetEmail]);
    await pool.query(`DELETE FROM auth.users WHERE email = $1`, [targetEmail]);

    console.log("3. Renaming fresh user to target email and confirming...");
    await pool.query(`
      UPDATE auth.users 
      SET email = $1, 
          email_confirmed_at = NOW(),
          raw_user_meta_data = raw_user_meta_data || jsonb_build_object('email', $1, 'email_verified', true)
      WHERE id = $2
    `, [targetEmail, userId]);

    await pool.query(`
      UPDATE auth.identities
      SET identity_data = identity_data || jsonb_build_object('email', '${targetEmail}', 'email_verified', true)
      WHERE user_id = '${userId}'
    `);

    console.log("4. Syncing public.users...");
    await pool.query(`DELETE FROM public.users WHERE email = $1 OR id = $2`, [targetEmail, userId]);
    await pool.query(`
      INSERT INTO public.users (id, email, role, display_name)
      VALUES ($1, $2, 'mentor', 'Nischay B K')
    `, [userId, targetEmail]);

    console.log("SUCCESS! Nischay should now be able to log in with password123.");

  } catch (e) {
    console.error("Error:", e);
  } finally {
    await pool.end();
  }
}

run();
