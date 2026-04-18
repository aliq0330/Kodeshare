-- follows tablosuna onaylama için yeni INSERT politikası ekle
-- Mevcut politika sadece auth.uid() = follower_id'ye izin veriyor.
-- Takip isteği onaylanırken ise following_id olan kullanıcı (kabul eden) insert yapıyor.

create policy "Hedef kullanıcı takip isteğini onaylayabilir" on public.follows for insert with check (
  auth.uid() = following_id
  and exists (
    select 1 from public.follow_requests
    where requester_id = follower_id
      and target_id    = auth.uid()
  )
);
