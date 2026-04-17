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

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,

      init: async () => {
        set({ isLoading: true })
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          const profile = await fetchProfile(session.user.id)
          set({ user: profile, isAuthenticated: !!profile })
        } else {
          set({ user: null, isAuthenticated: false })
        }
        set({ isLoading: false })
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

// Auth state listener — set up once at module level
const { data: { subscription: _authSub } } = supabase.auth.onAuthStateChange(
  async (_event, session) => {
    if (session?.user) {
      const profile = await fetchProfile(session.user.id)
      useAuthStore.setState({ user: profile, isAuthenticated: !!profile })
    } else {
      useAuthStore.setState({ user: null, isAuthenticated: false })
    }
  }
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
  }
}
