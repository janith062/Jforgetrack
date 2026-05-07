import pkg from 'pg';
const { Client } = pkg;
import fs from 'fs/promises';
import path from 'path';

const connectionString = 'postgresql://postgres:6Cvk25Fg1hxUYpNv@db.pvgcmrjgzzccfkvetnbh.supabase.co:5432/postgres';

async function runSqlFile(client, filePath) {
    console.log(`Applying ${filePath}...`);
    const sql = await fs.readFile(filePath, 'utf-8');
    // Split by common delimiters if needed, but for these files we can run as one block
    // unless they contain multiple statements that pg can't handle at once.
    // However, pg client.query() can handle multiple statements.
    await client.query(sql);
    console.log(`Successfully applied ${filePath}\n`);
}

async function main() {
    const client = new Client({ connectionString });
    await client.connect();
    
    try {
        console.log("Cleaning up existing schema...");
        await client.query('DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;');
        await client.query('GRANT ALL ON SCHEMA public TO postgres; GRANT ALL ON SCHEMA public TO public;');
        
        console.log("Initializing database...");
        await runSqlFile(client, '../backend/schema.sql');
        await runSqlFile(client, '../backend/seed.sql');
        console.log("Database setup complete!");
    } catch (e) {
        console.error("Error setting up database:", e);
    } finally {
        await client.end();
    }
}

main();
