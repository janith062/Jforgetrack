import pg from 'pg';

const connectionString = 'postgresql://postgres:6Cvk25Fg1hxUYpNv@db.pvgcmrjgzzccfkvetnbh.supabase.co:5432/postgres';
const pool = new pg.Pool({ connectionString });

async function run() {
  const email = 'nischay@theboringpeople.in';
  const password = 'password123';
  
  try {
    console.log(`Manually re-creating ${email} with MINIMAL structure...`);

    // Ensure cleanup
    await pool.query('DELETE FROM public.users WHERE email = $1', [email]);
    await pool.query('DELETE FROM auth.identities WHERE email = $1', [email]);
    await pool.query('DELETE FROM auth.users WHERE email = $1', [email]);

    // Get a new UUID
    const resId = await pool.query('SELECT gen_random_uuid() as id');
    const userId = resId.rows[0].id;

    // Insert into auth.users - MINIMAL
    await pool.query(`
      INSERT INTO auth.users (
        id, instance_id, email, aud, role, encrypted_password, 
        created_at, updated_at
      ) VALUES (
        $1::uuid, '00000000-0000-0000-0000-000000000000', $2, 'authenticated', 'authenticated', 
        crypt($3, gen_salt('bf', 10)),
        NOW(), NOW()
      )
    `, [userId, email, password]);

    // Insert into auth.identities - MINIMAL
    await pool.query(`
      INSERT INTO auth.identities (
        id, user_id, provider_id, provider, identity_data, 
        created_at, updated_at
      ) VALUES (
        gen_random_uuid(), $1::uuid, $1::text, 'email',
        jsonb_build_object('sub', $1::text, 'email', $2::text),
        NOW(), NOW()
      )
    `, [userId, email]);

    // Insert into public.users
    await pool.query(`
      INSERT INTO public.users (id, email, role, display_name)
      VALUES ($1::uuid, $2, 'mentor', 'Nischay B K')
    `, [userId, email]);

    console.log("Nischay's account successfully re-created with MINIMAL structure!");

  } catch (e) {
    console.error("Error:", e.message);
  } finally {
    await pool.end();
  }
}

run();
