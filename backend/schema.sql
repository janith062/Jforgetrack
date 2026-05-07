-- Create Students Table
CREATE TABLE public.students (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    usn TEXT UNIQUE NOT NULL,
    admission_number TEXT,
    email TEXT,
    branch_code TEXT NOT NULL,
    batch TEXT DEFAULT '2024-2028',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Sessions Table
CREATE TABLE public.sessions (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    topic TEXT NOT NULL,
    month_number INTEGER NOT NULL,
    duration_hours DECIMAL(3,1) DEFAULT 2.0,
    session_type TEXT DEFAULT 'offline',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create ImportLog Table
CREATE TABLE public.import_log (
    id SERIAL PRIMARY KEY,
    filename TEXT NOT NULL,
    uploaded_by TEXT NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    total_rows INTEGER NOT NULL,
    imported_rows INTEGER NOT NULL,
    skipped_rows INTEGER NOT NULL,
    warnings JSONB,
    column_mapping JSONB,
    status TEXT NOT NULL
);

-- Create Attendance Table
CREATE TABLE public.attendance (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    session_id INTEGER NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
    present BOOLEAN NOT NULL,
    marked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    marked_by TEXT DEFAULT 'system',
    import_id INTEGER REFERENCES public.import_log(id) ON DELETE SET NULL,
    UNIQUE(student_id, session_id)
);

-- Create Materials Table
CREATE TABLE public.materials (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    type TEXT NOT NULL,
    url TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create public.users Table (Linked to auth.users)
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('mentor', 'student')),
    student_id INTEGER REFERENCES public.students(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- CHECK Constraints using Triggers
CREATE OR REPLACE FUNCTION check_attendance_date()
RETURNS TRIGGER AS $$
DECLARE
    session_date DATE;
BEGIN
    SELECT date INTO session_date FROM public.sessions WHERE id = NEW.session_id;
    IF session_date > CURRENT_DATE THEN
        RAISE EXCEPTION 'Attendance date cannot be in the future';
    END IF;
    IF session_date < '2025-08-04' THEN
        RAISE EXCEPTION 'Attendance date cannot be before program start';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_attendance_date
BEFORE INSERT OR UPDATE ON public.attendance
FOR EACH ROW EXECUTE FUNCTION check_attendance_date();

-- Row Level Security (RLS)

-- Enable RLS
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Students Policies
CREATE POLICY "students_read_own" ON public.students FOR SELECT USING (
    id = (SELECT student_id FROM public.users WHERE id = auth.uid())
);
CREATE POLICY "mentors_all_students" ON public.students FOR ALL USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'mentor'
);

-- Sessions Policies
CREATE POLICY "students_read_sessions" ON public.sessions FOR SELECT USING (true);
CREATE POLICY "mentors_all_sessions" ON public.sessions FOR ALL USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'mentor'
);

-- Attendance Policies
CREATE POLICY "students_read_own_attendance" ON public.attendance FOR SELECT USING (
    student_id = (SELECT student_id FROM public.users WHERE id = auth.uid())
);
CREATE POLICY "mentors_all_attendance" ON public.attendance FOR ALL USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'mentor'
);

-- Materials Policies
CREATE POLICY "students_read_materials" ON public.materials FOR SELECT USING (true);
CREATE POLICY "mentors_all_materials" ON public.materials FOR ALL USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'mentor'
);

-- ImportLog Policies
CREATE POLICY "mentors_all_import_log" ON public.import_log FOR ALL USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'mentor'
);

-- Users Policies
CREATE POLICY "users_read_own" ON public.users FOR SELECT USING (id = auth.uid());
CREATE POLICY "mentors_read_all_users" ON public.users FOR SELECT USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'mentor'
);

-- Auto-create User Trigger for Students
CREATE OR REPLACE FUNCTION public.handle_new_student()
RETURNS TRIGGER AS $$
DECLARE
    new_user_id UUID;
BEGIN
    -- We generate a new UUID for the auth.users record
    new_user_id := gen_random_uuid();
    
    -- Insert into auth.users (creating the actual auth account)
    -- Using the USN as the password, crypted with pgcrypto
    INSERT INTO auth.users (id, instance_id, email, aud, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role)
    VALUES (
        new_user_id,
        '00000000-0000-0000-0000-000000000000',
        LOWER(NEW.usn) || '@forge.local',
        'authenticated',
        crypt(NEW.usn, gen_salt('bf')),
        NOW(),
        '{"provider":"email","providers":["email"]}',
        '{}',
        NOW(),
        NOW(),
        'authenticated'
    );
    
    -- Insert into auth.identities
    INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, created_at, updated_at)
    VALUES (
        gen_random_uuid(),
        new_user_id,
        new_user_id::text,
        'email',
        jsonb_build_object('sub', new_user_id::text, 'email', LOWER(NEW.usn) || '@forge.local'),
        NOW(),
        NOW()
    );

    -- Insert into public.users
    INSERT INTO public.users (id, email, role, student_id, display_name)
    VALUES (
        new_user_id,
        LOWER(NEW.usn) || '@forge.local',
        'student',
        NEW.id,
        NEW.name
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_student_created
AFTER INSERT ON public.students
FOR EACH ROW EXECUTE FUNCTION public.handle_new_student();
