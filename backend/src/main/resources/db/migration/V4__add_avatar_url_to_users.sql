-- V4: Add avatar_url column to users table for permanent profile picture storage
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
