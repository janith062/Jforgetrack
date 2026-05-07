import pkg from 'pg';
const { Client } = pkg;

const connectionString = 'postgresql://postgres:6Cvk25Fg1hxUYpNv@db.pvgcmrjgzzccfkvetnbh.supabase.co:5432/postgres';

async function main() {
    const client = new Client({ connectionString });
    await client.connect();
    
    try {
        console.log("Checking extensions...");
        const res = await client.query("SELECT extname, extnamespace::regnamespace as schema FROM pg_extension");
        console.log("Extensions found:");
        res.rows.forEach(r => console.log(`- ${r.extname} in ${r.schema}`));

        console.log("\nEnabling pgcrypto if missing...");
        await client.query("CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;");
        console.log("pgcrypto ensured.");

    } catch (e) {
        console.error("Error checking extensions:", e);
    } finally {
        await client.end();
    }
}

main();
