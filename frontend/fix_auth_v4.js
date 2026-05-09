import pg from 'pg';
const connectionString = 'postgresql://postgres:6Cvk25Fg1hxUYpNv@db.pvgcmrjgzzccfkvetnbh.supabase.co:5432/postgres';
const pool = new pg.Pool({ connectionString });

async function run() {
  try {
    console.log("Attempting to create policy on auth.users...");
    await pool.query('CREATE POLICY "Allow all" ON auth.users FOR ALL TO public USING (true);');
    console.log("Success!");
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await pool.end();
  }
}
run();
