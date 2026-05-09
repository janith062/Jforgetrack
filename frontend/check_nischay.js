import pg from 'pg';

const connectionString = 'postgresql://postgres:6Cvk25Fg1hxUYpNv@db.pvgcmrjgzzccfkvetnbh.supabase.co:5432/postgres';
const pool = new pg.Pool({ connectionString });

async function run() {
  try {
    const email = 'nischay@theboringpeople.in';
    console.log(`Checking user: ${email}`);

    // Check auth.users
    const authUser = await pool.query('SELECT * FROM auth.users WHERE email = $1', [email]);
    console.log("Auth User:", authUser.rows.length ? authUser.rows[0] : "NOT FOUND");

    if (authUser.rows.length > 0) {
        const userId = authUser.rows[0].id;
        
        // Check auth.identities
        const identities = await pool.query('SELECT * FROM auth.identities WHERE user_id = $1', [userId]);
        console.log("Auth Identities:", identities.rows);

        // Check public.users
        const publicUser = await pool.query('SELECT * FROM public.users WHERE id = $1', [userId]);
        console.log("Public User:", publicUser.rows.length ? publicUser.rows[0] : "NOT FOUND");
    }

    // Check for audit logs related to this email
    try {
        const audit = await pool.query(`
            SELECT * FROM auth.audit_log_entries 
            WHERE payload::text LIKE $1 
            ORDER BY created_at DESC LIMIT 10
        `, [`%${email}%`]);
        console.log("Recent audit logs for this email:", JSON.stringify(audit.rows, null, 2));
    } catch (e) {
        console.log("Audit log check failed:", e.message);
    }

    // Check for any triggers on auth.users
    try {
        const authTriggers = await pool.query(`
            SELECT tgname, tgenabled, relname 
            FROM pg_trigger t 
            JOIN pg_class c ON t.tgrelid = c.oid 
            JOIN pg_namespace n ON c.relnamespace = n.oid
            WHERE n.nspname = 'auth' AND c.relname = 'users'
        `);
        console.log("Triggers on auth.users:", authTriggers.rows);
        
        for (const tg of authTriggers.rows) {
            const func = await pool.query(`
                SELECT routine_name, routine_definition 
                FROM information_schema.routines 
                WHERE routine_name = (
                    SELECT proname 
                    FROM pg_proc p 
                    JOIN pg_trigger t ON t.tgfoid = p.oid 
                    WHERE t.tgname = $1
                )
            `, [tg.tgname]);
            console.log(`Definition for trigger function of ${tg.tgname}:`, func.rows[0]);
        }
    } catch (e) {
        console.log("Auth trigger check failed:", e.message);
    }

  } catch (e) {
    console.error("Error:", e);
  } finally {
    await pool.end();
  }
}

run();
