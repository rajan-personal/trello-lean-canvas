import { Download, NotebookPen, Star, Trash2 } from 'lucide-react'
import type { LeanCanvas } from '../data/types'
import { downloadYaml } from '../data/download'
import { ToolbarIconButton } from './ToolbarIconButton'

interface Props {
  canvas: LeanCanvas
  notepadOpen: boolean
  onFavorite: () => void
  onToggleNotepad: () => void
  onDelete: () => void
  onNotify: (text: string) => void
}

export function CanvasToolbarActions({
  canvas,
  notepadOpen,
  onFavorite,
  onToggleNotepad,
  onDelete,
  onNotify,
}: Props) {
  return (
    <>
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
        onClick={() => {
          downloadYaml(canvas)
          onNotify(`${canvas.name}.yaml downloaded`)
        }}
      >
        <Download size={17} />
      </ToolbarIconButton>
      <ToolbarIconButton label="Delete board" onClick={onDelete}>
        <Trash2 size={17} />
      </ToolbarIconButton>
    </>
  )
}
