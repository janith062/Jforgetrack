import pg from 'pg';
const connectionString = 'postgresql://postgres:6Cvk25Fg1hxUYpNv@db.pvgcmrjgzzccfkvetnbh.supabase.co:5432/postgres';
const pool = new pg.Pool({ connectionString });

async function run() {
  try {
    // 1. Get all tables in auth schema
    const res = await pool.query("SELECT tablename FROM pg_tables WHERE schemaname = 'auth'");
    const tables = res.rows.map(r => r.tablename);
    
    console.log(`Disabling RLS on ${tables.length} tables in auth schema...`);
    
    // 2. Disable RLS on each table
    for (const table of tables) {
      await pool.query(`ALTER TABLE auth."${table}" DISABLE ROW LEVEL SECURITY;`);
    }
    
    // 3. Grant BYPASSRLS to supabase_auth_admin
    console.log("Granting BYPASSRLS to supabase_auth_admin...");
    await pool.query("ALTER ROLE supabase_auth_admin BYPASSRLS;");
    
    // 4. Ensure standard grants
    console.log("Ensuring standard grants on auth, extensions, and public schemas...");
    await pool.query(`
      GRANT USAGE ON SCHEMA auth TO anon, authenticated, service_role, supabase_auth_admin, dashboard_user;
      GRANT USAGE ON SCHEMA extensions TO anon, authenticated, service_role, supabase_auth_admin, dashboard_user;
      GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role, supabase_auth_admin, dashboard_user;
      
      GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA auth TO supabase_auth_admin, dashboard_user, postgres;
      GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA auth TO supabase_auth_admin, dashboard_user, postgres;
      GRANT ALL PRIVILEGES ON ALL ROUTINES IN SCHEMA auth TO supabase_auth_admin, dashboard_user, postgres;
    `);

    console.log("Fixes applied successfully.");
  } catch (e) {
    console.error("Error applying fixes:", e);
  } finally {
    await pool.end();
  }
}
run();
