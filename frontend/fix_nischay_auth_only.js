import pg from 'pg';

const connectionString = 'postgresql://postgres:6Cvk25Fg1hxUYpNv@db.pvgcmrjgzzccfkvetnbh.supabase.co:5432/postgres';
const pool = new pg.Pool({ connectionString });

async function run() {
  const email = 'nischay@theboringpeople.in';
  const password = 'password123';
  
  try {
    console.log(`Cleaning up...`);
    await pool.query('DELETE FROM public.users WHERE email = $1', [email]);
    await pool.query('DELETE FROM auth.identities WHERE email = $1', [email]);
    await pool.query('DELETE FROM auth.users WHERE email = $1', [email]);

    // Get a new UUID
    const resId = await pool.query('SELECT gen_random_uuid() as id');
    const userId = resId.rows[0].id;

    console.log(`Creating ${email} WITHOUT public.users entry...`);

    // Insert into auth.users
    await pool.query(`
      INSERT INTO auth.users (
        id, instance_id, email, aud, role, encrypted_password, 
        email_confirmed_at, 
        raw_app_meta_data, raw_user_meta_data, 
        created_at, updated_at, 
        is_sso_user, is_anonymous
      ) VALUES (
        $1::uuid, '00000000-0000-0000-0000-000000000000', $2, 'authenticated', 'authenticated', 
        crypt($3, gen_salt('bf', 10)),
        NOW(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('sub', $4::text, 'email', $5::text),
        NOW(), NOW(),
        false, false
      )
    `, [userId, email, password, userId, email]);

    // Insert into auth.identities
    await pool.query(`
      INSERT INTO auth.identities (
        id, user_id, provider_id, provider, identity_data, 
        created_at, updated_at
      ) VALUES (
        gen_random_uuid(), $1::uuid, $2::text, 'email',
        jsonb_build_object('sub', $3::text, 'email', $4::text),
        NOW(), NOW()
      )
    `, [userId, userId, userId, email]);

    console.log("Nischay's account re-created in auth only!");

  } catch (e) {
    console.error("Error:", e.message);
  } finally {
    await pool.end();
  }
}

run();
