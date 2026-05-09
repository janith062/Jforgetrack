import pg from 'pg';

const connectionString = 'postgresql://postgres:6Cvk25Fg1hxUYpNv@db.pvgcmrjgzzccfkvetnbh.supabase.co:5432/postgres';
const pool = new pg.Pool({ connectionString });

async function run() {
  try {
    const res = await pool.query(`
        SELECT column_name, is_generated, column_default 
        FROM information_schema.columns 
        WHERE table_schema = 'auth' AND table_name = 'identities'
    `);
    console.log("Identities columns metadata:", JSON.stringify(res.rows, null, 2));

    const res2 = await pool.query(`
        SELECT column_name, is_generated, column_default 
        FROM information_schema.columns 
        WHERE table_schema = 'auth' AND table_name = 'users'
    `);
    console.log("Users columns metadata:", JSON.stringify(res2.rows, null, 2));

  } catch (e) {
    console.error("Error:", e);
  } finally {
    await pool.end();
  }
}

run();
