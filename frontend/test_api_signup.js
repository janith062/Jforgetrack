import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://radpjeksfeufuzmokpec.supabase.co';
const supabaseKey = 'sb_publishable_okfNVV3zxS-ymvfcowZvGQ_Xo5MOxdP';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const email = 'nischay_api' + Date.now() + '@theboringpeople.in';
  const { data, error } = await supabase.auth.signUp({
    email,
    password: 'password123',
  });
  console.log("SignUp Data:", data);
  console.log("SignUp Error:", error);
}

test();
