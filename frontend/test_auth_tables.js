import pg from 'pg';
const connectionString = 'postgresql://postgres:6Cvk25Fg1hxUYpNv@db.pvgcmrjgzzccfkvetnbh.supabase.co:5432/postgres';
const pool = new pg.Pool({ connectionString });

const tables = [
  'auth.users',
  'auth.identities',
  'auth.sessions',
  'auth.refresh_tokens',
  'auth.mfa_factors',
  'auth.mfa_challenges',
  'auth.mfa_amr_claims',
  'auth.sso_providers',
  'auth.sso_domains',
  'auth.saml_providers',
  'auth.saml_relay_states',
  'auth.flow_state',
  'auth.audit_log_entries'
];

async function run() {
  for (const table of tables) {
    try {
      await pool.query(`SELECT * FROM ${table} LIMIT 1;`);
      console.log(`Success querying ${table}`);
    } catch (e) {
      console.error(`Failed querying ${table}:`, e.message);
    }
  }
  await pool.end();
}
run();
