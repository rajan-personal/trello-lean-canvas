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
      className="card-composer min-w-0 flex-none"
      onSubmit={(event) => {
        event.preventDefault()
        onSave()
      }}
    >
      <textarea
        ref={textareaRef}
        className="block min-h-[54px] max-h-[180px] w-full resize-y overflow-y-auto rounded-lg border-0 bg-white px-2.5 py-[7px] text-[13px] leading-[1.32] text-[#172b4d] shadow-[0_1px_1px_rgba(9,30,66,0.25),0_0_1px_rgba(9,30,66,0.31)] [field-sizing:content] placeholder:text-[#626f86] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#0c66e4] supports-[field-sizing:content]:resize-none [@media(pointer:coarse)]:text-base"
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
      <div className="composer-actions mt-1.5 flex items-center gap-1">
        <button
          type="submit"
          className="composer-submit min-h-7 rounded-md border-0 bg-[#0c66e4] px-2.5 py-1 text-xs leading-4 font-semibold text-white hover:bg-[#0055cc]"
        >
          Add card
        </button>
      </div>
    </form>
  )
}
