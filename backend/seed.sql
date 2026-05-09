-- Insert Mentor and Co-Facilitator into auth.users and public.users
DO $$
DECLARE
    mentor_id UUID := gen_random_uuid();
    cofacilitator_id UUID := gen_random_uuid();
BEGIN
    -- Cleanup existing
    DELETE FROM auth.users WHERE email IN ('nischay@theboringpeople.in', 'varun@theboringpeople.in');
    
    -- Mentor
    INSERT INTO auth.users (id, instance_id, email, aud, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role)
    VALUES (
        mentor_id, '00000000-0000-0000-0000-000000000000', 'nischay@theboringpeople.in', 'authenticated', crypt('password123', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(), 'authenticated'
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

