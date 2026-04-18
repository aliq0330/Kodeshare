-- ============================================================
-- KODESHARE — Repost & Quote Post Migration
-- Supabase SQL Editor'a kopyalayıp çalıştır.
-- Önceki repost SQL dosyalarını kullanıyorsan önce onları kaldır:
-- bu dosya idempotent'tir ve tekrar çalıştırılabilir.
-- ============================================================

-- ------------------------------------------------------------
-- 1. posts.type kısıtlamasını güncelle: 'gonderi' ekle
-- ------------------------------------------------------------
ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_type_check;

ALTER TABLE public.posts
  ADD CONSTRAINT posts_type_check
  CHECK (type IN ('snippet','project','article','repost','gonderi'));

-- ------------------------------------------------------------
-- 2. posts tablosuna repost sayacı ekle
-- ------------------------------------------------------------
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS repost_count integer NOT NULL DEFAULT 0;

-- Sadece bir gönderi, bir başka gönderiyi kaynak alabilir,
-- ve bir kullanıcı aynı gönderiyi yalnız bir kez "düz" repostlayabilir.
-- (Quote post'lar 'gonderi' tipindedir ve bu kısıtlamadan muaftır.)

-- Önce mevcut veride aynı (author_id, reposted_from) çiftine sahip
-- fazla plain repost kayıtlarını temizle. En eskisi korunur.
DELETE FROM public.posts p
USING public.posts q
WHERE p.type = 'repost'
  AND q.type = 'repost'
  AND p.reposted_from IS NOT NULL
  AND p.author_id     = q.author_id
  AND p.reposted_from = q.reposted_from
  AND p.created_at    > q.created_at;

DROP INDEX IF EXISTS posts_unique_plain_repost_idx;
CREATE UNIQUE INDEX posts_unique_plain_repost_idx
  ON public.posts (author_id, reposted_from)
  WHERE type = 'repost' AND reposted_from IS NOT NULL;

-- Hızlı repost sorguları için
CREATE INDEX IF NOT EXISTS posts_reposted_from_idx
  ON public.posts (reposted_from)
  WHERE reposted_from IS NOT NULL;

-- ------------------------------------------------------------
-- 3. repost_count trigger'ı
--    Bir post, reposted_from ile başka bir posta referans veriyorsa
--    (type = 'repost' veya 'gonderi'), kaynak postun repost_count'u artar.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_repost_count()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.reposted_from IS NOT NULL AND NEW.type IN ('repost','gonderi') THEN
      UPDATE public.posts
        SET repost_count = repost_count + 1
        WHERE id = NEW.reposted_from;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.reposted_from IS NOT NULL AND OLD.type IN ('repost','gonderi') THEN
      UPDATE public.posts
        SET repost_count = GREATEST(repost_count - 1, 0)
        WHERE id = OLD.reposted_from;
    END IF;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS posts_repost_count ON public.posts;
CREATE TRIGGER posts_repost_count
  AFTER INSERT OR DELETE ON public.posts
  FOR EACH ROW EXECUTE PROCEDURE public.update_repost_count();

-- ------------------------------------------------------------
-- 4. Mevcut verilerdeki repost_count değerini baştan hesapla
-- ------------------------------------------------------------
UPDATE public.posts p
SET repost_count = (
  SELECT COUNT(*)
  FROM public.posts r
  WHERE r.reposted_from = p.id
    AND r.type IN ('repost','gonderi')
);

-- ------------------------------------------------------------
-- 5. Repost bildirimleri için yardımcı fonksiyon (opsiyonel)
--    Bir kullanıcı başka birinin postunu repostladığında
--    otomatik bildirim oluşturur.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_repost_notification()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  original_author uuid;
  label text;
BEGIN
  IF NEW.reposted_from IS NULL OR NEW.type NOT IN ('repost','gonderi') THEN
    RETURN NEW;
  END IF;

  SELECT author_id INTO original_author
    FROM public.posts
    WHERE id = NEW.reposted_from;

  IF original_author IS NULL OR original_author = NEW.author_id THEN
    RETURN NEW;
  END IF;

  label := CASE WHEN NEW.type = 'gonderi'
                THEN 'Gönderini alıntıladı'
                ELSE 'Gönderini yeniden paylaştı' END;

  INSERT INTO public.notifications (user_id, actor_id, type, post_id, message)
  VALUES (original_author, NEW.author_id, 'repost', NEW.reposted_from, label);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS posts_repost_notification ON public.posts;
CREATE TRIGGER posts_repost_notification
  AFTER INSERT ON public.posts
  FOR EACH ROW EXECUTE PROCEDURE public.handle_repost_notification();
