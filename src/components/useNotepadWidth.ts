import { useEffect, useRef, useState } from 'react'

export const MIN_NOTEPAD_WIDTH = 260

export function useNotepadWidth() {
  const panelRef = useRef<HTMLElement>(null)
  const [maximum, setMaximum] = useState(320)
  const [preferred, setPreferred] = useState(320)
  const [expanded, setExpanded] = useState(false)
  useEffect(() => {
    const container = panelRef.current?.parentElement
    if (!container) return
    const observer = new ResizeObserver(() => setMaximum(container.clientWidth))
    observer.observe(container)
    return () => observer.disconnect()
  }, [])
  const minimum = Math.min(MIN_NOTEPAD_WIDTH, maximum)
  const width = expanded ? maximum : Math.min(maximum, Math.max(minimum, preferred))
  const setWidth = (value: number) => {
    setExpanded(false)
    setPreferred(Math.min(maximum, Math.max(minimum, value)))
  }
  return { panelRef, width, minimum, maximum, expanded, setWidth,
    toggleExpanded: () => setExpanded((value) => !value) }
}
