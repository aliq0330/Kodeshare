import { oneDark } from '@codemirror/theme-one-dark'
import { dracula } from '@uiw/codemirror-theme-dracula'
import { githubDark, githubLight } from '@uiw/codemirror-theme-github'
import { nord } from '@uiw/codemirror-theme-nord'
import { tokyoNight } from '@uiw/codemirror-theme-tokyo-night'
import { solarizedDark, solarizedLight } from '@uiw/codemirror-theme-solarized'
import { materialDark } from '@uiw/codemirror-theme-material'
import { monokai } from '@uiw/codemirror-theme-monokai'
import type { Extension } from '@codemirror/state'

export type EditorThemeId =
  | 'one-dark'
  | 'dracula'
  | 'github-dark'
  | 'github-light'
  | 'nord'
  | 'tokyo-night'
  | 'solarized-dark'
  | 'solarized-light'
  | 'material-dark'
  | 'monokai'

export interface PreviewColors {
  gutter:     string
  keyword:    string
  string:     string
  comment:    string
  fn:         string
  text:       string
  activeLine: string
}

export interface UiColors {
  pageBg:    string  // editor page / main area background
  sidebarBg: string  // projects sidebar background
  panelBg:   string  // top panel bar + tab bar background
  raisedBg:  string  // hover / selected states
  border:    string  // all border colors
  text:      string  // primary text
  textMuted: string  // secondary / muted text
  textFaint: string  // very dim text (line numbers, timestamps)
}

export interface ThemeConfig {
  id:        EditorThemeId
  name:      string
  dark:      boolean
  bg:        string
  extension: Extension | null
  preview:   PreviewColors
  ui:        UiColors
}

