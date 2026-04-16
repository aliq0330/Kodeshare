export const LANGUAGES = ['html', 'css', 'javascript', 'typescript', 'react', 'vue', 'other'] as const

export const LANGUAGE_COLORS: Record<string, string> = {
  html:       '#e34c26',
  css:        '#264de4',
  javascript: '#f7df1e',
  typescript: '#3178c6',
  react:      '#61dafb',
  vue:        '#42b883',
  other:      '#8b9ab5',
}

export const LANGUAGE_ICONS: Record<string, string> = {
  html:       'html',
  css:        'css',
  javascript: 'js',
  typescript: 'ts',
  react:      'tsx',
  vue:        'vue',
  other:      'txt',
}

export const FEED_TABS = [
  { id: 'following', label: 'Takip' },
  { id: 'trending',  label: 'Trend' },
  { id: 'latest',    label: 'Yeni' },
] as const

export const EXPLORE_CATEGORIES = [
  { id: 'all',        label: 'Tümü' },
  { id: 'react',      label: 'React' },
  { id: 'html',       label: 'HTML' },
  { id: 'css',        label: 'CSS' },
  { id: 'javascript', label: 'JavaScript' },
  { id: 'typescript', label: 'TypeScript' },
  { id: 'animation',  label: 'Animasyon' },
  { id: 'ui',         label: 'UI / UX' },
] as const

export const POST_TYPES = [
  { id: 'snippet', label: 'Snippet' },
  { id: 'project', label: 'Proje' },
  { id: 'article', label: 'Makale' },
] as const
