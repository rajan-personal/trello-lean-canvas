import type { WorkspaceRoute } from './workspace-route'

export function WorkspaceUnavailable({ route, onReturn }: { route: WorkspaceRoute; onReturn: () => void }) {
  return <main className="main-area h-full min-w-0 flex-1">
    {route.kind !== 'root' && <div role="alert" className="p-4 text-white">
      {route.kind === 'missing' ? 'Page not found.' : 'This project is unavailable. It may have been deleted or you may not have access.'}
      <button className="ml-3 underline" onClick={onReturn}>Go to workspace</button>
    </div>}
  </main>
}
