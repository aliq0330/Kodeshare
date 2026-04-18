-- ============================================================
-- KODESHARE — posts.comments_count senkronizasyonu
-- Supabase SQL Editor'a kopyalayip calistir
--
-- Trigger (schema.sql) her yeni/silinen yorum icin sayaci
-- gunceller; ama eski veriler veya race-condition durumlari
-- icin sayi dogal olarak sapmis olabilir. Bu script sayaci
-- comments tablosundaki gercek kayit sayisiyla yeniden esitler.
-- ============================================================

UPDATE public.posts p
SET comments_count = sub.c
FROM (
  SELECT post_id, COUNT(*)::int AS c
  FROM public.comments
  GROUP BY post_id
) sub
WHERE p.id = sub.post_id
  AND p.comments_count IS DISTINCT FROM sub.c;

-- Hic yorumu kalmamis postlari da sifirla
UPDATE public.posts
SET comments_count = 0
WHERE comments_count > 0
  AND id NOT IN (SELECT DISTINCT post_id FROM public.comments);
