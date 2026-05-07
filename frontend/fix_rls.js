import pkg from 'pg';
const { Client } = pkg;

const connectionString = 'postgresql://postgres:6Cvk25Fg1hxUYpNv@db.pvgcmrjgzzccfkvetnbh.supabase.co:5432/postgres';

async function main() {
    const client = new Client({ connectionString });
    await client.connect();
    
    try {
        console.log("Fixing recursive RLS policies...");
        
        const sql = `
            -- 1. Create a security definer function to check roles without recursion
            CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
            RETURNS TEXT AS $$
            BEGIN
                RETURN (SELECT role FROM public.users WHERE id = user_id);
            END;
            $$ LANGUAGE plpgsql SECURITY DEFINER;

            -- 2. Drop existing recursive policies
            DROP POLICY IF EXISTS "mentors_all_students" ON public.students;
            DROP POLICY IF EXISTS "mentors_all_sessions" ON public.sessions;
            DROP POLICY IF EXISTS "mentors_all_attendance" ON public.attendance;
            DROP POLICY IF EXISTS "mentors_all_materials" ON public.materials;
            DROP POLICY IF EXISTS "mentors_all_import_log" ON public.import_log;
            DROP POLICY IF EXISTS "mentors_read_all_users" ON public.users;

            -- 3. Recreate policies using the non-recursive function
            CREATE POLICY "mentors_all_students" ON public.students FOR ALL USING (
                public.get_user_role(auth.uid()) = 'mentor'
            );
            CREATE POLICY "mentors_all_sessions" ON public.sessions FOR ALL USING (
                public.get_user_role(auth.uid()) = 'mentor'
            );
            CREATE POLICY "mentors_all_attendance" ON public.attendance FOR ALL USING (
                public.get_user_role(auth.uid()) = 'mentor'
            );
            CREATE POLICY "mentors_all_materials" ON public.materials FOR ALL USING (
                public.get_user_role(auth.uid()) = 'mentor'
            );
            CREATE POLICY "mentors_all_import_log" ON public.import_log FOR ALL USING (
                public.get_user_role(auth.uid()) = 'mentor'
            );
            CREATE POLICY "mentors_read_all_users" ON public.users FOR SELECT USING (
                public.get_user_role(auth.uid()) = 'mentor'
            );
        `;
        
        await client.query(sql);
        console.log("RLS policies fixed successfully!");
    } catch (e) {
        console.error("Error fixing RLS:", e);
    } finally {
        await client.end();
    }
}

main();
