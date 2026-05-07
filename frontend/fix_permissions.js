import pkg from 'pg';
const { Client } = pkg;

const connectionString = 'postgresql://postgres:6Cvk25Fg1hxUYpNv@db.pvgcmrjgzzccfkvetnbh.supabase.co:5432/postgres';

async function main() {
    const client = new Client({ connectionString });
    await client.connect();
    
    try {
        console.log("Restoring Supabase permissions...");
        
        const sql = `
            -- Grant usage to Supabase roles
            GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
            GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
            GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
            GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;

            -- Explicitly allow authenticator to assume roles
            GRANT anon TO authenticator;
            GRANT authenticated TO authenticator;
            GRANT service_role TO authenticator;

            -- Ensure postgres user has everything
            ALTER SCHEMA public OWNER TO postgres;
        `;
        
        await client.query(sql);
        console.log("Permissions restored successfully!");
    } catch (e) {
        console.error("Error restoring permissions:", e);
    } finally {
        await client.end();
    }
}

main();
