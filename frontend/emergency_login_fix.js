import pkg from 'pg';
const { Client } = pkg;

const connectionString = 'postgresql://postgres:6Cvk25Fg1hxUYpNv@db.pvgcmrjgzzccfkvetnbh.supabase.co:5432/postgres';

async function main() {
    const client = new Client({ connectionString });
    await client.connect();
    
    try {
        console.log("Starting Comprehensive Login & Schema Fix...");

        const sql = `
            -- 1. Ensure pgcrypto exists in extensions
            CREATE EXTENSION IF NOT EXISTS pgcrypto SCHEMA extensions;

            -- 2. Restore Schema Permissions
            GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
            GRANT USAGE ON SCHEMA extensions TO anon, authenticated, service_role;

            -- 3. Fix Recursive RLS Function
            CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
            RETURNS TEXT AS $$
            BEGIN
                -- This function is SECURITY DEFINER to bypass RLS recursion
                RETURN (SELECT role FROM public.users WHERE id = user_id);
            END;
            $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

            -- 4. Re-apply RLS Policies to avoid recursion
            -- First, drop all possible conflicting policies
            DROP POLICY IF EXISTS "mentors_all_students" ON public.students;
            DROP POLICY IF EXISTS "mentors_all_sessions" ON public.sessions;
            DROP POLICY IF EXISTS "mentors_all_attendance" ON public.attendance;
            DROP POLICY IF EXISTS "mentors_all_materials" ON public.materials;
            DROP POLICY IF EXISTS "mentors_all_import_log" ON public.import_log;
            DROP POLICY IF EXISTS "mentors_read_all_users" ON public.users;
            DROP POLICY IF EXISTS "users_read_own" ON public.users;

            -- Users can read their own profile
            CREATE POLICY "users_read_own" ON public.users FOR SELECT USING (id = auth.uid());

            -- Mentors can do anything
            CREATE POLICY "mentors_read_all_users" ON public.users FOR SELECT USING (public.get_user_role(auth.uid()) = 'mentor');
            CREATE POLICY "mentors_all_students" ON public.students FOR ALL USING (public.get_user_role(auth.uid()) = 'mentor');
            CREATE POLICY "mentors_all_sessions" ON public.sessions FOR ALL USING (public.get_user_role(auth.uid()) = 'mentor');
            CREATE POLICY "mentors_all_attendance" ON public.attendance FOR ALL USING (public.get_user_role(auth.uid()) = 'mentor');
            CREATE POLICY "mentors_all_materials" ON public.materials FOR ALL USING (public.get_user_role(auth.uid()) = 'mentor');
            CREATE POLICY "mentors_all_import_log" ON public.import_log FOR ALL USING (public.get_user_role(auth.uid()) = 'mentor');

            -- 5. GRANT permissions to tables (MUST be done after tables are created)
            GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
            GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
            GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;

            -- 6. Ensure default search path
            ALTER DATABASE postgres SET search_path TO "$user", public, extensions;
        `;

        await client.query(sql);
        console.log("✅ Comprehensive Fix Applied Successfully!");

        // 7. Verify the mentor account exists and has correct password
        const res = await client.query("SELECT id, email, encrypted_password FROM auth.users WHERE email = 'nischay@theboringpeople.in'");
        if (res.rows.length === 0) {
            console.log("❌ Mentor account missing! Please run seed.sql again.");
        } else {
            console.log("✅ Mentor account found. ID:", res.rows[0].id);
        }

    } catch (e) {
        console.error("❌ Error applying fix:", e);
    } finally {
        await client.end();
    }
}

main();
