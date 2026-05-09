import { createClient } from '@supabase/supabase-js';
import pg from 'pg';

const supabaseUrl = 'https://pvgcmrjgzzccfkvetnbh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2Z2NtcmpnenpjY2ZrdmV0bmJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxNDk5MDUsImV4cCI6MjA5MzcyNTkwNX0.4kvVTeGx1rS2CL7_wP3pvY64LXUQ4Qm8uKM5fN9481k';
const connectionString = 'postgresql://postgres:6Cvk25Fg1hxUYpNv@db.pvgcmrjgzzccfkvetnbh.supabase.co:5432/postgres';

const supabase = createClient(supabaseUrl, supabaseKey);
const pool = new pg.Pool({ connectionString });

async function run() {
  const email = '4sh24cs001@forge.local';
  
  try {
    console.log(`Deleting ${email}...`);
    await pool.query('DELETE FROM public.users WHERE email = $1', [email]);
    await pool.query('DELETE FROM auth.identities WHERE email = $1', [email]);
    await pool.query('DELETE FROM auth.users WHERE email = $1', [email]);

    console.log(`Signing up ${email}...`);
    const { data, error } = await supabase.auth.signUp({
      email,
      password: 'password123',
    });
    
    if (error) {
      console.log("Signup Error:", error.message);
      return;
    }
    
    console.log("Signup Success!");

  } catch (e) {
    console.error("Error:", e);
  } finally {
    await pool.end();
  }
}

run();
