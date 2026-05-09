import { createClient } from '@supabase/supabase-js';
import pg from 'pg';

const supabaseUrl = 'https://pvgcmrjgzzccfkvetnbh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2Z2NtcmpnenpjY2ZrdmV0bmJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxNDk5MDUsImV4cCI6MjA5MzcyNTkwNX0.4kvVTeGx1rS2CL7_wP3pvY64LXUQ4Qm8uKM5fN9481k';
const connectionString = 'postgresql://postgres:6Cvk25Fg1hxUYpNv@db.pvgcmrjgzzccfkvetnbh.supabase.co:5432/postgres';

const supabase = createClient(supabaseUrl, supabaseKey);
const pool = new pg.Pool({ connectionString });

async function run() {
  const email = 'nischay@theboringpeople.in';
  const password = 'password123';
  
  try {
    console.log(`Signing up ${email}...`);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    
    if (error) {
      throw error;
    }
    
    const userId = data.user.id;
    console.log(`Signup success! User ID: ${userId}`);
    
    console.log("Confirming email manually in database...");
    await pool.query('UPDATE auth.users SET email_confirmed_at = NOW(), confirmed_at = NOW() WHERE id = $1', [userId]);

    console.log("Adding to public.users as mentor...");
    // Check if user already exists in public.users (though cleanup should have handled it)
    await pool.query(`
      INSERT INTO public.users (id, email, role, display_name)
      VALUES ($1, $2, 'mentor', 'Nischay B K')
      ON CONFLICT (id) DO UPDATE SET role = 'mentor', display_name = 'Nischay B K'
    `, [userId, email]);

    console.log("Nischay's account successfully re-created and promoted to mentor!");

  } catch (e) {
    console.error("Error:", e.message);
  } finally {
    await pool.end();
  }
}

run();
