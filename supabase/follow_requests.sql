-- Takip istekleri tablosu (gizli hesaplar için)
create table public.follow_requests (
  id           uuid primary key default uuid_generate_v4(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  target_id    uuid not null references public.profiles(id) on delete cascade,
  created_at   timestamptz default now(),
  unique(requester_id, target_id)
);

alter table public.follow_requests enable row level security;

create policy "İlgili kullanıcılar istekleri görebilir" on public.follow_requests for select using (
  auth.uid() = requester_id or auth.uid() = target_id
);
create policy "Giriş yapanlar takip isteği gönderebilir" on public.follow_requests for insert with check (
  auth.uid() = requester_id
);
create policy "İlgili kullanıcılar isteği silebilir" on public.follow_requests for delete using (
  auth.uid() = requester_id or auth.uid() = target_id
);

-- Bildirim silme politikası
-- Kullanıcı kendi bildirimini, aktör ise kendi gönderdiği follow_request bildirimini silebilir
create policy "Kullanıcı bildirimini silebilir" on public.notifications for delete using (
  auth.uid() = user_id
  or (auth.uid() = actor_id and type = 'follow_request')
);

-- notifications type kısıtlamasına follow_request ekle
alter table public.notifications
  drop constraint if exists notifications_type_check;
alter table public.notifications
  add constraint notifications_type_check
  check (type in ('like','comment','reply','follow','mention','repost','message','collection_save','follow_request'));

-- DELETE olaylarında tüm alanların gelmesi için replica identity full
alter table public.notifications replica identity full;

-- Realtime
alter publication supabase_realtime add table public.follow_requests;
