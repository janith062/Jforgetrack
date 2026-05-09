import pg from 'pg';

const connectionString = 'postgresql://postgres:6Cvk25Fg1hxUYpNv@db.pvgcmrjgzzccfkvetnbh.supabase.co:5432/postgres';
const pool = new pg.Pool({ connectionString });

async function run() {
  const email = 'nischay@theboringpeople.in';
  const userId = '2b9f6947-c03d-46e7-8ccd-2ea63f16539a'; 
  const password = 'password123';
  
  try {
    console.log(`Manually re-creating ${email} with correct structure...`);

    // Ensure cleanup
    await pool.query('DELETE FROM public.users WHERE email = $1', [email]);
    await pool.query('DELETE FROM auth.identities WHERE email = $1', [email]);
    await pool.query('DELETE FROM auth.users WHERE email = $1', [email]);

    // Insert into auth.users
    // Note: confirmed_at is ALWAYS generated, so we omit it.
    await pool.query(`
      INSERT INTO auth.users (
        id, instance_id, email, aud, role, encrypted_password, 
        email_confirmed_at, last_sign_in_at,
        raw_app_meta_data, raw_user_meta_data, 
        created_at, updated_at, 
        is_sso_user, is_anonymous
      ) VALUES (
        $1::uuid, '00000000-0000-0000-0000-000000000000', $2, 'authenticated', 'authenticated', 
        crypt($3, gen_salt('bf', 10)),
        NOW(), NOW(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('sub', $4::text, 'email', $5::text, 'email_verified', true, 'phone_verified', false),
        NOW(), NOW(),
        false, false
      )
    `, [userId, email, password, userId, email]);

    // Insert into auth.identities
    // Note: email is ALWAYS generated, so we omit it.
    await pool.query(`
      INSERT INTO auth.identities (
        id, user_id, provider_id, provider, identity_data, 
        last_sign_in_at, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), $1::uuid, $2::text, 'email',
        jsonb_build_object('sub', $3::text, 'email', $4::text, 'email_verified', true, 'phone_verified', false),
        NOW(), NOW(), NOW()
      )
    `, [userId, userId, userId, email]);

    // Insert into public.users
    await pool.query(`
      INSERT INTO public.users (id, email, role, display_name)
      VALUES ($1::uuid, $2, 'mentor', 'Nischay B K')
    `, [userId, email]);

    console.log("Nischay's account successfully re-created manually!");

  } catch (e) {
    console.error("Error:", e.message);
  } finally {
    await pool.end();
  }
}

run();
