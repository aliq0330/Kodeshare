-- ============================================================
-- POST DRAFTS — Bulut taslak kaydetme
-- ============================================================

create table if not exists public.post_drafts (
  id          uuid primary key default uuid_generate_v4(),
  author_id   uuid not null references public.profiles(id) on delete cascade,
  description text,
  tags        text,
  blocks      jsonb default '[]',
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create trigger post_drafts_updated_at before update on public.post_drafts
  for each row execute procedure update_updated_at();

-- RLS
alter table public.post_drafts enable row level security;

create policy "taslak_sahibi_gorebilir" on public.post_drafts
  for select using (auth.uid() = author_id);

create policy "taslak_sahibi_olusturabilir" on public.post_drafts
  for insert with check (auth.uid() = author_id);

create policy "taslak_sahibi_guncelleyebilir" on public.post_drafts
  for update using (auth.uid() = author_id);

create policy "taslak_sahibi_silebilir" on public.post_drafts
  for delete using (auth.uid() = author_id);