export const EDITOR_THEMES: ThemeConfig[] = [
  {
    id: 'one-dark', name: 'One Dark', dark: true, bg: '#282c34',
    extension: oneDark,
    preview: { gutter: '#495162', keyword: '#c678dd', string: '#98c379', comment: '#5c6370', fn: '#61afef', text: '#abb2bf', activeLine: '#2c313c' },
    ui: { pageBg: '#21252b', sidebarBg: '#1b1e23', panelBg: '#1b1e23', raisedBg: '#2c313c', border: '#3a3f4b', text: '#abb2bf', textMuted: '#636d83', textFaint: '#3e4451' },
  },
  {
    id: 'dracula', name: 'Dracula', dark: true, bg: '#282a36',
    extension: dracula,
    preview: { gutter: '#6272a4', keyword: '#ff79c6', string: '#f1fa8c', comment: '#6272a4', fn: '#50fa7b', text: '#f8f8f2', activeLine: '#44475a' },
    ui: { pageBg: '#282a36', sidebarBg: '#21222c', panelBg: '#21222c', raisedBg: '#44475a', border: '#44475a', text: '#f8f8f2', textMuted: '#6272a4', textFaint: '#44475a' },
  },
  {
    id: 'github-dark', name: 'GitHub Dark', dark: true, bg: '#0d1117',
    extension: githubDark,
    preview: { gutter: '#6e7681', keyword: '#ff7b72', string: '#a5d6ff', comment: '#8b949e', fn: '#d2a8ff', text: '#c9d1d9', activeLine: '#161b22' },
    ui: { pageBg: '#0d1117', sidebarBg: '#010409', panelBg: '#010409', raisedBg: '#161b22', border: '#30363d', text: '#c9d1d9', textMuted: '#8b949e', textFaint: '#3d444d' },
  },
  {
    id: 'github-light', name: 'GitHub Light', dark: false, bg: '#ffffff',
    extension: githubLight,
    preview: { gutter: '#8c959f', keyword: '#cf222e', string: '#0a3069', comment: '#6e7781', fn: '#8250df', text: '#24292f', activeLine: '#f6f8fa' },
    ui: { pageBg: '#ffffff', sidebarBg: '#f6f8fa', panelBg: '#f6f8fa', raisedBg: '#eaeef2', border: '#d0d7de', text: '#24292f', textMuted: '#57606a', textFaint: '#8c959f' },
  },
  {
    id: 'nord', name: 'Nord', dark: true, bg: '#2e3440',
    extension: nord,
    preview: { gutter: '#4c566a', keyword: '#81a1c1', string: '#a3be8c', comment: '#616e88', fn: '#88c0d0', text: '#d8dee9', activeLine: '#3b4252' },
    ui: { pageBg: '#2e3440', sidebarBg: '#242932', panelBg: '#1f232d', raisedBg: '#3b4252', border: '#434c5e', text: '#d8dee9', textMuted: '#616e88', textFaint: '#4c566a' },
  },
  {
    id: 'tokyo-night', name: 'Tokyo Night', dark: true, bg: '#1a1b26',
    extension: tokyoNight,
    preview: { gutter: '#3b4261', keyword: '#bb9af7', string: '#9ece6a', comment: '#565f89', fn: '#7aa2f7', text: '#a9b1d6', activeLine: '#1f2335' },
    ui: { pageBg: '#1a1b26', sidebarBg: '#13141f', panelBg: '#0f1019', raisedBg: '#1f2335', border: '#292e42', text: '#a9b1d6', textMuted: '#565f89', textFaint: '#3b4261' },
  },
  {
    id: 'solarized-dark', name: 'Solarized Dark', dark: true, bg: '#002b36',
    extension: solarizedDark,
    preview: { gutter: '#073642', keyword: '#859900', string: '#2aa198', comment: '#586e75', fn: '#268bd2', text: '#839496', activeLine: '#073642' },
    ui: { pageBg: '#002b36', sidebarBg: '#00212b', panelBg: '#001c24', raisedBg: '#073642', border: '#0a4454', text: '#839496', textMuted: '#586e75', textFaint: '#073642' },
  },
  {
    id: 'solarized-light', name: 'Solarized Light', dark: false, bg: '#fdf6e3',
    extension: solarizedLight,
    preview: { gutter: '#93a1a1', keyword: '#859900', string: '#2aa198', comment: '#93a1a1', fn: '#268bd2', text: '#657b83', activeLine: '#eee8d5' },
    ui: { pageBg: '#fdf6e3', sidebarBg: '#eee8d5', panelBg: '#e8e2d0', raisedBg: '#ddd6c2', border: '#cdc7b5', text: '#657b83', textMuted: '#93a1a1', textFaint: '#b2bbb6' },
  },
  {
    id: 'material-dark', name: 'Material Dark', dark: true, bg: '#263238',
    extension: materialDark,
    preview: { gutter: '#546e7a', keyword: '#c792ea', string: '#c3e88d', comment: '#546e7a', fn: '#82aaff', text: '#eeffff', activeLine: '#2c3b41' },
    ui: { pageBg: '#263238', sidebarBg: '#1e292f', panelBg: '#1a2328', raisedBg: '#2e3c43', border: '#37474f', text: '#eeffff', textMuted: '#546e7a', textFaint: '#37474f' },
  },
  {
    id: 'monokai', name: 'Monokai', dark: true, bg: '#272822',
    extension: monokai,
    preview: { gutter: '#75715e', keyword: '#f92672', string: '#e6db74', comment: '#75715e', fn: '#a6e22e', text: '#f8f8f2', activeLine: '#3e3d32' },
    ui: { pageBg: '#272822', sidebarBg: '#1e1f1a', panelBg: '#1a1b16', raisedBg: '#3e3d32', border: '#49483e', text: '#f8f8f2', textMuted: '#75715e', textFaint: '#49483e' },
  },
]

export const DEFAULT_THEME_ID: EditorThemeId = 'one-dark'

export function getThemeConfig(id: string): ThemeConfig {
  return EDITOR_THEMES.find((t) => t.id === id) ?? EDITOR_THEMES[0]
}
