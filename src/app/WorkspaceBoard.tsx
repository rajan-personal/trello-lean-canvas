import { useRef } from 'react'
import type { AppUser } from '../auth/auth-context'
import { KanbanBoard } from '../components/board/KanbanBoard'
import type { BoardCommand } from '../data/board-mutations'
import type { useBoard } from './useBoard'
import type { RegisterDraftGuard } from './useNavigationGuard'

interface Props {
  deleted?: boolean; onDismissDeleted: () => void
  state: ReturnType<typeof useBoard>; user: AppUser; blocked: boolean
  register: RegisterDraftGuard; notify: (message: string) => void
}
export function WorkspaceBoard({ state, user, blocked, deleted, onDismissDeleted, register, notify }: Props) {
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
  return <div className="kanban-area">
    {deleted && <div className="kanban-status" role="alert">This canvas was deleted elsewhere. Copy your drafts before closing.
      <button onClick={onDismissDeleted}>Close deleted canvas</button></div>}
    {!deleted && state.error && <div className="kanban-status" role="alert">{state.error}
      <button onClick={() => void state.reload()} disabled={state.pending}>Retry loading board</button></div>}
    {state.loading && <p className="kanban-status" role="status">Loading board…</p>}
    {state.pending && <p className="kanban-status" role="status">Saving board…</p>}
    {state.board && <KanbanBoard board={state.board} user={user}
      deleted={deleted} pending={blocked || state.pending || (!deleted && state.loading)} error={deleted ? null : state.error} run={run} register={register} />}
  </div>
}
