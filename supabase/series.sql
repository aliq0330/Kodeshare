-- ============================================================
-- SERİLER — Gönderi dizisi oluşturma
-- ============================================================

create table if not exists public.series (
  id          uuid primary key default uuid_generate_v4(),
  author_id   uuid not null references public.profiles(id) on delete cascade,
  title       text not null,
  description text,
  cover_image text,
  posts_count int default 0,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create trigger series_updated_at before update on public.series
  for each row execute procedure update_updated_at();

create table if not exists public.series_posts (
  series_id  uuid not null references public.series(id) on delete cascade,
  post_id    uuid not null references public.posts(id) on delete cascade,
  position   int not null default 0,
  created_at timestamptz default now(),
  primary key (series_id, post_id)
);

-- Seri gönderi sayacı
create or replace function update_series_posts_count()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    update public.series set posts_count = posts_count + 1 where id = new.series_id;
  elsif tg_op = 'DELETE' then
    update public.series set posts_count = greatest(posts_count - 1, 0) where id = old.series_id;
  end if;
  return null;
end;
$$;

create trigger series_posts_count after insert or delete on public.series_posts
  for each row execute procedure update_series_posts_count();

-- RLS — series
alter table public.series enable row level security;

create policy "herkes_seri_gorebilir" on public.series
  for select using (true);

create policy "seri_sahibi_olusturabilir" on public.series
  for insert with check (auth.uid() = author_id);

create policy "seri_sahibi_guncelleyebilir" on public.series
  for update using (auth.uid() = author_id);

create policy "seri_sahibi_silebilir" on public.series
  for delete using (auth.uid() = author_id);

-- RLS — series_posts
alter table public.series_posts enable row level security;

create policy "herkes_seri_posts_gorebilir" on public.series_posts
  for select using (true);

create policy "seri_sahibi_post_ekleyebilir" on public.series_posts
  for insert with check (
    auth.uid() = (select author_id from public.series where id = series_id)
  );

create policy "seri_sahibi_post_kaldirabilir" on public.series_posts
  for delete using (
    auth.uid() = (select author_id from public.series where id = series_id)
  );

create policy "seri_sahibi_siralama_guncelleyebilir" on public.series_posts
  for update using (
    auth.uid() = (select author_id from public.series where id = series_id)
  );
