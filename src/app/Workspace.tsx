import { useState } from 'react'
import type { AppUser } from '../auth/auth-context'
import { AppStatus } from '../components/AppStatus'
import { CreateCanvasDialog } from '../components/CreateCanvasDialog'
import type { CanvasDialogState } from '../components/Dialog'
import { NotepadPanel } from '../components/NotepadPanel'
import { Sidebar } from '../components/Sidebar'
import { SyncError } from '../components/SyncError'
import { Toast } from '../components/Toast'
import type { WorkspaceView } from '../components/WorkspaceTabs'
import { useCanvasCommands } from './useCanvasCommands'
import { useCanvasState } from './useCanvasState'
import { useCardDrag } from './useCardDrag'
import { useCardEditing } from './useCardEditing'
import { useNotice } from './useNotice'
import { useWorkspacePanels } from './useWorkspacePanels'
import { useBoard } from './useBoard'
import { useNavigationGuard } from './useNavigationGuard'
import { WorkspaceHeader } from './WorkspaceHeader'
import { WorkspaceViewPanel } from './WorkspaceViewPanel'
interface Props {
  user: AppUser
  onSignOut: () => void | Promise<void>
  persistence?: 'firestore' | 'local'
}
export function Workspace({ user, onSignOut, persistence }: Props) {
  const [view, setView] = useState<WorkspaceView>('canvas')
  const state = useCanvasState(user.uid, persistence, view === 'board')
  const board = useBoard(state.boards, state.activeCanvas?.id)
  const { notice, notify } = useNotice()
  const guard = useNavigationGuard(board.pending || state.pending, notify)
  const cards = useCardEditing(state, notify)
  const commands = useCanvasCommands(state, cards.clearCardEditing, notify)
  const dragHandlers = useCardDrag(state, () => cards.setEditingCard(null), notify)
  const panels = useWorkspacePanels()
  const [dialog, setDialog] = useState<CanvasDialogState | null>(null)
  const sectionProps = { ...cards, dragHandlers }
  const signOut = () => { if (guard.allow()) return onSignOut() }
  if (state.loading) return <AppStatus />
  if (state.error && !state.activeCanvas) return <AppStatus message={state.error} onSignOut={signOut} />
  return (
    <div className="app-shell h-dvh min-h-[640px] overflow-hidden bg-linear-[130deg,#0c66e4_0%,#338bfa_100%] max-[760px]:min-h-0">
      <WorkspaceHeader state={state} commands={commands} panels={panels} allow={guard.allow}
        setDialog={setDialog} view={view} setView={setView} />
      <div className={`workspace-layout flex h-[calc(100dvh-48px)] min-h-[592px] max-[760px]:min-h-0 ${state.activeCanvas ? 'max-[760px]:h-[calc(100dvh-92px)]' : ''}`}>
        <Sidebar
          canvases={state.canvases}
          activeId={state.activeCanvas?.id ?? null}
          onSelect={(id) => { if (guard.allow()) commands.selectCanvas(id) }}
          onMove={(id, index) => { if (guard.allow()) commands.moveCanvas(id, index) }}
          user={user}
          onSignOut={signOut}
          open={panels.sidebarOpen}
          collapsed={panels.sidebarCollapsed}
          onClose={panels.closeSidebar}
        />
        {state.activeCanvas ? <WorkspaceViewPanel canvas={state.activeCanvas} view={view} board={board}
          sectionProps={sectionProps} user={user} blocked={state.pending} deleted={state.deleted} onDismissDeleted={() => {
            if (guard.allow()) state.setActiveId(null)
          }} register={guard.register} notify={notify} /> :
          <main className="main-area h-full min-w-0 flex-1" />}
        {state.activeCanvas && !state.deleted && (
          <NotepadPanel
            key={state.activeCanvas.id}
            canvas={state.activeCanvas}
            open={panels.notepadOpen}
            onChange={(notes) => state.updateActiveCanvas((canvas) => ({ ...canvas, notes }))}
          />
        )}
      </div>
      <CreateCanvasDialog dialog={dialog} setDialog={setDialog} onCreate={commands.createCanvas} />
      {state.error && <SyncError message={state.error} />}
      <Toast notice={notice} />
    </div>
  )
}
