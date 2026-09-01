import type { Dispatch, SetStateAction } from 'react'
import { X } from 'lucide-react'

export interface CanvasDialogState {
  heading: string
  submitLabel: string
  value: string
}

interface DialogProps {
  dialog: CanvasDialogState | null
  setDialog: Dispatch<SetStateAction<CanvasDialogState | null>>
  onSubmit: (dialog: CanvasDialogState) => void
}

/** Modal form for creating a canvas. */
export function Dialog({ dialog, setDialog, onSubmit }: DialogProps) {
  if (!dialog) return null

  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={() => setDialog(null)}>
      <form
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-label={dialog.heading}
        onSubmit={(event) => {
          event.preventDefault()
          onSubmit(dialog)
        }}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="dialog-header">
          <h2>{dialog.heading}</h2>
          <button type="button" onClick={() => setDialog(null)} aria-label="Close dialog"><X size={20} /></button>
        </div>
        <input
          autoFocus
          aria-label="Canvas name"
          value={dialog.value}
          onChange={(event) => setDialog({ ...dialog, value: event.target.value })}
        />
        <div className="dialog-actions">
          <button type="button" className="secondary" onClick={() => setDialog(null)}>Cancel</button>
          <button type="submit">{dialog.submitLabel}</button>
        </div>
      </form>
    </div>
  )
}
