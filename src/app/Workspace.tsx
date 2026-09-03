import { useState } from 'react'
import type { AppUser } from '../auth/auth-context'
import { AppStatus } from '../components/AppStatus'
import { CanvasBoard } from '../components/CanvasBoard'
import { CreateCanvasDialog } from '../components/CreateCanvasDialog'
import type { CanvasDialogState } from '../components/Dialog'
import { NotepadPanel } from '../components/NotepadPanel'
import { Sidebar } from '../components/Sidebar'
import { SyncError } from '../components/SyncError'
import { Toast } from '../components/Toast'
import { TopBar } from '../components/TopBar'
import { useCanvasCommands } from './useCanvasCommands'
import { useCanvasState } from './useCanvasState'
import { useCardDrag } from './useCardDrag'
import { useCardEditing } from './useCardEditing'
import { useNotice } from './useNotice'
import { useWorkspacePanels } from './useWorkspacePanels'
interface Props {
  user: AppUser
  onSignOut: () => void
  persistence?: 'firestore' | 'local'
}
export function Workspace({ user, onSignOut, persistence }: Props) {
  const state = useCanvasState(user.uid, persistence)
  const { notice, notify } = useNotice()
  const cards = useCardEditing(state, notify)
  const commands = useCanvasCommands(state, cards.clearCardEditing, notify)
  const dragHandlers = useCardDrag(state, () => cards.setEditingCard(null), notify)
  const panels = useWorkspacePanels()
  const [dialog, setDialog] = useState<CanvasDialogState | null>(null)
  const sectionProps = { ...cards, dragHandlers }
  if (state.loading) return <AppStatus />
  if (state.error && !state.canvases.length) return <AppStatus message={state.error} onSignOut={onSignOut} />
  return (
    <div className="app-shell h-dvh min-h-[640px] overflow-hidden bg-linear-[130deg,#0c66e4_0%,#338bfa_100%] max-[760px]:min-h-0">
      <TopBar
        canvas={state.activeCanvas}
        sidebarOpen={panels.sidebarOpen}
        sidebarCollapsed={panels.sidebarCollapsed}
        onToggleSidebar={panels.toggleSidebar}
        onOpenSidebar={panels.openSidebar}
        onNewCanvas={() =>
          setDialog({ heading: 'Create canvas', submitLabel: 'Create canvas', value: '' })
        }
        onLoadSamples={commands.loadSampleData}
        onRename={commands.renameCanvas}
        notepadOpen={panels.notepadOpen}
        onToggleNotepad={panels.toggleNotepad}
        onFavorite={() =>
          state.updateActiveCanvas((canvas) => ({
            ...canvas,
            favorite: !canvas.favorite,
          }))
        }
        onDelete={commands.deleteCanvas}
        onImport={commands.importYaml}
        onNotify={notify}
      />
      <div className="workspace-layout flex h-[calc(100dvh-48px)] min-h-[592px] max-[760px]:min-h-0">
        <Sidebar
          canvases={state.canvases}
          activeId={state.activeCanvas?.id ?? null}
          onSelect={commands.selectCanvas}
          onMove={commands.moveCanvas}
          user={user}
          onSignOut={onSignOut}
          open={panels.sidebarOpen}
          collapsed={panels.sidebarCollapsed}
          onClose={panels.closeSidebar}
        />
        {state.activeCanvas ? (
          <CanvasBoard
            sections={state.activeCanvas.sections}
            sectionProps={sectionProps}
          />
        ) : (
          <main className="main-area h-full min-w-0 flex-1" />
        )}
        {state.activeCanvas && (
          <NotepadPanel
            key={state.activeCanvas.id}
            canvas={state.activeCanvas}
            open={panels.notepadOpen}
            onChange={(notes) =>
              state.updateActiveCanvas((canvas) => ({ ...canvas, notes }))
            }
          />
        )}
      </div>
      <CreateCanvasDialog
        dialog={dialog}
        setDialog={setDialog}
        onCreate={commands.createCanvas}
      />
      {state.error && <SyncError message={state.error} />}
      <Toast notice={notice} />
    </div>
  )
}
