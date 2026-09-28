import { useId, useState } from 'react'
import type { Editor } from '@tiptap/react'
import { Link } from 'lucide-react'

export function RichTextLinkControl({ editor, active }: { editor: Editor; active: boolean }) {
  const id = useId()
  const [url, setUrl] = useState<string | null>(null)
  const [error, setError] = useState(false)
  const close = () => { setUrl(null); editor.commands.focus() }
  const apply = () => {
    const href = url?.trim() ?? ''
    if (!href) editor.chain().focus().extendMarkRange('link').unsetLink().run()
    else {
      try {
        if (!['https:', 'http:', 'mailto:'].includes(new URL(href).protocol)) throw new Error('Invalid link')
      } catch { setError(true); return }
      editor.chain().focus().extendMarkRange('link').setLink({ href }).run()
    }
    close()
  }
  return <>
    <button type="button" aria-label="Link" title="Link" aria-pressed={active} aria-expanded={url !== null}
      onClick={() => { setUrl(String(editor.getAttributes('link').href ?? '')); setError(false) }}>
      <Link size={18} aria-hidden="true" />
    </button>
    {url !== null && <div className="rich-text-link" role="group" aria-label="Edit link">
      <label htmlFor={id}>Link URL</label>
      <input id={id} type="url" value={url} placeholder="https://example.com"
        aria-invalid={error} aria-describedby={error ? `${id}-error` : undefined}
        onChange={(event) => { setUrl(event.target.value); setError(false) }}
        onKeyDown={(event) => {
          if (event.key === 'Enter') { event.preventDefault(); apply() }
          if (event.key === 'Escape') { event.preventDefault(); close() }
        }} />
      <button type="button" onClick={apply}>Apply link</button>
      <button type="button" onClick={() => { editor.chain().focus().extendMarkRange('link').unsetLink().run(); close() }}>Remove link</button>
      <button type="button" onClick={close}>Cancel</button>
      {error && <p id={`${id}-error`} role="alert">Enter an http, https, or mailto URL.</p>}
    </div>}
  </>
}
