import pg from 'pg';

const connectionString = 'postgresql://postgres:6Cvk25Fg1hxUYpNv@db.pvgcmrjgzzccfkvetnbh.supabase.co:5432/postgres';
const pool = new pg.Pool({ connectionString });

async function run() {
  try {
    const email1 = 'test_865@theboringpeople.in';
    const email2 = 'nischay@theboringpeople.in';
    
    console.log(`Swapping ${email1} and ${email2}...`);

    // We need to swap in both auth.users and auth.identities
    // And since auth.identities.email is generated, we might need to update identity_data
    
    // 1. Get IDs
    const res1 = await pool.query("SELECT id FROM auth.users WHERE email = $1", [email1]);
    const id1 = res1.rows[0].id;
    const res2 = await pool.query("SELECT id FROM auth.users WHERE email = $1", [email2]);
    const id2 = res2.rows[0].id;

    // 2. Update emails in auth.users
    await pool.query("UPDATE auth.users SET email = 'temp1@temp.com' WHERE id = $1", [id1]);
    await pool.query("UPDATE auth.users SET email = $1 WHERE id = $2", [email1, id2]);
    await pool.query("UPDATE auth.users SET email = $1 WHERE id = $2", [email2, id1]);

    // 3. Update identity_data in auth.identities (which will update the generated email column)
    await pool.query("UPDATE auth.identities SET identity_data = jsonb_build_object('sub', user_id::text, 'email', 'temp1@temp.com') WHERE user_id = $1", [id1]);
    await pool.query("UPDATE auth.identities SET identity_data = jsonb_build_object('sub', user_id::text, 'email', $1::text) WHERE user_id = $2", [email1, id2]);
    await pool.query("UPDATE auth.identities SET identity_data = jsonb_build_object('sub', user_id::text, 'email', $1::text) WHERE user_id = $2", [email2, id1]);

    console.log("Swap complete!");

  } catch (e) {
    console.error("Error:", e);
  } finally {
    await pool.end();
  }
}

run();
