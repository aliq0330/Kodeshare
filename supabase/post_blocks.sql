-- Block-based post system migration
-- Run in Supabase SQL Editor

-- === 1. Create post_blocks table ===
create table if not exists public.post_blocks (
  id         uuid        primary key default gen_random_uuid(),
  post_id    uuid        not null references public.posts(id) on delete cascade,
  type       text        not null check (type in ('snippet','project','image','link','video','article')),
  position   int         not null default 0,
  data       jsonb       not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_post_blocks_post_id_pos
  on public.post_blocks(post_id, position);

alter table public.post_blocks enable row level security;

create policy "post_blocks_public_read" on public.post_blocks
  for select using (true);

create policy "post_blocks_author_insert" on public.post_blocks
  for insert with check (
    auth.uid() = (select author_id from public.posts where id = post_id)
  );

create policy "post_blocks_author_update" on public.post_blocks
  for update using (
    auth.uid() = (select author_id from public.posts where id = post_id)
  );

create policy "post_blocks_author_delete" on public.post_blocks
  for delete using (
    auth.uid() = (select author_id from public.posts where id = post_id)
  );

-- === 2. Migrate snippet / gonderi post_files → snippet blocks ===
insert into public.post_blocks (post_id, type, position, data)
select
  pf.post_id,
  'snippet',
  pf."order",
  jsonb_build_object(
    'name',     pf.name,
    'language', pf.language,
    'content',  pf.content
  )
from public.post_files pf
join public.posts p on p.id = pf.post_id
where p.type in ('snippet', 'gonderi')
  and p.is_published = true;

-- === 3. Migrate published project post_files → one project block each ===
insert into public.post_blocks (post_id, type, position, data)
select
  p.id,
  'project',
  0,
  jsonb_build_object(
    'files',
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'name',     f.name,
            'language', f.language,
            'content',  f.content
          ) order by f."order"
        )
        from public.post_files f
        where f.post_id = p.id
      ),
      '[]'::jsonb
    )
  )
from public.posts p
where p.type = 'project'
  and p.is_published = true;

-- === 4. Drop old type constraint ===
alter table public.posts drop constraint if exists posts_type_check;

-- === 5. Convert old published post types → 'post' ===
update public.posts
set type = 'post'
where type in ('snippet', 'article', 'gonderi')
  and is_published = true;

update public.posts
set type = 'post'
where type = 'project'
  and is_published = true;

-- === 6. Add new type constraint ===
alter table public.posts
  add constraint posts_type_check
  check (type in ('post', 'repost', 'project'));

-- === 7. Update post_edits: replace original_files with original_blocks ===
alter table public.post_edits
  add column if not exists original_blocks jsonb default '[]'::jsonb;

alter table public.post_edits
  drop column if exists original_files;
