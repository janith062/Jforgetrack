import pg from 'pg';

const connectionString = 'postgresql://postgres:6Cvk25Fg1hxUYpNv@db.pvgcmrjgzzccfkvetnbh.supabase.co:5432/postgres';
const pool = new pg.Pool({ connectionString });

async function run() {
  try {
    const res = await pool.query("SELECT tablename FROM pg_tables WHERE schemaname = 'auth'");
    console.log("Tables in auth schema:", res.rows.map(r => r.tablename));
    
    const res2 = await pool.query("SELECT matviewname FROM pg_matviews WHERE schemaname = 'auth'");
    console.log("Materialized views in auth schema:", res2.rows.map(r => r.matviewname));

    const res3 = await pool.query("SELECT viewname FROM pg_views WHERE schemaname = 'auth'");
    console.log("Views in auth schema:", res3.rows.map(r => r.viewname));

  } catch (e) {
    console.error("Error:", e);
  } finally {
    await pool.end();
  }
}

run();
