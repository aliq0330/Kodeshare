import { supabase } from '@/lib/supabase'
import { DEFAULT_NOTIFICATION_PREFS, type NotificationPrefs } from '@/lib/database.types'

type PrefKey = keyof NotificationPrefs

function normalize(raw: unknown): NotificationPrefs {
  const p = (raw && typeof raw === 'object' ? raw : {}) as Partial<NotificationPrefs>
  return { ...DEFAULT_NOTIFICATION_PREFS, ...p }
}

export const notificationPrefsService = {
  async get(userId: string): Promise<NotificationPrefs> {
    const { data } = await supabase
      .from('profiles')
      .select('notification_prefs')
      .eq('id', userId)
      .single()
    return normalize((data as { notification_prefs?: unknown } | null)?.notification_prefs)
  },

  async getMine(): Promise<NotificationPrefs> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { ...DEFAULT_NOTIFICATION_PREFS }
    return this.get(user.id)
  },

  async update(patch: Partial<NotificationPrefs>): Promise<NotificationPrefs> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Giriş yapmalısın')
    const current = await this.get(user.id)
    const next = { ...current, ...patch }
    const { error } = await supabase
      .from('profiles')
      .update({ notification_prefs: next })
      .eq('id', user.id)
    if (error) throw new Error(error.message)
    return next
  },

  async shouldNotify(userId: string, key: PrefKey): Promise<boolean> {
    try {
      const prefs = await this.get(userId)
      return prefs[key] !== false
    } catch {
      return true
    }
  },
}
