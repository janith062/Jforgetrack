import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://radpjeksfeufuzmokpec.supabase.co';
const supabaseKey = 'sb_publishable_okfNVV3zxS-ymvfcowZvGQ_Xo5MOxdP';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'test_new_user@theboringpeople.in',
    password: 'password123',
  });
  console.log("Login Data:", data);
  console.log("Login Error:", error);
}

test();
