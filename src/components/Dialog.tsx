import { useEffect, useRef, type Dispatch, type SetStateAction } from 'react'
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
  const dialogRef = useRef<HTMLDialogElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const open = Boolean(dialog)

  useEffect(() => {
    const element = dialogRef.current
    if (!open || !element) return
    const closeFromBackdrop = (event: MouseEvent) => {
      const bounds = element.getBoundingClientRect()
      const outside = event.clientX < bounds.left || event.clientX > bounds.right ||
        event.clientY < bounds.top || event.clientY > bounds.bottom
      if (event.target === element && outside) setDialog(null)
    }
    element.addEventListener('mousedown', closeFromBackdrop)
    element.showModal()
    inputRef.current?.focus()
    return () => {
      element.removeEventListener('mousedown', closeFromBackdrop)
      if (element.open) element.close()
    }
  }, [open, setDialog])

  if (!dialog) return null

  return (
    <dialog
      ref={dialogRef}
      className="dialog dialog-backdrop m-auto w-[calc(100%-40px)] max-w-[440px] rounded-xl border-0 bg-white p-5 text-[#172b4d] shadow-[0_10px_30px_rgba(9,30,66,0.35)] backdrop:bg-[rgba(9,30,66,0.54)]"
      aria-label={dialog.heading}
      onCancel={() => setDialog(null)}
      onClose={() => setDialog(null)}
    >
      <form
        onSubmit={(event) => {
          event.preventDefault()
          onSubmit(dialog)
        }}
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
          ref={inputRef}
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
    </dialog>
  )
}
