import { useEffect, useState } from 'react'
import type { AppUser } from '../auth/auth-context'
import { AppStatus } from '../components/AppStatus'
import { CreateCanvasDialog } from '../components/CreateCanvasDialog'
import type { CanvasDialogState } from '../components/Dialog'
import { NotepadPanel } from '../components/NotepadPanel'
import { Sidebar } from '../components/Sidebar'
import { SyncError } from '../components/SyncError'
import { Toast } from '../components/Toast'
import { projectPath } from './workspace-route'
import { useWorkspaceHistory, useWorkspaceRoute } from './useWorkspaceRoute'
import { useCanvasCommands } from './useCanvasCommands'
import { useCanvasState } from './useCanvasState'
import { useCardDrag } from './useCardDrag'
import { useCardEditing } from './useCardEditing'
import { useNotice } from './useNotice'
import { useWorkspacePanels } from './useWorkspacePanels'
import { useBoard } from './useBoard'
import { useNavigationGuard } from './useNavigationGuard'
import { WorkspaceUnavailable } from './WorkspaceUnavailable'
import { WorkspaceHeader } from './WorkspaceHeader'
import { WorkspaceViewPanel } from './WorkspaceViewPanel'
interface Props {
  user: AppUser
  onSignOut: () => void | Promise<void>
  persistence?: 'firestore' | 'local'
  browserRouting?: boolean
}
export function Workspace({ user, onSignOut, persistence, browserRouting = false }: Props) {
  const { history, route, view, projectId, ticketId } = useWorkspaceRoute(browserRouting)
  const state = useCanvasState(user.uid, persistence, view === 'board', {
    id: projectId,
    setId: (id) => history.navigate(id ? projectPath(id, view) : '/'),
  })
  const board = useBoard(state.boards, state.activeCanvas?.id)
  const { notice, notify } = useNotice()
  const guard = useNavigationGuard(board.pending || state.pending, notify)
  const cards = useCardEditing(state, notify)
  const allow = useWorkspaceHistory(history, guard.allow, () => guard.allow() && cards.allowBrowserNavigation())
  const commands = useCanvasCommands(state, cards.clearCardEditing, notify)
  const dragHandlers = useCardDrag(state, () => cards.setEditingCard(null), notify)
  const panels = useWorkspacePanels()
  const [dialog, setDialog] = useState<CanvasDialogState | null>(null)
  const sectionProps = { ...cards, dragHandlers }
  const defaultId = !state.loading && !state.error && route.kind === 'root' ? state.canvases[0]?.id : undefined
  useEffect(() => {
    if (defaultId) history.navigate(projectPath(defaultId), true)
  }, [defaultId, history])
  const ticket = {
    id: ticketId,
    open: (id: string) => { if (projectId && allow()) history.navigate(projectPath(projectId, 'board', id)) },
    close: () => { if (projectId) history.navigate(projectPath(projectId, 'board')) },
  }
  const signOut = () => { if (allow()) return onSignOut() }
  if (state.loading) return <AppStatus />
  if (state.error && !state.activeCanvas) return <AppStatus message={state.error} onSignOut={signOut} />
  return (
    <div className="app-shell h-dvh min-h-[640px] overflow-hidden bg-linear-[130deg,#0c66e4_0%,#338bfa_100%] max-[760px]:min-h-0">
      <WorkspaceHeader state={state} commands={commands} panels={panels} allow={allow}
        setDialog={setDialog} view={view} setView={(next) => { if (projectId) history.navigate(projectPath(projectId, next)) }} />
      <div className={`workspace-layout flex h-[calc(100dvh-48px)] min-h-[592px] max-[760px]:min-h-0 ${state.activeCanvas ? 'max-[760px]:h-[calc(100dvh-92px)]' : ''}`}>
        <Sidebar
          canvases={state.canvases}
          activeId={state.activeCanvas?.id ?? null}
          onSelect={(id) => { if (allow()) commands.selectCanvas(id) }}
          onMove={(id, index) => { if (allow()) commands.moveCanvas(id, index) }}
          user={user}
          onSignOut={signOut}
          open={panels.sidebarOpen}
          collapsed={panels.sidebarCollapsed}
          onClose={panels.closeSidebar}
        />
        {state.activeCanvas ? <WorkspaceViewPanel canvas={state.activeCanvas} view={view} board={board}
          sectionProps={sectionProps} user={user} ticket={ticket} blocked={state.pending} deleted={state.deleted} onDismissDeleted={() => {
            if (allow()) state.setActiveId(null)
          }} register={guard.register} notify={notify} /> :
          <WorkspaceUnavailable route={route} onReturn={() => { if (allow()) history.navigate('/') }} />}
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
