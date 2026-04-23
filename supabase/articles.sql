-- ============================================================
-- ARTICLES TABLE
-- Her makale Supabase'de saklanır, yayınlanınca public link alır
-- ============================================================

create table public.articles (
  id           uuid default gen_random_uuid() primary key,
  author_id    uuid references public.profiles(id) on delete cascade not null,
  title        text not null default 'Başlıksız Makale',
  subtitle     text default '',
  cover_image  text,
  blocks       jsonb not null default '[]',
  is_published boolean default false,
  views_count  integer default 0,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- updated_at otomatik güncelleme
create trigger update_articles_updated_at
  before update on articles
  for each row execute function update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.articles enable row level security;

-- Yayınlanan makaleler herkese açık
create policy "Published articles are viewable by everyone"
  on articles for select
  using (is_published = true);

-- Yazar kendi tüm makalelerini görebilir (taslak dahil)
create policy "Authors can view their own articles"
  on articles for select
  using (auth.uid() = author_id);

-- Oturum açmış kullanıcılar makale oluşturabilir
create policy "Authors can insert articles"
  on articles for insert
  with check (auth.uid() = author_id);

-- Yazar kendi makalelerini güncelleyebilir
create policy "Authors can update their articles"
  on articles for update
  using (auth.uid() = author_id);

-- Yazar kendi makalelerini silebilir
create policy "Authors can delete their articles"
  on articles for delete
  using (auth.uid() = author_id);
