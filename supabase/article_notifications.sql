-- notifications tablosuna article_id kolonu ekle
alter table public.notifications
  add column if not exists article_id uuid references public.articles(id) on delete cascade;

-- comment_id FK'sini kaldır — hem post hem article yorumlarını tutabilmesi için
-- (article_comments ID'leri public.comments tablosuna referans veremez)
alter table public.notifications
  drop constraint if exists notifications_comment_id_fkey;

-- follow_request tipini type check constraint'e ekle
alter table public.notifications
  drop constraint if exists notifications_type_check;

alter table public.notifications
  add constraint notifications_type_check
    check (type in ('like','comment','reply','follow','follow_request','mention','repost','message','collection_save'));
