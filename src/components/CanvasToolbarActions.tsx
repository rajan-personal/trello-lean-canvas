import { Download, NotebookPen, Star, Trash2 } from 'lucide-react'
import type { LeanCanvas } from '../data/types'
import { ToolbarIconButton } from './ToolbarIconButton'
import { CanvasMoreMenu } from './CanvasMoreMenu'

interface Props {
  canvas: LeanCanvas
  notepadOpen: boolean
  onFavorite: () => void
  onToggleNotepad: () => void
  onDelete: () => void
  onDownload: () => void
}

export function CanvasToolbarActions({
  canvas,
  notepadOpen,
  onFavorite,
  onToggleNotepad,
  onDelete,
  onDownload,
}: Props) {
  return (
    <>
      <div className="flex items-center max-[761px]:hidden">
      <ToolbarIconButton
        label="Favorite canvas"
        onClick={onFavorite}
        active={canvas.favorite}
        pressed={canvas.favorite}
      >
        <Star size={17} fill={canvas.favorite ? 'currentColor' : 'none'} />
      </ToolbarIconButton>
      <ToolbarIconButton
        label="Notepad"
        title={notepadOpen ? 'Close notepad' : 'Open notepad'}
        onClick={onToggleNotepad}
        active={notepadOpen}
        expanded={notepadOpen}
        controls="canvas-notepad"
      >
        <NotebookPen size={17} />
      </ToolbarIconButton>
      <ToolbarIconButton
        label="Download canvas data as YAML"
        title="Download YAML"
        onClick={onDownload}
      >
        <Download size={17} />
      </ToolbarIconButton>
      <span aria-hidden="true" className="mx-1.5 h-5 w-px bg-white/25" />
      <ToolbarIconButton label="Delete canvas" onClick={onDelete} danger>
        <Trash2 size={17} />
      </ToolbarIconButton>
      </div>
      <CanvasMoreMenu canvas={canvas} notepadOpen={notepadOpen} onFavorite={onFavorite}
        onToggleNotepad={onToggleNotepad} onDownload={onDownload} onDelete={onDelete} />
    </>
  )
}
