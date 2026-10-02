import type { TicketSelection } from '../components/board/RoutedTicketDialog'
import { useRef } from 'react'
import { AlertCircle, Loader2 } from 'lucide-react'
import type { AppUser } from '../auth/auth-context'
import { KanbanBoard } from '../components/board/KanbanBoard'
import { BoardSkeleton } from '../components/board/BoardSkeleton'
import type { BoardCommand } from '../data/board-mutations'
import type { useBoard } from './useBoard'
import type { RegisterDraftGuard } from './useNavigationGuard'

interface Props {
  ticket?: TicketSelection
  deleted?: boolean; onDismissDeleted: () => void
  state: ReturnType<typeof useBoard>; user: AppUser; blocked: boolean
  register: RegisterDraftGuard; notify: (message: string) => void
}
export function WorkspaceBoard({ state, user, blocked, deleted, onDismissDeleted, register, notify, ticket }: Props) {
  const busy = useRef(false)
  const run = async (command: BoardCommand) => {
    if (deleted || busy.current || blocked || state.pending || state.loading) return false
    busy.current = true
    try {
      await state.dispatch(command)
      notify(command.type === 'move-card' ? 'Card moved' : 'Board saved')
      return true
    } catch { return false } finally { busy.current = false }
  }
  return <div className="kanban-area" data-syncing={state.pending || state.loading || undefined}>
    {deleted && <div className="kanban-status" role="alert"><AlertCircle size={18} aria-hidden="true" />
      <span>This canvas was deleted elsewhere. Copy your drafts before closing.</span>
      <button onClick={onDismissDeleted}>Close deleted canvas</button></div>}
    {!state.board && state.loading && !state.error && !deleted && <BoardSkeleton />}
    {!state.board && state.error && !deleted && <div className="kanban-load-error">
      <div className="kanban-load-error-card" role="alert">
        <AlertCircle size={28} aria-hidden="true" />
        <h2>Board couldn't load</h2>
        <p>{state.error}</p>
        <button className="kanban-primary" onClick={() => void state.reload()} disabled={state.pending || state.loading}>
          Retry loading board
        </button>
      </div>
    </div>}
    {state.board && !deleted && state.error && <div className="kanban-status" role="alert">
      <AlertCircle size={18} aria-hidden="true" /><span>{state.error}</span>
      <button onClick={() => void state.reload()} disabled={state.pending}>Retry loading board</button></div>}
    {state.board && <p className="kanban-sync-status" role="status" aria-atomic="true"
      hidden={!state.pending && !state.loading}>
      <Loader2 size={12} className="kanban-spinner" aria-hidden="true" />
      {state.pending ? 'Saving board…' : 'Refreshing board…'}
    </p>}
    {state.board && <KanbanBoard ticket={ticket} loading={state.loading} board={state.board} user={user}
      deleted={deleted} pending={blocked || state.pending || (!deleted && state.loading)} error={deleted ? null : state.error} run={run} register={register} />}
  </div>
}
