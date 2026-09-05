import { useState, type ComponentProps } from 'react'
import { BoardInlineComposer } from './BoardInlineComposer'
import { BoardTitleDialog } from './BoardTitleDialog'

export function InlineComposerStory(args: ComponentProps<typeof BoardInlineComposer>) {
  const [title, setTitle] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState(args.error)
  if (title !== null) return <p role="status">{title || 'Composer closed'}</p>
  return <div className="kanban-area"><div className="kanban-column">
    <BoardInlineComposer {...args} pending={pending || args.pending} error={error}
      onClose={() => { args.onClose(); setTitle((saved) => saved ?? '') }}
      onSave={async (id, value) => {
        setPending(true)
        try {
          if (!await args.onSave(id, value)) { setError('Save failed. Retry your draft.'); return false }
          setTitle(value); return true
        } finally { setPending(false) }
      }} />
  </div></div>
}
export function TitleDialogStory(args: ComponentProps<typeof BoardTitleDialog>) {
  const [title, setTitle] = useState(args.initial ?? '')
  const [open, setOpen] = useState(true)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState(args.error)
  return open ? <BoardTitleDialog {...args} initial={title} pending={pending || args.pending} error={error}
    onClose={() => { args.onClose(); setOpen(false) }} onSave={async (value) => {
      setPending(true)
      try {
        if (!await args.onSave(value)) { setError('Rename failed. Retry your draft.'); return false }
        setTitle(value); return true
      } finally { setPending(false) }
    }} /> : <button onClick={() => setOpen(true)}>{title}</button>
}
