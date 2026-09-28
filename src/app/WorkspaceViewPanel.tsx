import type { TicketSelection } from '../components/board/RoutedTicketDialog'
import { lazy, Suspense, type ComponentProps } from 'react'
import type { AppUser } from '../auth/auth-context'
import { CanvasBoard } from '../components/CanvasBoard'
import { workspaceViews, type WorkspaceView } from '../data/workspace-view'
import { ProjectAbout } from '../components/ProjectAbout'
import type { LeanCanvas } from '../data/types'
import type { useBoard } from './useBoard'
import type { RegisterDraftGuard } from './useNavigationGuard'

const WorkspaceBoard = lazy(() => import('./WorkspaceBoard').then((module) => ({ default: module.WorkspaceBoard })))
interface Props {
  ticket?: TicketSelection
  canvas: LeanCanvas; view: WorkspaceView; board: ReturnType<typeof useBoard>
  sectionProps: ComponentProps<typeof CanvasBoard>['sectionProps']; user: AppUser
  deleted?: boolean; onDismissDeleted: () => void
  blocked: boolean; register: RegisterDraftGuard; notify: (message: string) => void
  about: Omit<ComponentProps<typeof ProjectAbout>, 'canvas' | 'register'>
}
export function WorkspaceViewPanel({ canvas, view, board, sectionProps, user, blocked, deleted, onDismissDeleted, register, notify, ticket, about }: Props) {
  return <main className="flex min-w-0 flex-1" aria-label={view === 'about' ? 'Project about' : view === 'board' ? 'Kanban board' : 'Lean canvas'}>
    {workspaceViews.filter((tab) => tab !== view).map((tab) =>
      <div key={tab} id={`${tab}-panel`} role="tabpanel" aria-labelledby={`${tab}-tab`} hidden />)}
    <div id={`${view}-panel`} role="tabpanel" aria-labelledby={`${view}-tab`} tabIndex={0} className="flex min-w-0 flex-1">
      {view === 'about' ? <ProjectAbout key={canvas.id} canvas={canvas} register={register} {...about} /> : view === 'canvas' ? <CanvasBoard sections={canvas.sections} sectionProps={sectionProps} /> :
        <Suspense fallback={<p role="status" className="p-3 text-white">Loading board…</p>}>
          <WorkspaceBoard key={canvas.id} state={board} user={user}
            ticket={ticket} blocked={blocked} deleted={deleted} onDismissDeleted={onDismissDeleted} register={register} notify={notify} />
        </Suspense>}
    </div>
  </main>
}
