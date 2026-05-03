import { useState, useEffect } from 'react'

export function useIsLightMode(): boolean {
  const [isLight, setIsLight] = useState(() =>
    !document.documentElement.classList.contains('dark'),
  )
  useEffect(() => {
    const obs = new MutationObserver(() =>
      setIsLight(!document.documentElement.classList.contains('dark')),
    )
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => obs.disconnect()
  }, [])
  return isLight
}
