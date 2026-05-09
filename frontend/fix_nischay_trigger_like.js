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

    console.log(`Creating ${email} with TRIGGER-LIKE SQL...`);

    // Insert into auth.users - Exactly like schema.sql
    await pool.query(`
      INSERT INTO auth.users (id, instance_id, email, aud, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role)
      VALUES (
        $1::uuid,
        '00000000-0000-0000-0000-000000000000',
        $2,
        'authenticated',
        crypt($3, gen_salt('bf')),
        NOW(),
        '{"provider":"email","providers":["email"]}',
        '{}',
        NOW(),
        NOW(),
        'authenticated'
      )
    `, [userId, email, password]);

    // Insert into auth.identities - Exactly like schema.sql
    await pool.query(`
      INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, created_at, updated_at)
      VALUES (
        gen_random_uuid(),
        $1::uuid,
        $1::text,
        'email',
        jsonb_build_object('sub', $1::text, 'email', $2::text),
        NOW(),
        NOW()
      )
    `, [userId, email]);

    // Insert into public.users
    await pool.query(`
      INSERT INTO public.users (id, email, role, display_name)
      VALUES ($1::uuid, $2, 'mentor', 'Nischay B K')
    `, [userId, email]);

    console.log("Nischay's account re-created with trigger-like SQL!");

  } catch (e) {
    console.error("Error:", e.message);
  } finally {
    await pool.end();
  }
}

run();
