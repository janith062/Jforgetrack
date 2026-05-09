import pkg from 'pg';
const { Client } = pkg;

const connectionString = 'postgresql://postgres:6Cvk25Fg1hxUYpNv@db.pvgcmrjgzzccfkvetnbh.supabase.co:5432/postgres';

async function main() {
    const client = new Client({ connectionString });
    await client.connect();
    
    try {
        const res = await client.query("SELECT id, email, role FROM public.users WHERE email = 'nischay@theboringpeople.in'");
        console.log("Public User:", res.rows[0]);
    } catch (e) {
        console.error("Error:", e);
    } finally {
        await client.end();
    }
}

main();
