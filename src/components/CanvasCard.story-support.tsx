import { useState } from 'react'
import { CanvasCard, type CanvasCardProps } from './CanvasCard'
import { InlineCardEditor } from './InlineCardEditor'

export function CanvasCardHarness(args: CanvasCardProps) {
  const [text, setText] = useState(args.text)
  const [draft, setDraft] = useState<string | null>(null)
  const [deleted, setDeleted] = useState(false)
  if (deleted) return <p>Card deleted</p>
  if (draft !== null) return <InlineCardEditor value={draft} setValue={setDraft}
    onCancel={() => setDraft(null)} onSave={() => { setText(draft.trim()); setDraft(null) }} />
  return <CanvasCard {...args} text={text}
    onEdit={(id, index, value) => { args.onEdit(id, index, value); setDraft(value) }}
    onDelete={(id, index) => { args.onDelete(id, index); setDeleted(true) }} />
}
