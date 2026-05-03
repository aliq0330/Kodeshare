import { useState, useEffect } from 'react'
import { useEditorStore } from '@store/editorStore'

export function useIsLightMode(): boolean {
  const appTheme = useEditorStore((s) => s.appTheme)
  const [systemDark, setSystemDark] = useState(() =>
    window.matchMedia('(prefers-color-scheme: dark)').matches,
  )

  useEffect(() => {
    if (appTheme !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [appTheme])

  if (appTheme === 'dark')   return false
  if (appTheme === 'light')  return true
  return !systemDark
}
