import pg from 'pg';

const connectionString = 'postgresql://postgres:6Cvk25Fg1hxUYpNv@db.pvgcmrjgzzccfkvetnbh.supabase.co:5432/postgres';
const pool = new pg.Pool({ connectionString });

async function run() {
  const email = 'nischay@theboringpeople.in';
  
  try {
    const res = await pool.query(`
        SELECT table_schema, table_name, column_name
        FROM information_schema.columns
        WHERE data_type IN ('text', 'character varying')
        AND table_schema NOT IN ('pg_catalog', 'information_schema')
    `);
    
    console.log(`Searching for '${email}' in ${res.rows.length} columns...`);
    
    for (const col of res.rows) {
        try {
            const count = await pool.query(`
                SELECT count(*) FROM "${col.table_schema}"."${col.table_name}" 
                WHERE "${col.column_name}"::text = $1
            `, [email]);
            
            if (parseInt(count.rows[0].count) > 0) {
                console.log(`Found match in ${col.table_schema}.${col.table_name}.${col.column_name}`);
            }
        } catch (e) {
            // Ignore columns that can't be queried this way
        }
    }
    console.log("Search finished.");

  } catch (e) {
    console.error("Error:", e);
  } finally {
    await pool.end();
  }
}

run();
