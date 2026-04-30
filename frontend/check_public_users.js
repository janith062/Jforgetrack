import pg from 'pg';

const connectionString = 'postgresql://postgres:Shreyas@2593@db.radpjeksfeufuzmokpec.supabase.co:5432/postgres';
const pool = new pg.Pool({ connectionString });

async function run() {
  try {
    console.log("--- Columns ---");
    const res = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users' AND table_schema = 'public'");
    console.log(JSON.stringify(res.rows, null, 2));

    console.log("\n--- RLS Status ---");
    const rls = await pool.query("SELECT relname, relrowsecurity FROM pg_class WHERE oid = 'public.users'::regclass");
    console.log(JSON.stringify(rls.rows, null, 2));

    console.log("\n--- RLS Policies ---");
    const policies = await pool.query("SELECT * FROM pg_policies WHERE tablename = 'users' AND schemaname = 'public'");
    console.log(JSON.stringify(policies.rows, null, 2));

    console.log("\n--- Data Sample ---");
    const data = await pool.query("SELECT * FROM public.users LIMIT 5");
    console.log(JSON.stringify(data.rows, null, 2));
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await pool.end();
  }
}

run();
