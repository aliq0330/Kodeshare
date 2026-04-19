-- Admin RLS politikaları
-- Admin UUID: cea14a01-7d94-4b32-8d91-578f49390515

-- Admin herhangi bir gönderiyi silebilir
create policy "Admin gönderileri silebilir"
on public.posts for delete
using (auth.uid() = 'cea14a01-7d94-4b32-8d91-578f49390515');

-- Admin herhangi bir yorumu silebilir
create policy "Admin yorumları silebilir"
on public.comments for delete
using (auth.uid() = 'cea14a01-7d94-4b32-8d91-578f49390515');

-- Admin tüm bildirimleri görebilir
create policy "Admin tüm bildirimleri görebilir"
on public.notifications for select
using (auth.uid() = 'cea14a01-7d94-4b32-8d91-578f49390515');
