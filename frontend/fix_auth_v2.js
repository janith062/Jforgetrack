import pg from 'pg';
const connectionString = 'postgresql://postgres:6Cvk25Fg1hxUYpNv@db.pvgcmrjgzzccfkvetnbh.supabase.co:5432/postgres';
const pool = new pg.Pool({ connectionString });

async function run() {
  try {
    console.log("Granting BYPASSRLS to supabase_auth_admin...");
    await pool.query("ALTER ROLE supabase_auth_admin BYPASSRLS;");
    
    console.log("Ensuring standard grants...");
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
