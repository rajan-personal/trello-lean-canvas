import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'

export function useAccountMenu() {
  const id = useId()
  const trigger = useRef<HTMLButtonElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  const last = useRef(false)
  const [open, setOpen] = useState(false)
  const nativePopover = typeof HTMLElement !== 'undefined' && 'popover' in HTMLElement.prototype
  const close = () => { panel.current?.hidePopover?.(); setOpen(false); trigger.current?.focus() }
  const show = (atEnd = false) => { last.current = atEnd; setOpen(true) }
  useEffect(() => {
    if (!open) return
    const element = panel.current!
    const button = trigger.current!
    const position = () => {
      const rect = button.getBoundingClientRect()
      const width = element.offsetWidth; const height = element.offsetHeight
      element.style.left = `${Math.max(8, Math.min(rect.left, innerWidth - width - 8))}px`
      const top = rect.top - height - 6 >= 8 ? rect.top - height - 6 : rect.bottom + 6
      element.style.top = `${Math.max(8, Math.min(top, innerHeight - height - 8))}px`
    }
    if (nativePopover) element.showPopover()
    position()
    const items = element.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:not(:disabled)')
    items[last.current ? items.length - 1 : 0]?.focus()
    const dismiss = (event: PointerEvent) => {
      if (!element.contains(event.target as Node) && !button.contains(event.target as Node)) {
        if (nativePopover) element.hidePopover()
        setOpen(false)
        if (element.contains(document.activeElement)) button.focus()
      }
    }
    const escape = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault(); event.stopPropagation()
      if (nativePopover) element.hidePopover()
      setOpen(false); button.focus()
    }
    document.addEventListener('keydown', escape)
    document.addEventListener('pointerdown', dismiss)
    window.addEventListener('resize', position)
    window.addEventListener('scroll', position, true)
    return () => {
      document.removeEventListener('keydown', escape)
      document.removeEventListener('pointerdown', dismiss)
      window.removeEventListener('resize', position)
      window.removeEventListener('scroll', position, true)
    }
  }, [open, nativePopover])
  const keydown = (event: KeyboardEvent<HTMLDivElement>) => {
    event.stopPropagation()
    if (event.key === 'Escape') { event.preventDefault(); close(); return }
    if (event.key === 'Tab') {
      const controls = [...document.querySelectorAll<HTMLElement>('button, a[href], input, select, textarea, [tabindex]')]
        .filter((item) => item.tabIndex >= 0 && !item.matches(':disabled') && !item.closest('[inert]') &&
          !panel.current?.contains(item) && item.getClientRects().length > 0 && getComputedStyle(item).visibility !== 'hidden')
      const index = controls.indexOf(trigger.current!)
      const next = controls[index + (event.shiftKey ? -1 : 1)]
      close()
      if (next) { event.preventDefault(); next.focus() }
      return
    }
    const items = [...event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:not(:disabled)')]
    const index = items.indexOf(document.activeElement as HTMLButtonElement)
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 :
      event.key === 'ArrowDown' ? (index + 1) % items.length : event.key === 'ArrowUp' ? (index - 1 + items.length) % items.length : null
    if (next !== null) { event.preventDefault(); items[next]?.focus() }
  }
  return { id, trigger, panel, open, nativePopover, show, close, keydown }
}
