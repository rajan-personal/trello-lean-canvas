import { useEffect, useRef } from 'react'

/** In-place Trello-style editor for an existing canvas card. */
export function InlineCardEditor({ value, setValue, onSave, onCancel }) {
  const editorRef = useRef(null)

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!editorRef.current?.contains(event.target)) onCancel()
    }

    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [onCancel])

  return (
    <div ref={editorRef} className="inline-card-editor">
      <textarea
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
      <div className="inline-card-actions">
        <button type="button" className="save-card-button" onClick={onSave} disabled={!value.trim()}>Save</button>
      </div>
    </div>
  )
}
