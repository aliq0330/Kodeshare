-- Gizli hesap gönderilerini takipçi olmayanlardan gizle
-- Mevcut "herkes görebilir" politikasını kaldır ve yerini al

drop policy if exists "Herkes gönderileri görebilir" on public.posts;

create policy "Gönderileri görüntüle" on public.posts for select using (
  -- Yazar kendi gönderilerini her zaman görebilir
  auth.uid() = author_id
  OR
  -- Herkese açık hesapların gönderileri herkese görünür
  (select is_public from public.profiles where id = author_id) = true
  OR
  -- Gizli hesapların gönderileri sadece takipçilere görünür
  auth.uid() in (
    select follower_id from public.follows where following_id = author_id
  )
);
