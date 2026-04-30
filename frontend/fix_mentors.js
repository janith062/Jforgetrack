import pg from 'pg';
import { createClient } from '@supabase/supabase-js';

const connectionString = 'postgresql://postgres:Shreyas@2593@db.radpjeksfeufuzmokpec.supabase.co:5432/postgres';
const supabaseUrl = 'https://radpjeksfeufuzmokpec.supabase.co';
const supabaseKey = 'sb_publishable_okfNVV3zxS-ymvfcowZvGQ_Xo5MOxdP';
const supabase = createClient(supabaseUrl, supabaseKey);

const pool = new pg.Pool({ connectionString });

async function run() {
  try {
    const mentors = [
      { email: 'nischay@theboringpeople.in', name: 'Nischay B K' },
      { email: 'varun@theboringpeople.in', name: 'Varun' }
    ];

    for (const mentor of mentors) {
      console.log(`Fixing ${mentor.email}...`);
      
      // 1. Delete existing
      await pool.query(`DELETE FROM auth.users WHERE email = $1`, [mentor.email]);
      
      // 2. Sign Up via API
      const { data, error } = await supabase.auth.signUp({
        email: mentor.email,
        password: 'password123',
      });
      if (error) {
        console.error(`SignUp error for ${mentor.email}:`, error);
        continue;
      }
      
      const userId = data.user.id;
      console.log(`Created user ${userId}`);

      // 3. Confirm email via pg
      await pool.query(`UPDATE auth.users SET email_confirmed_at = NOW() WHERE id = $1`, [userId]);

      // 4. Insert into public.users
      await pool.query(`
        INSERT INTO public.users (id, email, role, display_name)
        VALUES ($1, $2, 'mentor', $3)
        ON CONFLICT (id) DO NOTHING;
      `, [userId, mentor.email, mentor.name]);
      
      console.log(`Fixed ${mentor.email} successfully.`);
    }

  } catch (e) {
    console.error("Error:", e);
  } finally {
    await pool.end();
  }
}

run();
