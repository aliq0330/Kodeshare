-- ============================================================
-- KODESHARE — Mevcut deployment'a uygula
-- Supabase SQL Editor'a kopyalayıp çalıştır
-- ============================================================

-- 1. conversation_participants INSERT policy eksikti
--    PostgreSQL'de CREATE POLICY IF NOT EXISTS desteklenmez,
--    bu yüzden DO block ile kontrol yapılır.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'conversation_participants'
    AND policyname = 'Giris yapanlar konusmaya katilabilir'
  ) THEN
    EXECUTE 'CREATE POLICY "Giris yapanlar konusmaya katilabilir"
      ON public.conversation_participants
      FOR INSERT WITH CHECK (auth.uid() IS NOT NULL)';
  END IF;
END $$;

-- 2. Post sayaclari senkronizasyonu
UPDATE public.posts p
SET likes_count    = (SELECT COUNT(*) FROM public.post_likes pl WHERE pl.post_id = p.id),
    comments_count = (SELECT COUNT(*) FROM public.comments c   WHERE c.post_id   = p.id),
    saves_count    = (SELECT COUNT(*) FROM public.post_saves ps WHERE ps.post_id  = p.id);

-- 3. Profil takipci/takip sayilari
UPDATE public.profiles p
SET followers_count = (SELECT COUNT(*) FROM public.follows f WHERE f.following_id = p.id),
    following_count = (SELECT COUNT(*) FROM public.follows f WHERE f.follower_id   = p.id);

-- 4. Yorum begeni sayilari
UPDATE public.comments c
SET likes_count = (SELECT COUNT(*) FROM public.comment_likes cl WHERE cl.comment_id = c.id);

-- 5. comment_likes trigger (eger yoksa olustur)
CREATE OR REPLACE FUNCTION public.update_comment_likes_count()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.comments SET likes_count = likes_count + 1 WHERE id = NEW.comment_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.comments SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.comment_id;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS comment_likes_count ON public.comment_likes;
CREATE TRIGGER comment_likes_count
  AFTER INSERT OR DELETE ON public.comment_likes
  FOR EACH ROW EXECUTE PROCEDURE public.update_comment_likes_count();
