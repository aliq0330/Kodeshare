import { supabase } from '@/lib/supabase'
import { notificationPrefsService } from './notificationPrefsService'

type NotificationType = 'like' | 'comment' | 'reply' | 'follow' | 'mention' | 'repost' | 'message' | 'collection_save'

const TYPE_TO_PREF: Record<NotificationType, Parameters<typeof notificationPrefsService.shouldNotify>[1]> = {
  like:            'likes',
  comment:         'comments',
  reply:           'replies',
  follow:          'follows',
  mention:         'mentions',
  repost:          'reposts',
  message:         'messages',
  collection_save: 'likes',
}

interface NotifyPayload {
  userId:     string
  actorId:    string
  type:       NotificationType
  message:    string
  postId?:    string | null
  commentId?: string | null
}

export async function notify({ userId, actorId, type, message, postId, commentId }: NotifyPayload): Promise<void> {
  if (userId === actorId) return
  try {
    const ok = await notificationPrefsService.shouldNotify(userId, TYPE_TO_PREF[type])
    if (!ok) return
    const { error } = await supabase.from('notifications').insert({
      user_id:    userId,
      actor_id:   actorId,
      type,
      post_id:    postId    ?? null,
      comment_id: commentId ?? null,
      message,
    })
    if (error) console.error('[notify] insert failed', type, error)
  } catch (err) {
    console.error('[notify] threw', type, err)
  }
}

const MENTION_RE = /@([a-zA-Z0-9_]{2,30})/g

export function extractMentions(text: string | null | undefined): string[] {
  if (!text) return []
  const set = new Set<string>()
  for (const m of text.matchAll(MENTION_RE)) set.add(m[1].toLowerCase())
  return Array.from(set)
}

export async function notifyMentions(params: {
  text:     string | null | undefined
  actorId:  string
  message:  string
  postId?:  string | null
  commentId?: string | null
  excludeUserIds?: string[]
}): Promise<void> {
  const usernames = extractMentions(params.text)
  if (usernames.length === 0) return
  const orExpr = usernames.map((u) => `username.ilike.${u}`).join(',')
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username')
    .or(orExpr)
  if (error) {
    console.error('[notifyMentions] profile lookup failed', error)
    return
  }
  const exclude = new Set(params.excludeUserIds ?? [])
  exclude.add(params.actorId)
  for (const row of (data ?? []) as { id: string; username: string }[]) {
    if (exclude.has(row.id)) continue
    await notify({
      userId:    row.id,
      actorId:   params.actorId,
      type:      'mention',
      message:   params.message,
      postId:    params.postId,
      commentId: params.commentId,
    })
  }
}
