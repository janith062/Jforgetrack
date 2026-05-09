import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pvgcmrjgzzccfkvetnbh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2Z2NtcmpnenpjY2ZrdmV0bmJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxNDk5MDUsImV4cCI6MjA5MzcyNTkwNX0.4kvVTeGx1rS2CL7_wP3pvY64LXUQ4Qm8uKM5fN9481k';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const email = `test_${Math.floor(Math.random() * 1000)}@theboringpeople.in`;
  console.log(`Attempting signup for ${email}`);
  const { data, error } = await supabase.auth.signUp({
    email,
    password: 'password123',
  });
  
  if (error) {
    console.log("Signup Error Status:", error.status);
    console.log("Signup Error Message:", error.message);
    console.log("Full Error Object:", JSON.stringify(error, null, 2));
  } else {
    console.log("Signup Success!");
    console.log("User ID:", data.user.id);
  }
}

test();
