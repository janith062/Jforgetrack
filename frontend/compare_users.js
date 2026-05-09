import pg from 'pg';

const connectionString = 'postgresql://postgres:6Cvk25Fg1hxUYpNv@db.pvgcmrjgzzccfkvetnbh.supabase.co:5432/postgres';
const pool = new pg.Pool({ connectionString });

async function run() {
  try {
    const res1 = await pool.query("SELECT * FROM auth.users WHERE email = 'test_865@theboringpeople.in'");
    const user1 = res1.rows[0];
    
    const res2 = await pool.query("SELECT * FROM auth.users WHERE email = 'nischay@theboringpeople.in'");
    const user2 = res2.rows[0];
    
    console.log("Comparison of Users:");
    console.log("test_865:", JSON.stringify(user1, null, 2));
    console.log("nischay:", JSON.stringify(user2, null, 2));

    const idents1 = await pool.query("SELECT * FROM auth.identities WHERE user_id = $1", [user1?.id]);
    const idents2 = await pool.query("SELECT * FROM auth.identities WHERE user_id = $1", [user2?.id]);
    
    console.log("Comparison of Identities:");
    console.log("test_865 Idents:", JSON.stringify(idents1.rows, null, 2));
    console.log("nischay Idents:", JSON.stringify(idents2.rows, null, 2));

  } catch (e) {
    console.error("Error:", e);
  } finally {
    await pool.end();
  }
}

run();
