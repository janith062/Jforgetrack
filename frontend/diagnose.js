import pg from 'pg';

const connectionString = 'postgresql://postgres:Shreyas@2593@db.radpjeksfeufuzmokpec.supabase.co:5432/postgres';
const pool = new pg.Pool({ connectionString });

async function run() {
  try {
    // Check for any broken triggers or functions on auth schema
    const res = await pool.query(`
      SELECT routine_schema, routine_name, routine_type
      FROM information_schema.routines
      WHERE routine_schema = 'auth'
      ORDER BY routine_name;
    `);
    console.log("Auth functions:", res.rows.map(r => r.routine_name));

    // Check if there are any invalid views
    const views = await pool.query(`
      SELECT schemaname, viewname
      FROM pg_views
      WHERE schemaname = 'auth';
    `);
    console.log("Auth views:", views.rows.map(r => r.viewname));

    // Try to read from auth.users directly
    const users = await pool.query(`SELECT count(*) FROM auth.users`);
    console.log("User count:", users.rows[0].count);

    // Check pg_log for recent errors (may not be available)
    // Instead check the auth.audit_log_entries
    try {
      const audit = await pool.query(`SELECT * FROM auth.audit_log_entries ORDER BY created_at DESC LIMIT 5`);
      console.log("Recent audit logs:", JSON.stringify(audit.rows, null, 2));
    } catch (e) {
      console.log("No audit log:", e.message);
    }
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await pool.end();
  }
}

run();
