-- Gönderi düzenleme geçmişi tablosu
-- Supabase SQL Editor'da çalıştır

-- posts tablosuna is_edited kolonu ekle
alter table public.posts add column if not exists is_edited boolean default false;

-- Düzenleme geçmişi tablosu (ilk düzenlemede orijinal içerik saklanır)
create table if not exists public.post_edits (
  id                   uuid primary key default uuid_generate_v4(),
  post_id              uuid not null references public.posts(id) on delete cascade,
  original_title       text not null,
  original_description text,
  original_tags        text[] default '{}',
  edited_at            timestamptz default now()
);

alter table public.post_edits enable row level security;

-- Herkes görebilir
create policy "Herkes düzenleme geçmişini görebilir"
on public.post_edits for select using (true);

-- Sadece yazar ekleyebilir
create policy "Yazar düzenleme kaydı oluşturabilir"
on public.post_edits for insert with check (
  auth.uid() = (select author_id from public.posts where id = post_id)
);
