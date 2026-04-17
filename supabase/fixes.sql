-- ============================================================
-- KODESHARE — Mevcut deployment'a uygula
-- Supabase SQL Editor'a kopyalayıp çalıştır
-- ============================================================

-- 1. conversation_participants INSERT policy eksikti
--    (Mesaj başlatma çalışmıyorsa bu policy gerekli)
create policy if not exists "Giriş yapanlar konuşmaya katılabilir"
  on public.conversation_participants
  for insert
  with check (auth.uid() is not null);

-- 2. Sayaç senkronizasyonu
--    (likes_count 0 kalıyor, comments_count güncellenmiyorsa çalıştır)

-- Post beğeni sayıları
update public.posts p
set likes_count = (select count(*) from public.post_likes pl where pl.post_id = p.id);

-- Post yorum sayıları
update public.posts p
set comments_count = (select count(*) from public.comments c where c.post_id = p.id);

-- Post kaydetme sayıları
update public.posts p
set saves_count = (select count(*) from public.post_saves ps where ps.post_id = p.id);

-- Profil takipçi/takip sayıları
update public.profiles p
set followers_count = (select count(*) from public.follows f where f.following_id = p.id),
    following_count = (select count(*) from public.follows f where f.follower_id  = p.id);

-- Yorum beğeni sayıları
update public.comments c
set likes_count = (select count(*) from public.comment_likes cl where cl.comment_id = c.id);

-- 3. Eğer comment_likes trigger yoksa (yorum beğeni sayısı hiç güncellenmediyse)
create or replace function public.update_comment_likes_count()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    update public.comments set likes_count = likes_count + 1 where id = new.comment_id;
  elsif tg_op = 'DELETE' then
    update public.comments set likes_count = greatest(likes_count - 1, 0) where id = old.comment_id;
  end if;
  return null;
end;
$$;

drop trigger if exists comment_likes_count on public.comment_likes;
create trigger comment_likes_count after insert or delete on public.comment_likes
  for each row execute procedure public.update_comment_likes_count();
