-- ============================================================
-- KODESHARE — Feed performans iyilestirmeleri
-- Supabase SQL Editor'a kopyalayip calistir.
-- Idempotent: birden fazla kez calistirilabilir.
--
-- Amac: getFeed / getUserPosts / getWeeklyTop sorgulari
-- (is_published, type, created_at, likes_count) uzerinde
-- yariliyor. Bu kolonlar icin composite index ekliyoruz
-- ki Postgres tam tablo taramasi yapmasin.
-- ============================================================

-- 1. Feed (en yeni) — created_at desc + is_published filtresi
CREATE INDEX IF NOT EXISTS posts_feed_recent_idx
  ON public.posts (created_at DESC)
  WHERE is_published = true AND type <> 'project';

-- 2. Trending — likes_count desc + is_published filtresi
CREATE INDEX IF NOT EXISTS posts_feed_trending_idx
  ON public.posts (likes_count DESC, created_at DESC)
  WHERE is_published = true AND type <> 'project';

-- 3. Profil sayfasi — author_id + created_at desc
CREATE INDEX IF NOT EXISTS posts_author_recent_idx
  ON public.posts (author_id, created_at DESC)
  WHERE is_published = true AND type <> 'project';

-- 4. Tag aramalari icin GIN index (tags array)
CREATE INDEX IF NOT EXISTS posts_tags_gin_idx
  ON public.posts USING GIN (tags);

-- 5. post_likes / post_saves — kullanici-bazli isLiked/isSaved hydration
--    primary key (user_id, post_id) zaten var ama tersinden de
--    sorulduguna gore (post_id ile) bir tane daha gerekli.
CREATE INDEX IF NOT EXISTS post_likes_post_idx
  ON public.post_likes (post_id);

CREATE INDEX IF NOT EXISTS post_saves_post_idx
  ON public.post_saves (post_id);

-- 6. PostgREST schema cache'i yenile
NOTIFY pgrst, 'reload schema';

-- 7. Istatistikleri guncelle (opsiyonel ama tavsiye edilir)
ANALYZE public.posts;
ANALYZE public.post_likes;
ANALYZE public.post_saves;
