import { useEffect, useRef } from 'react'

interface InlineCardEditorProps {
  value: string
  setValue: (value: string) => void
  onSave: () => void
  onCancel: () => void
}

/** In-place Trello-style editor for an existing canvas card. */
export function InlineCardEditor({ value, setValue, onSave, onCancel }: InlineCardEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !editorRef.current?.contains(event.target)) onCancel()
    }

    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [onCancel])

  return (
    <div
      ref={editorRef}
      className="inline-card-editor min-w-0 rounded-lg bg-white p-[7px] shadow-[0_0_0_2px_#0c66e4,0_4px_10px_rgba(9,30,66,0.2)]"
    >
      <textarea
        className="h-auto min-h-[34px] max-h-24 w-full resize-none overflow-y-auto border-0 bg-white p-[3px] text-[13px] leading-[1.32] text-[#172b4d] outline-none [field-sizing:content]"
        autoFocus
        aria-label="Edit card"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
            event.preventDefault()
            onSave()
          }
          if (event.key === 'Escape') onCancel()
        }}
      />
      <div className="inline-card-actions mt-1.5 flex items-center gap-[5px]">
        <button
          type="button"
          className="save-card-button grid min-h-[30px] min-w-[30px] place-items-center rounded-[5px] border-0 bg-[#0c66e4] px-[11px] py-0 font-semibold text-white hover:not-disabled:brightness-96 disabled:cursor-not-allowed disabled:bg-[#dcdfe4] disabled:text-[#8993a4]"
          onClick={onSave}
          disabled={!value.trim()}
        >
          Save
        </button>
      </div>
    </div>
  )
}
