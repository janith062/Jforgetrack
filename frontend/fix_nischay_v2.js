import pg from 'pg';

const connectionString = 'postgresql://postgres:Shreyas@2593@db.radpjeksfeufuzmokpec.supabase.co:5432/postgres';
const pool = new pg.Pool({ connectionString });

async function run() {
  try {
    const email = 'nischay@theboringpeople.in';
    const newId = 'c1234567-89ab-cdef-0123-456789abcdef'; // A new UUID
    const hash = '$2a$10$87rfO8aAMEa4RyHEtfHHj.v318iE5kzx8C8WJmNkdm.mRE9DqiGpi'; // password123

    console.log("Cleaning up old records...");
    await pool.query(`DELETE FROM auth.identities WHERE email = $1`, [email]);
    await pool.query(`DELETE FROM auth.users WHERE email = $1`, [email]);

    console.log("Inserting fresh user record...");
    await pool.query(`
      INSERT INTO auth.users (
        id, instance_id, email, aud, encrypted_password, 
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, 
        is_anonymous, is_sso_user, email_confirmed_at, confirmed_at
      ) VALUES (
        $1::uuid, '00000000-0000-0000-0000-000000000000', $2, 'authenticated', $3,
        '{"provider":"email","providers":["email"]}',
        jsonb_build_object('sub', $1::text, 'email', $2, 'email_verified', false, 'phone_verified', false),
        NOW(), NOW(), 'authenticated', false, false, NULL, NULL
      )
    `, [newId, email, hash]);

    console.log("Inserting fresh identity record...");
    await pool.query(`
      INSERT INTO auth.identities (
        id, user_id, provider_id, provider, identity_data, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), $1::uuid, $1::text, 'email',
        jsonb_build_object('sub', $1::text, 'email', $2, 'email_verified', false, 'phone_verified', false),
        NOW(), NOW()
      )
    `, [newId, email]);

    console.log("Inserting public.users record...");
    await pool.query(`
      INSERT INTO public.users (id, email, role, display_name)
      VALUES ($1::uuid, $2, 'mentor', 'Nischay B K')
    `, [newId, email]);

    console.log("Success! Nischay is now in an 'unconfirmed' state (mimicking test_new_user).");
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await pool.end();
  }
}

run();
