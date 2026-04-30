import pg from 'pg';

const connectionString = 'postgresql://postgres:Shreyas@2593@db.radpjeksfeufuzmokpec.supabase.co:5432/postgres';
const pool = new pg.Pool({ connectionString });

async function run() {
  try {
    const email = 'nischay@theboringpeople.in';
    const resId = await pool.query('SELECT gen_random_uuid() as id');
    const id = resId.rows[0].id;
    const hash = '$2a$10$87rfO8aAMEa4RyHEtfHHj.v318iE5kzx8C8WJmNkdm.mRE9DqiGpi'; // password123

    console.log("Cleaning up...");
    await pool.query(`DELETE FROM auth.identities WHERE email = '${email}'`);
    await pool.query(`DELETE FROM auth.users WHERE email = '${email}'`);

    console.log("Inserting user...");
    await pool.query(`
      INSERT INTO auth.users (
        id, instance_id, email, aud, encrypted_password, 
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, 
        is_anonymous, is_sso_user, email_confirmed_at
      ) VALUES (
        '${id}', '00000000-0000-0000-0000-000000000000', '${email}', 'authenticated', crypt('password123', gen_salt('bf', 10)),
        '{"provider":"email","providers":["email"]}'::jsonb,
        '{"sub": "${id}", "email": "${email}", "email_verified": false, "phone_verified": false}'::jsonb,
        NOW(), NOW(), 'authenticated', false, false, NULL
      )
    `);

    console.log("Inserting identity...");
    await pool.query(`
      INSERT INTO auth.identities (
        id, user_id, provider_id, provider, identity_data, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), '${id}', '${id}', 'email',
        '{"sub": "${id}", "email": "${email}", "email_verified": false, "phone_verified": false}'::jsonb,
        NOW(), NOW()
      )
    `);

    console.log("Inserting public user...");
    await pool.query(`
      INSERT INTO public.users (id, email, role, display_name)
      VALUES ('${id}', '${email}', 'mentor', 'Nischay B K')
    `);

    console.log("Done!");
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await pool.end();
  }
}

run();
