import { NotepadPanel } from '../components/NotepadPanel'
import type { CanvasState } from './useCanvasState'
import type { useWorkspacePanels } from './useWorkspacePanels'

interface Props {
  state: CanvasState
  panels: ReturnType<typeof useWorkspacePanels>
}

export function WorkspaceNotepad({ state, panels }: Props) {
  if (!state.activeCanvas || state.deleted || !panels.notepadMounted) return null
  return <NotepadPanel key={state.activeCanvas.id} canvas={state.activeCanvas}
    open={panels.notepadOpen}
    saving={state.pending} saveFailed={state.error !== null} onClose={panels.toggleNotepad}
    onChange={(notes) => state.updateActiveCanvas((canvas) => ({ ...canvas, notes }))} />
}
