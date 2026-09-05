import { useState, type ComponentProps } from 'react'
import { CanvasToolbarActions } from './CanvasToolbarActions'

export function CanvasToolbarHarness(args: ComponentProps<typeof CanvasToolbarActions>) {
  const [canvas, setCanvas] = useState(args.canvas)
  const [notepadOpen, setOpen] = useState(args.notepadOpen)
  const [deleted, setDeleted] = useState(false)
  if (deleted) return <p>Canvas deleted</p>
  return <CanvasToolbarActions {...args} canvas={canvas} notepadOpen={notepadOpen}
    onFavorite={() => { args.onFavorite(); setCanvas((current) => ({ ...current, favorite: !current.favorite })) }}
    onToggleNotepad={() => { args.onToggleNotepad(); setOpen((current) => !current) }}
    onDelete={() => { args.onDelete(); setDeleted(true) }} />
}
