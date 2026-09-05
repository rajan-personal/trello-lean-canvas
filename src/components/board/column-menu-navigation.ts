/** Keep a portalled action group's exit order adjacent to its trigger. */
export function columnMenuKeydown(
  event: KeyboardEvent, panel: HTMLElement, trigger: HTMLButtonElement, close: () => void,
) {
  if (event.key === 'Escape') {
    event.preventDefault()
    close()
    trigger.focus()
    return
  }
  if (event.key !== 'Tab') return
  const actions = [...panel.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')]
  const active = document.activeElement
  if (!actions.length && active === trigger) { close(); return }
  if (!active || !panel.contains(active)) return
  const direction = event.shiftKey ? Node.DOCUMENT_POSITION_PRECEDING : Node.DOCUMENT_POSITION_FOLLOWING
  if (actions.some((action) => active.compareDocumentPosition(action) & direction)) return
  close()
  trigger.focus()
  // Forward Tab continues naturally from the trigger to the next board control.
  // Backward Tab stops on the trigger rather than skipping it.
  if (event.shiftKey) event.preventDefault()
}
