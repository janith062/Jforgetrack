import pg from 'pg';

const connectionString = 'postgresql://postgres:6Cvk25Fg1hxUYpNv@db.pvgcmrjgzzccfkvetnbh.supabase.co:5432/postgres';
const pool = new pg.Pool({ connectionString });

async function run() {
  try {
    console.log("Checking for broken routines in auth schema...");
    const routines = await pool.query(`
      SELECT routine_schema, routine_name, routine_type
      FROM information_schema.routines
      WHERE routine_schema = 'auth'
      ORDER BY routine_name;
    `);
    console.log("Auth functions:", routines.rows.map(r => r.routine_name));

    console.log("\nChecking for broken views in auth schema...");
    const views = await pool.query(`
      SELECT schemaname, viewname
      FROM pg_views
      WHERE schemaname = 'auth';
    `);
    console.log("Auth views:", views.rows.map(r => r.viewname));

    console.log("\nChecking if any auth views are inaccessible...");
    for (const view of views.rows) {
        try {
            await pool.query(`SELECT 1 FROM auth."${view.viewname}" LIMIT 1`);
            // console.log(`View ${view.viewname} is OK`);
        } catch (e) {
            console.error(`Error reading view ${view.viewname}:`, e.message);
        }
    }

    console.log("\nChecking if any tables in auth are inaccessible...");
    const tables = await pool.query(`
        SELECT tablename FROM pg_tables WHERE schemaname = 'auth'
    `);
    for (const table of tables.rows) {
        try {
            await pool.query(`SELECT 1 FROM auth."${table.tablename}" LIMIT 1`);
            // console.log(`Table ${table.tablename} is OK`);
        } catch (e) {
            console.error(`Error reading table ${table.tablename}:`, e.message);
        }
    }

  } catch (e) {
    console.error("Error:", e);
  } finally {
    await pool.end();
  }
}

run();
