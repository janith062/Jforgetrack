import pg from 'pg';

const connectionString = 'postgresql://postgres:Shreyas@2593@db.radpjeksfeufuzmokpec.supabase.co:5432/postgres';
const pool = new pg.Pool({ connectionString });

async function run() {
  try {
    const res = await pool.query(`
      SELECT tgname, proname 
      FROM pg_trigger 
      JOIN pg_proc ON pg_trigger.tgfoid = pg_proc.oid 
      WHERE tgrelid = 'public.users'::regclass
    `);
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await pool.end();
  }
}

run();
