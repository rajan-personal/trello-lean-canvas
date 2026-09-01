import { X } from 'lucide-react'

export interface CardComposerProps {
  value: string
  setValue: (value: string) => void
  onSave: () => void
  onCancel: () => void
}

/** Inline editor used to add a card to a Lean Canvas section. */
export function CardComposer({ value, setValue, onSave, onCancel }: CardComposerProps) {
  return (
    <form
      className="card-composer"
      onSubmit={(event) => {
        event.preventDefault()
        onSave()
      }}
    >
      <textarea
        name="card-text"
        autoFocus
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
        <button type="button" className="composer-cancel" onClick={onCancel} aria-label="Cancel adding card" title="Cancel">
          <X size={20} />
        </button>
      </div>
    </form>
  )
}
