import type { EditorLanguage } from '@/types'

const EXT_MAP: Record<string, EditorLanguage> = {
  html:  'html',
  htm:   'html',
  css:   'css',
  js:    'javascript',
  mjs:   'javascript',
  ts:    'typescript',
  tsx:   'typescript',
  jsx:   'javascript',
  vue:   'html',
}

export function languageFromFilename(name: string): EditorLanguage {
  const ext = name.split('.').pop()?.toLowerCase() ?? ''
  return EXT_MAP[ext] ?? 'javascript'
}

export function defaultContentForLanguage(lang: EditorLanguage): string {
  const defaults: Record<EditorLanguage, string> = {
    html: '<!doctype html>\n<html lang="tr">\n<head>\n  <meta charset="UTF-8" />\n  <title>Document</title>\n</head>\n<body>\n  \n</body>\n</html>',
    css:  '/* Stiller */\n',
    javascript: '// JavaScript\n',
    typescript: '// TypeScript\n',
  }
  return defaults[lang] ?? ''
}
