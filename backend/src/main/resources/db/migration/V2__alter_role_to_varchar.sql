-- V2: Ensure role columns are VARCHAR for Spring Boot JPA compatibility
-- Wrapped in exception handlers so re-running on an already-migrated DB is safe.

DO $$ BEGIN
    ALTER TABLE public.users ALTER COLUMN role TYPE VARCHAR(20) USING role::text;
EXCEPTION
    WHEN others THEN null;  -- already VARCHAR(20), skip
END $$;

DO $$ BEGIN
    ALTER TABLE public.announcements ALTER COLUMN target_roles TYPE VARCHAR(20)[] USING target_roles::text[];
EXCEPTION
    WHEN others THEN null;  -- already correct type, skip
END $$;
