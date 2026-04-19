-- Dosya içeriği geçmişini saklamak için original_files kolonu ekle
-- Supabase SQL Editor'da çalıştır
alter table public.post_edits add column if not exists original_files jsonb default '[]'::jsonb;
