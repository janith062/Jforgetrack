import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pvgcmrjgzzccfkvetnbh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2Z2NtcmpnenpjY2ZrdmV0bmJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxNDk5MDUsImV4cCI6MjA5MzcyNTkwNX0.4kvVTeGx1rS2CL7_wP3pvY64LXUQ4Qm8uKM5fN9481k';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    debug: true
  }
});

async function test() {
  const email = 'nischay@theboringpeople.in';
  console.log(`Attempting login for ${email} with debug:true`);
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: 'password123',
  });
  
  if (error) {
    console.log("Login Error:", error);
  } else {
    console.log("Login Success!");
  }
}

test();
