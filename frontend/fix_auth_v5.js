import pg from 'pg';
const connectionString = 'postgresql://postgres:6Cvk25Fg1hxUYpNv@db.pvgcmrjgzzccfkvetnbh.supabase.co:5432/postgres';
const pool = new pg.Pool({ connectionString });

async function run() {
  try {
    const res = await pool.query("SELECT tablename FROM pg_tables WHERE schemaname = 'auth'");
    const tables = res.rows.map(r => r.tablename);
    
    for (const table of tables) {
      try {
        console.log(`Creating policy on auth."${table}"...`);
        await pool.query(`CREATE POLICY "Allow all" ON auth."${table}" FOR ALL TO public USING (true);`);
      } catch (e) {
        console.error(`Failed on ${table}:`, e.message);
      }
    }
    
    console.log("Policies created.");
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await pool.end();
  }
}
run();
