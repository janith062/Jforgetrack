import pg from 'pg';
const connectionString = 'postgresql://postgres:6Cvk25Fg1hxUYpNv@db.pvgcmrjgzzccfkvetnbh.supabase.co:5432/postgres';
const pool = new pg.Pool({ connectionString });

async function run() {
  try {
    const res = await pool.query(`
      SELECT column_name, data_type, column_default, is_nullable, is_generated, generation_expression
      FROM information_schema.columns 
      WHERE table_schema = 'auth' AND table_name = 'users'
      ORDER BY ordinal_position;
    `);
    console.log("auth.users columns:", JSON.stringify(res.rows, null, 2));

    const res2 = await pool.query(`
      SELECT column_name, data_type, column_default, is_nullable, is_generated, generation_expression
      FROM information_schema.columns 
      WHERE table_schema = 'auth' AND table_name = 'identities'
      ORDER BY ordinal_position;
    `);
    console.log("auth.identities columns:", JSON.stringify(res2.rows, null, 2));
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await pool.end();
  }
}
run();
