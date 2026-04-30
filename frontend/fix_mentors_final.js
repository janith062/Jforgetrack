import pg from 'pg';

// Using the direct connection to use Supabase's internal admin functions
const connectionString = 'postgresql://postgres:Shreyas@2593@db.radpjeksfeufuzmokpec.supabase.co:5432/postgres';
const pool = new pg.Pool({ connectionString });

async function run() {
  try {
    // The key insight: GoTrue uses bcrypt but we need to generate the hash
    // using the same bcrypt parameters GoTrue uses.
    // We'll use supabase's own extensions to do this.
    
    const mentors = [
      { email: 'nischay@theboringpeople.in', name: 'Nischay B K' },
      { email: 'varun@theboringpeople.in', name: 'Varun' },
    ];

    for (const mentor of mentors) {
      const id = mentor.email === 'nischay@theboringpeople.in'
        ? 'c1234567-89ab-cdef-0123-456789abcdef'
        : 'd1234567-89ab-cdef-0123-456789abcdef';

      console.log(`\nFixing ${mentor.email} (ID: ${id})...`);

      // Delete existing records
      await pool.query(`DELETE FROM public.users WHERE email = '${mentor.email}'`);
      await pool.query(`DELETE FROM auth.identities WHERE provider_id = '${id}'`);
      await pool.query(`DELETE FROM auth.users WHERE email = '${mentor.email}'`);

      // Insert using supabase's own crypt function - bcrypt with 10 rounds
      // This matches what GoTrue expects
      await pool.query(`
        INSERT INTO auth.users (
          id, instance_id, email, aud, role,
          encrypted_password, email_confirmed_at,
          raw_app_meta_data, raw_user_meta_data,
          created_at, updated_at,
          is_anonymous, is_sso_user
        ) VALUES (
          '${id}'::uuid,
          '00000000-0000-0000-0000-000000000000',
          '${mentor.email}',
          'authenticated',
          'authenticated',
          crypt('password123', gen_salt('bf')),
          NOW(),
          '{"provider":"email","providers":["email"]}'::jsonb,
          ('{"sub":"' || '${id}' || '","email":"' || '${mentor.email}' || '","email_verified":true,"phone_verified":false}')::jsonb,
          NOW(), NOW(),
          false, false
        )
      `);

      await pool.query(`
        INSERT INTO auth.identities (
          id, user_id, provider_id, provider,
          identity_data, created_at, updated_at
        ) VALUES (
          gen_random_uuid(),
          '${id}'::uuid,
          '${id}',
          'email',
          ('{"sub":"' || '${id}' || '","email":"' || '${mentor.email}' || '","email_verified":true,"phone_verified":false}')::jsonb,
          NOW(), NOW()
        )
      `);

      await pool.query(`
        INSERT INTO public.users (id, email, role, display_name)
        VALUES ('${id}'::uuid, '${mentor.email}', 'mentor', '${mentor.name}')
        ON CONFLICT (id) DO UPDATE SET email = '${mentor.email}', role = 'mentor', display_name = '${mentor.name}'
      `);

      // Verify the hash can be verified
      const verify = await pool.query(`
        SELECT (encrypted_password = crypt('password123', encrypted_password)) as matches
        FROM auth.users WHERE email = '${mentor.email}'
      `);
      console.log(`  Hash verification: ${verify.rows[0]?.matches}`);
    }

    console.log('\nAll done!');
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await pool.end();
  }
}

run();
