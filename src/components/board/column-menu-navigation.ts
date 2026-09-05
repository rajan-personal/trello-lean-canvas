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
  if (event.key !== 'Tab' || !panel.contains(document.activeElement)) return
  const actions = [...panel.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')]
  const boundary = event.shiftKey ? actions[0] : actions.at(-1)
  if (document.activeElement !== boundary) return
  close()
  trigger.focus()
  // Forward Tab continues naturally from the trigger to the next board control.
  // Backward Tab stops on the trigger rather than skipping it.
  if (event.shiftKey) event.preventDefault()
}
