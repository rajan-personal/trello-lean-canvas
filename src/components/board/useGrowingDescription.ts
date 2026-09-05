import { useLayoutEffect, useRef } from 'react'

/** Older browsers grow the description too; modern browsers use field-sizing. */
export function useGrowingDescription(value: string) {
  const ref = useRef<HTMLTextAreaElement>(null)
  useLayoutEffect(() => {
    const element = ref.current
    if (!element || CSS.supports('field-sizing', 'content')) return
    const resize = () => {
      element.style.height = 'auto'
      const border = element.offsetHeight - element.clientHeight
      element.style.height = `${element.scrollHeight + border}px`
    }
    resize()
    let width = element.clientWidth
    const observer = new ResizeObserver(() => {
      if (element.clientWidth === width) return
      width = element.clientWidth
      resize()
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [value])
  return ref
}
