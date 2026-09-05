import type { CanvasDialogState } from '../components/Dialog'
import { TopBar } from '../components/TopBar'
import { WorkspaceTabs, type WorkspaceView } from '../components/WorkspaceTabs'
import type { useCanvasCommands } from './useCanvasCommands'
import type { CanvasState } from './useCanvasState'
import type { useWorkspacePanels } from './useWorkspacePanels'

interface Props {
  state: CanvasState; commands: ReturnType<typeof useCanvasCommands>
  panels: ReturnType<typeof useWorkspacePanels>; allow: () => boolean
  setDialog: (dialog: CanvasDialogState) => void; view: WorkspaceView
  setView: (view: WorkspaceView) => void
}
export function WorkspaceHeader({ state, commands, panels, allow, setDialog, view, setView }: Props) {
  return <TopBar canvas={state.activeCanvas} sidebarOpen={panels.sidebarOpen}
    sidebarCollapsed={panels.sidebarCollapsed} onToggleSidebar={panels.toggleSidebar}
    onOpenSidebar={panels.openSidebar}
    tabs={state.activeCanvas && <WorkspaceTabs view={view} onChange={(next) => {
      if (next === view) return true
      if (!allow()) return false
      setView(next)
      return true
    }} />}
    onNewCanvas={() => {
      if (allow()) setDialog({ heading: 'Create canvas', submitLabel: 'Create canvas', value: '' })
    }}
    onLoadSamples={() => { if (allow()) void commands.loadSampleData() }}
    onRename={commands.renameCanvas} notepadOpen={panels.notepadOpen}
    onToggleNotepad={panels.toggleNotepad}
    onFavorite={() => state.updateActiveCanvas((canvas) => ({ ...canvas, favorite: !canvas.favorite }))}
    onDelete={() => { if (allow()) commands.deleteCanvas() }}
    onImport={(event) => {
      if (allow()) void commands.importYaml(event)
      else event.target.value = ''
    }}
    onDownload={() => { if (allow()) void commands.exportYaml() }} />
}
