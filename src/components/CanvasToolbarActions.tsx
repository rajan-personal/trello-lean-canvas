import type { ChangeEvent } from 'react'
import { Download, Star, Trash2 } from 'lucide-react'
import type { LeanCanvas } from '../data/types'
import { downloadYaml } from '../data/download'
import { ToolbarIconButton } from './ToolbarIconButton'
import { UploadCanvasButton } from './UploadCanvasButton'

interface Props {
  canvas: LeanCanvas
  onFavorite: () => void
  onDelete: () => void
  onImport: (event: ChangeEvent<HTMLInputElement>) => void
  onNotify: (text: string) => void
}

export function CanvasToolbarActions({
  canvas,
  onFavorite,
  onDelete,
  onImport,
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
        label="Download canvas data as YAML"
        title="Download YAML"
        onClick={() => {
          downloadYaml(canvas)
          onNotify(`${canvas.name}.yaml downloaded`)
        }}
      >
        <Download size={17} />
      </ToolbarIconButton>
      <UploadCanvasButton onImport={onImport} />
      <ToolbarIconButton label="Delete board" onClick={onDelete}>
        <Trash2 size={17} />
      </ToolbarIconButton>
    </>
  )
}
