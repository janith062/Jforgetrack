import pg from 'pg';

const connectionString = 'postgresql://postgres:Shreyas@2593@db.radpjeksfeufuzmokpec.supabase.co:5432/postgres';
const pool = new pg.Pool({ connectionString });

async function run() {
  try {
    const res = await pool.query("SELECT grantee, privilege_type FROM information_schema.role_table_grants WHERE table_name = 'users' AND table_schema = 'public'");
    console.log(JSON.stringify(res.rows, null, 2));

    console.log("\nGranting SELECT to anon and authenticated...");
    await pool.query("GRANT SELECT ON public.users TO anon, authenticated");
    console.log("Grants applied.");
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await pool.end();
  }
}

run();
