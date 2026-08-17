-- V1: Initialize complete SES-GPT Schema with pgvector

CREATE EXTENSION IF NOT EXISTS vector;

-- 1. User Roles
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM (
        'STUDENT', 'TA', 'LECTURER', 'HOD', 'DEAN', 'ADMIN'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Users Table
CREATE TABLE IF NOT EXISTS public.users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id  VARCHAR(20) UNIQUE NOT NULL,
    name        VARCHAR(120) NOT NULL,
    email       VARCHAR(160) UNIQUE,
    password    VARCHAR(255) NOT NULL,
    role        VARCHAR(20) NOT NULL DEFAULT 'STUDENT',
    department  VARCHAR(120) NOT NULL,
    level       VARCHAR(10),
    verified    BOOLEAN NOT NULL DEFAULT FALSE,
    active      BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ensure column type is VARCHAR in case table pre-existed with an enum type
DO $$ BEGIN
    ALTER TABLE public.users ALTER COLUMN role TYPE VARCHAR(20) USING role::text;
EXCEPTION
    WHEN others THEN null;  -- ignore if already VARCHAR
END $$;

CREATE INDEX IF NOT EXISTS idx_users_student_id ON public.users(student_id);
CREATE INDEX IF NOT EXISTS idx_users_email      ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role       ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_department ON public.users(department);

-- 3. Documents Table
CREATE TABLE IF NOT EXISTS public.documents (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title       VARCHAR(255) NOT NULL,
    source_type VARCHAR(50) NOT NULL,
    owner_id    UUID REFERENCES public.users(id) ON DELETE SET NULL,
    department  VARCHAR(120),
    scope       VARCHAR(50) NOT NULL DEFAULT 'DEPARTMENT',
    file_name   VARCHAR(255),
    content     TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_documents_owner_id   ON public.documents(owner_id);
CREATE INDEX IF NOT EXISTS idx_documents_department ON public.documents(department);
CREATE INDEX IF NOT EXISTS idx_documents_scope      ON public.documents(scope);

-- 4. Document Chunks (pgvector 1536-dim embeddings)
CREATE TABLE IF NOT EXISTS public.document_chunks (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id  UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    chunk_index  INT NOT NULL,
    content      TEXT NOT NULL,
    token_count  INT,
    embedding    VECTOR(1536) NOT NULL,
    department   VARCHAR(120),
    scope        VARCHAR(50) NOT NULL DEFAULT 'DEPARTMENT',
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- HNSW index: works on empty tables; better performance than IVFFlat
CREATE INDEX IF NOT EXISTS idx_chunks_embedding ON public.document_chunks
    USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

CREATE INDEX IF NOT EXISTS idx_chunks_document_id  ON public.document_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_chunks_department   ON public.document_chunks(department);
CREATE INDEX IF NOT EXISTS idx_chunks_scope        ON public.document_chunks(scope);

-- 5. Announcements Table & Reads Junction
CREATE TABLE IF NOT EXISTS public.announcements (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id       UUID NOT NULL REFERENCES public.users(id),
    title           VARCHAR(255) NOT NULL,
    body            TEXT NOT NULL,
    target_scope    VARCHAR(50) NOT NULL,
    target_dept     VARCHAR(120),
    target_levels   VARCHAR(50)[],
    target_roles    VARCHAR(20)[],
    published_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    scheduled_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.announcement_reads (
    announcement_id UUID NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    read_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (announcement_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_announcements_sender     ON public.announcements(sender_id);
CREATE INDEX IF NOT EXISTS idx_announcements_dept       ON public.announcements(target_dept);
CREATE INDEX IF NOT EXISTS idx_announcements_published  ON public.announcements(published_at DESC);

-- 6. Conversations and Messages Table
CREATE TABLE IF NOT EXISTS public.conversations (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title       VARCHAR(255),
    session_type VARCHAR(30) NOT NULL DEFAULT 'GENERAL',
    document_id UUID REFERENCES public.documents(id),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.messages (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    role            VARCHAR(10) NOT NULL,
    content         TEXT NOT NULL,
    retrieved_chunks JSONB,
    tokens_used     INT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conv_id      ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at   ON public.messages(created_at DESC);
