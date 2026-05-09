import pg from 'pg';

const connectionString = 'postgresql://postgres:6Cvk25Fg1hxUYpNv@db.pvgcmrjgzzccfkvetnbh.supabase.co:5432/postgres';
const pool = new pg.Pool({ connectionString });

async function run() {
  try {
    const res = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'auth' AND table_name = 'identities'
    `);
    console.log("Columns in auth.identities:", res.rows.map(r => r.column_name));

    const res2 = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'auth' AND table_name = 'users'
    `);
    console.log("Columns in auth.users:", res2.rows.map(r => r.column_name));

  } catch (e) {
    console.error("Error:", e);
  } finally {
    await pool.end();
  }
}

run();
