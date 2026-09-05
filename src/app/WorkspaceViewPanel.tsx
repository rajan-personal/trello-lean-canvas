import { lazy, Suspense, type ComponentProps } from 'react'
import type { AppUser } from '../auth/auth-context'
import { CanvasBoard } from '../components/CanvasBoard'
import type { WorkspaceView } from '../components/WorkspaceTabs'
import type { LeanCanvas } from '../data/types'
import type { useBoard } from './useBoard'
import type { RegisterDraftGuard } from './useNavigationGuard'

const WorkspaceBoard = lazy(() => import('./WorkspaceBoard').then((module) => ({ default: module.WorkspaceBoard })))
interface Props {
  canvas: LeanCanvas; view: WorkspaceView; board: ReturnType<typeof useBoard>
  sectionProps: ComponentProps<typeof CanvasBoard>['sectionProps']; user: AppUser
  deleted?: boolean; onDismissDeleted: () => void
  blocked: boolean; register: RegisterDraftGuard; notify: (message: string) => void
}
export function WorkspaceViewPanel({ canvas, view, board, sectionProps, user, blocked, deleted, onDismissDeleted, register, notify }: Props) {
  const inactive = view === 'canvas' ? 'board' : 'canvas'
  return <main className="flex min-w-0 flex-1" aria-label={view === 'board' ? 'Kanban board' : 'Lean canvas'}>
    <div id={`${inactive}-panel`} role="tabpanel" aria-labelledby={`${inactive}-tab`} hidden />
    <div id={`${view}-panel`} role="tabpanel" aria-labelledby={`${view}-tab`} className="flex min-w-0 flex-1">
      {view === 'canvas' ? <CanvasBoard sections={canvas.sections} sectionProps={sectionProps} /> :
        <Suspense fallback={<p role="status" className="p-3 text-white">Loading board…</p>}>
          <WorkspaceBoard key={canvas.id} state={board} user={user}
            blocked={blocked} deleted={deleted} onDismissDeleted={onDismissDeleted} register={register} notify={notify} />
        </Suspense>}
    </div>
  </main>
}
