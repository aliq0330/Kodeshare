-- Admin kullanıcı yönetimi için ek RLS politikaları
-- Supabase SQL Editor'da çalıştır

-- Admin herhangi bir koleksiyonu silebilir
create policy "Admin koleksiyonları silebilir"
on public.collections for delete
using (auth.uid() = 'cea14a01-7d94-4b32-8d91-578f49390515');

-- Admin herhangi bir beğeniyi silebilir
create policy "Admin beğenileri silebilir"
on public.post_likes for delete
using (auth.uid() = 'cea14a01-7d94-4b32-8d91-578f49390515');

-- Admin herhangi bir kaydedileni silebilir
create policy "Admin kaydedilenleri silebilir"
on public.post_saves for delete
using (auth.uid() = 'cea14a01-7d94-4b32-8d91-578f49390515');

-- Admin herhangi bir mesajı silebilir
create policy "Admin mesajları silebilir"
on public.messages for delete
using (auth.uid() = 'cea14a01-7d94-4b32-8d91-578f49390515');

-- Admin herhangi bir takibi silebilir
create policy "Admin takipleri silebilir"
on public.follows for delete
using (auth.uid() = 'cea14a01-7d94-4b32-8d91-578f49390515');

-- Admin tüm profilleri silebilir (hesap silme)
create policy "Admin profilleri silebilir"
on public.profiles for delete
using (auth.uid() = 'cea14a01-7d94-4b32-8d91-578f49390515');

-- Kullanıcı hesabını tamamen silen RPC (auth.users dahil)
create or replace function admin_delete_user(target_user_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  if auth.uid() != 'cea14a01-7d94-4b32-8d91-578f49390515' then
    raise exception 'Yetkisiz erişim';
  end if;
  delete from auth.users where id = target_user_id;
end;
$$;
