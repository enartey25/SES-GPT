-- V5: Alter announcements and create notifications tables for permanent broadcast tracking and recipient delivery

-- 1. Upgrade announcements table columns
ALTER TABLE public.announcements 
    ADD COLUMN IF NOT EXISTS sender_name VARCHAR(255) DEFAULT 'Faculty Broadcast',
    ADD COLUMN IF NOT EXISTS sender_role VARCHAR(50) DEFAULT 'lecturer',
    ADD COLUMN IF NOT EXISTS target_school VARCHAR(255) DEFAULT 'School of Engineering Sciences',
    ADD COLUMN IF NOT EXISTS target_department VARCHAR(255) DEFAULT 'Computer Engineering',
    ADD COLUMN IF NOT EXISTS target_student_ids TEXT[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS reach_count INT DEFAULT 0;

ALTER TABLE public.announcements ALTER COLUMN sender_id DROP NOT NULL;
ALTER TABLE public.announcements ALTER COLUMN target_scope DROP NOT NULL;

-- 2. Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    announcement_id UUID REFERENCES public.announcements(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    student_id VARCHAR(50),
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    sender_name VARCHAR(255) NOT NULL,
    sender_role VARCHAR(50) NOT NULL,
    department VARCHAR(255) NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_student_id ON public.notifications(student_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON public.announcements(created_at DESC);

-- 3. Seed initial announcements
INSERT INTO public.announcements (id, title, body, sender_name, sender_role, target_school, target_department, target_levels, target_roles, reach_count, created_at)
VALUES 
('11111111-1111-1111-1111-111111111111', 'Mid-Semester Exam Timetable Released', 'The mid-semester examination timetable for the Computer Engineering department has been published. Students are to check the student portal for room and seating assignments. Examinations run from Week 8 (October 6–10). Report any clashes to the Registry by September 28.', 'Prof. Aba Bentil', 'hod', 'School of Engineering Sciences', 'Computer Engineering', ARRAY['L100', 'L200', 'L300', 'L400'], ARRAY['student', 'ta', 'lecturer'], 312, CURRENT_TIMESTAMP - INTERVAL '2 days'),
('22222222-2222-2222-2222-222222222222', 'CPEN 306 Embedded Systems Lab Session Rescheduled', 'The lab session for CPEN 306 has been moved to Friday, October 3 at 10am in CCB Lab 204. Please come prepared with your laboratory logbooks.', 'Dr. Godfrey Mills', 'lecturer', 'School of Engineering Sciences', 'Computer Engineering', ARRAY['L300'], ARRAY['student'], 78, CURRENT_TIMESTAMP - INTERVAL '4 days'),
('33333333-3333-3333-3333-333333333333', 'Final Year Project Supervisor Assignments Posted', 'Supervisor assignments for all L400 final year projects have been posted to the departmental noticeboard and online student repository.', 'Prof. Elvis Nyarko', 'dean', 'School of Engineering Sciences', 'Computer Engineering', ARRAY['L400'], ARRAY['student', 'lecturer'], 65, CURRENT_TIMESTAMP - INTERVAL '7 days')
ON CONFLICT (id) DO NOTHING;

-- 4. Seed initial notifications for demo student
INSERT INTO public.notifications (id, announcement_id, student_id, title, body, sender_name, sender_role, department, is_read, created_at)
VALUES
('44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', '22370498', 'Mid-Semester Exam Timetable Released', 'The mid-semester examination timetable for the Computer Engineering department has been published. Students are to check the student portal for room and seating assignments.', 'Prof. Aba Bentil', 'hod', 'Computer Engineering', FALSE, CURRENT_TIMESTAMP - INTERVAL '2 days'),
('55555555-5555-5555-5555-555555555555', '22222222-2222-2222-2222-222222222222', '22370498', 'CPEN 306 Embedded Systems Lab Session Rescheduled', 'The lab session for CPEN 306 has been moved to Friday, October 3 at 10am in CCB Lab 204. Please come prepared with your laboratory logbooks.', 'Dr. Godfrey Mills', 'lecturer', 'Computer Engineering', FALSE, CURRENT_TIMESTAMP - INTERVAL '4 days')
ON CONFLICT (id) DO NOTHING;
