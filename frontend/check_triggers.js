import pkg from 'pg';
const { Client } = pkg;

const connectionString = 'postgresql://postgres:6Cvk25Fg1hxUYpNv@db.pvgcmrjgzzccfkvetnbh.supabase.co:5432/postgres';

async function main() {
    const client = new Client({ connectionString });
    await client.connect();
    
    try {
        console.log("Checking for triggers on auth.users...");
        
        const sql = `
            SELECT trigger_name, event_manipulation, event_object_table, action_statement
            FROM information_schema.triggers
            WHERE event_object_schema = 'auth' AND event_object_table = 'users';
        `;
        
        const res = await client.query(sql);
        console.log("Triggers found:", res.rows.length);
        res.rows.forEach(r => console.log(`- ${r.trigger_name}: ${r.event_manipulation} on ${r.event_object_table}`));

    } catch (e) {
        console.error("Error checking triggers:", e);
    } finally {
        await client.end();
    }
}

main();
