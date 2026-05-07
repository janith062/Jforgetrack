import pkg from 'pg';
const { Client } = pkg;

const connectionString = 'postgresql://postgres:6Cvk25Fg1hxUYpNv@db.pvgcmrjgzzccfkvetnbh.supabase.co:5432/postgres';

async function main() {
    const client = new Client({ connectionString });
    await client.connect();
    
    try {
        console.log("Checking search_path...");
        const res = await client.query("SHOW search_path");
        console.log("Current search_path:", res.rows[0].search_path);

        console.log("\nEnsuring search_path includes public and extensions...");
        await client.query("ALTER DATABASE postgres SET search_path TO \"$user\", public, extensions");
        console.log("Database search_path updated.");

        const res2 = await client.query("SHOW search_path");
        console.log("New search_path (current session may not show it):", res2.rows[0].search_path);

    } catch (e) {
        console.error("Error checking search_path:", e);
    } finally {
        await client.end();
    }
}

main();
