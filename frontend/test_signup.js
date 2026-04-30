import pg from 'pg';
import { createClient } from '@supabase/supabase-js';

const connectionString = 'postgresql://postgres:Shreyas@2593@db.radpjeksfeufuzmokpec.supabase.co:5432/postgres';
const supabaseUrl = 'https://radpjeksfeufuzmokpec.supabase.co';
const supabaseKey = 'sb_publishable_okfNVV3zxS-ymvfcowZvGQ_Xo5MOxdP';
const supabase = createClient(supabaseUrl, supabaseKey);
const pool = new pg.Pool({ connectionString });

async function test() {
  const email = 'nischay_test@theboringpeople.in';
  
  // 1. Delete just in case
  await pool.query(`DELETE FROM auth.identities WHERE provider_id = $1`, [email]);
  await pool.query(`DELETE FROM auth.users WHERE email = $1`, [email]);

  const { data, error } = await supabase.auth.signUp({
    email,
    password: 'password123',
  });
  console.log("SignUp Data:", data);
  console.log("SignUp Error:", error);
  
  if (!error) {
    // 2. Set confirmed and insert to public.users
    await pool.query(`UPDATE auth.users SET email_confirmed_at = NOW() WHERE id = $1`, [data.user.id]);
    await pool.query(`
      INSERT INTO public.users (id, email, role, display_name)
      VALUES ($1, $2, 'mentor', 'Nischay B K')
    `, [data.user.id, email]);
    
    // 3. Test login
    const login = await supabase.auth.signInWithPassword({
      email,
      password: 'password123',
    });
    console.log("Login Error:", login.error);
  }
}
test();
