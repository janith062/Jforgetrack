import pkg from 'pg';
const { Client } = pkg;

const connectionString = 'postgresql://postgres:6Cvk25Fg1hxUYpNv@db.pvgcmrjgzzccfkvetnbh.supabase.co:5432/postgres';

async function main() {
    const client = new Client({ connectionString });
    await client.connect();
    
    try {
        console.log("Deleting old mentor data...");
        await client.query("DELETE FROM auth.users WHERE email = 'nischay@theboringpeople.in'");
        // public.users should be deleted by CASCADE if the foreign key was set correctly.
        // But let's be sure.
        await client.query("DELETE FROM public.users WHERE email = 'nischay@theboringpeople.in'");

        console.log("Re-inserting mentor...");
        
        const mentorId = 'aeced567-10f2-4872-8b91-1e0609b22f42'; // Keeping the same ID

        await client.query(`
            INSERT INTO auth.users (
                id, 
                instance_id, 
                email, 
                aud, 
                encrypted_password, 
                email_confirmed_at, 
                raw_app_meta_data, 
                raw_user_meta_data, 
                created_at, 
                updated_at, 
                role,
                confirmation_token,
                recovery_token,
                email_change_token_new,
                email_change
            ) VALUES (
                '${mentorId}', 
                '00000000-0000-0000-0000-000000000000', 
                'nischay@theboringpeople.in', 
                'authenticated', 
                extensions.crypt('password123', extensions.gen_salt('bf')), 
                NOW(), 
                '{"provider":"email","providers":["email"]}', 
                '{}', 
                NOW(), 
                NOW(), 
                'authenticated',
                '', '', '', ''
            )
        `);

        await client.query(`
            INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, created_at, updated_at)
            VALUES (
                extensions.gen_random_uuid(), 
                '${mentorId}', 
                '${mentorId}', 
                'email', 
                jsonb_build_object('sub', '${mentorId}', 'email', 'nischay@theboringpeople.in'), 
                NOW(), 
                NOW()
            )
        `);

        await client.query(`
            INSERT INTO public.users (id, email, role, display_name)
            VALUES ('${mentorId}', 'nischay@theboringpeople.in', 'mentor', 'Nischay B K')
        `);

        console.log("Mentor recreated successfully!");

    } catch (e) {
        console.error("Error recreating mentor:", e);
    } finally {
        await client.end();
    }
}

main();
