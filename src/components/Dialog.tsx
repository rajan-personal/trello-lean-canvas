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

const dialogButtonClass = 'min-h-8 rounded-md border-0 px-3 py-1.5 font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0c66e4]'

/** Modal form for creating a canvas. */
export function Dialog({ dialog, setDialog, onSubmit }: DialogProps) {
  if (!dialog) return null

  return (
    <div
      className="dialog-backdrop fixed inset-0 z-100 grid place-items-center bg-[rgba(9,30,66,0.54)] p-5"
      role="presentation"
      onMouseDown={() => setDialog(null)}
    >
      <form
        className="dialog w-full max-w-[440px] rounded-xl bg-white p-5 shadow-[0_10px_30px_rgba(9,30,66,0.35)]"
        role="dialog"
        aria-modal="true"
        aria-label={dialog.heading}
        onSubmit={(event) => {
          event.preventDefault()
          onSubmit(dialog)
        }}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="dialog-header mb-4 flex items-center justify-between">
          <h2 className="m-0 text-xl font-bold">{dialog.heading}</h2>
          <button
            type="button"
            className="grid size-8 place-items-center rounded-md border-0 bg-transparent p-0 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#0c66e4]"
            onClick={() => setDialog(null)}
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
        </div>
        <input
          className="w-full rounded-md border-2 border-[#8590a2] px-3 py-2.5 text-[#172b4d] outline-none focus:border-[#0c66e4]"
          autoFocus
          aria-label="Canvas name"
          value={dialog.value}
          onChange={(event) => setDialog({ ...dialog, value: event.target.value })}
        />
        <div className="dialog-actions mt-[18px] flex justify-end gap-2">
          <button
            type="button"
            className={`${dialogButtonClass} secondary bg-[#f1f2f4] text-[#172b4d] hover:bg-[#dcdfe4]`}
            onClick={() => setDialog(null)}
          >
            Cancel
          </button>
          <button type="submit" className={`${dialogButtonClass} bg-[#0c66e4] text-white hover:bg-[#0055cc]`}>{dialog.submitLabel}</button>
        </div>
      </form>
    </div>
  )
}
