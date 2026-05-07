import pkg from 'pg';
const { Client } = pkg;

const connectionString = 'postgresql://postgres:6Cvk25Fg1hxUYpNv@db.pvgcmrjgzzccfkvetnbh.supabase.co:5432/postgres';

async function main() {
    const client = new Client({ connectionString });
    await client.connect();
    
    try {
        console.log("Checking user 'nischay@theboringpeople.in'...");
        
        const authUser = await client.query("SELECT id, email, encrypted_password FROM auth.users WHERE email = 'nischay@theboringpeople.in'");
        console.log("Auth User found:", authUser.rows.length > 0 ? "YES" : "NO");
        if (authUser.rows.length > 0) {
            console.log("Auth User ID:", authUser.rows[0].id);
        }

        const publicUser = await client.query("SELECT id, email, role FROM public.users WHERE email = 'nischay@theboringpeople.in'");
        console.log("Public User found:", publicUser.rows.length > 0 ? "YES" : "NO");
        if (publicUser.rows.length > 0) {
            console.log("Public User ID:", publicUser.rows[0].id);
            console.log("Public User Role:", publicUser.rows[0].role);
        }

        const identities = await client.query("SELECT * FROM auth.identities WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'nischay@theboringpeople.in')");
        console.log("Identities found:", identities.rows.length > 0 ? "YES" : "NO");

    } catch (e) {
        console.error("Error checking user:", e);
    } finally {
        await client.end();
    }
}

main();
