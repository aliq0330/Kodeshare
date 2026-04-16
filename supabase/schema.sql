-- ============================================================
-- KODESHARE — Supabase Database Schema
-- Supabase SQL Editor'a kopyalayıp çalıştır
-- ============================================================

-- Extensions
create extension if not exists "uuid-ossp";

-- ============================================================
-- 1. PROFILES (auth.users'ı genişletir)
-- ============================================================
create table public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  username      text unique not null,
  display_name  text not null,
  avatar_url    text,
  cover_url     text,
  bio           text,
  location      text,
  website       text,
  github_url    text,
  twitter_url   text,
  is_verified   boolean default false,
  is_online     boolean default false,
  last_seen_at  timestamptz,
  followers_count int default 0,
  following_count int default 0,
  posts_count     int default 0,
  created_at    timestamptz default now()
);

-- Yeni kullanıcı kaydolunca otomatik profil oluştur
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, username, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- 2. POSTS
-- ============================================================
create table public.posts (
  id              uuid primary key default uuid_generate_v4(),
  author_id       uuid not null references public.profiles(id) on delete cascade,
  type            text not null check (type in ('snippet','project','article','repost')),
  title           text not null,
  description     text,
  tags            text[] default '{}',
  preview_image_url text,
  live_demo_url   text,
  reposted_from   uuid references public.posts(id) on delete set null,
  likes_count     int default 0,
  comments_count  int default 0,
  shares_count    int default 0,
  saves_count     int default 0,
  views_count     int default 0,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- Post dosyaları
create table public.post_files (
  id          uuid primary key default uuid_generate_v4(),
  post_id     uuid not null references public.posts(id) on delete cascade,
  name        text not null,
  language    text not null,
  content     text not null default '',
  "order"     int default 0
);

-- Post güncelleme trigger
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;
create trigger posts_updated_at before update on public.posts
  for each row execute procedure update_updated_at();

-- ============================================================
-- 3. BEĞENİ & KAYDETME
-- ============================================================
create table public.post_likes (
  user_id    uuid references public.profiles(id) on delete cascade,
  post_id    uuid references public.posts(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, post_id)
);

create table public.post_saves (
  user_id    uuid references public.profiles(id) on delete cascade,
  post_id    uuid references public.posts(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, post_id)
);

-- Beğeni sayacını güncelle
create or replace function update_likes_count()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    update public.posts set likes_count = likes_count + 1 where id = new.post_id;
  elsif tg_op = 'DELETE' then
    update public.posts set likes_count = greatest(likes_count - 1, 0) where id = old.post_id;
  end if;
  return null;
end;
$$;
create trigger post_likes_count after insert or delete on public.post_likes
  for each row execute procedure update_likes_count();

-- Kaydetme sayacını güncelle
create or replace function update_saves_count()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    update public.posts set saves_count = saves_count + 1 where id = new.post_id;
  elsif tg_op = 'DELETE' then
    update public.posts set saves_count = greatest(saves_count - 1, 0) where id = old.post_id;
  end if;
  return null;
end;
$$;
create trigger post_saves_count after insert or delete on public.post_saves
  for each row execute procedure update_saves_count();

-- ============================================================
-- 4. YORUMLAR
-- ============================================================
create table public.comments (
  id          uuid primary key default uuid_generate_v4(),
  post_id     uuid not null references public.posts(id) on delete cascade,
  author_id   uuid not null references public.profiles(id) on delete cascade,
  content     text not null,
  parent_id   uuid references public.comments(id) on delete cascade,
  likes_count int default 0,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create table public.comment_likes (
  user_id    uuid references public.profiles(id) on delete cascade,
  comment_id uuid references public.comments(id) on delete cascade,
  primary key (user_id, comment_id)
);

-- Yorum sayacını güncelle
create or replace function update_comments_count()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    update public.posts set comments_count = comments_count + 1 where id = new.post_id;
  elsif tg_op = 'DELETE' then
    update public.posts set comments_count = greatest(comments_count - 1, 0) where id = old.post_id;
  end if;
  return null;
end;
$$;
create trigger comments_count after insert or delete on public.comments
  for each row execute procedure update_comments_count();

-- ============================================================
-- 5. TAKİP SİSTEMİ
-- ============================================================
create table public.follows (
  follower_id  uuid references public.profiles(id) on delete cascade,
  following_id uuid references public.profiles(id) on delete cascade,
  created_at   timestamptz default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

-- Takipçi/takip sayaçlarını güncelle
create or replace function update_follow_counts()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    update public.profiles set following_count = following_count + 1 where id = new.follower_id;
    update public.profiles set followers_count = followers_count + 1 where id = new.following_id;
  elsif tg_op = 'DELETE' then
    update public.profiles set following_count = greatest(following_count - 1, 0) where id = old.follower_id;
    update public.profiles set followers_count = greatest(followers_count - 1, 0) where id = old.following_id;
  end if;
  return null;
end;
$$;
create trigger follows_count after insert or delete on public.follows
  for each row execute procedure update_follow_counts();

-- ============================================================
-- 6. KOLEKSİYONLAR
-- ============================================================
create table public.collections (
  id          uuid primary key default uuid_generate_v4(),
  owner_id    uuid not null references public.profiles(id) on delete cascade,
  name        text not null,
  description text,
  cover_url   text,
  visibility  text not null default 'public' check (visibility in ('public','private')),
  posts_count int default 0,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create trigger collections_updated_at before update on public.collections
  for each row execute procedure update_updated_at();

create table public.collection_posts (
  collection_id uuid references public.collections(id) on delete cascade,
  post_id       uuid references public.posts(id) on delete cascade,
  created_at    timestamptz default now(),
  primary key (collection_id, post_id)
);

-- Koleksiyon gönderi sayacı
create or replace function update_collection_posts_count()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    update public.collections set posts_count = posts_count + 1 where id = new.collection_id;
  elsif tg_op = 'DELETE' then
    update public.collections set posts_count = greatest(posts_count - 1, 0) where id = old.collection_id;
  end if;
  return null;
end;
$$;
create trigger collection_posts_count after insert or delete on public.collection_posts
  for each row execute procedure update_collection_posts_count();

-- ============================================================
-- 7. MESAJLAŞMA
-- ============================================================
create table public.conversations (
  id         uuid primary key default uuid_generate_v4(),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.conversation_participants (
  conversation_id uuid references public.conversations(id) on delete cascade,
  user_id         uuid references public.profiles(id) on delete cascade,
  primary key (conversation_id, user_id)
);

create table public.messages (
  id              uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id       uuid not null references public.profiles(id) on delete cascade,
  content         text not null,
  status          text default 'sent' check (status in ('sent','delivered','read')),
  created_at      timestamptz default now()
);

-- Konuşma updated_at güncelle
create or replace function update_conversation_on_message()
returns trigger language plpgsql as $$
begin
  update public.conversations set updated_at = now() where id = new.conversation_id;
  return new;
end;
$$;
create trigger message_updates_conversation after insert on public.messages
  for each row execute procedure update_conversation_on_message();

-- ============================================================
-- 8. BİLDİRİMLER
-- ============================================================
create table public.notifications (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  actor_id   uuid not null references public.profiles(id) on delete cascade,
  type       text not null check (type in ('like','comment','reply','follow','mention','repost','message','collection_save')),
  post_id    uuid references public.posts(id) on delete cascade,
  comment_id uuid references public.comments(id) on delete cascade,
  message    text not null,
  is_read    boolean default false,
  created_at timestamptz default now()
);

-- ============================================================
-- 9. ROW LEVEL SECURITY (RLS)
-- ============================================================
alter table public.profiles               enable row level security;
alter table public.posts                  enable row level security;
alter table public.post_files             enable row level security;
alter table public.post_likes             enable row level security;
alter table public.post_saves             enable row level security;
alter table public.comments               enable row level security;
alter table public.comment_likes          enable row level security;
alter table public.follows                enable row level security;
alter table public.collections            enable row level security;
alter table public.collection_posts       enable row level security;
alter table public.conversations          enable row level security;
alter table public.conversation_participants enable row level security;
alter table public.messages               enable row level security;
alter table public.notifications          enable row level security;

-- Profiles
create policy "Herkes profilleri görebilir"       on public.profiles for select using (true);
create policy "Kullanıcı kendi profilini günceller" on public.profiles for update using (auth.uid() = id);

-- Posts
create policy "Herkes gönderileri görebilir"   on public.posts for select using (true);
create policy "Giriş yapanlar gönderi paylaşabilir" on public.posts for insert with check (auth.uid() = author_id);
create policy "Yazar gönderisini düzenleyebilir"   on public.posts for update using (auth.uid() = author_id);
create policy "Yazar gönderisini silebilir"        on public.posts for delete using (auth.uid() = author_id);

-- Post files
create policy "Herkes dosyaları görebilir"    on public.post_files for select using (true);
create policy "Yazar dosya ekleyebilir"        on public.post_files for insert with check (
  auth.uid() = (select author_id from public.posts where id = post_id)
);
create policy "Yazar dosyayı güncelleyebilir"  on public.post_files for update using (
  auth.uid() = (select author_id from public.posts where id = post_id)
);
create policy "Yazar dosyayı silebilir"        on public.post_files for delete using (
  auth.uid() = (select author_id from public.posts where id = post_id)
);

-- Likes & Saves
create policy "Herkes beğenileri görebilir"    on public.post_likes for select using (true);
create policy "Giriş yapanlar beğenebilir"     on public.post_likes for insert with check (auth.uid() = user_id);
create policy "Kullanıcı beğenisini kaldırabilir" on public.post_likes for delete using (auth.uid() = user_id);

create policy "Herkes kaydetmeleri görebilir"  on public.post_saves for select using (true);
create policy "Giriş yapanlar kaydedebilir"    on public.post_saves for insert with check (auth.uid() = user_id);
create policy "Kullanıcı kaydını kaldırabilir" on public.post_saves for delete using (auth.uid() = user_id);

-- Comments
create policy "Herkes yorumları görebilir"     on public.comments for select using (true);
create policy "Giriş yapanlar yorum yapabilir" on public.comments for insert with check (auth.uid() = author_id);
create policy "Yazar yorumunu düzenleyebilir"  on public.comments for update using (auth.uid() = author_id);
create policy "Yazar yorumunu silebilir"       on public.comments for delete using (auth.uid() = author_id);

-- Follows
create policy "Herkes takipleri görebilir"     on public.follows for select using (true);
create policy "Giriş yapanlar takip edebilir"  on public.follows for insert with check (auth.uid() = follower_id);
create policy "Takibi bırakabilir"             on public.follows for delete using (auth.uid() = follower_id);

-- Collections
create policy "Herkese açık koleksiyonlar görünür" on public.collections for select
  using (visibility = 'public' or auth.uid() = owner_id);
create policy "Giriş yapanlar koleksiyon oluşturabilir" on public.collections for insert with check (auth.uid() = owner_id);
create policy "Sahip koleksiyonu güncelleyebilir"  on public.collections for update using (auth.uid() = owner_id);
create policy "Sahip koleksiyonu silebilir"        on public.collections for delete using (auth.uid() = owner_id);

create policy "Herkes koleksiyon gönderilerini görebilir" on public.collection_posts for select using (true);
create policy "Koleksiyon sahibi gönderi ekleyebilir" on public.collection_posts for insert with check (
  auth.uid() = (select owner_id from public.collections where id = collection_id)
);
create policy "Koleksiyon sahibi gönderi çıkarabilir" on public.collection_posts for delete using (
  auth.uid() = (select owner_id from public.collections where id = collection_id)
);

-- Messages
create policy "Katılımcılar konuşmayı görebilir" on public.conversations for select using (
  auth.uid() in (select user_id from public.conversation_participants where conversation_id = id)
);
create policy "Giriş yapanlar konuşma başlatabilir" on public.conversations for insert with check (auth.uid() is not null);

create policy "Katılımcılar üyeleri görebilir" on public.conversation_participants for select using (
  auth.uid() in (select user_id from public.conversation_participants where conversation_id = conversation_id)
);
create policy "Konuşma üyesi mesaj görebilir" on public.messages for select using (
  auth.uid() in (select user_id from public.conversation_participants where conversation_id = conversation_id)
);
create policy "Konuşma üyesi mesaj gönderebilir" on public.messages for insert with check (
  auth.uid() = sender_id and
  auth.uid() in (select user_id from public.conversation_participants where conversation_id = conversation_id)
);

-- Notifications
create policy "Kullanıcı kendi bildirimlerini görebilir" on public.notifications for select using (auth.uid() = user_id);
create policy "Sistem bildirim oluşturabilir" on public.notifications for insert with check (auth.uid() is not null);
create policy "Kullanıcı bildirimini güncelleyebilir" on public.notifications for update using (auth.uid() = user_id);

-- ============================================================
-- 10. REALTIME — hangi tablolar canlı dinlenebilir
-- ============================================================
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.post_likes;
alter publication supabase_realtime add table public.follows;
