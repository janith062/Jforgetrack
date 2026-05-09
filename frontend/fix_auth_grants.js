import pg from 'pg';
const connectionString = 'postgresql://postgres:6Cvk25Fg1hxUYpNv@db.pvgcmrjgzzccfkvetnbh.supabase.co:5432/postgres';
const pool = new pg.Pool({ connectionString });

async function run() {
  try {
    const query = `
      GRANT USAGE ON SCHEMA auth TO anon, authenticated, service_role, supabase_auth_admin, dashboard_user;
      GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA auth TO supabase_auth_admin, dashboard_user, postgres;
      GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA auth TO supabase_auth_admin, dashboard_user, postgres;
      GRANT ALL PRIVILEGES ON ALL ROUTINES IN SCHEMA auth TO supabase_auth_admin, dashboard_user, postgres;
    `;
    console.log("Applying grants...");
    await pool.query(query);
    console.log("Grants applied successfully.");
  } catch (e) {
    console.error("Error applying grants:", e);
  } finally {
    await pool.end();
  }
}
run();
