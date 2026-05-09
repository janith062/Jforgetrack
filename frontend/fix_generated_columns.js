import pg from 'pg';
const connectionString = 'postgresql://postgres:6Cvk25Fg1hxUYpNv@db.pvgcmrjgzzccfkvetnbh.supabase.co:5432/postgres';
const pool = new pg.Pool({ connectionString });

async function run() {
  try {
    console.log("Fixing auth.users.confirmed_at...");
    // 1. Create a temp column to hold the data
    await pool.query('ALTER TABLE auth.users ADD COLUMN confirmed_at_temp timestamptz;');
    await pool.query('UPDATE auth.users SET confirmed_at_temp = confirmed_at;');
    
    // 2. Drop the generated column
    await pool.query('ALTER TABLE auth.users DROP COLUMN confirmed_at;');
    
    // 3. Add it back as a regular column
    await pool.query('ALTER TABLE auth.users ADD COLUMN confirmed_at timestamptz;');
    await pool.query('UPDATE auth.users SET confirmed_at = confirmed_at_temp;');
    
    // 4. Drop the temp column
    await pool.query('ALTER TABLE auth.users DROP COLUMN confirmed_at_temp;');
    
    console.log("Fixing auth.identities.email...");
    // 1. Create a temp column
    await pool.query('ALTER TABLE auth.identities ADD COLUMN email_temp text;');
    await pool.query('UPDATE auth.identities SET email_temp = email;');
    
    // 2. Drop the generated column
    await pool.query('ALTER TABLE auth.identities DROP COLUMN email;');
    
    // 3. Add it back as a regular column
    await pool.query('ALTER TABLE auth.identities ADD COLUMN email text;');
    await pool.query('UPDATE auth.identities SET email = email_temp;');
    
    // 4. Drop the temp column
    await pool.query('ALTER TABLE auth.identities DROP COLUMN email_temp;');

    console.log("Fixes applied successfully.");
  } catch (e) {
    console.error("Error applying fixes:", e.message);
  } finally {
    await pool.end();
  }
}
run();
