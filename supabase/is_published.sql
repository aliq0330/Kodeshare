-- ============================================================
-- KODESHARE — posts.is_published migration
-- Supabase SQL Editor'a kopyalayip calistir
--
-- Amac: Editorde olusturulan/forklanan projeler (type='project')
-- posts tablosuna yazildigi icin otomatik olarak feed'e dusuyordu.
-- Bu migration 'is_published' bayragini ekler; sadece true olan
-- kayitlar feed/profil listelerinde gosterilir.
-- ============================================================

-- 1. Kolonu ekle (zaten varsa atla)
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT false;

-- 2. Proje disindaki mevcut tum postlari 'yayinlanmis' olarak isaretle
UPDATE public.posts
SET is_published = true
WHERE type IN ('snippet', 'article', 'repost', 'gonderi')
  AND is_published = false;

-- 3. Feed filtrelemesini hizlandirmak icin index
CREATE INDEX IF NOT EXISTS posts_is_published_idx
  ON public.posts(is_published);
