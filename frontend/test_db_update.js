import pg from 'pg';
const connectionString = 'postgresql://postgres:6Cvk25Fg1hxUYpNv@db.pvgcmrjgzzccfkvetnbh.supabase.co:5432/postgres';
const pool = new pg.Pool({ connectionString });

async function run() {
  try {
    const res = await pool.query(`UPDATE auth.users SET last_sign_in_at = now() WHERE email = 'varun@theboringpeople.in' RETURNING id;`);
    console.log('Update success:', res.rows);
    
    // Also test inserting a session just in case
    if (res.rows.length > 0) {
      const userId = res.rows[0].id;
      const res2 = await pool.query(`
        INSERT INTO auth.sessions (id, user_id, created_at, updated_at) 
        VALUES (gen_random_uuid(), $1, now(), now()) 
        RETURNING id;
      `, [userId]);
      console.log('Session insert success:', res2.rows);
    }
  } catch (e) {
    console.error('Database error:', e);
  } finally {
    await pool.end();
  }
}
run();
