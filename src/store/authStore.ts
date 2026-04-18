import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '@/lib/supabase'
import type { User } from '@/types'

interface RegisterPayload {
  displayName: string
  username: string
  email: string
  password: string
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login:    (email: string, password: string) => Promise<void>
  register: (payload: RegisterPayload) => Promise<void>
  logout:   () => Promise<void>
  setUser:  (user: User | null) => void
  init:     () => Promise<void>
}

let authListenerRegistered = false

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,

      init: async () => {
        set({ isLoading: true })
        try {
          const sessionResult = await Promise.race([
            supabase.auth.getSession(),
            new Promise<never>((_, reject) => setTimeout(() => reject(new Error('auth timeout')), 8_000)),
          ])
          const session = sessionResult.data.session
          if (session?.user) {
            const profile = await fetchProfile(session.user.id)
            set({ user: profile, isAuthenticated: !!profile })
          } else {
            set({ user: null, isAuthenticated: false })
          }
        } catch {
          // timeout or network error — keep persisted auth state, just unblock UI
        } finally {
          set({ isLoading: false })
        }

        if (!authListenerRegistered) {
          authListenerRegistered = true
          // ÖNEMLİ: onAuthStateChange callback'inin İÇİNDE `await supabase.from(...)`
          // yapmak client'ı kilitler (deadlock) ve sekme değişimi sonrası tüm
          // isteklerin asılı kalmasına yol açar. Bu yüzden async işi callback'in
          // dışına, mikrotask kuyruğuna ertelemek zorundayız.
          supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
              const userId = session.user.id
              setTimeout(async () => {
                const profile = await fetchProfile(userId)
                set({ user: profile, isAuthenticated: !!profile })
              }, 0)
            } else {
              set({ user: null, isAuthenticated: false })
            }
          })
        }
      },

      login: async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw new Error(error.message)
      },

      register: async ({ displayName, username, email, password }) => {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { display_name: displayName, username } },
        })
        if (error) throw new Error(error.message)
      },

      logout: async () => {
        await supabase.auth.signOut()
        set({ user: null, isAuthenticated: false })
      },

      setUser: (user) => set({ user, isAuthenticated: !!user }),
    }),
    {
      name: 'auth',
      partialize: (s) => ({ user: s.user, isAuthenticated: s.isAuthenticated }),
    },
  ),
)

async function fetchProfile(userId: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  if (error || !data) return null
  return mapProfile(data)
}

export function mapProfile(p: Record<string, unknown>): User {
  return {
    id:             p.id as string,
    username:       p.username as string,
    displayName:    p.display_name as string,
    email:          '',
    avatarUrl:      p.avatar_url as string | null,
    coverUrl:       p.cover_url as string | null,
    bio:            p.bio as string | null,
    location:       p.location as string | null,
    website:        p.website as string | null,
    githubUrl:      p.github_url as string | null,
    twitterUrl:     p.twitter_url as string | null,
    followersCount: p.followers_count as number,
    followingCount: p.following_count as number,
    postsCount:     p.posts_count as number,
    isVerified:     p.is_verified as boolean,
    isOnline:       p.is_online as boolean,
    lastSeenAt:     p.last_seen_at as string | null,
    createdAt:      p.created_at as string,
    isPublic:       (p.is_public   as boolean) ?? true,
    showLikes:      (p.show_likes  as boolean) ?? true,
    showOnline:     (p.show_online as boolean) ?? true,
    searchable:     (p.searchable  as boolean) ?? false,
  }
}
