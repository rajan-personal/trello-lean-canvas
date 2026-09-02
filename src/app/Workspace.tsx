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
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [notepadOpen, setNotepadOpen] = useState(false)
  const [dialog, setDialog] = useState<CanvasDialogState | null>(null)
  const sectionProps = { ...cards, dragHandlers }
  if (state.loading) return <AppStatus />
  if (state.error && !state.canvases.length) return <AppStatus message={state.error} onSignOut={onSignOut} />
  return (
    <div className="app-shell h-dvh min-h-[640px] overflow-hidden bg-linear-[130deg,#0c66e4_0%,#338bfa_100%]">
      <TopBar
        canvas={state.activeCanvas}
        sidebarOpen={sidebarOpen}
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={() => setSidebarCollapsed((value) => !value)}
        onOpenSidebar={() => setSidebarOpen(true)}
        onNewCanvas={() =>
          setDialog({ heading: 'Create canvas', submitLabel: 'Create canvas', value: '' })
        }
        onRename={commands.renameCanvas}
        notepadOpen={notepadOpen}
        onToggleNotepad={() => setNotepadOpen((value) => !value)}
        onFavorite={() =>
          state.updateActiveCanvas((canvas) => ({
            ...canvas,
            favorite: !canvas.favorite,
          }))
        }
        onDelete={commands.deleteCanvas}
        onImport={commands.importYaml}
        onNotify={notify}
        user={user}
        onSignOut={onSignOut}
      />
      <div className="workspace-layout flex h-[calc(100dvh-48px)] min-h-[592px]">
        <Sidebar
          canvases={state.canvases}
          activeId={state.activeCanvas?.id ?? null}
          onSelect={commands.selectCanvas}
          onMove={commands.moveCanvas}
          onLoadSamples={commands.loadSampleData}
          open={sidebarOpen}
          collapsed={sidebarCollapsed}
          onClose={() => setSidebarOpen(false)}
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
            open={notepadOpen}
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
