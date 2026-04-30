import pg from 'pg';

const connectionString = 'postgresql://postgres:Shreyas@2593@db.radpjeksfeufuzmokpec.supabase.co:5432/postgres';
const pool = new pg.Pool({ connectionString });

async function run() {
  try {
    const testEmail = 'test_new_user@theboringpeople.in';
    const targetEmail = 'nischay@theboringpeople.in';

    console.log("Deleting any existing nischay records...");
    await pool.query(`DELETE FROM auth.identities WHERE email = '${targetEmail}'`);
    await pool.query(`DELETE FROM auth.users WHERE email = '${targetEmail}'`);

    console.log("Setting password and confirming email for nischay...");
    await pool.query(`
      UPDATE auth.users 
      SET email = '${targetEmail}', 
          email_confirmed_at = NOW(),
          encrypted_password = '$2a$10$vsl.q3qify9v4KQqk0wA.u4GX/IMdJPPuCdmkPyUOvjQcXHLvXNFG',
          raw_user_meta_data = raw_user_meta_data || '{"email": "${targetEmail}", "email_verified": true}'::jsonb
      WHERE email = '${testEmail}' OR email = '${targetEmail}'
    `);

    await pool.query(`
      UPDATE auth.identities
      SET identity_data = identity_data || '{"email": "${targetEmail}"}'::jsonb
      WHERE identity_data->>'email' = '${testEmail}'
    `);

    console.log("Fixing public.users record...");
    await pool.query(`DELETE FROM public.users WHERE email = '${targetEmail}'`);
    await pool.query(`
      INSERT INTO public.users (id, email, role, display_name)
      SELECT id, '${targetEmail}', 'mentor', 'Nischay B K'
      FROM auth.users WHERE email = '${targetEmail}'
    `);

    console.log("Done! Now Nischay's email is linked to the working GoTrue user record.");
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await pool.end();
  }
}

run();
