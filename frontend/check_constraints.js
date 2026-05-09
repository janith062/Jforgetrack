import pg from 'pg';

const connectionString = 'postgresql://postgres:6Cvk25Fg1hxUYpNv@db.pvgcmrjgzzccfkvetnbh.supabase.co:5432/postgres';
const pool = new pg.Pool({ connectionString });

async function run() {
  try {
    const res = await pool.query(`
        SELECT conname, pg_get_constraintdef(c.oid) as def
        FROM pg_constraint c 
        JOIN pg_class r ON c.conrelid = r.oid 
        JOIN pg_namespace n ON r.relnamespace = n.oid 
        WHERE n.nspname = 'auth' AND r.relname = 'users'
    `);
    console.log("Constraints on auth.users:", JSON.stringify(res.rows, null, 2));

  } catch (e) {
    console.error("Error:", e);
  } finally {
    await pool.end();
  }
}

run();
