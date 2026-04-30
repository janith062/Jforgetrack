import pg from 'pg';

const connectionString = 'postgresql://postgres:Shreyas@2593@db.radpjeksfeufuzmokpec.supabase.co:5432/postgres';
const pool = new pg.Pool({ connectionString });

async function run() {
  try {
    const targetEmail = 'nischay@theboringpeople.in';
    const userId = 'c748acd3-8b22-4646-8f3a-e9929f9f516b';

    console.log("Renaming user...");
    await pool.query(`UPDATE auth.users SET email = $1, encrypted_password = '$2a$10$vsl.q3qify9v4KQqk0wA.u4GX/IMdJPPuCdmkPyUOvjQcXHLvXNFG', email_confirmed_at = NOW(), raw_user_meta_data = raw_user_meta_data || '{"email": "nischay@theboringpeople.in", "email_verified": true}'::jsonb WHERE id = $2`, [targetEmail, userId]);
    
    await pool.query(`UPDATE auth.identities SET identity_data = identity_data || '{"email": "nischay@theboringpeople.in", "email_verified": true}'::jsonb WHERE user_id = $1`, [userId]);

    await pool.query(`INSERT INTO public.users (id, email, role, display_name) VALUES ($1, $2, 'mentor', 'Nischay B K') ON CONFLICT (id) DO UPDATE SET email = $2`, [userId, targetEmail]);

    console.log("DONE!");
  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}
run();
