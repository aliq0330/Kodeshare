-- Beğeniler
create table if not exists public.article_likes (
  article_id uuid references public.articles(id) on delete cascade not null,
  user_id    uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz default now(),
  primary key (article_id, user_id)
);
alter table public.article_likes enable row level security;
create policy "Herkes görebilir" on public.article_likes for select using (true);
create policy "Giriş yapanlar beğenebilir" on public.article_likes for insert with check (auth.uid() = user_id);
create policy "Kendi beğenisini kaldırabilir" on public.article_likes for delete using (auth.uid() = user_id);

-- Kaydedilenler
create table if not exists public.article_saves (
  article_id uuid references public.articles(id) on delete cascade not null,
  user_id    uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz default now(),
  primary key (article_id, user_id)
);
alter table public.article_saves enable row level security;
create policy "Herkes görebilir" on public.article_saves for select using (true);
create policy "Giriş yapanlar kaydedebilir" on public.article_saves for insert with check (auth.uid() = user_id);
create policy "Kendi kaydını kaldırabilir" on public.article_saves for delete using (auth.uid() = user_id);

-- Yorumlar
create table if not exists public.article_comments (
  id         uuid default gen_random_uuid() primary key,
  article_id uuid references public.articles(id) on delete cascade not null,
  author_id  uuid references public.profiles(id) on delete cascade not null,
  parent_id  uuid references public.article_comments(id) on delete cascade,
  content    text not null,
  created_at timestamptz default now()
);
alter table public.article_comments enable row level security;
create policy "Herkes görebilir" on public.article_comments for select using (true);
create policy "Giriş yapanlar yorum yapabilir" on public.article_comments for insert with check (auth.uid() = author_id);
create policy "Kendi yorumunu silebilir" on public.article_comments for delete using (auth.uid() = author_id);

-- Koleksiyon-Makale bağlantısı
create table if not exists public.collection_articles (
  collection_id uuid references public.collections(id) on delete cascade not null,
  article_id    uuid references public.articles(id)    on delete cascade not null,
  created_at    timestamptz default now(),
  primary key (collection_id, article_id)
);
alter table public.collection_articles enable row level security;
create policy "Herkes görebilir" on public.collection_articles for select using (true);
create policy "Koleksiyon sahibi yönetebilir" on public.collection_articles
  for all using (
    exists (
      select 1 from public.collections c
      where c.id = collection_id and c.owner_id = auth.uid()
    )
  );
