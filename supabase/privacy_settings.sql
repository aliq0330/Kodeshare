-- Gizlilik ayarları kolonları profiles tablosuna eklenir
alter table public.profiles
  add column if not exists is_public    boolean not null default true,
  add column if not exists show_likes   boolean not null default true,
  add column if not exists show_online  boolean not null default true,
  add column if not exists searchable   boolean not null default false;

-- Mesaj durumu güncellemesi için UPDATE politikası (markRead için gerekli)
create policy "Konuşma üyesi mesajı güncelleyebilir" on public.messages
  for update using (
    auth.uid() in (
      select user_id from public.conversation_participants
      where conversation_id = messages.conversation_id
    )
  );
