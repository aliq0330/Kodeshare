import { useEffect, useRef } from 'react'
import { useEditorStore } from '@store/editorStore'

const DEBOUNCE_MS = 2000

export function useAutoSave(onSave: () => Promise<void>) {
  const files = useEditorStore((s) => s.files)
  const autoSave = useEditorStore((s) => s.autoSave)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!autoSave) return

    const hasUnsaved = files.some((f) => f.isModified)
    if (!hasUnsaved) return

    if (timerRef.current) clearTimeout(timerRef.current)

    timerRef.current = setTimeout(() => {
      onSave()
    }, DEBOUNCE_MS)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [files, autoSave, onSave])
}
