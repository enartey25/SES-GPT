-- V3: Normalize and migrate department names to the 5 official School of Engineering Sciences (SES) departments:
-- 1. Computer Engineering
-- 2. Agricultural Engineering
-- 3. Biomedical Engineering
-- 4. Food Process Engineering
-- 5. Materials Science and Engineering

-- Migrate users table
UPDATE public.users
SET department = 'Computer Engineering'
WHERE department IN ('Electrical Engineering', 'Computer Science', 'IT', 'Software Engineering');

UPDATE public.users
SET department = 'Agricultural Engineering'
WHERE department IN ('Mechanical Engineering', 'Agric Engineering');

UPDATE public.users
SET department = 'Food Process Engineering'
WHERE department IN ('Chemical Engineering', 'Food Processing', 'Food Engineering');

UPDATE public.users
SET department = 'Materials Science and Engineering'
WHERE department IN ('Civil Engineering', 'Materials Science', 'Materials Engineering');

-- Migrate documents table
UPDATE public.documents
SET department = 'Computer Engineering'
WHERE department IN ('Electrical Engineering', 'Computer Science', 'IT', 'Software Engineering');

UPDATE public.documents
SET department = 'Agricultural Engineering'
WHERE department IN ('Mechanical Engineering', 'Agric Engineering');

UPDATE public.documents
SET department = 'Food Process Engineering'
WHERE department IN ('Chemical Engineering', 'Food Processing', 'Food Engineering');

UPDATE public.documents
SET department = 'Materials Science and Engineering'
WHERE department IN ('Civil Engineering', 'Materials Science', 'Materials Engineering');

-- Migrate document_chunks table
UPDATE public.document_chunks
SET department = 'Computer Engineering'
WHERE department IN ('Electrical Engineering', 'Computer Science', 'IT', 'Software Engineering');

UPDATE public.document_chunks
SET department = 'Agricultural Engineering'
WHERE department IN ('Mechanical Engineering', 'Agric Engineering');

UPDATE public.document_chunks
SET department = 'Food Process Engineering'
WHERE department IN ('Chemical Engineering', 'Food Processing', 'Food Engineering');

UPDATE public.document_chunks
SET department = 'Materials Science and Engineering'
WHERE department IN ('Civil Engineering', 'Materials Science', 'Materials Engineering');

-- Migrate announcements table
UPDATE public.announcements
SET target_dept = 'Computer Engineering'
WHERE target_dept IN ('Electrical Engineering', 'Computer Science', 'IT', 'Software Engineering');

UPDATE public.announcements
SET target_dept = 'Agricultural Engineering'
WHERE target_dept IN ('Mechanical Engineering', 'Agric Engineering');

UPDATE public.announcements
SET target_dept = 'Food Process Engineering'
WHERE target_dept IN ('Chemical Engineering', 'Food Processing', 'Food Engineering');

UPDATE public.announcements
SET target_dept = 'Materials Science and Engineering'
WHERE target_dept IN ('Civil Engineering', 'Materials Science', 'Materials Engineering');
