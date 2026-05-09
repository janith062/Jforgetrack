import { createClient } from '@supabase/supabase-js';
import pg from 'pg';

const supabaseUrl = 'https://pvgcmrjgzzccfkvetnbh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2Z2NtcmpnenpjY2ZrdmV0bmJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxNDk5MDUsImV4cCI6MjA5MzcyNTkwNX0.4kvVTeGx1rS2CL7_wP3pvY64LXUQ4Qm8uKM5fN9481k';
const connectionString = 'postgresql://postgres:6Cvk25Fg1hxUYpNv@db.pvgcmrjgzzccfkvetnbh.supabase.co:5432/postgres';

const supabase = createClient(supabaseUrl, supabaseKey);
const pool = new pg.Pool({ connectionString });

async function run() {
  const tempEmail = `nischay_temp_${Date.now()}@theboringpeople.in`;
  const finalEmail = 'nischay@theboringpeople.in';
  const password = 'password123';
  
  try {
    console.log(`Step 1: Signing up with ${tempEmail}...`);
    const { data, error } = await supabase.auth.signUp({
      email: tempEmail,
      password: password,
    });
    
    if (error) {
      console.log("Signup Error:", error.message);
      return;
    }
    
    const userId = data.user.id;
    console.log(`Signup success! User ID: ${userId}`);
    
    console.log(`Step 2: Converting ${tempEmail} to ${finalEmail} in DB...`);

    // Clean up any existing final email record just in case
    await pool.query('DELETE FROM public.users WHERE email = $1', [finalEmail]);
    await pool.query('DELETE FROM auth.identities WHERE email = $1', [finalEmail]);
    await pool.query('DELETE FROM auth.users WHERE email = $1', [finalEmail]);

    // Update auth.users
    await pool.query("UPDATE auth.users SET email = $1, email_confirmed_at = NOW() WHERE id = $2", [finalEmail, userId]);

    // Update auth.identities
    await pool.query(`
        UPDATE auth.identities 
        SET identity_data = jsonb_build_object('sub', user_id::text, 'email', $1::text) 
        WHERE user_id = $2
    `, [finalEmail, userId]);

    // Update public.users
    await pool.query(`
      INSERT INTO public.users (id, email, role, display_name)
      VALUES ($1, $2, 'mentor', 'Nischay B K')
      ON CONFLICT (id) DO UPDATE SET email = $2, role = 'mentor', display_name = 'Nischay B K'
    `, [userId, finalEmail]);

    console.log("SUCCESS! Nischay should now be able to log in.");

  } catch (e) {
    console.error("Error:", e.message);
  } finally {
    await pool.end();
  }
}

run();
