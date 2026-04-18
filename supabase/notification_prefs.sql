-- ============================================================
-- KODESHARE — Bildirim sistemi tamamlama migration'i
-- Supabase SQL Editor'a kopyalayip calistir
--
-- 1) profiles.notification_prefs jsonb ekler (kullanici tercihleri)
-- 2) Mevcut kullanicilara default tercih degerlerini set eder
-- ============================================================

-- 1. Kolonu ekle (varsa atla)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS notification_prefs jsonb NOT NULL DEFAULT jsonb_build_object(
    'likes',    true,
    'comments', true,
    'replies',  true,
    'follows',  true,
    'mentions', true,
    'messages', true,
    'reposts',  true,
    'email',    false
  );

-- 2. Eski kayitlarda NULL/eksik olursa default'a cevir
UPDATE public.profiles
SET notification_prefs = jsonb_build_object(
  'likes',    true,
  'comments', true,
  'replies',  true,
  'follows',  true,
  'mentions', true,
  'messages', true,
  'reposts',  true,
  'email',    false
)
WHERE notification_prefs IS NULL;
