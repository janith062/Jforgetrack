import pg from 'pg';

const connectionString = 'postgresql://postgres:6Cvk25Fg1hxUYpNv@db.pvgcmrjgzzccfkvetnbh.supabase.co:5432/postgres';
const pool = new pg.Pool({ connectionString });

async function run() {
  try {
    const res = await pool.query("SELECT * FROM auth.users WHERE email LIKE 'test_%@theboringpeople.in' ORDER BY created_at DESC LIMIT 1");
    const user = res.rows[0];
    console.log("Successful User Template:", JSON.stringify(user, null, 2));

    if (user) {
        const idents = await pool.query("SELECT * FROM auth.identities WHERE user_id = $1", [user.id]);
        console.log("Successful Identity Template:", JSON.stringify(idents.rows[0], null, 2));
    }

  } catch (e) {
    console.error("Error:", e);
  } finally {
    await pool.end();
  }
}

run();
