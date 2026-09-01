import { useEffect, useLayoutEffect, useRef } from 'react'

export interface CardComposerProps {
  value: string
  setValue: (value: string) => void
  onSave: () => void
  onCancel: () => void
}

/** Inline editor used to add a card to a Lean Canvas section. */
export function CardComposer({ value, setValue, onSave, onCancel }: CardComposerProps) {
  const composerRef = useRef<HTMLFormElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useLayoutEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    const end = textarea.value.length
    textarea.focus()
    textarea.setSelectionRange(end, end)
  }, [])

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !composerRef.current?.contains(event.target)) onCancel()
    }

    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [onCancel])

  return (
    <form
      ref={composerRef}
      className="card-composer"
      onSubmit={(event) => {
        event.preventDefault()
        onSave()
      }}
    >
      <textarea
        ref={textareaRef}
        name="card-text"
        required
        aria-label="New card"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault()
            if (value.trim()) event.currentTarget.form?.requestSubmit()
          }
          if (event.key === 'Escape') onCancel()
        }}
        placeholder="Enter a title for this card…"
      />
      <div className="composer-actions">
        <button type="submit" className="composer-submit">Add card</button>
      </div>
    </form>
  )
}
