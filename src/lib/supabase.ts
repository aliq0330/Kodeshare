import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseKey) {
  throw new Error('VITE_SUPABASE_URL ve VITE_SUPABASE_ANON_KEY ortam değişkenleri gereklidir.')
}

function fetchWithTimeout(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  // Çağıran kod (örn. postStore) zaten kendi AbortController'ını
  // verebiliyorsa (sekme değişimi vs.) onu da dinleyelim.
  const controller = new AbortController()
  const tid = setTimeout(() => controller.abort(), 30_000)
  const upstream = init?.signal
  if (upstream) {
    if (upstream.aborted) controller.abort()
    else upstream.addEventListener('abort', () => controller.abort(), { once: true })
  }
  return fetch(input, { ...init, signal: controller.signal }).finally(() => clearTimeout(tid))
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabase = createClient<any>(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: { eventsPerSecond: 10 },
  },
  global: {
    fetch: fetchWithTimeout,
  },
})
