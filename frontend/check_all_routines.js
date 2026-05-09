import pg from 'pg';

const connectionString = 'postgresql://postgres:6Cvk25Fg1hxUYpNv@db.pvgcmrjgzzccfkvetnbh.supabase.co:5432/postgres';
const pool = new pg.Pool({ connectionString });

async function run() {
  try {
    const res = await pool.query(`
        SELECT routine_schema, routine_name 
        FROM information_schema.routines 
        WHERE routine_schema NOT IN ('pg_catalog', 'information_schema')
        ORDER BY routine_schema, routine_name
    `);
    
    const schemas = {};
    res.rows.forEach(r => {
        if (!schemas[r.routine_schema]) schemas[r.routine_schema] = [];
        schemas[r.routine_schema].push(r.routine_name);
    });
    
    console.log("Routines by schema:", JSON.stringify(schemas, null, 2));

  } catch (e) {
    console.error("Error:", e);
  } finally {
    await pool.end();
  }
}

run();
