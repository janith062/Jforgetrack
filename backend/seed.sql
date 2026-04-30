-- Insert Mentor and Co-Facilitator into auth.users and public.users
DO $$
DECLARE
    mentor_id UUID := gen_random_uuid();
    cofacilitator_id UUID := gen_random_uuid();
BEGIN
    -- Mentor
    INSERT INTO auth.users (id, instance_id, email, aud, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role)
    VALUES (
        mentor_id, '00000000-0000-0000-0000-000000000000', 'nischay@theboringpeople.in', 'authenticated', crypt('password123', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(), 'authenticated',
    );

    INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, created_at, updated_at)
    VALUES (gen_random_uuid(), mentor_id, mentor_id::text, 'email', jsonb_build_object('sub', mentor_id::text, 'email', 'nischay@theboringpeople.in'), NOW(), NOW());
    
    INSERT INTO public.users (id, email, role, student_id, display_name)
    VALUES (mentor_id, 'nischay@theboringpeople.in', 'mentor', NULL, 'Nischay B K');


    -- Co-facilitator
    INSERT INTO auth.users (id, instance_id, email, aud, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role)
    VALUES (
        cofacilitator_id, '00000000-0000-0000-0000-000000000000', 'varun@theboringpeople.in', 'authenticated', crypt('password123', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(), 'authenticated'
    );
    INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, created_at, updated_at)
    VALUES (gen_random_uuid(), cofacilitator_id, cofacilitator_id::text, 'email', jsonb_build_object('sub', cofacilitator_id::text, 'email', 'varun@theboringpeople.in'), NOW(), NOW());
    
    INSERT INTO public.users (id, email, role, student_id, display_name)
    VALUES (cofacilitator_id, 'varun@theboringpeople.in', 'mentor', NULL, 'Varun');
END $$;

-- Insert 25 Students
-- This will automatically create auth.users and public.users records via the trigger
INSERT INTO public.students (name, usn, branch_code) VALUES
('Abhishek Sharma', '4SH24CS001', 'CS'),
('Divya Kulkarni', '4SH24CS002', 'AI'),
('Ravi Kumar', '4SH24CS003', 'CS'),
('Sneha Reddy', '4SH24CS004', 'IS'),
('Arjun Nair', '4SH24CS005', 'AI'),
('Priya Desai', '4SH24CS006', 'CS'),
('Karthik Iyer', '4SH24CS007', 'IS'),
('Ananya Rao', '4SH24CS008', 'CS'),
('Vikram Singh', '4SH24CS009', 'AI'),
('Megha Menon', '4SH24CS010', 'IS'),
('Rahul K', '4SH24CS011', 'CS'),
('Neha Patil', '4SH24CS012', 'AI'),
('Siddharth Joshi', '4SH24CS013', 'CS'),
('Pooja Hegde', '4SH24CS014', 'IS'),
('Aditya Verma', '4SH24CS015', 'AI'),
('Kavya Shetty', '4SH24CS016', 'CS'),
('Rohan Das', '4SH24CS017', 'IS'),
('Swati Mishra', '4SH24CS018', 'CS'),
('Nitin Bhat', '4SH24CS019', 'AI'),
('Preeti Jain', '4SH24CS020', 'IS'),
('Varun Gupta', '4SH24CS021', 'CS'),
('Nisha Choudhury', '4SH24CS022', 'AI'),
('Manoj Tiwari', '4SH24CS023', 'CS'),
('Aarti Sharma', '4SH24CS024', 'IS'),
('Vivek Reddy', '4SH24CS025', 'AI');

-- Insert 15 Sessions across Month 4, 5, 6
INSERT INTO public.sessions (date, topic, month_number, duration_hours, session_type) VALUES
('2025-11-01', 'Intro to Machine Learning', 4, 2.0, 'offline'),
('2025-11-08', 'Linear Regression Deep Dive', 4, 2.0, 'offline'),
('2025-11-15', 'Logistic Regression & Classification', 4, 2.0, 'online'),
('2025-11-22', 'Decision Trees and Random Forests', 4, 2.0, 'offline'),
('2025-11-29', 'Support Vector Machines', 4, 2.0, 'offline'),
('2025-12-06', 'Neural Networks Basics', 5, 2.0, 'offline'),
('2025-12-13', 'Deep Learning with PyTorch', 5, 2.5, 'online'),
('2025-12-20', 'Convolutional Neural Networks', 5, 2.5, 'offline'),
('2025-12-27', 'Recurrent Neural Networks', 5, 2.0, 'offline'),
('2026-01-03', 'Transformers Architecture', 5, 2.0, 'offline'),
('2026-01-10', 'Large Language Models (LLMs)', 6, 2.0, 'online'),
('2026-01-17', '8-Layer AI Stack', 6, 2.0, 'offline'),
('2026-01-24', 'ReAct Agent Pattern', 6, 2.0, 'offline'),
('2026-01-31', 'pgvector RAG', 6, 2.5, 'offline'),
('2026-02-07', 'Tiered Autonomy Multi-Agent', 6, 2.5, 'offline');

-- Insert Materials (2 per session: slides + recording)
DO $$
DECLARE
    s RECORD;
BEGIN
    FOR s IN SELECT id, topic FROM public.sessions LOOP
        INSERT INTO public.materials (session_id, title, type, url, description)
        VALUES 
        (s.id, s.topic || ' Slides', 'slides', 'https://docs.google.com/presentation/d/dummy', 'Presentation slides for ' || s.topic),
        (s.id, s.topic || ' Recording', 'recording', 'https://youtube.com/watch?v=dummy', 'Session recording for ' || s.topic);
    END LOOP;
END $$;

-- Insert Import Logs
INSERT INTO public.import_log (filename, uploaded_by, total_rows, imported_rows, skipped_rows, status) VALUES
('month4_attendance.csv', 'Nischay B K', 125, 125, 0, 'completed'),
('month5_attendance.csv', 'Varun', 125, 120, 5, 'completed');

-- Insert Attendance (Realistic distribution)
-- 70-90% attendance, a few at 50-60%
DO $$
DECLARE
    st RECORD;
    se RECORD;
    is_present BOOLEAN;
    rand FLOAT;
BEGIN
    FOR st IN SELECT id FROM public.students LOOP
        FOR se IN SELECT id FROM public.sessions LOOP
            rand := random();
            -- Student 3 and 10 have ~50% attendance
            IF st.id IN (3, 10) THEN
                is_present := rand > 0.5;
            ELSE
                is_present := rand > 0.15; -- 85% attendance
            END IF;
            
            INSERT INTO public.attendance (student_id, session_id, present, marked_by)
            VALUES (st.id, se.id, is_present, 'Nischay B K');
        END LOOP;
    END LOOP;
END $$;
